import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PPONav } from "./PPONav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Gavel } from "lucide-react";
import { toast } from "sonner";
import { fmtData, fmtDataHora, fmtNota } from "@/lib/ppo";

export default function Contestacoes() {
  const { user, isRh, isGestor, podeAdminPPO } = useAuth();
  const podeDecidir = isRh || isGestor || podeAdminPPO;
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detalhe, setDetalhe] = useState<any>(null);

  const load = async () => {
    const { data, error } = await (supabase as any)
      .from("ppo_contestacoes")
      .select("*")
      .order("aberta_em", { ascending: false });
    if (error) toast.error("Erro: " + error.message);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const decidir = async (decisao: string) => {
    if (!detalhe.justificativa) return toast.error("A justificativa da decisão é obrigatória.");
    const patch: any = {
      decisao,
      justificativa: detalhe.justificativa,
      analise: detalhe.analise || null,
      analisado_por: user?.id,
      analisado_em: new Date().toISOString(),
    };
    if (decisao === "alterado") {
      patch.nota_nova = detalhe.nota_nova === "" ? null : Number(detalhe.nota_nova);
    }
    const { error } = await (supabase as any)
      .from("ppo_contestacoes")
      .update(patch)
      .eq("id", detalhe.id);
    if (error) return toast.error("Erro: " + error.message);

    if (decisao === "alterado" && detalhe.indicador_id && patch.nota_nova != null) {
      await (supabase as any)
        .from("ppo_avaliacao_itens")
        .update({
          nota_manual: patch.nota_nova,
          nota_manual_justificativa: `Contestação deferida: ${detalhe.justificativa}`,
        })
        .eq("avaliacao_id", detalhe.avaliacao_id)
        .eq("indicador_id", detalhe.indicador_id);
      await (supabase as any)
        .from("ppo_avaliacoes")
        .update({ status: "comunicada", comunicado_em: new Date().toISOString() })
        .eq("id", detalhe.avaliacao_id);
    }
    toast.success("Decisão registrada.");
    setDetalhe(null);
    load();
  };

  return (
    <div className="space-y-6">
      <PPONav />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contestações</h1>
        <p className="text-muted-foreground">
          Prazo de 3 dias úteis contados da comunicação do resultado.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" /> Solicitações de revisão
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma contestação registrada.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aberta em</TableHead>
                    <TableHead>Prazo limite</TableHead>
                    <TableHead>Resultado contestado</TableHead>
                    <TableHead>Decisão</TableHead>
                    <TableHead>Nota anterior</TableHead>
                    <TableHead>Nota nova</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{fmtDataHora(r.aberta_em)}</TableCell>
                      <TableCell>
                        {fmtData(r.prazo_limite)}
                        {r.fora_do_prazo && (
                          <Badge variant="destructive" className="ml-2">
                            fora do prazo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {r.resultado_contestado || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.decisao ? "secondary" : "outline"}>
                          {r.decisao || "em análise"}
                        </Badge>
                      </TableCell>
                      <TableCell>{fmtNota(r.nota_anterior)}</TableCell>
                      <TableCell>{fmtNota(r.nota_nova)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setDetalhe(r)}>
                          Abrir
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

      <Dialog open={!!detalhe} onOpenChange={(v) => !v && setDetalhe(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contestação</DialogTitle>
          </DialogHeader>
          {detalhe && (
            <div className="space-y-4 text-sm">
              <p>
                <strong>Resultado contestado:</strong> {detalhe.resultado_contestado || "—"}
              </p>
              <p>
                <strong>Motivo:</strong> {detalhe.motivo}
              </p>
              <p>
                <strong>Pedido de revisão:</strong> {detalhe.solicitacao_revisao || "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                Evidência: {detalhe.evidencia_url || "não anexada"}
              </p>

              {podeDecidir && !detalhe.decisao && (
                <div className="space-y-3 border-t pt-3">
                  <div className="space-y-1">
                    <Label>Análise</Label>
                    <Textarea
                      rows={2}
                      defaultValue={detalhe.analise || ""}
                      onBlur={(e) => setDetalhe({ ...detalhe, analise: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Justificativa da decisão *</Label>
                    <Textarea
                      rows={2}
                      defaultValue={detalhe.justificativa || ""}
                      onBlur={(e) => setDetalhe({ ...detalhe, justificativa: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Nova nota do indicador (se alterado)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue={detalhe.nota_nova ?? ""}
                      onBlur={(e) => setDetalhe({ ...detalhe, nota_nova: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => decidir("mantido")}>
                      Mantido
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => decidir("alterado")}>
                      Alterado
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => decidir("cancelado")}>
                      Cancelado
                    </Button>
                  </div>
                </div>
              )}

              {detalhe.decisao && (
                <div className="rounded-md border p-3">
                  <p>
                    <strong>Decisão:</strong> {detalhe.decisao} em {fmtDataHora(detalhe.analisado_em)}
                  </p>
                  <p className="text-muted-foreground">{detalhe.justificativa}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
