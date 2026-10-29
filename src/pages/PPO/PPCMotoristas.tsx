import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PPONav } from "./PPONav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  PPC_ITENS_ADM, RESP_LABEL, calcularPPC, periodoPPC, PPC_MAX_OPERACAO, PPC_MAX_SEGURANCA, Responsavel,
} from "@/lib/ppc";

type Area = Responsavel | "geral";
type Linha = { adm: Record<string, boolean>; seg: number; op: number; observacao: string };

const AREA_TITULO: Record<Area, string> = {
  operacional: "Operacional",
  rh: "RH",
  seguranca: "Segurança do Trabalho",
  geral: "Visão geral",
};

export default function PPCMotoristas() {
  const { isRh, isSesmt, isLideranca, isAdmin } = useAuth();
  const areas = useMemo(() => {
    const a: Area[] = [];
    if (isAdmin || isLideranca) a.push("operacional");
    if (isAdmin || isRh) a.push("rh");
    if (isAdmin || isSesmt) a.push("seguranca");
    if (isAdmin || isRh) a.push("geral");
    return a;
  }, [isAdmin, isLideranca, isRh, isSesmt]);
  const [area, setArea] = useState<Area | null>(null);
  useEffect(() => { if (!area || !areas.includes(area)) setArea(areas[0] ?? null); }, [areas, area]);

  const [refData, setRefData] = useState(() => new Date().toISOString().slice(0, 10));
  const periodo = useMemo(() => periodoPPC(new Date(refData + "T12:00:00")), [refData]);
  const [colabs, setColabs] = useState<any[]>([]);
  const [linhas, setLinhas] = useState<Record<string, Linha>>({});
  const [saving, setSaving] = useState(false);

  const carregar = async () => {
    const { data: ps } = await supabase.from("profiles").select("id,nome,matricula,cargo")
      .eq("cliente", "Gerdau").eq("cargo", "MOT CARRETEIRO").order("nome");
    setColabs(ps || []);
    const { data: av } = await supabase.from("ppc_avaliacoes").select("*").eq("periodo_inicio", periodo.inicio);
    const m: Record<string, Linha> = {};
    (ps || []).forEach((p) => {
      const a = av?.find((x) => x.colaborador_id === p.id);
      m[p.id] = {
        adm: (a?.adm as Record<string, boolean>) || {},
        seg: a ? Number(a.pts_seguranca) : PPC_MAX_SEGURANCA,
        op: a ? Number(a.pts_operacao) : PPC_MAX_OPERACAO,
        observacao: a?.observacao || "",
      };
    });
    setLinhas(m);
  };
  useEffect(() => { carregar(); }, [periodo.inicio]);

  const upd = (id: string, patch: Partial<Linha>) => setLinhas((l) => ({ ...l, [id]: { ...l[id], ...patch } }));

  const itensArea = area && area !== "geral" ? PPC_ITENS_ADM.filter((i) => i.resp.includes(area)) : [];

  // Salva somente os campos da área, mesclando com o que já está gravado (evita apagar o trabalho das outras áreas)
  const salvar = async () => {
    if (!area) return;
    setSaving(true);
    const { data: atual } = await supabase.from("ppc_avaliacoes").select("colaborador_id,adm")
      .eq("periodo_inicio", periodo.inicio);
    const rows = colabs.map((c) => {
      const l = linhas[c.id];
      const row: any = { colaborador_id: c.id, periodo_inicio: periodo.inicio, periodo_fim: periodo.fim };
      if (area === "geral") {
        row.observacao = l.observacao || null;
      } else {
        const gravado = (atual?.find((a) => a.colaborador_id === c.id)?.adm as Record<string, boolean>) || {};
        const minha: Record<string, boolean> = {};
        itensArea.forEach((i) => { if (i.key in l.adm) minha[i.key] = l.adm[i.key]; });
        row.adm = { ...gravado, ...minha };
        if (area === "seguranca") row.pts_seguranca = Math.min(Math.max(l.seg, 0), PPC_MAX_SEGURANCA);
        if (area === "operacional") row.pts_operacao = Math.min(Math.max(l.op, 0), PPC_MAX_OPERACAO);
      }
      return row;
    });
    const { error } = await supabase.from("ppc_avaliacoes").upsert(rows, { onConflict: "colaborador_id,periodo_inicio" });
    setSaving(false);
    toast(error ? { title: "Erro ao salvar", description: error.message, variant: "destructive" } : { title: "PPC salvo" });
    if (!error) carregar();
  };

  const fmt = (d: string) => d.split("-").reverse().join("/");
  const brl = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <div className="space-y-4">
      <PPONav />
      <Card>
        <CardHeader>
          <CardTitle>PPC – Motoristas (Gerdau)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cada área vê e salva apenas os itens sob sua responsabilidade.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {areas.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {areas.map((a) => (
                <Button key={a} size="sm" variant={a === area ? "default" : "outline"} onClick={() => setArea(a)}>
                  {AREA_TITULO[a]}
                </Button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-sm">Data de referência</label>
              <Input type="date" value={refData} onChange={(e) => setRefData(e.target.value)} />
            </div>
            <p className="text-sm">Período: <b>{fmt(periodo.inicio)} a {fmt(periodo.fim)}</b></p>
          </div>
        </CardContent>
      </Card>

      {!area && <p className="text-sm text-muted-foreground">Você não é responsável por nenhum item do PPC.</p>}

      {area && area !== "geral" && colabs.map((c) => {
        const l = linhas[c.id];
        if (!l) return null;
        return (
          <Card key={c.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{c.nome} <span className="text-muted-foreground">({c.matricula})</span></CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 md:grid-cols-2">
                {itensArea.map((i) => {
                  const ok = l.adm[i.key] !== false;
                  return (
                    <div key={i.key} className="flex items-center justify-between rounded border p-2 text-sm">
                      <span>{i.key} {i.label}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant={ok ? "default" : "outline"}
                          onClick={() => upd(c.id, { adm: { ...l.adm, [i.key]: true } })}>Cumpriu</Button>
                        <Button size="sm" variant={!ok ? "destructive" : "outline"}
                          onClick={() => upd(c.id, { adm: { ...l.adm, [i.key]: false } })}>Não cumpriu</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {area === "seguranca" && (
                <div className="max-w-[200px]">
                  <label className="text-sm">Pontos de Segurança (0–40)</label>
                  <Input type="number" min={0} max={40} value={l.seg}
                    onChange={(e) => upd(c.id, { seg: Number(e.target.value) })} />
                </div>
              )}
              {area === "operacional" && (
                <div className="max-w-[200px]">
                  <label className="text-sm">Pontos de Operação (0–60)</label>
                  <Input type="number" min={0} max={60} value={l.op}
                    onChange={(e) => upd(c.id, { op: Number(e.target.value) })} />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {area === "geral" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Resultado do período</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {colabs.map((c) => {
              const l = linhas[c.id];
              if (!l) return null;
              const r = calcularPPC(l.adm, l.seg, l.op);
              const falhas = PPC_ITENS_ADM.filter((i) => l.adm[i.key] === false);
              return (
                <div key={c.id} className="rounded border p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <b>{c.nome} <span className="text-muted-foreground font-normal">({c.matricula})</span></b>
                    <div className="flex gap-2">
                      {!r.admOk && <Badge variant="destructive">Pré-requisito não cumprido</Badge>}
                      <Badge variant="outline">Seg {l.seg} · Op {l.op}</Badge>
                      <Badge>{r.pontos} pts · {brl(r.valor)}</Badge>
                    </div>
                  </div>
                  {falhas.length > 0 && (
                    <p className="text-sm text-destructive">
                      Não cumpriu: {falhas.map((f) => `${f.key} ${f.label} (${f.resp.map((x) => RESP_LABEL[x]).join(" / ")})`).join("; ")}
                    </p>
                  )}
                  <Input placeholder="Observação (data, frota, ocorrência)" value={l.observacao}
                    onChange={(e) => upd(c.id, { observacao: e.target.value })} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {area && (
        <Button onClick={salvar} disabled={saving || !colabs.length}>
          {saving ? "Salvando..." : `Salvar – ${AREA_TITULO[area]}`}
        </Button>
      )}
    </div>
  );
}
