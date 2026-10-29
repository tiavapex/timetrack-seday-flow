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

type Linha = { adm: Record<string, boolean>; seg: number; op: number; observacao: string };

export default function PPCMotoristas() {
  const { isRh, isSesmt, isLideranca, isAdmin } = useAuth();
  const [refData, setRefData] = useState(() => new Date().toISOString().slice(0, 10));
  const periodo = useMemo(() => periodoPPC(new Date(refData + "T12:00:00")), [refData]);
  const [colabs, setColabs] = useState<any[]>([]);
  const [linhas, setLinhas] = useState<Record<string, Linha>>({});
  const [saving, setSaving] = useState(false);

  const pode = (r: Responsavel[]) =>
    isAdmin || r.some((x) => (x === "rh" ? isRh : x === "seguranca" ? isSesmt : isLideranca));

  useEffect(() => {
    (async () => {
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
    })();
  }, [periodo.inicio]);

  const upd = (id: string, patch: Partial<Linha>) => setLinhas((l) => ({ ...l, [id]: { ...l[id], ...patch } }));

  const salvar = async () => {
    setSaving(true);
    const rows = colabs.map((c) => ({
      colaborador_id: c.id, periodo_inicio: periodo.inicio, periodo_fim: periodo.fim,
      adm: linhas[c.id].adm,
      pts_seguranca: Math.min(Math.max(linhas[c.id].seg, 0), PPC_MAX_SEGURANCA),
      pts_operacao: Math.min(Math.max(linhas[c.id].op, 0), PPC_MAX_OPERACAO),
      observacao: linhas[c.id].observacao || null,
    }));
    const { error } = await supabase.from("ppc_avaliacoes").upsert(rows, { onConflict: "colaborador_id,periodo_inicio" });
    setSaving(false);
    toast(error ? { title: "Erro ao salvar", description: error.message, variant: "destructive" } : { title: "PPC salvo" });
  };

  const fmt = (d: string) => d.split("-").reverse().join("/");

  return (
    <div className="space-y-4">
      <PPONav />
      <Card>
        <CardHeader>
          <CardTitle>PPC – Motoristas (Gerdau)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pilar 1 Administrativo é pré-requisito: qualquer descumprimento zera o prêmio. Segurança vale 40 pontos e
            Operação 60 pontos. 100 pontos = R$ 600,00.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-sm">Data de referência</label>
            <Input type="date" value={refData} onChange={(e) => setRefData(e.target.value)} />
          </div>
          <p className="text-sm">Período de apuração: <b>{fmt(periodo.inicio)} a {fmt(periodo.fim)}</b></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Responsáveis – Pilar 1 Administrativo</CardTitle></CardHeader>
        <CardContent className="grid gap-1 text-sm">
          {PPC_ITENS_ADM.map((i) => (
            <div key={i.key}><b>{i.key} {i.label}:</b> {i.resp.map((r) => RESP_LABEL[r]).join(" e ")}</div>
          ))}
        </CardContent>
      </Card>

      {colabs.map((c) => {
        const l = linhas[c.id];
        if (!l) return null;
        const r = calcularPPC(l.adm, l.seg, l.op);
        return (
          <Card key={c.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{c.nome} <span className="text-muted-foreground">({c.matricula})</span></CardTitle>
              <div className="flex items-center gap-2">
                {!r.admOk && <Badge variant="destructive">Pré-requisito não cumprido</Badge>}
                <Badge>{r.pontos} pts · R$ {r.valor.toFixed(2).replace(".", ",")}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 md:grid-cols-2">
                {PPC_ITENS_ADM.map((i) => {
                  const ok = l.adm[i.key] !== false;
                  const editavel = pode(i.resp);
                  return (
                    <div key={i.key} className="flex items-center justify-between rounded border p-2 text-sm">
                      <span>{i.key} {i.label}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant={ok ? "default" : "outline"} disabled={!editavel}
                          onClick={() => upd(c.id, { adm: { ...l.adm, [i.key]: true } })}>Cumpriu</Button>
                        <Button size="sm" variant={!ok ? "destructive" : "outline"} disabled={!editavel}
                          onClick={() => upd(c.id, { adm: { ...l.adm, [i.key]: false } })}>Não cumpriu</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="text-sm">Segurança (0–40)</label>
                  <Input type="number" min={0} max={40} value={l.seg} disabled={!pode(["seguranca"])}
                    onChange={(e) => upd(c.id, { seg: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm">Operação (0–60)</label>
                  <Input type="number" min={0} max={60} value={l.op} disabled={!pode(["operacional"])}
                    onChange={(e) => upd(c.id, { op: Number(e.target.value) })} />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm">Observação (data, frota, ocorrência)</label>
                  <Input value={l.observacao} onChange={(e) => upd(c.id, { observacao: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      <Button onClick={salvar} disabled={saving || !colabs.length}>{saving ? "Salvando..." : "Salvar PPC"}</Button>
    </div>
  );
}
