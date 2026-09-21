import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, RefreshCw, Users, Clock, AlertTriangle, Link2 } from "lucide-react";
import { toast } from "sonner";

interface Lote {
  id: string;
  source: string;
  entity: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  rows_fetched: number;
  rows_new: number;
  rows_changed: number;
  error_message: string | null;
  triggered_by: string | null;
  rejeitados: number;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  running: "secondary",
  success: "default",
  partial: "outline",
  error: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  running: "Em andamento",
  success: "Concluída",
  partial: "Concluída com rejeições",
  error: "Erro",
};

function dataHora(v: string | null) {
  return v ? new Date(v).toLocaleString("pt-BR") : "-";
}

export default function ColaboradoresVPS() {
  const { isAdmin, isRh } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [cargaCompleta, setCargaCompleta] = useState(false);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [ativos, setAtivos] = useState(0);

  const podeVer = isAdmin || isRh;

  const carregar = async () => {
    setLoading(true);
    const [{ data: hist, error: histErr }, { count }] = await Promise.all([
      (supabase as any).rpc("fn_sync_status", { p_limit: 50 }),
      (supabase as any).from("vw_colaboradores_ativos").select("id", { count: "exact", head: true }),
    ]);
    if (histErr) toast.error("Erro ao carregar histórico: " + histErr.message);
    else setLotes((hist as Lote[]) || []);
    setAtivos(count || 0);
    setLoading(false);
  };

  useEffect(() => {
    if (podeVer) carregar();
    else setLoading(false);
  }, [podeVer]);

  const sincronizar = async () => {
    setSincronizando(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-colaboradores", {
        body: { full: cargaCompleta },
      });
      if (error) throw error;
      const d = data as any;
      if (d?.ok === false) throw new Error(d?.error || "Falha na sincronização");
      toast.success(
        `Sincronização concluída: ${d?.rows_fetched ?? 0} recebidos, ${d?.novos ?? 0} novos, ${
          d?.alterados ?? 0
        } alterados, ${d?.rejeitados ?? 0} rejeitados.`
      );
    } catch (e: any) {
      toast.error("Erro na sincronização: " + (e?.message || e));
    } finally {
      setSincronizando(false);
      carregar();
    }
  };

  if (!podeVer) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Esta página é restrita a administradores e ao RH.
        </CardContent>
      </Card>
    );
  }

  const ultimo = lotes[0];
  const ultimoSucesso = lotes.find((l) => l.status === "success" || l.status === "partial");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Colaboradores (VPS)</h1>
          <p className="text-muted-foreground">
            Integração somente leitura com a base de colaboradores da VPS
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link to="/integracoes/vinculos">
              <Link2 className="mr-2 h-4 w-4" /> Vincular colaboradores
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Switch
              id="carga-completa"
              checked={cargaCompleta}
              onCheckedChange={setCargaCompleta}
            />
            <Label htmlFor="carga-completa" className="text-sm">
              Carga completa
            </Label>
          </div>
          <Button onClick={sincronizar} disabled={sincronizando}>
            {sincronizando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sincronizar agora
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" /> Colaboradores ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{ativos}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" /> Última sincronização
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">
            {dataHora(ultimoSucesso?.finished_at ?? null)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status do último lote
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ultimo ? (
              <Badge variant={STATUS_VARIANT[ultimo.status] || "outline"}>
                {STATUS_LABEL[ultimo.status] || ultimo.status}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">Sem lotes</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertTriangle className="h-4 w-4" /> Rejeitados (último lote)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{ultimo?.rejeitados ?? 0}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de sincronizações</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : lotes.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma sincronização executada até agora.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Recebidos</TableHead>
                    <TableHead className="text-right">Novos</TableHead>
                    <TableHead className="text-right">Alterados</TableHead>
                    <TableHead className="text-right">Rejeitados</TableHead>
                    <TableHead>Disparado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotes.map((l) => (
                    <Fragment key={l.id}>
                      <TableRow>
                        <TableCell>{dataHora(l.started_at)}</TableCell>
                        <TableCell>{dataHora(l.finished_at)}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[l.status] || "outline"}>
                            {STATUS_LABEL[l.status] || l.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{l.rows_fetched}</TableCell>
                        <TableCell className="text-right">{l.rows_new}</TableCell>
                        <TableCell className="text-right">{l.rows_changed}</TableCell>
                        <TableCell className="text-right">{l.rejeitados}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {l.triggered_by || "-"}
                        </TableCell>
                      </TableRow>
                      {l.error_message && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-sm text-destructive">
                            {l.error_message}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
