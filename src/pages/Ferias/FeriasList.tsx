import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Loader2, Palmtree, Eye } from "lucide-react";
import { toast } from "sonner";

interface Ferias {
  id: string;
  colaborador_nome: string;
  matricula: string | null;
  data_emissao: string;
  data_inicio: string;
  dias_descanso: number;
  status: string;
  centro_custo: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pendente: "secondary",
  aprovada: "default",
  reprovada: "destructive",
  lancada: "default",
};

export default function FeriasList() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Ferias[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("ferias_solicitacoes")
      .select(
        "id, colaborador_nome, matricula, data_emissao, data_inicio, dias_descanso, status, centro_custo"
      )
      .order("data_emissao", { ascending: false });
    if (error) toast.error("Erro: " + error.message);
    else setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = rows.filter(
    (r) =>
      !search ||
      r.colaborador_nome.toLowerCase().includes(search.toLowerCase()) ||
      (r.matricula || "").includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Solicitação de Férias</h1>
          <p className="text-muted-foreground">
            Solicite, aprove e exporte os pedidos de férias
          </p>
        </div>
        {user && (
          <Button asChild>
            <Link to="/ferias/nova">
              <Plus className="mr-2 h-4 w-4" /> Nova solicitação
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palmtree className="h-5 w-5" /> Solicitações
          </CardTitle>
          <Input
            placeholder="Buscar por colaborador ou matrícula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma solicitação encontrada.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emissão</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>C.Custo</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Dias</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        {new Date(r.data_emissao + "T00:00:00").toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>{r.matricula || "-"}</TableCell>
                      <TableCell className="font-medium">{r.colaborador_nome}</TableCell>
                      <TableCell>{r.centro_custo}</TableCell>
                      <TableCell>
                        {new Date(r.data_inicio + "T00:00:00").toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>{r.dias_descanso}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[r.status] || "outline"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/ferias/${r.id}`}>
                            <Eye className="mr-1 h-4 w-4" /> Abrir
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
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
