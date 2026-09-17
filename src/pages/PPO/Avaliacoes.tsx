import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PPONav } from "./PPONav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { STATUS_AVALIACAO, fmtNota, rotuloFaixa } from "@/lib/ppo";

export default function Avaliacoes() {
  const [rows, setRows] = useState<any[]>([]);
  const [ciclos, setCiclos] = useState<any[]>([]);
  const [ciclo, setCiclo] = useState("todos");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [av, cy, pf] = await Promise.all([
        (supabase as any)
          .from("ppo_avaliacoes")
          .select("id, ciclo_id, status, nota_final, faixa, elegivel, colaborador_id")
          .eq("ativo", true)
          .order("created_at", { ascending: false }),
        (supabase as any).from("ppo_ciclos").select("id, nome").order("periodo_inicio", { ascending: false }),
        (supabase as any).from("profiles").select("id, nome, matricula, cargo, setor"),
      ]);
      if (av.error) toast.error("Erro ao carregar avaliações: " + av.error.message);
      const mapa = new Map((pf.data || []).map((p: any) => [p.id, p]));
      setRows((av.data || []).map((a: any) => ({ ...a, colaborador: mapa.get(a.colaborador_id) })));
      setCiclos(cy.data || []);
      setLoading(false);
    })();
  }, []);

  const filtrados = rows.filter(
    (r) =>
      (ciclo === "todos" || r.ciclo_id === ciclo) &&
      (!busca ||
        (r.colaborador?.nome || "").toLowerCase().includes(busca.toLowerCase()) ||
        (r.colaborador?.matricula || "").includes(busca))
  );

  return (
    <div className="space-y-6">
      <PPONav />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Apuração de avaliações</h1>
        <p className="text-muted-foreground">
          Resultados individuais e confidenciais — acesso restrito ao seu papel no programa.
        </p>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle>Avaliações</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Buscar por nome ou matrícula..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="max-w-xs"
            />
            <Select value={ciclo} onValueChange={setCiclo}>
              <SelectTrigger className="w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os ciclos</SelectItem>
                {ciclos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtrados.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma avaliação disponível. Gere as avaliações a partir de um ciclo aberto.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Nota final</TableHead>
                    <TableHead>Faixa</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.colaborador?.nome || "—"}</TableCell>
                      <TableCell>{r.colaborador?.matricula || "—"}</TableCell>
                      <TableCell>{r.colaborador?.cargo || "—"}</TableCell>
                      <TableCell>{r.colaborador?.setor || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{STATUS_AVALIACAO[r.status] || r.status}</Badge>
                      </TableCell>
                      <TableCell>{fmtNota(r.nota_final)}</TableCell>
                      <TableCell>
                        {r.elegivel === false ? "Inelegível" : rotuloFaixa(r.faixa)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/ppo/avaliacoes/${r.id}`}>
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
