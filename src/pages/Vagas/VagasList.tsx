import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Loader2, Briefcase, Eye } from "lucide-react";
import { toast } from "sonner";

interface Vaga {
  id: string;
  numero: number;
  cargo_solicitado: string;
  unidade: string;
  area_departamento: string;
  solicitante_nome: string;
  status: string;
  data_solicitacao: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pendente_aprovacao: "secondary",
  aprovada: "default",
  congelada: "outline",
  cancelada: "destructive",
  fechada: "default",
};
const STATUS_LABEL: Record<string, string> = {
  pendente_aprovacao: "Pendente Aprovação",
  aprovada: "Aprovada",
  congelada: "Congelada",
  cancelada: "Cancelada",
  fechada: "Fechada",
};

export default function VagasList() {
  const { isGestor } = useAuth();
  const [items, setItems] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("vagas")
      .select("id, numero, cargo_solicitado, unidade, area_departamento, solicitante_nome, status, data_solicitacao")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro: " + error.message);
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter(
    (v) =>
      !search ||
      v.cargo_solicitado.toLowerCase().includes(search.toLowerCase()) ||
      v.solicitante_nome.toLowerCase().includes(search.toLowerCase()) ||
      v.unidade.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Abertura de Vagas</h1>
          <p className="text-muted-foreground">Requisição e acompanhamento de vagas</p>
        </div>
        {isGestor && (
          <Button asChild>
            <Link to="/vagas/nova"><Plus className="mr-2 h-4 w-4" /> Nova Vaga</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> Vagas
          </CardTitle>
          <Input
            placeholder="Buscar por cargo, solicitante ou unidade..."
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
            <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma vaga encontrada.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{v.numero}</TableCell>
                      <TableCell>{new Date(v.data_solicitacao + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="font-medium">{v.cargo_solicitado}</TableCell>
                      <TableCell>{v.unidade}</TableCell>
                      <TableCell>{v.area_departamento}</TableCell>
                      <TableCell>{v.solicitante_nome}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[v.status] || "outline"}>
                          {STATUS_LABEL[v.status] || v.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/vagas/${v.id}`}><Eye className="mr-1 h-4 w-4" /> Abrir</Link>
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
