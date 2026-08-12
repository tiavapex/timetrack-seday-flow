import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { Plus, Loader2, ClipboardList, Eye } from "lucide-react";
import { toast } from "sonner";
import { getPilar } from "@/lib/ppo-criterios";

interface PPO {
  id: string;
  tipo: string;
  pilar: string;
  empresa: string | null;
  periodo_inicio: string;
  periodo_fim: string;
  status: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  rascunho: "outline",
  pendente: "secondary",
  aprovado: "default",
  reprovado: "destructive",
};

export default function PPOList() {
  const [rows, setRows] = useState<PPO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any)
        .from("ppo_avaliacoes")
        .select("id, tipo, pilar, empresa, periodo_inicio, periodo_fim, status")
        .order("periodo_inicio", { ascending: false });
      if (error) toast.error("Erro: " + error.message);
      else setRows(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter(
    (r) =>
      !search ||
      getPilar(r.tipo).titulo.toLowerCase().includes(search.toLowerCase()) ||
      (r.empresa || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Avaliação PPO</h1>
          <p className="text-muted-foreground">
            Programa de Participação por Objetivos — Pilares 1, 2 e 3
          </p>
        </div>
        <Button asChild>
          <Link to="/ppo/nova">
            <Plus className="mr-2 h-4 w-4" /> Nova Avaliação
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> Avaliações
          </CardTitle>
          <Input
            placeholder="Buscar por pilar ou empresa..."
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
              Nenhuma avaliação encontrada.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pilar</TableHead>
                    <TableHead>Avaliação</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.pilar}</TableCell>
                      <TableCell className="font-medium">
                        {getPilar(r.tipo).titulo}
                      </TableCell>
                      <TableCell>{r.empresa || "-"}</TableCell>
                      <TableCell>
                        {new Date(r.periodo_inicio + "T00:00:00").toLocaleDateString("pt-BR")} a{" "}
                        {new Date(r.periodo_fim + "T00:00:00").toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[r.status] || "outline"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/ppo/${r.id}`}>
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
