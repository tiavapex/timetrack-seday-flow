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
import { Plus, Loader2, FileText, Eye } from "lucide-react";
import { toast } from "sonner";

interface ASE {
  id: string;
  periodo_data: string;
  cliente: string;
  centro_custo: string;
  setor: string;
  responsavel: string;
  status: string;
  created_at: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  rascunho: "outline",
  pendente: "secondary",
  aprovada: "default",
  reprovada: "destructive",
  lancada: "default",
};

export default function ASEList() {
  const { isGestor } = useAuth();
  const [ases, setAses] = useState<ASE[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("ases")
      .select("id, periodo_data, cliente, centro_custo, setor, responsavel, status, created_at")
      .order("periodo_data", { ascending: false });
    if (error) toast.error("Erro: " + error.message);
    else setAses(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, []);

  const filtered = ases.filter(
    (a) =>
      !search ||
      a.cliente.toLowerCase().includes(search.toLowerCase()) ||
      a.responsavel.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ASE</h1>
          <p className="text-muted-foreground">
            Autorização de Serviços Extraordinários
          </p>
        </div>
        {isGestor && (
          <Button asChild>
            <Link to="/ase/nova">
              <Plus className="mr-2 h-4 w-4" /> Nova ASE
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Autorizações
          </CardTitle>
          <Input
            placeholder="Buscar por cliente ou responsável..."
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
              Nenhuma ASE encontrada.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>C.Custo</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        {new Date(a.periodo_data + "T00:00:00").toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-medium">{a.cliente}</TableCell>
                      <TableCell>{a.centro_custo}</TableCell>
                      <TableCell>{a.setor}</TableCell>
                      <TableCell>{a.responsavel}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[a.status] || "outline"}>
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/ase/${a.id}`}>
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
