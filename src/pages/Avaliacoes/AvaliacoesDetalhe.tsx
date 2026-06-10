import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileDown, Loader2 } from "lucide-react";
import { exportAvaliacaoPDF } from "@/lib/avaliacao-export";
import { notaLabel } from "@/lib/competencias";

export default function AvaliacoesDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [av, setAv] = useState<any>(null);
  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: a } = await (supabase as any)
        .from("avaliacoes_competencias").select("*").eq("id", id).maybeSingle();
      const { data: i } = await (supabase as any)
        .from("avaliacao_competencias_itens").select("*").eq("avaliacao_id", id).order("ordem");
      setAv(a); setItens(i || []); setLoading(false);
    })();
  }, [id]);

  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;
  if (!av) return <p>Avaliação não encontrada.</p>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/avaliacoes")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Avaliação — {av.nome}</h1>
        </div>
        <Button onClick={() => exportAvaliacaoPDF(av, itens)}>
          <FileDown className="h-4 w-4 mr-2" /> Exportar PDF
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3 text-sm">
          <div><b>Período:</b> {av.periodo} dias</div>
          <div><b>Cargo:</b> {av.cargo || "—"}</div>
          <div><b>Setor:</b> {av.setor || "—"}</div>
          <div><b>Matrícula:</b> {av.matricula || "—"}</div>
          <div><b>Admissão:</b> {av.data_admissao || "—"}</div>
          <div><b>Término:</b> {av.data_termino || "—"}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Competências</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {itens.map((it) => (
            <div key={it.id} className="flex justify-between border-b py-2 text-sm">
              <div>
                <p className="font-medium">{it.ordem}. {it.competencia}</p>
                <p className="text-xs text-muted-foreground">{it.descricao}</p>
              </div>
              <Badge variant="outline">{notaLabel(it.nota)}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Observações</CardTitle></CardHeader>
        <CardContent className="text-sm whitespace-pre-wrap">{av.observacoes}</CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Medida e Mobilização</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><b>Medida:</b> <span className="capitalize">{av.medida}</span></p>
          <p><b>Mobilização:</b> {av.mobilizacao ? `Sim — ${av.data_mobilizacao}` : `Não`}</p>
          {!av.mobilizacao && av.motivo_nao_mobilizacao && (
            <p><b>Motivo:</b> {av.motivo_nao_mobilizacao}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
