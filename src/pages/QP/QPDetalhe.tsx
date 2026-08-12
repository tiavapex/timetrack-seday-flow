import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, FileDown, Check, X } from "lucide-react";
import { toast } from "sonner";
import { exportQPtoPDF } from "@/lib/qp-export";

const d = (v?: string | null) =>
  v ? new Date(v + "T00:00:00").toLocaleDateString("pt-BR") : "-";

function Campo({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "-"}</p>
    </div>
  );
}

export default function QPDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isGestor } = useAuth();
  const [qp, setQp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await (supabase as any)
      .from("qp_solicitacoes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) toast.error("QP não encontrada");
    else setQp(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const alterarStatus = async (status: string) => {
    const { error } = await (supabase as any)
      .from("qp_solicitacoes")
      .update({ status })
      .eq("id", id);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Status atualizado");
    load();
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (!qp) return null;

  const tipos = [
    ["Admissão", qp.tp_admissao],
    ["Demissão", qp.tp_demissao],
    ["Reembolso", qp.tp_reembolso],
    ["Advertência / Suspensão", qp.tp_advertencia],
    ["Abono", qp.tp_abono],
    ["Acerto de ponto", qp.tp_acerto_ponto],
    ["Troca", qp.tp_troca],
    ["Compensação", qp.tp_compensacao],
    ["Folga", qp.tp_folga],
  ].filter(([, v]) => v);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/qp")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">QP — {qp.nome}</h1>
            <p className="text-muted-foreground">
              {qp.empresa} • {qp.area} • {d(qp.data_evento)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="self-center">{qp.status}</Badge>
          <Button variant="outline" size="sm" onClick={() => exportQPtoPDF(qp)}>
            <FileDown className="mr-1 h-4 w-4" /> PDF para assinatura
          </Button>
          {isGestor && qp.status === "pendente" && (
            <>
              <Button size="sm" onClick={() => alterarStatus("aprovado")}>
                <Check className="mr-1 h-4 w-4" /> Aprovar
              </Button>
              <Button size="sm" variant="destructive" onClick={() => alterarStatus("reprovado")}>
                <X className="mr-1 h-4 w-4" /> Reprovar
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Campo label="Tipo(s)" value={tipos.map(([k]) => k).join(", ")} />
          <Campo label="Data de entrega" value={d(qp.data_entrega)} />
          <Campo label="Cargo" value={qp.cargo} />
          <Campo label="Matrícula" value={qp.matricula} />
          <Campo label="Salário" value={qp.salario} />
          <div className="md:col-span-3">
            <Campo label="Motivo" value={qp.motivo} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recrutamento e seleção</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Campo label="Aprovado" value={qp.rec_aprovado ? "Sim" : "Não"} />
          <Campo label="Treinamento" value={qp.rec_treinamento ? "Sim" : "Não"} />
          <Campo label="Reprovado" value={qp.rec_reprovado ? "Sim" : "Não"} />
          <Campo label="Currículo" value={qp.rec_curriculo ? "Sim" : "Não"} />
          <Campo label="Cursos" value={qp.rec_cursos ? "Sim" : "Não"} />
          <Campo label="Outros" value={qp.rec_outros ? "Sim" : "Não"} />
          <Campo label="Indicado por" value={qp.indicado_por} />
          <Campo label="Tempo de experiência" value={qp.tempo_experiencia} />
          <Campo label="Necessidade p/ admissão" value={d(qp.data_necessidade_admissao)} />
          <Campo label="Exame admissional" value={d(qp.data_exame_admissional)} />
          <Campo label="Admissão" value={d(qp.data_admissao)} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Benefícios</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Campo
              label="AD função / gratificação"
              value={qp.ben_ad_funcao ? `Sim — ${qp.ben_ad_funcao_valor || ""}` : "Não"}
            />
            <Campo
              label={`${qp.ben_va_vr || "VA/VR"} (valor dia)`}
              value={qp.ben_va_vr_ativo ? `Sim — ${qp.ben_va_vr_valor || ""}` : "Não"}
            />
            <Campo label="PPO" value={qp.ben_ppo ? `Sim — ${qp.ben_ppo_valor || ""}` : "Não"} />
            <Campo label="VT / auxílio" value={qp.ben_vt ? `Sim — ${qp.ben_vt_valor || ""}` : "Não"} />
            <Campo
              label="Plano de saúde"
              value={qp.ben_plano_saude ? `Sim — ${qp.ben_plano_saude_fob || ""}` : "Não"}
            />
            <Campo label="Plano odontológico" value={qp.ben_plano_odonto ? "Sim" : "Não"} />
            <Campo label="Outro" value={qp.ben_outro} />
            <Campo label="Obs." value={qp.ben_obs} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uniforme</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Campo label="Calça" value={qp.unif_calca} />
            <Campo label="Camisa" value={qp.unif_camisa} />
            <Campo label="Jaqueta" value={qp.unif_jaqueta} />
            <Campo label="Botina" value={qp.unif_botina} />
            <Campo label="Capa de chuva" value={qp.unif_capa_chuva} />
          </CardContent>
        </Card>
      </div>

      {qp.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{qp.observacoes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
