import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PPONav } from "./PPONav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  PILARES,
  PPO_DOC,
  PPO_TEXTOS_LEGAIS,
  fmtData,
  fmtNota,
  faixaReconhecimento,
} from "@/lib/ppo";

const FAIXAS = ["95,00 a 100,00", "90,00 a 94,99", "80,00 a 89,99", "70,00 a 79,99", "sem_reconhecimento"];

export default function PPOHome() {
  const [loading, setLoading] = useState(true);
  const [ciclo, setCiclo] = useState<any>(null);
  const [ciclos, setCiclos] = useState<any[]>([]);
  const [avs, setAvs] = useState<any[]>([]);
  const [contest, setContest] = useState<any[]>([]);
  const [ocorr, setOcorr] = useState<any[]>([]);
  const [itens, setItens] = useState<any[]>([]);
  const [indIncompletos, setIndIncompletos] = useState(0);
  const [melhorias, setMelhorias] = useState(0);

  useEffect(() => {
    (async () => {
      const [cy, av, ct, oc, it, ind, me] = await Promise.all([
        (supabase as any).from("ppo_ciclos").select("*").order("periodo_inicio", { ascending: false }),
        (supabase as any).from("ppo_avaliacoes").select("*").eq("ativo", true),
        (supabase as any).from("ppo_contestacoes").select("*"),
        (supabase as any).from("ppo_ocorrencias").select("*"),
        (supabase as any).from("ppo_avaliacao_itens").select("id, avaliacao_id, fonte_dado, evidencia_url, evidencia_descricao"),
        (supabase as any).from("ppo_indicadores").select("*").eq("ativo", true),
        (supabase as any).from("ppo_melhorias").select("id"),
      ]);
      setCiclos(cy.data || []);
      setCiclo((cy.data || []).find((c: any) => c.status !== "encerrado") || (cy.data || [])[0] || null);
      setAvs(av.data || []);
      setContest(ct.data || []);
      setOcorr(oc.data || []);
      setItens(it.data || []);
      setIndIncompletos(
        (ind.data || []).filter(
          (i: any) => !i.formula || i.meta == null || i.peso == null || !i.fonte_dado || !i.responsavel_id
        ).length
      );
      setMelhorias((me.data || []).length);
      setLoading(false);
    })();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  const doCiclo = ciclo ? avs.filter((a) => a.ciclo_id === ciclo.id) : avs;
  const previstas = doCiclo.length;
  const realizadas = doCiclo.filter((a) =>
    ["comunicada", "encerrada", "em_contestacao"].includes(a.status)
  ).length;
  const pendentes = previstas - realizadas;
  const adesao = previstas ? Math.round((realizadas / previstas) * 100) : 0;
  const contestadas = contest.filter((c) => doCiclo.some((a) => a.id === c.avaliacao_id));
  const idxContestacao = realizadas ? Math.round((contestadas.length / realizadas) * 100) : 0;
  const alteradas = contestadas.filter((c) => c.decisao === "alterado").length;
  const idxRevisao = contestadas.length ? Math.round((alteradas / contestadas.length) * 100) : 0;
  const noPrazo = doCiclo.filter(
    (a) => a.encerrado_em && ciclo?.periodo_fim && a.encerrado_em.slice(0, 10) <= ciclo.periodo_fim
  ).length;
  const idxFechamento = previstas ? Math.round((noPrazo / previstas) * 100) : 0;
  const diasRestantes = ciclo?.periodo_fim
    ? Math.ceil((new Date(ciclo.periodo_fim + "T00:00:00").getTime() - Date.now()) / 86400000)
    : null;

  const distribuicao = FAIXAS.map((f) => ({
    faixa: f === "sem_reconhecimento" ? "Sem reconhec." : f,
    qtd: doCiclo.filter(
      (a) => a.nota_final != null && faixaReconhecimento(Number(a.nota_final)).faixa === f
    ).length,
  }));

  const mediaPilar = PILARES.map((p) => {
    const notas = doCiclo
      .map((a) => a[`nota_p${p.numero}`])
      .filter((n) => n != null)
      .map(Number);
    return {
      pilar: `P${p.numero}`,
      media: notas.length ? Number((notas.reduce((x, y) => x + y, 0) / notas.length).toFixed(2)) : 0,
    };
  });

  const evolucao = ciclos
    .slice()
    .reverse()
    .map((c) => {
      const notas = avs
        .filter((a) => a.ciclo_id === c.id && a.nota_final != null)
        .map((a) => Number(a.nota_final));
      return {
        ciclo: c.nome,
        media: notas.length ? Number((notas.reduce((x, y) => x + y, 0) / notas.length).toFixed(2)) : 0,
      };
    });

  const semEvidencia = itens.filter(
    (i) => !i.fonte_dado || (!i.evidencia_url && !i.evidencia_descricao)
  ).length;
  const semManifestacao = ocorr.filter(
    (o) => o.status === "aguardando_manifestacao" && !o.manifestacao_em
  ).length;
  const contestacoesAbertas = contest.filter((c) => !c.decisao).length;

  const cards = [
    { label: "Avaliações previstas", valor: previstas },
    { label: "Realizadas", valor: realizadas },
    { label: "Pendentes", valor: pendentes },
    { label: "Índice de adesão", valor: `${adesao}%` },
    { label: "Índice de contestação", valor: `${idxContestacao}%` },
    { label: "Índice de revisão", valor: `${idxRevisao}%` },
    { label: "Fechamento no prazo", valor: `${idxFechamento}%` },
    { label: "Ações de melhoria", valor: melhorias },
  ];

  return (
    <div className="space-y-6">
      <PPONav />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Programa de Reconhecimento por Performance Administrativa
        </h1>
        <p className="text-muted-foreground">
          {PPO_DOC} ·{" "}
          {ciclo
            ? `${ciclo.nome} (${fmtData(ciclo.periodo_inicio)} a ${fmtData(ciclo.periodo_fim)})`
            : "Nenhum ciclo cadastrado"}
          {diasRestantes != null && diasRestantes >= 0 ? ` · ${diasRestantes} dia(s) restante(s)` : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{c.valor}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(semEvidencia > 0 || semManifestacao > 0 || contestacoesAbertas > 0 || indIncompletos > 0) && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Alertas de conformidade
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            {semEvidencia > 0 && (
              <Badge variant="destructive">{semEvidencia} indicador(es) sem fonte/evidência</Badge>
            )}
            {semManifestacao > 0 && (
              <Badge variant="destructive">
                {semManifestacao} ocorrência(s) aguardando manifestação
              </Badge>
            )}
            {contestacoesAbertas > 0 && (
              <Badge variant="destructive">{contestacoesAbertas} contestação(ões) sem decisão</Badge>
            )}
            {indIncompletos > 0 && (
              <Badge variant="destructive">
                {indIncompletos} indicador(es) sem meta, peso, fonte ou responsável
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por faixa</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribuicao}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="faixa" fontSize={10} />
                <YAxis allowDecimals={false} fontSize={10} />
                <RTooltip />
                <Bar dataKey="qtd" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Média por pilar</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={mediaPilar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="pilar" fontSize={11} />
                <Radar dataKey="media" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                <RTooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Evolução da nota média por ciclo</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="ciclo" fontSize={10} />
                <YAxis domain={[0, 100]} fontSize={10} />
                <RTooltip />
                <Line type="monotone" dataKey="media" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-2 pt-6 text-xs text-muted-foreground">
          <p>{PPO_TEXTOS_LEGAIS.faixas}</p>
          <p>{PPO_TEXTOS_LEGAIS.participacao}</p>
          <p>{PPO_TEXTOS_LEGAIS.naoSubstitui}</p>
          <p>{PPO_TEXTOS_LEGAIS.inelegibilidade}</p>
          <p>
            Nota média geral do ciclo:{" "}
            {fmtNota(
              doCiclo.filter((a) => a.nota_final != null).length
                ? doCiclo
                    .filter((a) => a.nota_final != null)
                    .reduce((x, a) => x + Number(a.nota_final), 0) /
                    doCiclo.filter((a) => a.nota_final != null).length
                : null
            )}{" "}
            — resultados individuais não são divulgados publicamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
