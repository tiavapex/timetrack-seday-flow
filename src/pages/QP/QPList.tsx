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
import { Plus, Loader2, ClipboardPen, Eye } from "lucide-react";
import { toast } from "sonner";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  rascunho: "outline",
  pendente: "secondary",
  aprovado: "default",
  reprovado: "destructive",
  concluido: "default",
};

function tipos(r: any) {
  const map: [string, boolean][] = [
    ["Admissão", r.tp_admissao],
    ["Demissão", r.tp_demissao],
    ["Reembolso", r.tp_reembolso],
    ["Advertência", r.tp_advertencia],
    ["Abono", r.tp_abono],
    ["Acerto de ponto", r.tp_acerto_ponto],
    ["Troca", r.tp_troca],
    ["Compensação", r.tp_compensacao],
    ["Folga", r.tp_folga],
  ];
  return map.filter(([, v]) => v).map(([k]) => k).join(", ") || "-";
}

export default function QPList() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any)
        .from("qp_solicitacoes")
        .select("*")
        .order("data_evento", { ascending: false });
      if (error) toast.error("Erro: " + error.message);
      else setRows(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter(
    (r) =>
      !search ||
      r.nome.toLowerCase().includes(search.toLowerCase()) ||
      (r.matricula || "").includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">QP — Queira Providenciar</h1>
          <p className="text-muted-foreground">
            Solicitações administrativas e de pessoal
          </p>
        </div>
        <Button asChild>
          <Link to="/qp/nova">
            <Plus className="mr-2 h-4 w-4" /> Nova QP
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardPen className="h-5 w-5" /> Solicitações
          </CardTitle>
          <Input
            placeholder="Buscar por nome ou matrícula..."
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
              Nenhuma QP encontrada.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data evento</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        {new Date(r.data_evento + "T00:00:00").toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>{r.empresa}</TableCell>
                      <TableCell className="font-medium">{r.nome}</TableCell>
                      <TableCell>{r.cargo || "-"}</TableCell>
                      <TableCell className="text-xs">{tipos(r)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[r.status] || "outline"}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/qp/${r.id}`}>
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
