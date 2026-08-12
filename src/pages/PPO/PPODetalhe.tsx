import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Loader2, FileDown, FileSpreadsheet, Check, X } from "lucide-react";
import { toast } from "sonner";
import { getPilar, PPO_NOTA_OBS, totalMaximo } from "@/lib/ppo-criterios";
import { exportPPOtoPDF, exportPPOtoExcel } from "@/lib/ppo-export";

export default function PPODetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isGestor } = useAuth();
  const [ppo, setPpo] = useState<any>(null);
  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await (supabase as any)
      .from("ppo_avaliacoes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) {
      toast.error("Avaliação não encontrada");
      setLoading(false);
      return;
    }
    const { data: its } = await (supabase as any)
      .from("ppo_itens")
      .select("*")
      .eq("ppo_id", id)
      .order("ordem");
    setPpo(data);
    setItens(its || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const alterarStatus = async (status: string) => {
    const { error } = await (supabase as any)
      .from("ppo_avaliacoes")
      .update({ status })
      .eq("id", id);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Status atualizado");
    load();
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (!ppo) return null;

  const pilar = getPilar(ppo.tipo);
  const dados = {
    tipo: ppo.tipo,
    pilar: ppo.pilar,
    empresa: ppo.empresa,
    periodo_inicio: ppo.periodo_inicio,
    periodo_fim: ppo.periodo_fim,
    observacao: ppo.observacao,
    itens: itens.map((i) => ({
      matricula: i.matricula,
      nome: i.nome,
      funcao: i.funcao,
      criterios: i.criterios || {},
      total: i.total,
      observacao: i.observacao,
    })),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/ppo")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{pilar.titulo}</h1>
            <p className="text-muted-foreground">
              {pilar.pilar} • {new Date(ppo.periodo_inicio + "T00:00:00").toLocaleDateString("pt-BR")} a{" "}
              {new Date(ppo.periodo_fim + "T00:00:00").toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="self-center">{ppo.status}</Badge>
          <Button variant="outline" size="sm" onClick={() => exportPPOtoPDF(dados)}>
            <FileDown className="mr-1 h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportPPOtoExcel(dados)}>
            <FileSpreadsheet className="mr-1 h-4 w-4" /> Excel
          </Button>
          {isGestor && ppo.status === "pendente" && (
            <>
              <Button size="sm" onClick={() => alterarStatus("aprovado")}>
                <Check className="mr-1 h-4 w-4" /> Aprovar
              </Button>
              <Button size="sm" variant="destructive" onClick={() => alterarStatus("reprovado")}>
                <X className="mr-1 h-4 w-4" /> Reprovar
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Colaboradores avaliados
            {pilar.modo === "pontuacao" && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (máximo {totalMaximo(pilar)} pontos)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MAT</TableHead>
                  <TableHead>NOME</TableHead>
                  <TableHead>FUNÇÃO</TableHead>
                  {pilar.criterios.map((c) => (
                    <TableHead key={c.key} className="text-center text-[10px] leading-tight">
                      {c.label}
                      <div className="font-normal text-muted-foreground">{c.peso}</div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center">TOTAL</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.matricula || "-"}</TableCell>
                    <TableCell className="font-medium">{i.nome}</TableCell>
                    <TableCell>{i.funcao || "-"}</TableCell>
                    {pilar.criterios.map((c) => {
                      const ok = (i.criterios || {})[c.key] !== false;
                      return (
                        <TableCell key={c.key} className="text-center">
                          {pilar.modo === "pontuacao" ? (
                            ok ? c.peso : 0
                          ) : ok ? (
                            "ok"
                          ) : (
                            <span className="font-bold text-destructive">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-medium">{i.total ?? "-"}</TableCell>
                    <TableCell className="text-xs">{i.observacao || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{PPO_NOTA_OBS}</p>
          {ppo.observacao && (
            <p className="mt-3 text-sm">
              <strong>Observação geral:</strong> {ppo.observacao}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
