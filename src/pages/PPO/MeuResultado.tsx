import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PPONav } from "./PPONav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Gavel, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  PILARES,
  STATUS_AVALIACAO,
  PPO_TEXTOS_LEGAIS,
  fmtNota,
  fmtData,
  fmtDataHora,
  rotuloFaixa,
  prazoDiasUteis,
} from "@/lib/ppo";

export default function MeuResultado() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [ciclos, setCiclos] = useState<any[]>([]);
  const [selecionada, setSelecionada] = useState<any>(null);
  const [itens, setItens] = useState<any[]>([]);
  const [indicadores, setIndicadores] = useState<any[]>([]);
  const [feriados, setFeriados] = useState<string[]>([]);
  const [contestar, setContestar] = useState(false);
  const [form, setForm] = useState({
    indicador_id: "",
    resultado_contestado: "",
    motivo: "",
    evidencia_url: "",
    solicitacao_revisao: "",
  });

  const load = async () => {
    if (!user) return;
    const { data: me } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setPerfil(me);
    if (!me) return setLoading(false);
    const [av, cy, fe] = await Promise.all([
      (supabase as any)
        .from("ppo_avaliacoes")
        .select("*")
        .eq("colaborador_id", me.id)
        .order("created_at", { ascending: false }),
      (supabase as any).from("ppo_ciclos").select("id, nome, periodo_inicio, periodo_fim"),
      (supabase as any).from("feriados").select("data"),
    ]);
    setAvaliacoes(av.data || []);
    setCiclos(cy.data || []);
    setFeriados((fe.data || []).map((f: any) => f.data));
    const primeira = (av.data || []).find((a: any) =>
      ["comunicada", "em_contestacao", "encerrada"].includes(a.status)
    );
    setSelecionada(primeira || null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  useEffect(() => {
    if (!selecionada) return;
    (async () => {
      const [its, ind] = await Promise.all([
        (supabase as any).from("ppo_avaliacao_itens").select("*").eq("avaliacao_id", selecionada.id),
        (supabase as any).from("ppo_indicadores").select("id, nome, pilar, meta, unidade"),
      ]);
      setItens(its.data || []);
      setIndicadores(ind.data || []);
    })();
  }, [selecionada]);

  const dentroDoPrazo = (() => {
    if (!selecionada?.comunicado_em) return false;
    const limite = prazoDiasUteis(new Date(selecionada.comunicado_em), 3, feriados);
    return new Date() <= limite;
  })();
  const prazoLimite = selecionada?.comunicado_em
    ? prazoDiasUteis(new Date(selecionada.comunicado_em), 3, feriados)
    : null;

  const abrirContestacao = async () => {
    if (!form.motivo || !form.resultado_contestado)
      return toast.error("Informe o resultado contestado e a justificativa.");
    const { error } = await (supabase as any).from("ppo_contestacoes").insert({
      avaliacao_id: selecionada.id,
      indicador_id: form.indicador_id || null,
      resultado_contestado: form.resultado_contestado,
      motivo: form.motivo,
      evidencia_url: form.evidencia_url || null,
      solicitacao_revisao: form.solicitacao_revisao || null,
      aberta_em: new Date().toISOString(),
      prazo_limite: prazoLimite?.toISOString().slice(0, 10),
    });
    if (error) return toast.error("Erro: " + error.message);
    await (supabase as any)
      .from("ppo_avaliacoes")
      .update({ status: "em_contestacao" })
      .eq("id", selecionada.id);
    toast.success("Contestação registrada. Você será notificado da decisão.");
    setContestar(false);
    load();
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="space-y-6">
      <PPONav />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu resultado</h1>
        <p className="text-muted-foreground">
          Informação individual e confidencial — {perfil?.nome || "colaborador"}
        </p>
      </div>

      {!selecionada ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Você ainda não possui resultado comunicado. Os resultados aparecem aqui após a validação
            da gerência e a comunicação pelo RH.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {avaliacoes
              .filter((a) => ["comunicada", "em_contestacao", "encerrada"].includes(a.status))
              .map((a) => (
                <Button
                  key={a.id}
                  size="sm"
                  variant={a.id === selecionada.id ? "default" : "outline"}
                  onClick={() => setSelecionada(a)}
                >
                  {ciclos.find((c) => c.id === a.ciclo_id)?.nome || "Ciclo"}
                </Button>
              ))}
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {PILARES.map((p) => (
              <Card key={p.numero}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    P{p.numero} — {p.nome}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {fmtNota(selecionada[`nota_p${p.numero}`])}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resultado do ciclo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>Nota final:</strong> {fmtNota(selecionada.nota_final)}
              </p>
              <p>
                <strong>Faixa de reconhecimento:</strong> {rotuloFaixa(selecionada.faixa)} ·{" "}
                {selecionada.percentual_referencia ?? 0}%
              </p>
              <p>
                <strong>Situação:</strong>{" "}
                <Badge variant="secondary">
                  {STATUS_AVALIACAO[selecionada.status] || selecionada.status}
                </Badge>
              </p>
              <p>
                <strong>Elegibilidade:</strong>{" "}
                {selecionada.elegivel === false
                  ? `Inelegível — ${selecionada.motivo_inelegibilidade || "motivo registrado pelo RH"}`
                  : "Elegível no ciclo"}
              </p>
              <p className="text-xs text-muted-foreground">{PPO_TEXTOS_LEGAIS.faixas}</p>
              <p className="text-xs text-muted-foreground">{PPO_TEXTOS_LEGAIS.participacao}</p>
              <p className="text-xs text-muted-foreground">{PPO_TEXTOS_LEGAIS.inelegibilidade}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild size="sm" variant="outline">
                  <Link to={`/ppo/feedback/${selecionada.id}`}>
                    <MessageSquare className="mr-1 h-4 w-4" /> Meu feedback
                  </Link>
                </Button>
                {dentroDoPrazo && selecionada.status === "comunicada" && (
                  <Button size="sm" onClick={() => setContestar(true)}>
                    <Gavel className="mr-1 h-4 w-4" /> Contestar (até {fmtData(prazoLimite?.toISOString().slice(0, 10))})
                  </Button>
                )}
              </div>
              {selecionada.comunicado_em && (
                <p className="text-xs text-muted-foreground">
                  Comunicado em {fmtDataHora(selecionada.comunicado_em)}. Prazo de contestação: 3 dias
                  úteis.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notas por indicador</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pilar</TableHead>
                      <TableHead>Indicador</TableHead>
                      <TableHead>Meta</TableHead>
                      <TableHead>Apurado</TableHead>
                      <TableHead>Nota</TableHead>
                      <TableHead>Peso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((it) => {
                      const ind = indicadores.find((i) => i.id === it.indicador_id);
                      return (
                        <TableRow key={it.id}>
                          <TableCell>P{ind?.pilar ?? it.pilar}</TableCell>
                          <TableCell className="font-medium">{ind?.nome || "—"}</TableCell>
                          <TableCell>
                            {ind?.meta ?? "—"} {ind?.unidade || ""}
                          </TableCell>
                          <TableCell>{it.valor_apurado ?? "—"}</TableCell>
                          <TableCell>{fmtNota(it.nota_manual ?? it.nota_convertida)}</TableCell>
                          <TableCell>{it.peso_aplicado ?? "—"}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={contestar} onOpenChange={setContestar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar revisão do resultado</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1">
              <Label>Resultado contestado *</Label>
              <Input
                value={form.resultado_contestado}
                placeholder="Ex.: nota do indicador de SLA"
                onChange={(e) => setForm({ ...form, resultado_contestado: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Justificativa *</Label>
              <Textarea
                rows={3}
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Evidência (link)</Label>
              <Input
                value={form.evidencia_url}
                onChange={(e) => setForm({ ...form, evidencia_url: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Pedido de revisão</Label>
              <Textarea
                rows={2}
                value={form.solicitacao_revisao}
                onChange={(e) => setForm({ ...form, solicitacao_revisao: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContestar(false)}>
              Cancelar
            </Button>
            <Button onClick={abrirContestacao}>Enviar contestação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
