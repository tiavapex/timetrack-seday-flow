import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Upload, Loader2, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Mapeamento: coluna do arquivo → campo do profile
const CAMPOS = [
  { src: "NOMECOMPLETOFUNC_ORIGINAL", dst: "nome", label: "Nome completo" },
  { src: "CHAPAFUNC", dst: "matricula", label: "Matrícula" },
  { src: "DESCFUNCAO", dst: "cargo", label: "Cargo" },
  { src: "DESCFUNCAOCOMPLETA", dst: "funcao_completa", label: "Função completa" },
  { src: "DESCSETOR", dst: "setor_desc", label: "Setor (descrição)" },
  { src: "CODSETOR", dst: "setor_codigo", label: "Setor (código)" },
  { src: "DESCSECAO", dst: "secao_desc", label: "Seção (descrição)" },
  { src: "CODSECAO", dst: "secao_codigo", label: "Seção (código)" },
  { src: "DESCDEPTO", dst: "depto", label: "Departamento" },
  { src: "DATAADMISSAO", dst: "data_admissao", label: "Data admissão (opcional)" },
  { src: "EMAIL", dst: "email", label: "E-mail (opcional)" },
];

type ParsedRow = Record<string, any>;
type Result = { inseridos: number; ignorados: number; erros: { matricula: string; motivo: string }[] };

function normalizeKey(k: string) {
  return (k || "").toString().trim().toUpperCase().replace(/\s+/g, "");
}

function parseDate(v: any): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  // dd/mm/yyyy
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
}

export default function ImportarColaboradores() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  if (!isAdmin) {
    return <p className="text-sm text-muted-foreground">Apenas administradores podem importar colaboradores.</p>;
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array", cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
    if (!json.length) {
      toast.error("Arquivo vazio");
      return;
    }
    // Normaliza chaves
    const normalized = json.map((r) => {
      const o: ParsedRow = {};
      Object.keys(r).forEach((k) => (o[normalizeKey(k)] = r[k]));
      return o;
    });
    setHeaders(Object.keys(normalized[0]));
    setRows(normalized);
    toast.success(`${normalized.length} linhas carregadas`);
  };

  const importar = async () => {
    if (!rows.length) return;
    setImporting(true);
    const res: Result = { inseridos: 0, ignorados: 0, erros: [] };

    // 1) busca matrículas já existentes
    const matriculas = rows
      .map((r) => String(r["CHAPAFUNC"] ?? "").trim())
      .filter(Boolean);
    const { data: existentes } = await (supabase as any)
      .from("profiles")
      .select("matricula")
      .in("matricula", matriculas);
    const existSet = new Set((existentes || []).map((p: any) => String(p.matricula)));

    // 2) monta lote (ignora duplicados)
    const payload: any[] = [];
    for (const r of rows) {
      const matricula = String(r["CHAPAFUNC"] ?? "").trim();
      if (!matricula) {
        res.erros.push({ matricula: "(sem matrícula)", motivo: "CHAPAFUNC vazio" });
        continue;
      }
      if (existSet.has(matricula)) {
        res.ignorados++;
        continue;
      }
      const nome = String(r["NOMECOMPLETOFUNC_ORIGINAL"] ?? "").trim();
      if (!nome) {
        res.erros.push({ matricula, motivo: "Nome vazio" });
        continue;
      }
      payload.push({
        matricula,
        nome,
        email: String(r["EMAIL"] ?? "").trim() || null,
        cargo: String(r["DESCFUNCAO"] ?? "").trim() || null,
        funcao_completa: String(r["DESCFUNCAOCOMPLETA"] ?? "").trim() || null,
        setor_desc: String(r["DESCSETOR"] ?? "").trim() || null,
        setor_codigo: String(r["CODSETOR"] ?? "").trim() || null,
        secao_desc: String(r["DESCSECAO"] ?? "").trim() || null,
        secao_codigo: String(r["CODSECAO"] ?? "").trim() || null,
        depto: String(r["DESCDEPTO"] ?? "").trim() || null,
        setor: String(r["DESCSETOR"] ?? "").trim() || null,
        data_admissao: parseDate(r["DATAADMISSAO"]),
        ativo: true,
      });
      existSet.add(matricula); // evita dup dentro do próprio arquivo
    }

    // 3) insere em chunks
    const CHUNK = 200;
    for (let i = 0; i < payload.length; i += CHUNK) {
      const slice = payload.slice(i, i + CHUNK);
      const { error, data } = await (supabase as any)
        .from("profiles")
        .insert(slice)
        .select("id");
      if (error) {
        res.erros.push({ matricula: `(lote ${i}-${i + slice.length})`, motivo: error.message });
      } else {
        res.inseridos += (data || []).length;
      }
    }

    setImporting(false);
    setResult(res);
    if (res.inseridos > 0) toast.success(`${res.inseridos} colaboradores importados`);
    if (res.erros.length) toast.error(`${res.erros.length} erro(s) na importação`);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/colaboradores")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Importar Colaboradores</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" /> Origem dos dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted/40 p-3 text-sm space-y-1">
            <p className="font-medium">Como gerar o arquivo:</p>
            <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
              <li>No SQL Server (TOTVS RM), execute sua consulta com as colunas:
                <code className="ml-1 text-xs">NOMECOMPLETOFUNC_ORIGINAL, CHAPAFUNC, DESCFUNCAO, DESCFUNCAOCOMPLETA, DESCSETOR, CODSETOR, DESCSECAO, CODSECAO, DESCDEPTO</code>.
              </li>
              <li>Exporte o resultado para <b>CSV</b> ou <b>XLSX</b> (UTF-8 recomendado).</li>
              <li>Faça o upload abaixo. Matrículas já cadastradas serão <b>ignoradas</b>.</li>
            </ol>
          </div>

          <div className="grid md:grid-cols-2 gap-2">
            {CAMPOS.map((c) => (
              <div key={c.src} className="text-xs flex items-center gap-2">
                <Badge variant="outline" className="font-mono">{c.src}</Badge>
                <span className="text-muted-foreground">→ {c.label}</span>
              </div>
            ))}
          </div>

          <div>
            <Label>Arquivo CSV ou XLSX</Label>
            <Input type="file" accept=".csv,.xlsx,.xls" onChange={onFile} />
            {fileName && <p className="text-xs text-muted-foreground mt-1">Selecionado: {fileName}</p>}
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pré-visualização ({rows.length} linhas)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-80 border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.slice(0, 9).map((h) => <TableHead key={h} className="text-xs">{h}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 20).map((r, i) => (
                    <TableRow key={i}>
                      {headers.slice(0, 9).map((h) => <TableCell key={h} className="text-xs">{String(r[h] ?? "")}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <Button variant="outline" onClick={() => { setRows([]); setHeaders([]); setFileName(""); }}>
                Limpar
              </Button>
              <Button onClick={importar} disabled={importing}>
                {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Importar {rows.length} colaboradores
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader><CardTitle>Resultado</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-4 w-4" /> {result.inseridos} inseridos
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4" /> {result.ignorados} ignorados (matrícula já existe)
              </div>
              {result.erros.length > 0 && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" /> {result.erros.length} erros
                </div>
              )}
            </div>
            {result.erros.length > 0 && (
              <div className="max-h-60 overflow-auto border rounded p-2 text-xs space-y-1">
                {result.erros.map((e, i) => (
                  <div key={i}><b>{e.matricula}:</b> {e.motivo}</div>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button asChild variant="outline"><Link to="/colaboradores">Voltar para colaboradores</Link></Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
