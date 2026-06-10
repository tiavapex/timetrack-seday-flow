import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Check,
  X,
  RotateCcw,
  FileDown,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { exportFeriasPDF, exportFeriasXLSX } from "@/lib/ferias-export";

export default function FeriasDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [canLaunch, setCanLaunch] = useState(false);
  const [reproveOpen, setReproveOpen] = useState(false);
  const [reproveMotivo, setReproveMotivo] = useState("");

  const fetchOne = async () => {
    setLoading(true);
    const { data: row, error } = await (supabase as any)
      .from("ferias_solicitacoes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !row) {
      toast.error("Solicitação não encontrada");
      navigate("/ferias");
      return;
    }
    setData(row);

    // Check approval permissions via RPC
    if (user && row.user_id !== user.id) {
      const { data: ok } = await (supabase as any).rpc("can_approve_ferias", {
        _approver: user.id,
        _solicitante: row.user_id,
      });
      setCanApprove(!!ok);
    } else {
      setCanApprove(false);
    }

    // DP+/admin can launch
    const { data: dpOk } = await (supabase as any).rpc("is_dp_or_higher", { _user_id: user?.id });
    setCanLaunch(!!dpOk);

    setLoading(false);
  };

  useEffect(() => {
    if (id && user) fetchOne();
  }, [id, user]);

  const update = async (patch: any) => {
    setBusy(true);
    const { error } = await (supabase as any)
      .from("ferias_solicitacoes")
      .update(patch)
      .eq("id", id);
    setBusy(false);
    if (error) {
      toast.error("Erro: " + error.message);
      return false;
    }
    await fetchOne();
    return true;
  };

  const aprovar = async () => {
    if (await update({
      status: "aprovada",
      aprovado_por: user!.id,
      aprovado_em: new Date().toISOString(),
      reprovado_motivo: null,
    })) toast.success("Solicitação aprovada");
  };

  const reprovar = async () => {
    if (!reproveMotivo.trim()) {
      toast.error("Informe o motivo");
      return;
    }
    if (await update({
      status: "reprovada",
      aprovado_por: user!.id,
      aprovado_em: new Date().toISOString(),
      reprovado_motivo: reproveMotivo,
    })) {
      toast.success("Solicitação reprovada");
      setReproveOpen(false);
      setReproveMotivo("");
    }
  };

  const revogar = async () => {
    if (!confirm("Revogar a aprovação desta solicitação?")) return;
    if (await update({
      status: "pendente",
      aprovado_por: null,
      aprovado_em: null,
      lancado_erp: false,
      lancado_por: null,
      lancado_em: null,
    })) toast.success("Aprovação revogada");
  };

  const lancarERP = async () => {
    if (await update({
      status: "lancada",
      lancado_erp: true,
      lancado_por: user!.id,
      lancado_em: new Date().toISOString(),
    })) toast.success("Marcada como lançada no ERP");
  };

  if (loading || !data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fmt = (d: string | null) =>
    d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "-";

  const STATUS_VARIANT: Record<string, any> = {
    pendente: "secondary",
    aprovada: "default",
    reprovada: "destructive",
    lancada: "default",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/ferias")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Solicitação de Férias</h1>
            <p className="text-muted-foreground">{data.colaborador_nome}</p>
          </div>
        </div>
        <Badge variant={STATUS_VARIANT[data.status] || "outline"}>{data.status}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Dados</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
          <Field label="Data de Emissão" value={fmt(data.data_emissao)} />
          <Field label="Centro de Custo" value={data.centro_custo} />
          <Field label="Matrícula" value={data.matricula || "-"} />
          <Field label="Colaborador" value={data.colaborador_nome} />
          <Field label="Cargo" value={data.cargo || "-"} />
          <Field label="Empresa" value={data.empresa || "-"} />
          <Field
            label="Período Aquisitivo"
            value={`${fmt(data.periodo_aquisitivo_inicio)} a ${fmt(data.periodo_aquisitivo_fim)}`}
          />
          <Field label="Data de Início" value={fmt(data.data_inicio)} />
          <Field label="Descanso (dias)" value={String(data.dias_descanso)} />
          <Field label="Abono - início" value={fmt(data.abono_data_inicio)} />
          <Field label="Abono - dias" value={data.abono_dias ? String(data.abono_dias) : "-"} />
          {data.observacao && (
            <div className="md:col-span-2">
              <div className="text-xs text-muted-foreground">Observação</div>
              <div className="whitespace-pre-wrap">{data.observacao}</div>
            </div>
          )}
          {data.reprovado_motivo && (
            <div className="md:col-span-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <div className="text-xs font-medium text-destructive">Motivo da reprovação</div>
              <div className="text-sm">{data.reprovado_motivo}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ações</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {data.status === "pendente" && canApprove && (
            <>
              <Button onClick={aprovar} disabled={busy}>
                <Check className="mr-2 h-4 w-4" /> Aprovar
              </Button>
              <Button variant="destructive" onClick={() => setReproveOpen(true)} disabled={busy}>
                <X className="mr-2 h-4 w-4" /> Reprovar
              </Button>
            </>
          )}
          {data.status === "aprovada" && (canApprove || isAdmin) && (
            <Button variant="outline" onClick={revogar} disabled={busy}>
              <RotateCcw className="mr-2 h-4 w-4" /> Revogar aprovação
            </Button>
          )}
          {data.status === "aprovada" && canLaunch && (
            <Button onClick={lancarERP} disabled={busy}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Marcar lançada no ERP
            </Button>
          )}
          <Button variant="outline" onClick={() => exportFeriasPDF(data)}>
            <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
          <Button variant="outline" onClick={() => exportFeriasXLSX(data)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar XLSX
          </Button>
        </CardContent>
      </Card>

      <Dialog open={reproveOpen} onOpenChange={setReproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprovar solicitação</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Motivo da reprovação"
            value={reproveMotivo}
            onChange={(e) => setReproveMotivo(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReproveOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={reprovar} disabled={busy}>Reprovar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
