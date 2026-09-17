import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PPONav } from "./PPONav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Network } from "lucide-react";
import { PPO_DOC, PPO_TEXTOS_LEGAIS } from "@/lib/ppo";

export default function Governanca() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("ppo_governanca")
        .select("*")
        .order("ordem");
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PPONav />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Governança do programa</h1>
        <p className="text-muted-foreground">
          Matriz de responsabilidades e validações — {PPO_DOC}, Anexo VIII
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" /> Etapas, responsáveis e registros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Validação</TableHead>
                    <TableHead>Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.etapa}</TableCell>
                      <TableCell>{r.responsavel_perfil}</TableCell>
                      <TableCell>{r.validacao_perfil || "—"}</TableCell>
                      <TableCell>{r.registro || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Princípios e limites do programa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{PPO_TEXTOS_LEGAIS.faixas}</p>
          <p>{PPO_TEXTOS_LEGAIS.participacao}</p>
          <p>{PPO_TEXTOS_LEGAIS.naoSubstitui}</p>
          <p>{PPO_TEXTOS_LEGAIS.inelegibilidade}</p>
          <p>
            Casos omissos são encaminhados para análise conjunta de RH, Gerência, Jurídico e
            Diretoria.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
