import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, ClipboardCheck } from "lucide-react";

export default function AvaliacoesList() {
  const { isGestor } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("avaliacoes_competencias")
        .select("*")
        .order("created_at", { ascending: false });
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" /> Avaliação de Competências
          </h1>
          <p className="text-sm text-muted-foreground">Avaliações 30, 60 e 90 dias</p>
        </div>
        {isGestor && (
          <Button onClick={() => navigate("/avaliacoes/nova")}>
            <Plus className="h-4 w-4 mr-2" /> Nova Avaliação
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma avaliação cadastrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2">Colaborador</th>
                    <th>Período</th>
                    <th>Medida</th>
                    <th>Mobilização</th>
                    <th>Criado em</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="py-2">{r.nome}</td>
                      <td>{r.periodo} dias</td>
                      <td><Badge variant="outline">{r.medida}</Badge></td>
                      <td>{r.mobilizacao ? `Sim (${r.data_mobilizacao})` : "Não"}</td>
                      <td>{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                      <td className="text-right">
                        <Link to={`/avaliacoes/${r.id}`} className="text-primary text-sm hover:underline">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
