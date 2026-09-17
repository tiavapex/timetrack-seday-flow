import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PPONav } from "./PPONav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, FileSpreadsheet, FileDown, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PPO_DOC, fmtDataHora } from "@/lib/ppo";

export default function Auditoria() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [entidade, setEntidade] = useState("todas");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any)
        .from("ppo_auditoria_log")
        .select("*")
        .order("criado_em", { ascending: false })
        .limit(1000);
      if (error) toast.error("Erro: " + error.message);
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  const entidades = Array.from(new Set(rows.map((r) => r.entidade)));
  const filtrados = rows.filter(
    (r) =>
      (entidade === "todas" || r.entidade === entidade) &&
      (!busca || JSON.stringify(r).toLowerCase().includes(busca.toLowerCase()))
  );

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtrados.map((r) => ({
        "Data/hora": fmtDataHora(r.criado_em),
        Entidade: r.entidade,
        Registro: r.entidade_id,
        Ação: r.acao,
        Usuário: r.usuario_id,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Auditoria");
    XLSX.writeFile(wb, "auditoria-ppo.xlsx");
  };

  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(12);
    doc.text(`Relatório de auditoria do PPO — ${PPO_DOC}`, 14, 14);
    doc.setFontSize(9);
    doc.text(`Emitido em ${new Date().toLocaleString("pt-BR")}`, 14, 20);
    autoTable(doc, {
      startY: 26,
      head: [["Data/hora", "Entidade", "Registro", "Ação", "Usuário"]],
      body: filtrados
        .slice(0, 500)
        .map((r) => [fmtDataHora(r.criado_em), r.entidade, r.entidade_id, r.acao, r.usuario_id || "—"]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [30, 64, 124] },
      theme: "grid",
    });
    doc.save("auditoria-ppo.pdf");
  };

  return (
    <div className="space-y-6">
      <PPONav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Auditoria e rastreabilidade</h1>
          <p className="text-muted-foreground">
            Trilha imutável de acessos e alterações — {PPO_DOC}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportarExcel}>
            <FileSpreadsheet className="mr-1 h-4 w-4" /> Excel
          </Button>
          <Button size="sm" variant="outline" onClick={exportarPDF}>
            <FileDown className="mr-1 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Registros
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Input
              className="max-w-xs"
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <Select value={entidade} onValueChange={setEntidade}>
              <SelectTrigger className="w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as entidades</SelectItem>
                {entidades.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
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
              Nenhum registro de auditoria.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/hora</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Usuário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.slice(0, 300).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{fmtDataHora(r.criado_em)}</TableCell>
                      <TableCell>{r.entidade}</TableCell>
                      <TableCell className="max-w-[220px] truncate text-xs">{r.entidade_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.acao}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-xs">
                        {r.usuario_id || "—"}
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
