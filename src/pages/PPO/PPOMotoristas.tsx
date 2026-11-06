import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PPONav } from "./PPONav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Pencil, Printer, Save, Trash2, X } from "lucide-react";
import { periodoPPC } from "@/lib/ppc";
import { calcularPPOMotoristas } from "@/lib/ppo-motoristas";
import { relatorioMotoristas } from "@/lib/motoristas-export";
import type { Tables } from "@/integrations/supabase/types";

type Turno = Tables<"ppo_motoristas_turnos">;
type Colab = { id: string; nome: string; matricula: string | null };
const hoje = () => new Date().toISOString().slice(0, 10);
const vazio = () => ({ colaborador_id: "", data: hoje(), turno: "", viagens: 0, meias_viagens: 0, tara: false, observacao: "" });
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export default function PPOMotoristas() {
  const { isLideranca, isRh, isLoading, isGestor } = useAuth();
  const [ref, setRef] = useState(hoje());
  const periodo = useMemo(() => periodoPPC(new Date(ref + "T12:00:00")), [ref]);
  const [colabs, setColabs] = useState<Colab[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [form, setForm] = useState(vazio);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const podeVer = isLideranca || isRh;
  const carregar = async () => {
    setLoading(true);
    const { data: ps, error: pe } = await supabase.from("profiles").select("id,nome,matricula").eq("cliente", "Gerdau").eq("cargo", "MOT CARRETEIRO").order("nome");
    const { data: ts, error: te } = await supabase.from("ppo_motoristas_turnos").select("*").gte("data", periodo.inicio).lte("data", periodo.fim).order("data").order("turno");
    if (pe || te) toast({ title: "Erro ao carregar", description: (pe || te)?.message, variant: "destructive" });
    else { setColabs(ps || []); setTurnos(ts || []); }
    setLoading(false);
  };
  useEffect(() => { if (!isLoading && podeVer) void carregar(); }, [periodo.inicio, isLoading, podeVer]);
  const resumo = colabs.map(c => ({ ...c, ...calcularPPOMotoristas(turnos.filter(t => t.colaborador_id === c.id)) }));
  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLideranca || !form.colaborador_id || !form.turno.trim()) return;
    if (![form.viagens, form.meias_viagens].every(n => Number.isInteger(n) && n >= 0) || form.data < periodo.inicio || form.data > periodo.fim) {
      toast({ title: "Confira a data e as quantidades", description: "Informe quantidades inteiras e uma data do período selecionado.", variant: "destructive" }); return;
    }
    setSaving(true);
    const payload = { ...form, turno: form.turno.trim() };
    const query = editId ? supabase.from("ppo_motoristas_turnos").update(payload).eq("id", editId).select("id") : supabase.from("ppo_motoristas_turnos").insert(payload).select("id");
    const { data, error } = await query;
    setSaving(false);
    if (error || !data?.length) { toast({ title: "Erro ao salvar", description: error?.code === "23505" ? "Já existe um apontamento deste motorista nesta data e turno. Edite o registro existente." : error?.message || "Apontamento não atualizado.", variant: "destructive" }); return; }
    setForm(vazio()); setEditId(null); toast({ title: "Apontamento salvo" }); await carregar();
  };
  const excluir = async (t: Turno) => {
    if (!window.confirm("Excluir este apontamento de turno?")) return;
    const { data, error } = await supabase.from("ppo_motoristas_turnos").delete().eq("id", t.id).select("id");
    if (error || !data?.length) toast({ title: "Erro ao excluir", description: error?.message || "Apontamento não excluído.", variant: "destructive" });
    else { if (editId === t.id) { setEditId(null); setForm(vazio()); } await carregar(); }
  };
  const imprimir = () => relatorioMotoristas("PPO", periodo, ["Colaborador", "Matrícula", "Viagens realizadas", "Sem tara (desconsideradas)", "Viagens válidas", "Valor"], resumo.map(r => [r.nome, r.matricula || "", r.realizadas, r.desconsideradas, r.validas, brl(r.valor)]), "Pagamento em folha");
  return <div className="space-y-6"><PPONav /><div className="space-y-4 border-b pb-4"><h1 className="text-2xl font-bold">PPO — Motoristas Gerdau</h1><div className="flex flex-wrap items-end gap-4"><label className="text-sm">Data de referência<Input aria-label="Data de referência" type="date" value={ref} onChange={e => { if (e.target.value) { setRef(e.target.value); setEditId(null); } }} /></label><p className="text-sm">{periodo.inicio.split('-').reverse().join('/')} a {periodo.fim.split('-').reverse().join('/')}</p><Button variant="outline" onClick={imprimir} disabled={!podeVer || loading || !turnos.length}><Printer className="mr-2 h-4 w-4" />Relatório PDF</Button></div></div>
    {!isLoading && !podeVer && <p>Você não tem acesso à apuração de viagens.</p>}
    {podeVer && isLideranca && <form onSubmit={salvar} className="space-y-4 border-b pb-6"><h2 className="font-semibold">{editId ? "Editar apontamento" : "Apontamento por turno"}</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label className="text-sm">Motorista<Select value={form.colaborador_id} onValueChange={v => setForm(f => ({ ...f, colaborador_id: v }))}><SelectTrigger aria-label="Motorista"><SelectValue placeholder="Selecione o motorista" /></SelectTrigger><SelectContent>{colabs.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select></label><label className="text-sm">Data<Input aria-label="Data do turno" type="date" min={periodo.inicio} max={periodo.fim} required value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} /></label><label className="text-sm">Turno<Input aria-label="Turno" required placeholder="Ex.: Diurno" value={form.turno} onChange={e => setForm(f => ({ ...f, turno: e.target.value }))} /></label><label className="text-sm">Viagens completas<Input aria-label="Viagens completas" type="number" min={0} step={1} required value={form.viagens} onChange={e => setForm(f => ({ ...f, viagens: Number(e.target.value) }))} /></label><label className="text-sm">Meias viagens (0,5 cada)<Input aria-label="Meias viagens" type="number" min={0} step={1} required value={form.meias_viagens} onChange={e => setForm(f => ({ ...f, meias_viagens: Number(e.target.value) }))} /></label><label className="flex items-center gap-2 text-sm"><Checkbox checked={form.tara} onCheckedChange={v => setForm(f => ({ ...f, tara: v === true }))} aria-label="Tara realizada no turno" />Tara realizada no turno</label></div><label className="block text-sm">Observação<Input aria-label="Observação do turno" value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} /></label><div className="flex gap-2"><Button disabled={saving || loading || !form.colaborador_id}><Save className="mr-2 h-4 w-4" />{saving ? "Salvando..." : "Salvar apontamento"}</Button>{editId && <Button type="button" variant="outline" onClick={() => { setEditId(null); setForm(vazio()); }}><X className="mr-2 h-4 w-4" />Cancelar</Button>}</div></form>}
    {podeVer && (loading ? <p>Carregando...</p> : <><section className="space-y-3"><h2 className="font-semibold">Resultado do período</h2><Table><TableHeader><TableRow>{["Motorista", "Realizadas", "Desconsideradas", "Válidas", "Valor em folha"].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{resumo.map(r => <TableRow key={r.id}><TableCell>{r.nome}</TableCell><TableCell>{r.realizadas}</TableCell><TableCell>{r.desconsideradas}</TableCell><TableCell>{r.validas}</TableCell><TableCell className="font-semibold">{brl(r.valor)}</TableCell></TableRow>)}</TableBody></Table></section><section className="space-y-3"><h2 className="font-semibold">Turnos apontados</h2>{!turnos.length ? <p className="text-sm text-muted-foreground">Nenhum turno registrado neste período.</p> : <Table><TableHeader><TableRow>{["Data", "Motorista", "Turno", "Completas", "Meias", "Tara", "Observação", ...(isLideranca ? ["Ações"] : [])].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{turnos.map(t => <TableRow key={t.id}><TableCell className="whitespace-nowrap">{t.data.split('-').reverse().join('/')}</TableCell><TableCell>{colabs.find(c => c.id === t.colaborador_id)?.nome}</TableCell><TableCell>{t.turno}</TableCell><TableCell>{t.viagens}</TableCell><TableCell>{t.meias_viagens}</TableCell><TableCell>{t.tara ? "Sim" : "Não"}</TableCell><TableCell>{t.observacao}</TableCell>{isLideranca && <TableCell><div className="flex">{isGestor && t.status==="pendente" && <Button size="sm" onClick={async()=>{const {error}=await supabase.rpc("decidir_solicitacao",{p_tipo:"viagens",p_id:t.id,p_aprovar:true});if(error)toast({title:error.message,variant:"destructive"});else await carregar();}}>Aprovar</Button>}<Button variant="ghost" size="icon" title="Editar turno" aria-label="Editar turno" onClick={() => { setEditId(t.id); setForm({ colaborador_id: t.colaborador_id, data: t.data, turno: t.turno, viagens: t.viagens, meias_viagens: t.meias_viagens, tara: t.tara, observacao: t.observacao || "" }); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" title="Excluir turno" aria-label="Excluir turno" onClick={() => void excluir(t)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell>}</TableRow>)}</TableBody></Table>}</section></>)}
  </div>;
}