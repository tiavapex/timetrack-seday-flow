import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PPONav } from "./PPONav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2, Plus, Pencil, AlertTriangle, FileSpreadsheet, Trash2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  PILARES,
  UNIDADES,
  DIRECOES,
  FONTES_DADO,
  MOTIVOS_ALTERACAO_INDICADOR,
  FAIXAS_META,
  FAIXAS_ACURACIDADE,
  FAIXAS_BINARIO,
  descreverFaixa,
  nomePilar,
  Faixa,
} from "@/lib/ppo";

const vazio = () => ({
  setor_id: "",
  cargo_id: "",
  pilar: "1",
  nome: "",
  descricao: "",
  formula: "",
  unidade: "%",
  direcao: "maior_melhor",
  meta: "",
  peso: "",
  fonte_dado: "",
  responsavel_id: "",
  requisito_minimo: false,
  critico: false,
  vigencia_inicio: "",
  motivo_alteracao: "",
});

function completo(i: any) {
  return !!(i.formula && i.meta !== null && i.peso !== null && i.fonte_dado && i.responsavel_id);
}

export default function Indicadores() {
  const { podeAdminPPO, isGestor } = useAuth();
  const podeEditar = podeAdminPPO || isGestor;

  const [loading, setLoading] = useState(true);
  const [indicadores, setIndicadores] = useState<any[]>([]);
  const [faixasPorInd, setFaixasPorInd] = useState<Record<string, Faixa[]>>({});
  const [setores, setSetores] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [perfis, setPerfis] = useState<any[]>([]);
  const [filtroSetor, setFiltroSetor] = useState("todos");
  const [filtroPilar, setFiltroPilar] = useState("todos");

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(vazio());
  const [faixas, setFaixas] = useState<Faixa[]>(FAIXAS_META);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [ind, fx, st, cg, pf] = await Promise.all([
      (supabase as any).from("ppo_indicadores").select("*").eq("ativo", true).order("pilar"),
      (supabase as any).from("ppo_faixas_indicador").select("*").order("ordem"),
      (supabase as any).from("ppo_setores").select("*").eq("ativo", true).order("nome"),
      (supabase as any).from("ppo_cargos").select("*").eq("ativo", true).order("nome"),
      (supabase as any).from("profiles").select("id, nome").eq("ativo", true).order("nome"),
    ]);
    if (ind.error) toast.error("Erro ao carregar indicadores: " + ind.error.message);
    setIndicadores(ind.data || []);
    const agrup: Record<string, Faixa[]> = {};
    (fx.data || []).forEach((f: any) => {
      agrup[f.indicador_id] = [...(agrup[f.indicador_id] || []), f];
    });
    setFaixasPorInd(agrup);
    setSetores(st.data || []);
    setCargos(cg.data || []);
    setPerfis(pf.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtrados = useMemo(
    () =>
      indicadores.filter(
        (i) =>
          (filtroSetor === "todos" || i.setor_id === filtroSetor) &&
          (filtroPilar === "todos" || String(i.pilar) === filtroPilar)
      ),
    [indicadores, filtroSetor, filtroPilar]
  );

  // soma de pesos por setor + pilar
  const somasPeso = useMemo(() => {
    const m: Record<string, number> = {};
    indicadores.forEach((i) => {
      const k = `${i.setor_id || "geral"}-${i.pilar}`;
      m[k] = (m[k] || 0) + Number(i.peso || 0);
    });
    return m;
  }, [indicadores]);

  const abrirNovo = () => {
    setEditId(null);
    setForm(vazio());
    setFaixas(FAIXAS_META);
    setOpen(true);
  };

  const abrirEdicao = (i: any) => {
    setEditId(i.id);
    setForm({
      setor_id: i.setor_id || "",
      cargo_id: i.cargo_id || "",
      pilar: String(i.pilar),
      nome: i.nome || "",
      descricao: i.descricao || "",
      formula: i.formula || "",
      unidade: i.unidade || "%",
      direcao: i.direcao || "maior_melhor",
      meta: i.meta ?? "",
      peso: i.peso ?? "",
      fonte_dado: i.fonte_dado || "",
      responsavel_id: i.responsavel_id || "",
      requisito_minimo: !!i.requisito_minimo,
      critico: !!i.critico,
      vigencia_inicio: i.vigencia_inicio || "",
      motivo_alteracao: "",
    });
    setFaixas(
      (faixasPorInd[i.id] || FAIXAS_META).map((f: any) => ({
        limite_inferior: f.limite_inferior,
        limite_superior: f.limite_superior,
        nota: f.nota,
        ordem: f.ordem,
      }))
    );
    setOpen(true);
  };

  const salvar = async () => {
    if (!form.nome.trim()) return toast.error("Informe o nome do indicador.");
    if (!form.formula.trim()) return toast.error("Informe a fórmula de cálculo.");
    if (form.meta === "") return toast.error("Informe a meta.");
    if (form.peso === "") return toast.error("Informe o peso do indicador no pilar.");
    if (!form.fonte_dado) return toast.error("Selecione a fonte do dado.");
    if (!form.responsavel_id) return toast.error("Selecione o responsável pelo indicador.");
    if (faixas.length === 0) return toast.error("Cadastre as faixas de conversão em nota.");
    if (editId && !form.motivo_alteracao)
      return toast.error("Informe o motivo da alteração — a mudança gera nova versão do indicador.");

    setSaving(true);
    const payload: any = {
      setor_id: form.setor_id || null,
      cargo_id: form.cargo_id || null,
      pilar: Number(form.pilar),
      nome: form.nome,
      descricao: form.descricao || null,
      formula: form.formula,
      unidade: form.unidade,
      direcao: form.direcao,
      meta: Number(form.meta),
      peso: Number(form.peso),
      fonte_dado: form.fonte_dado,
      responsavel_id: form.responsavel_id,
      requisito_minimo: form.requisito_minimo,
      critico: form.critico,
      vigencia_inicio: form.vigencia_inicio || new Date().toISOString().slice(0, 10),
    };

    let novoId = editId;
    if (editId) {
      const anterior = indicadores.find((i) => i.id === editId);
      // versionamento: inativa a versão anterior e cria a nova
      await (supabase as any)
        .from("ppo_indicadores")
        .update({ ativo: false, vigencia_fim: new Date().toISOString().slice(0, 10) })
        .eq("id", editId);
      const { data, error } = await (supabase as any)
        .from("ppo_indicadores")
        .insert({
          ...payload,
          versao: (anterior?.versao || 1) + 1,
          indicador_origem_id: anterior?.indicador_origem_id || editId,
          motivo_alteracao: form.motivo_alteracao,
        })
        .select("id")
        .single();
      if (error) {
        setSaving(false);
        return toast.error("Erro: " + error.message);
      }
      novoId = data.id;
    } else {
      const { data, error } = await (supabase as any)
        .from("ppo_indicadores")
        .insert(payload)
        .select("id")
        .single();
      if (error) {
        setSaving(false);
        return toast.error("Erro: " + error.message);
      }
      novoId = data.id;
    }

    await (supabase as any).from("ppo_faixas_indicador").insert(
      faixas.map((f, idx) => ({
        indicador_id: novoId,
        limite_inferior: f.limite_inferior,
        limite_superior: f.limite_superior,
        nota: f.nota,
        ordem: idx + 1,
      }))
    );

    setSaving(false);
    setOpen(false);
    toast.success(editId ? "Nova versão do indicador registrada." : "Indicador cadastrado.");
    load();
  };

  const inativar = async (id: string) => {
    const { error } = await (supabase as any)
      .from("ppo_indicadores")
      .update({ ativo: false, vigencia_fim: new Date().toISOString().slice(0, 10) })
      .eq("id", id);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Indicador inativado (histórico preservado).");
    load();
  };

  const exportar = () => {
    const rows = filtrados.map((i) => ({
      Setor: setores.find((s) => s.id === i.setor_id)?.nome || "",
      Cargo: cargos.find((c) => c.id === i.cargo_id)?.nome || "",
      Pilar: `${i.pilar} - ${nomePilar(i.pilar)}`,
      Indicador: i.nome,
      Fórmula: i.formula || "",
      Meta: i.meta ?? "",
      "Peso (%)": i.peso ?? "",
      Unidade: i.unidade || "",
      Direção: i.direcao,
      Fonte: i.fonte_dado || "",
      Responsável: perfis.find((p) => p.id === i.responsavel_id)?.nome || "",
      Versão: i.versao,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Indicadores");
    XLSX.writeFile(wb, "matriz-indicadores-ppo.xlsx");
  };

  const importar = async (file: File) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    const novos = rows
      .map((r) => ({
        nome: r["Indicador"] || r["indicador"],
        pilar: Number(String(r["Pilar"] || 1).charAt(0)),
        formula: r["Fórmula"] || r["formula"] || null,
        meta: r["Meta"] != null ? Number(r["Meta"]) : null,
        peso: r["Peso (%)"] != null ? Number(r["Peso (%)"]) : null,
        unidade: r["Unidade"] || "%",
        fonte_dado: r["Fonte"] || null,
        setor_id: setores.find((s) => s.nome === r["Setor"])?.id || null,
        responsavel_id: perfis.find((p) => p.nome === r["Responsável"])?.id || null,
      }))
      .filter((n) => n.nome);
    if (novos.length === 0) return toast.error("Nenhuma linha válida encontrada na planilha.");
    const { error } = await (supabase as any).from("ppo_indicadores").insert(novos);
    if (error) return toast.error("Erro na importação: " + error.message);
    toast.success(
      `${novos.length} indicador(es) importado(s). Complete fórmula, meta, peso, fonte e responsável antes de usar na apuração.`
    );
    load();
  };

  return (
    <div className="space-y-6">
      <PPONav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Matriz de Indicadores</h1>
          <p className="text-muted-foreground">
            Nenhum indicador pode ser usado na apuração sem fórmula, meta, peso, fonte e responsável.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportar}>
            <FileSpreadsheet className="mr-1 h-4 w-4" /> Exportar
          </Button>
          {podeEditar && (
            <>
              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  Importar
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && importar(e.target.files[0])}
                  />
                </label>
              </Button>
              <Button size="sm" onClick={abrirNovo}>
                <Plus className="mr-1 h-4 w-4" /> Indicador
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle>Indicadores vigentes</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={filtroSetor} onValueChange={setFiltroSetor}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os setores</SelectItem>
                {setores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroPilar} onValueChange={setFiltroPilar}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Pilar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os pilares</SelectItem>
                {PILARES.map((p) => (
                  <SelectItem key={p.numero} value={String(p.numero)}>
                    P{p.numero} — {p.nome}
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
              Nenhum indicador cadastrado para o filtro selecionado.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Setor</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Pilar</TableHead>
                    <TableHead>Indicador</TableHead>
                    <TableHead>Fórmula</TableHead>
                    <TableHead>Meta</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Faixas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((i) => {
                    const ok = completo(i);
                    return (
                      <TableRow key={i.id} className={ok ? "" : "bg-destructive/5"}>
                        <TableCell>{setores.find((s) => s.id === i.setor_id)?.nome || "—"}</TableCell>
                        <TableCell>{cargos.find((c) => c.id === i.cargo_id)?.nome || "—"}</TableCell>
                        <TableCell>
                          P{i.pilar}
                          {i.requisito_minimo && (
                            <Badge variant="outline" className="ml-1 text-[10px]">
                              requisito mínimo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {i.nome}
                          <span className="ml-1 text-xs text-muted-foreground">v{i.versao}</span>
                          {!ok && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-destructive">
                              <AlertTriangle className="h-3 w-3" /> incompleto
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-xs">
                          {i.formula || "—"}
                        </TableCell>
                        <TableCell>{i.meta ?? "—"}</TableCell>
                        <TableCell>{i.peso != null ? `${i.peso}%` : "—"}</TableCell>
                        <TableCell className="text-xs">{i.fonte_dado || "—"}</TableCell>
                        <TableCell className="text-xs">
                          {perfis.find((p) => p.id === i.responsavel_id)?.nome || "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(faixasPorInd[i.id] || []).length || "—"}
                        </TableCell>
                        <TableCell className="space-x-1 text-right">
                          {podeEditar && (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => abrirEdicao(i)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => inativar(i.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 space-y-1 text-xs text-muted-foreground">
            <p>Soma dos pesos por setor e pilar (deve totalizar 100% em cada pilar):</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(somasPeso).map(([k, v]) => {
                const [setorId, pilar] = k.split("-");
                const nome = setores.find((s) => s.id === setorId)?.nome || "Sem setor";
                return (
                  <Badge key={k} variant={v === 100 ? "secondary" : "destructive"}>
                    {nome} · P{pilar}: {v}%
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Alterar indicador (gera nova versão)" : "Novo indicador"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Setor</Label>
              <Select value={form.setor_id} onValueChange={(v) => setForm({ ...form, setor_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {setores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cargo (opcional)</Label>
              <Select value={form.cargo_id} onValueChange={(v) => setForm({ ...form, cargo_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os cargos do setor" />
                </SelectTrigger>
                <SelectContent>
                  {cargos
                    .filter((c) => !form.setor_id || c.setor_id === form.setor_id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Pilar *</Label>
              <Select value={form.pilar} onValueChange={(v) => setForm({ ...form, pilar: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PILARES.map((p) => (
                    <SelectItem key={p.numero} value={String(p.numero)}>
                      P{p.numero} — {p.nome} (peso padrão {p.pesoPadrao}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {PILARES.find((p) => String(p.numero) === form.pilar)?.sugestoes}
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Indicador *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Descrição</Label>
              <Textarea
                rows={2}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Fórmula de cálculo *</Label>
              <Input
                value={form.formula}
                placeholder="Ex.: demandas atendidas no prazo / total de demandas × 100"
                onChange={(e) => setForm({ ...form, formula: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Meta *</Label>
              <Input
                type="number"
                step="0.01"
                value={form.meta}
                onChange={(e) => setForm({ ...form, meta: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Peso no pilar (%) *</Label>
              <Input
                type="number"
                step="0.01"
                value={form.peso}
                onChange={(e) => setForm({ ...form, peso: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select value={form.unidade} onValueChange={(v) => setForm({ ...form, unidade: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Direção</Label>
              <Select value={form.direcao} onValueChange={(v) => setForm({ ...form, direcao: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIRECOES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fonte do dado *</Label>
              <Select
                value={form.fonte_dado}
                onValueChange={(v) => setForm({ ...form, fonte_dado: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {FONTES_DADO.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsável *</Label>
              <Select
                value={form.responsavel_id}
                onValueChange={(v) => setForm({ ...form, responsavel_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {perfis.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Checkbox
                checked={form.requisito_minimo}
                onCheckedChange={(v) => setForm({ ...form, requisito_minimo: !!v })}
              />
              <span className="text-sm">
                Requisito mínimo de conformidade (Sim/Não) — não gera prêmio, apenas registra o
                atendimento
              </span>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Checkbox
                checked={form.critico}
                onCheckedChange={(v) => setForm({ ...form, critico: !!v })}
              />
              <span className="text-sm">Indicador crítico</span>
            </div>

            <div className="md:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <Label>Faixas de conversão em nota (0 a 100) *</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setFaixas(FAIXAS_META)}>
                    Modelo Meta/SLA
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setFaixas(FAIXAS_ACURACIDADE)}>
                    Modelo Acuracidade
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setFaixas(FAIXAS_BINARIO)}>
                    Modelo Sim/Não
                  </Button>
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>De</TableHead>
                      <TableHead>Até</TableHead>
                      <TableHead>Nota</TableHead>
                      <TableHead>Leitura</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faixas.map((f, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input
                            className="h-8"
                            type="number"
                            step="0.01"
                            value={f.limite_inferior ?? ""}
                            onChange={(e) =>
                              setFaixas((p) =>
                                p.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        limite_inferior:
                                          e.target.value === "" ? null : Number(e.target.value),
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8"
                            type="number"
                            step="0.01"
                            value={f.limite_superior ?? ""}
                            onChange={(e) =>
                              setFaixas((p) =>
                                p.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        limite_superior:
                                          e.target.value === "" ? null : Number(e.target.value),
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 w-20"
                            type="number"
                            step="0.01"
                            value={f.nota}
                            onChange={(e) =>
                              setFaixas((p) =>
                                p.map((x, i) => (i === idx ? { ...x, nota: Number(e.target.value) } : x))
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {descreverFaixa(f)} → nota {f.nota}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setFaixas((p) => p.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() =>
                  setFaixas((p) => [
                    ...p,
                    { limite_inferior: null, limite_superior: null, nota: 0, ordem: p.length + 1 },
                  ])
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Faixa
              </Button>
              <div className="mt-3 flex items-end gap-1">
                {faixas.map((f, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div
                      className="mx-auto w-full rounded-t bg-primary"
                      style={{ height: `${Math.max(4, (Number(f.nota) / 100) * 60)}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{f.nota}</span>
                  </div>
                ))}
              </div>
            </div>

            {editId && (
              <div className="space-y-2 md:col-span-2">
                <Label>Motivo da alteração *</Label>
                <Select
                  value={form.motivo_alteracao}
                  onValueChange={(v) => setForm({ ...form, motivo_alteracao: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTIVOS_ALTERACAO_INDICADOR.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  A versão anterior é preservada e a nova passa a valer a partir de hoje.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
