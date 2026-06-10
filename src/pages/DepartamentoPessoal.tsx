import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, Clock, FileSpreadsheet, Undo2 } from "lucide-react";
import { toast } from "sonner";

interface HoraExtra {
  id: string;
  colaborador_nome: string;
  matricula: string | null;
  empresa: string;
  setor: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  total_minutos: number;
  tipo: string;
  motivo: string;
  status: string;
  lancado_erp: boolean;
  lancado_em: string | null;
}

function formatMinutos(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}`;
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

export default function DepartamentoPessoal() {
  const { user, isAdmin } = useAuth();
  const [registros, setRegistros] = useState<HoraExtra[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRegistros = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("horas_extras")
      .select("*")
      .eq("status", "aprovado")
      .order("data", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar registros: " + error.message);
    } else {
      setRegistros(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRegistros();
  }, []);

  const marcarLancado = async (id: string, lancar: boolean) => {
    setUpdatingId(id);
    const { error } = await (supabase as any)
      .from("horas_extras")
      .update({
        lancado_erp: lancar,
        lancado_em: lancar ? new Date().toISOString() : null,
        lancado_por: lancar ? user?.id : null,
      })
      .eq("id", id);

    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      toast.success(lancar ? "Marcado como lançado no ERP" : "Lançamento desfeito");
      fetchRegistros();
    }
    setUpdatingId(null);
  };

  const naoLancadas = registros.filter((r) => !r.lancado_erp);
  const lancadas = registros.filter((r) => r.lancado_erp);

  const totalMinutosNaoLancadas = naoLancadas.reduce((s, r) => s + r.total_minutos, 0);
  const totalMinutosLancadas = lancadas.reduce((s, r) => s + r.total_minutos, 0);

  const renderTable = (rows: HoraExtra[], lancadasTab: boolean) => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (rows.length === 0) {
      return (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Nenhum registro encontrado.
        </div>
      );
    }
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Motivo</TableHead>
              {lancadasTab && <TableHead>Lançado em</TableHead>}
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.colaborador_nome}</TableCell>
                <TableCell>{r.matricula || "—"}</TableCell>
                <TableCell>{r.empresa}</TableCell>
                <TableCell>{r.setor}</TableCell>
                <TableCell>{formatDate(r.data)}</TableCell>
                <TableCell>
                  {r.hora_inicio.slice(0, 5)} - {r.hora_fim.slice(0, 5)}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatMinutos(r.total_minutos)}
                </TableCell>
                <TableCell>
                  <Badge variant={r.tipo === "produtiva" ? "default" : "secondary"}>
                    {r.tipo}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={r.motivo}>
                  {r.motivo}
                </TableCell>
                {lancadasTab && (
                  <TableCell className="text-xs text-muted-foreground">
                    {r.lancado_em
                      ? new Date(r.lancado_em).toLocaleString("pt-BR")
                      : "—"}
                  </TableCell>
                )}
                <TableCell className="text-right">
                  {lancadasTab ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingId === r.id}
                      onClick={() => marcarLancado(r.id, false)}
                    >
                      {updatingId === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Undo2 className="mr-1 h-4 w-4" />
                          Desfazer
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={updatingId === r.id}
                      onClick={() => marcarLancado(r.id, true)}
                    >
                      {updatingId === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Marcar lançada
                        </>
                      )}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Departamento Pessoal</h1>
        <p className="text-muted-foreground">
          Controle das horas extras aprovadas e seu lançamento no ERP.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes ERP</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{naoLancadas.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatMinutos(totalMinutosNaoLancadas)} a lançar
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lançadas no ERP</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lancadas.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatMinutos(totalMinutosLancadas)} processadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aprovado</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registros.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatMinutos(totalMinutosLancadas + totalMinutosNaoLancadas)} no total
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="nao-lancadas" className="w-full">
        <TabsList>
          <TabsTrigger value="nao-lancadas">
            Não lançadas ({naoLancadas.length})
          </TabsTrigger>
          <TabsTrigger value="lancadas">
            Lançadas ({lancadas.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="nao-lancadas" className="mt-4">
          {renderTable(naoLancadas, false)}
        </TabsContent>
        <TabsContent value="lancadas" className="mt-4">
          {renderTable(lancadas, true)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
