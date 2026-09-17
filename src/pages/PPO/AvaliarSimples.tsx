import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, ArrowLeft } from "lucide-react";
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

export default function AvaliarSimples() {
  const { profile, isGestor, isLideranca, isRh } = useAuth();
  const podeAvaliar = isGestor || isLideranca || isRh;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ciclo, setCiclo] = useState<any>(null);
  const [pesos, setPesos] = useState(PESOS_PADRAO);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [selecionado, setSelecionado] = useState<string>("");
  const [notas, setNotas] = useState<Notas>(VAZIO);

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

  const colaborador = colaboradores.find((c) => c.id === selecionado);

  // Carrega notas já lançadas para o colaborador no ciclo
  useEffect(() => {
    if (!selecionado || !ciclo) return setNotas(VAZIO);
    (async () => {
      const { data } = await (supabase as any)
        .from("ppo_avaliacoes")
        .select("nota_p1, nota_p2, nota_p3, nota_p4")
        .eq("ciclo_id", ciclo.id)
        .eq("colaborador_id", selecionado)
        .eq("ativo", true)
        .maybeSingle();
      setNotas(
        data
          ? {
              p1: data.nota_p1 != null ? String(data.nota_p1) : "",
              p2: data.nota_p2 != null ? String(data.nota_p2) : "",
              p3: data.nota_p3 != null ? String(data.nota_p3) : "",
              p4: data.nota_p4 != null ? String(data.nota_p4) : "",
            }
          : VAZIO
      );
    })();
  }, [selecionado, ciclo]);

  const resultado = useMemo(() => {
    const n = (v: string) => (v === "" ? 0 : Math.min(100, Math.max(0, Number(v) || 0)));
    const final = round2(
      (n(notas.p1) * pesos.p1 + n(notas.p2) * pesos.p2 + n(notas.p3) * pesos.p3 + n(notas.p4) * pesos.p4) / 100
    );
    return { final, ...faixaReconhecimento(final) };
  }, [notas, pesos]);

  const pesoDe = (i: number) => [pesos.p1, pesos.p2, pesos.p3, pesos.p4][i];

  const salvar = async () => {
    if (!ciclo) return toast.error("Nenhum ciclo aberto. Fale com o RH.");
    if (!selecionado) return toast.error("Selecione o colaborador.");
    const faltando = (["p1", "p2", "p3", "p4"] as const).some((k) => notas[k] === "");
    if (faltando) return toast.error("Informe a nota dos quatro pilares (0 a 100).");

    setSaving(true);
    const payload = {
      ciclo_id: ciclo.id,
      colaborador_id: selecionado,
      gestor_id: profile?.id ?? null,
      nota_p1: Number(notas.p1),
      nota_p2: Number(notas.p2),
      nota_p3: Number(notas.p3),
      nota_p4: Number(notas.p4),
      nota_final: resultado.final,
      faixa: resultado.faixa,
      percentual_referencia: resultado.percentual,
      status: "apurada",
      ativo: true,
    };

    const { data: existente } = await (supabase as any)
      .from("ppo_avaliacoes")
      .select("id")
      .eq("ciclo_id", ciclo.id)
      .eq("colaborador_id", selecionado)
      .eq("ativo", true)
      .maybeSingle();

    const { error } = existente
      ? await (supabase as any).from("ppo_avaliacoes").update(payload).eq("id", existente.id)
      : await (supabase as any).from("ppo_avaliacoes").insert(payload);

    setSaving(false);
    if (error) return toast.error("Erro ao salvar: " + error.message);
    toast.success("Notas registradas!");
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

  return (
    <div className="space-y-6">
      <PPONav />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Avaliar colaborador</h1>
        <p className="text-muted-foreground">
          {ciclo ? `Ciclo ${ciclo.nome}` : "Nenhum ciclo aberto no momento"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Colaborador</CardTitle>
        </CardHeader>
        <CardContent className="max-w-xl space-y-2">
          <Label>Selecione quem você vai avaliar</Label>
          <Select value={selecionado} onValueChange={setSelecionado}>
            <SelectTrigger>
              <SelectValue placeholder="Escolher colaborador" />
            </SelectTrigger>
            <SelectContent>
              {colaboradores.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                  {c.matricula ? ` — ${c.matricula}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {colaborador && (
            <p className="text-xs text-muted-foreground">
              {[colaborador.cargo, colaborador.setor].filter(Boolean).join(" • ") || "—"}
            </p>
          )}
        </CardContent>
      </Card>

      {selecionado && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>2. Nota dos pilares (0 a 100)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {PILARES.map((p, i) => {
                const key = (["p1", "p2", "p3", "p4"] as const)[i];
                const nota = notas[key] === "" ? 0 : Number(notas[key]) || 0;
                return (
                  <div
                    key={p.numero}
                    className="grid items-center gap-2 sm:grid-cols-[1fr_7rem_7rem]"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">Peso {pesoDe(i)}%</p>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={notas[key]}
                      onChange={(e) => setNotas((n) => ({ ...n, [key]: e.target.value }))}
                      placeholder="0 a 100"
                    />
                    <p className="text-sm text-muted-foreground">
                      Ponderada: <strong>{round2((nota * pesoDe(i)) / 100).toFixed(2)}</strong>
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Resultado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Nota final</p>
                  <p className="text-3xl font-bold">{resultado.final.toFixed(2)}</p>
                </div>
                <Badge variant="secondary">{rotuloFaixa(resultado.faixa)}</Badge>
                <Badge variant="outline">Referência {resultado.percentual}%</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{PPO_TEXTOS_LEGAIS.faixas}</p>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelecionado("")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Trocar colaborador
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
