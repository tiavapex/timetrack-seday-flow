import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileDown,
  FileSpreadsheet,
  Loader2,
  Undo2,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { exportASEtoPDF, exportASEtoXLSX } from "@/lib/ase-export";

export default function ASEDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isGestor, roles } = useAuth();
  const isDP = roles.includes("master" as any) || roles.includes("admin" as any) || roles.includes("dp" as any);

  const [ase, setAse] = useState<any>(null);
  const [colabs, setColabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: a }, { data: c }] = await Promise.all([
      (supabase as any).from("ases").select("*").eq("id", id).maybeSingle(),
      (supabase as any).from("ase_colaboradores").select("*").eq("ase_id", id).order("numero"),
    ]);
    setAse(a);
    setColabs(c || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (patch: any, msg: string) => {
    setActing(true);
    const { error } = await (supabase as any).from("ases").update(patch).eq("id", id);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success(msg);
      load();
    }
    setActing(false);
  };

  const aprovar = () =>
    updateStatus(
      { status: "aprovada", aprovado_por: user?.id, aprovado_em: new Date().toISOString() },
      "ASE aprovada"
    );
  const reprovar = () =>
    updateStatus(
      { status: "reprovada", aprovado_por: user?.id, aprovado_em: new Date().toISOString() },
      "ASE reprovada"
    );
  const revogar = () =>
    updateStatus(
      {
        status: "pendente",
        aprovado_por: null,
        aprovado_em: null,
        lancado_por: null,
        lancado_em: null,
      },
      "Aprovação revogada"
    );
  const marcarLancada = () =>
    updateStatus(
      { status: "lancada", lancado_por: user?.id, lancado_em: new Date().toISOString() },
      "Marcada como lançada no ERP"
    );

  const doExport = (kind: "pdf" | "xlsx") => {
    if (!ase) return;
    const data = {
      ...ase,
      colaboradores: colabs,
    };
    if (kind === "pdf") exportASEtoPDF(data);
    else exportASEtoXLSX(data);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!ase) {
    return <div className="py-20 text-center text-muted-foreground">ASE não encontrada</div>;
  }

  const canApprove = isGestor && ase.status === "pendente";
  const canRevoke = isGestor && (ase.status === "aprovada" || ase.status === "lancada");
  const canMarkLancada = isDP && ase.status === "aprovada";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/ase")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ASE — {ase.cliente}</h1>
            <p className="text-muted-foreground">
              {new Date(ase.periodo_data + "T00:00:00").toLocaleDateString("pt-BR")} ·{" "}
              <Badge variant="outline">{ase.status}</Badge>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => doExport("pdf")}>
            <FileDown className="mr-1 h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" onClick={() => doExport("xlsx")}>
            <FileSpreadsheet className="mr-1 h-4 w-4" /> XLSX
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 text-sm">
          <div><span className="text-muted-foreground">Cliente:</span> <strong>{ase.cliente}</strong></div>
          <div><span className="text-muted-foreground">C.Custo:</span> {ase.centro_custo}</div>
          <div><span className="text-muted-foreground">Setor:</span> {ase.setor}{ase.setor_outro ? ` - ${ase.setor_outro}` : ""}</div>
          <div><span className="text-muted-foreground">Responsável:</span> {ase.responsavel}</div>
          <div><span className="text-muted-foreground">Líder/Gestor:</span> {ase.lider_gestor || "—"}</div>
          <div><span className="text-muted-foreground">Horário:</span> {ase.horario_inicio?.slice(0,5)} às {ase.horario_fim?.slice(0,5)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Colaboradores ({colabs.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Escala</TableHead>
                <TableHead>N°</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>VT</TableHead>
                <TableHead>Alimentação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colabs.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.escala_sim ? "Sim" : "—"}</TableCell>
                  <TableCell>{c.numero ?? "—"}</TableCell>
                  <TableCell>{c.matricula || "—"}</TableCell>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>{c.cargo || "—"}</TableCell>
                  <TableCell>{c.vt ? "Sim" : "—"}</TableCell>
                  <TableCell>{c.alimentacao ? "Sim" : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Atividades</CardTitle></CardHeader>
        <CardContent className="whitespace-pre-wrap text-sm">{ase.atividades}</CardContent>
      </Card>

      {ase.observacao && (
        <Card>
          <CardHeader><CardTitle>Observação</CardTitle></CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm">{ase.observacao}</CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 justify-end">
        {canApprove && (
          <>
            <Button onClick={aprovar} disabled={acting}>
              <CheckCircle2 className="mr-1 h-4 w-4" /> Aprovar
            </Button>
            <Button variant="destructive" onClick={reprovar} disabled={acting}>
              <XCircle className="mr-1 h-4 w-4" /> Reprovar
            </Button>
          </>
        )}
        {canMarkLancada && (
          <Button onClick={marcarLancada} disabled={acting}>
            <Briefcase className="mr-1 h-4 w-4" /> Marcar lançada no ERP
          </Button>
        )}
        {canRevoke && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={acting}>
                <Undo2 className="mr-1 h-4 w-4" /> Revogar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revogar ASE?</AlertDialogTitle>
                <AlertDialogDescription>
                  A ASE voltará para o status pendente e qualquer lançamento no ERP será desfeito.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={revogar}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
