import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Save, Search } from "lucide-react";
import { toast } from "sonner";
import {
  PILARES,
  PESOS_PADRAO,
  PPO_TEXTOS_LEGAIS,
  faixaReconhecimento,
  round2,
  rotuloFaixa,
} from "@/lib/ppo";
import { PPONav } from "./PPONav";

type Notas = { p1: string; p2: string; p3: string; p4: string };
const VAZIO: Notas = { p1: "", p2: "", p3: "", p4: "" };
const CHAVES = ["p1", "p2", "p3", "p4"] as const;

export default function AvaliarSimples() {
  const { profile, isGestor, isLideranca, isRh } = useAuth();
  const podeAvaliar = isGestor || isLideranca || isRh;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ciclo, setCiclo] = useState<any>(null);
  const [pesos, setPesos] = useState(PESOS_PADRAO);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [notas, setNotas] = useState<Record<string, Notas>>({});
  const [obs, setObs] = useState<Record<string, string>>({});
  const [ciente, setCiente] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const [cy, pz, pf] = await Promise.all([
        (supabase as any)
          .from("ppo_ciclos")
          .select("id, nome, status, periodo_inicio, periodo_fim")
          .in("status", ["aberto", "em_apuracao", "planejado"])
          .order("periodo_inicio", { ascending: false })
          .limit(1),
        (supabase as any).from("ppo_pesos_pilar").select("p1, p2, p3, p4").eq("padrao", true).limit(1),
        (supabase as any)
          .from("profiles")
          .select("id, nome, matricula, cargo, setor")
          .eq("ativo", true)
          .order("nome"),
      ]);
      setCiclo(cy.data?.[0] || null);
      if (pz.data?.[0]) setPesos(pz.data[0]);
      setColaboradores(pf.data || []);
      setLoading(false);
    })();
  }, []);

  const pesoDe = (i: number) => [pesos.p1, pesos.p2, pesos.p3, pesos.p4][i];

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return colaboradores;
    return colaboradores.filter((c) =>
      [c.nome, c.matricula, c.cargo, c.setor].some((v: string) => (v || "").toLowerCase().includes(t))
    );
  }, [colaboradores, busca]);

  // Carrega notas já lançadas dos selecionados
  useEffect(() => {
    if (!ciclo || selecionados.length === 0) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("ppo_avaliacoes")
        .select(
          "colaborador_id, nota_p1, nota_p2, nota_p3, nota_p4, observacao_nao_reconhecimento, colaborador_ciente"
        )
        .eq("ciclo_id", ciclo.id)
        .eq("ativo", true)
        .in("colaborador_id", selecionados);
      if (!data?.length) return;
      setNotas((prev) => {
        const next = { ...prev };
        for (const a of data) {
          const atual = next[a.colaborador_id] || VAZIO;
          if (CHAVES.every((k) => atual[k] === ""))
            next[a.colaborador_id] = {
              p1: a.nota_p1 != null ? String(a.nota_p1) : "",
              p2: a.nota_p2 != null ? String(a.nota_p2) : "",
              p3: a.nota_p3 != null ? String(a.nota_p3) : "",
              p4: a.nota_p4 != null ? String(a.nota_p4) : "",
            };
        }
        return next;
      });
      setObs((prev) => {
        const next = { ...prev };
        for (const a of data)
          if (next[a.colaborador_id] === undefined)
            next[a.colaborador_id] = a.observacao_nao_reconhecimento || "";
        return next;
      });
      setCiente((prev) => {
        const next = { ...prev };
        for (const a of data)
          if (next[a.colaborador_id] === undefined) next[a.colaborador_id] = !!a.colaborador_ciente;
        return next;
      });
    })();
  }, [selecionados, ciclo]);

  const toggle = (id: string, on: boolean) => {
    setSelecionados((p) => (on ? [...p, id] : p.filter((x) => x !== id)));
    setNotas((p) => (on && !p[id] ? { ...p, [id]: VAZIO } : p));
  };

  const toggleTodos = (on: boolean) =>
    setSelecionados(on ? filtrados.map((c) => c.id) : []);

  const setNota = (id: string, k: keyof Notas, v: string) =>
    setNotas((p) => ({ ...p, [id]: { ...(p[id] || VAZIO), [k]: v } }));

  const resultadoDe = (id: string) => {
    const n = notas[id] || VAZIO;
    const v = (s: string) => (s === "" ? 0 : Math.min(100, Math.max(0, Number(s) || 0)));
    const final = round2(
      (v(n.p1) * pesos.p1 + v(n.p2) * pesos.p2 + v(n.p3) * pesos.p3 + v(n.p4) * pesos.p4) / 100
    );
    return { final, ...faixaReconhecimento(final) };
  };

  const semReconhecimento = selecionados.filter(
    (id) => CHAVES.every((k) => (notas[id] || VAZIO)[k] !== "") && resultadoDe(id).percentual === 0
  );


  const salvar = async () => {
    if (!ciclo) return toast.error("Nenhum ciclo aberto. Fale com o RH.");
    if (selecionados.length === 0) return toast.error("Selecione ao menos um colaborador.");
    const incompleto = selecionados.find((id) =>
      CHAVES.some((k) => (notas[id] || VAZIO)[k] === "")
    );
    if (incompleto) {
      const c = colaboradores.find((x) => x.id === incompleto);
      return toast.error(`Informe a nota dos quatro pilares de ${c?.nome || "todos"}.`);
    }
    const semObs = semReconhecimento.find((id) => !(obs[id] || "").trim());
    if (semObs) {
      const c = colaboradores.find((x) => x.id === semObs);
      return toast.error(
        `Preencha a observação do motivo de ${c?.nome || "colaborador"} não atingir o reconhecimento.`
      );
    }


    setSaving(true);
    const { data: existentes } = await (supabase as any)
      .from("ppo_avaliacoes")
      .select("id, colaborador_id")
      .eq("ciclo_id", ciclo.id)
      .eq("ativo", true)
      .in("colaborador_id", selecionados);
    const mapa = new Map((existentes || []).map((e: any) => [e.colaborador_id, e.id]));

    const erros: string[] = [];
    for (const id of selecionados) {
      const n = notas[id];
      const r = resultadoDe(id);
      const payload = {
        ciclo_id: ciclo.id,
        colaborador_id: id,
        gestor_id: profile?.id ?? null,
        nota_p1: Number(n.p1),
        nota_p2: Number(n.p2),
        nota_p3: Number(n.p3),
        nota_p4: Number(n.p4),
        nota_final: r.final,
        faixa: r.faixa,
        percentual_referencia: r.percentual,
        status: "apurada",
        ativo: true,
        observacao_nao_reconhecimento: r.percentual > 0 ? null : (obs[id] || "").trim() || null,
        colaborador_ciente: r.percentual > 0 ? false : !!ciente[id],
        colaborador_ciente_em: r.percentual > 0 || !ciente[id] ? null : new Date().toISOString(),
      };
      const existente = mapa.get(id);
      const { error } = existente
        ? await (supabase as any).from("ppo_avaliacoes").update(payload).eq("id", existente)
        : await (supabase as any).from("ppo_avaliacoes").insert(payload);
      if (error) erros.push(error.message);
    }
    setSaving(false);
    if (erros.length) return toast.error("Erro ao salvar: " + erros[0]);
    toast.success(`${selecionados.length} avaliação(ões) registrada(s)!`);
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  if (!podeAvaliar)
    return (
      <div className="space-y-6">
        <PPONav />
        <p className="text-sm text-muted-foreground">
          Você não tem permissão para lançar notas de PPO.
        </p>
      </div>
    );

  const todosMarcados = filtrados.length > 0 && filtrados.every((c) => selecionados.includes(c.id));

  return (
    <div className="space-y-6">
      <PPONav />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Avaliar colaboradores</h1>
        <p className="text-muted-foreground">
          {ciclo ? `Ciclo ${ciclo.nome}` : "Nenhum ciclo aberto no momento"}
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>1. Colaboradores ({selecionados.length} selecionados)</CardTitle>
          <div className="relative w-56">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Buscar"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex items-center gap-2">
            <Checkbox checked={todosMarcados} onCheckedChange={(v) => toggleTodos(!!v)} />
            <span className="text-sm text-muted-foreground">Selecionar todos os listados</span>
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border p-2">
            {filtrados.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted">
                <Checkbox
                  checked={selecionados.includes(c.id)}
                  onCheckedChange={(v) => toggle(c.id, !!v)}
                />
                <span className="text-sm">
                  {c.nome}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {[c.matricula, c.cargo, c.setor].filter(Boolean).join(" • ")}
                  </span>
                </span>
              </label>
            ))}
            {filtrados.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">Nenhum colaborador encontrado.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {selecionados.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>2. Nota dos pilares (0 a 100)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Colaborador</TableHead>
                      {PILARES.map((p, i) => (
                        <TableHead key={p.numero} className="w-28 text-center text-[11px] leading-tight">
                          {p.nome}
                          <div className="font-normal text-muted-foreground">Peso {pesoDe(i)}%</div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center">Nota final</TableHead>
                      <TableHead>Faixa</TableHead>
                      <TableHead className="text-center text-[11px] leading-tight">
                        Percentual de referência
                        <div className="font-normal text-muted-foreground">do reconhecimento</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selecionados.map((id) => {
                      const c = colaboradores.find((x) => x.id === id);
                      const r = resultadoDe(id);
                      return (
                        <TableRow key={id}>
                          <TableCell className="font-medium">
                            {c?.nome}
                            <div className="text-xs text-muted-foreground">
                              {[c?.matricula, c?.cargo].filter(Boolean).join(" • ")}
                            </div>
                          </TableCell>
                          {CHAVES.map((k) => (
                            <TableCell key={k}>
                              <Input
                                className="h-8 text-center"
                                type="number"
                                min={0}
                                max={100}
                                step="0.01"
                                value={(notas[id] || VAZIO)[k]}
                                onChange={(e) => setNota(id, k, e.target.value)}
                              />
                            </TableCell>
                          ))}
                          <TableCell className="text-center font-semibold">
                            {r.final.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{rotuloFaixa(r.faixa)}</Badge>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {r.percentual > 0 ? `${r.percentual}%` : "Sem reconhecimento"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{PPO_TEXTOS_LEGAIS.faixas}</p>
            </CardContent>
          </Card>

          {semReconhecimento.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>3. Colaboradores sem reconhecimento</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Explique o motivo de não ter atingido a faixa de reconhecimento e marque se o
                  colaborador está ciente do motivo.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                {semReconhecimento.map((id) => {
                  const c = colaboradores.find((x) => x.id === id);
                  return (
                    <div key={id} className="space-y-2 rounded-md border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">{c?.nome}</p>
                        <Badge variant="outline">
                          Nota {resultadoDe(id).final.toFixed(2)} — sem reconhecimento
                        </Badge>
                      </div>
                      <Label className="text-xs">Observação (obrigatória)</Label>
                      <Textarea
                        rows={3}
                        placeholder="Motivo de não ter atingido o reconhecimento"
                        value={obs[id] || ""}
                        onChange={(e) => setObs((p) => ({ ...p, [id]: e.target.value }))}
                      />
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={!!ciente[id]}
                          onCheckedChange={(v) => setCiente((p) => ({ ...p, [id]: !!v }))}
                        />
                        Colaborador está ciente do motivo
                      </label>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}


          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelecionados([])}>
              Limpar seleção
            </Button>
            <Button onClick={salvar} disabled={saving || !ciclo}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar notas
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
