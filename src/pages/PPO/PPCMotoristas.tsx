import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PPONav } from "./PPONav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Printer, Save } from "lucide-react";
import { PPC_ITENS_ADM, PPC_SEGURANCA, PPC_OPERACAO, calcularPPC, periodoPPC, pontosSeguranca, pontosOperacao, ItensPPC, Responsavel } from "@/lib/ppc";
import { relatorioMotoristas } from "@/lib/motoristas-export";

type Area = Responsavel | "geral";
type Colab = { id: string; nome: string; matricula: string | null };
type Linha = { adm: Record<string, boolean>; seg: ItensPPC | null; op: ItensPPC | null; antigoSeg: number; antigoOp: number; observacao: string };
const TITULOS: Record<Area, string> = { operacional: "Operacional", rh: "RH", seguranca: "Segurança do Trabalho", geral: "Visão geral" };
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export default function PPCMotoristas() {
  const { isRh, isSesmt, isLideranca, isLoading } = useAuth();
  const areas = useMemo(() => ([...(isLideranca ? ["operacional"] : []), ...(isRh ? ["rh", "geral"] : []), ...(isSesmt ? ["seguranca"] : [])] as Area[]), [isRh,isSesmt,isLideranca]);
  const [area, setArea] = useState<Area | null>(null);
  useEffect(() => { if (!area || !areas.includes(area)) setArea(areas[0] ?? null); }, [areas,area]);
  const [refData,setRefData] = useState(new Date().toISOString().slice(0,10));
  const periodo = useMemo(() => periodoPPC(new Date(refData + "T12:00:00")), [refData]);
  const [colabs,setColabs] = useState<Colab[]>([]);
  const [linhas,setLinhas] = useState<Record<string,Linha>>({});
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const carregar = async () => {
    setLoading(true);
    const { data: ps, error: pe } = await supabase.from("profiles").select("id,nome,matricula").eq("cliente","Gerdau").eq("cargo","MOT CARRETEIRO").order("nome");
    const { data: av, error: ae } = await supabase.from("ppc_avaliacoes").select("*").eq("periodo_inicio",periodo.inicio);
    if (pe || ae) { toast({ title:"Erro ao carregar", description:(pe || ae)?.message, variant:"destructive" }); setLoading(false); return; }
    setColabs(ps || []);
    const m: Record<string,Linha> = {};
    for (const p of ps || []) { const a = av?.find(x => x.colaborador_id === p.id); m[p.id] = { adm:(a?.adm as Record<string,boolean>) || {}, seg:(a?.seguranca_itens as ItensPPC) ?? null, op:(a?.operacao_itens as ItensPPC) ?? null, antigoSeg:Number(a?.pts_seguranca ?? 40), antigoOp:Number(a?.pts_operacao ?? 60), observacao:a?.observacao || "" }; }
    setLinhas(m); setLoading(false);
  };
  useEffect(() => { if (!isLoading && areas.length) void carregar(); }, [periodo.inicio,isLoading,areas]);
  const upd = (id: string, patch: Partial<Linha>) => setLinhas(l => ({...l,[id]:{...l[id],...patch}}));
  const scores = (l: Linha) => ({ seg:l.seg ? pontosSeguranca(l.seg) : l.antigoSeg, op:l.op ? pontosOperacao(l.op) : l.antigoOp });
  const itensAdm = area && area !== "geral" ? PPC_ITENS_ADM.filter(i => i.resp.includes(area)) : [];
  const admKey = (key: string) => key === "1.1" ? `1.1.${area}` : key;
  const salvar = async () => {
    if (!area || loading) return;
    for (const c of colabs) { const l = linhas[c.id]; if (l?.op && (!Number.isFinite(Number(l.op.dano ?? 0)) || Number(l.op.dano ?? 0)<0)) { toast({ title:"Informe um valor de dano válido", variant:"destructive" }); return; } }
    setSaving(true);
    try {
      for (const c of colabs) {
        const l = linhas[c.id]; if (!l) continue;
        const adm: Record<string,boolean> = {};
        for (const i of itensAdm) { const key = admKey(i.key); adm[key] = l.adm[key] ?? l.adm[i.key] ?? true; }
        const { error } = await supabase.rpc("salvar_ppc_area", { p_colaborador:c.id, p_inicio:periodo.inicio, p_area:area, p_adm:adm, p_itens:area === "seguranca" ? (l.seg || {}) : area === "operacional" ? (l.op || {}) : {}, p_observacao:l.observacao || null });
        if (error) throw error;
      }
      toast({ title:`PPC salvo — ${TITULOS[area]}` }); await carregar();
    } catch(e) { toast({ title:"Erro ao salvar", description:(e as Error).message, variant:"destructive" }); } finally { setSaving(false); }
  };
  const imprimir = () => relatorioMotoristas("PPC",periodo,["Colaborador","Matrícula","Segurança","Operação","Pontos descontados","Pontos finais","Valor","Observação"],colabs.flatMap(c => { const l = linhas[c.id]; if (!l) return []; const s=scores(l); const r=calcularPPC(l.adm,s.seg,s.op); return [[c.nome,c.matricula || "",s.seg,s.op,100-r.pontos,r.pontos,brl(r.valor),l.observacao]]; }),"Pagamento em vale alimentação");
  const resposta = (key: string, label: string, ok: boolean, onChange: (v:boolean)=>void) => <div key={key} className="flex flex-col gap-3 border-b py-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm min-w-0">{key} · {label}</span><div className="flex shrink-0 gap-1"><Button size="sm" variant={ok ? "default" : "outline"} onClick={()=>onChange(true)}>Cumpriu</Button><Button size="sm" variant={!ok ? "destructive" : "outline"} onClick={()=>onChange(false)}>Não cumpriu</Button></div></div>;
  return <div className="space-y-4"><PPONav/><div className="space-y-4 border-b pb-4"><h1 className="text-2xl font-bold">PPC — Motoristas Gerdau</h1>{areas.length>1 && <div className="flex flex-wrap gap-2">{areas.map(a=><Button key={a} variant={area===a ? "default":"outline"} onClick={()=>setArea(a)}>{TITULOS[a]}</Button>)}</div>}<div className="flex flex-wrap items-end gap-4"><label className="text-sm">Data de referência<Input aria-label="Data de referência" type="date" value={refData} onChange={e=>{if(e.target.value)setRefData(e.target.value);}}/></label><p className="text-sm">Período: {periodo.inicio.split('-').reverse().join('/')} a {periodo.fim.split('-').reverse().join('/')}</p>{area==="geral" && <Button variant="outline" onClick={imprimir} disabled={loading || !colabs.length}><Printer className="mr-2 h-4 w-4"/>Relatório PDF</Button>}</div></div>
    {!isLoading && !area && <p>Você não é responsável por itens do PPC.</p>}{area && loading && <p>Carregando...</p>}{area && !loading && !colabs.length && <p>Nenhum motorista da Gerdau encontrado.</p>}
    {!loading && area && colabs.map(c=>{const l=linhas[c.id]; if(!l)return null; const s=scores(l); const r=calcularPPC(l.adm,s.seg,s.op); const itens=area==="seguranca"?PPC_SEGURANCA:PPC_OPERACAO; const campo=area==="seguranca"?"seg":"op"; const valores=l[campo] || {}; return <Card key={c.id}><CardHeader><CardTitle className="text-base">{c.nome} ({c.matricula})</CardTitle></CardHeader><CardContent className="space-y-4">{area==="geral" ? <><div className="flex flex-wrap gap-4 text-sm"><span>Segurança: <b>{s.seg}/40</b></span><span>Operação: <b>{s.op}/60</b></span><span>Descontados: <b>{100-r.pontos}</b></span><span>Final: <b>{r.pontos} pts · {brl(r.valor)}</b></span></div>{!r.admOk && <p className="text-destructive text-sm">Pré-requisito administrativo não cumprido: {PPC_ITENS_ADM.filter(i=>l.adm[i.key]===false || (i.key==="1.1" && (l.adm["1.1.operacional"]===false || l.adm["1.1.rh"]===false))).map(i=>i.label).join("; ")}</p>}<Input aria-label={`Observação ${c.nome}`} placeholder="Observação (data, frota, ocorrência)" value={l.observacao} onChange={e=>upd(c.id,{observacao:e.target.value})}/></> : <><h2 className="font-semibold text-sm">Administrativo — pré-requisito</h2>{itensAdm.map(i=>resposta(i.key,i.label,(l.adm[admKey(i.key)] ?? l.adm[i.key])!==false,v=>upd(c.id,{adm:{...l.adm,[admKey(i.key)]:v}})))}{(area==="operacional" || area==="seguranca") && <><h2 className="font-semibold text-sm">{TITULOS[area]} — {area==="seguranca"?s.seg:s.op} pontos</h2>{l[campo]===null && (area==="seguranca"?l.antigoSeg!==40:l.antigoOp!==60) && <p className="text-sm text-muted-foreground">Pontuação anterior preservada. Ao preencher os indicadores, o cálculo passa a seguir o regulamento atualizado.</p>}{itens.map(i=>resposta(i.key,`${i.label} (${i.pontos} pontos)`,valores[i.key]!==false,v=>upd(c.id,{[campo]:{...valores,[i.key]:v}})))}{area==="seguranca" ? <label className="block text-sm">2.5 · Incidente/acidente — classificação Segurança e Supervisão<Select value={String(valores.incidente || "nenhum")} onValueChange={v=>upd(c.id,{seg:{...valores,incidente:v}})}><SelectTrigger aria-label={`Incidente ${c.nome}`}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="nenhum">Sem ocorrência — 0</SelectItem><SelectItem value="baixo">Baixo — 2 pontos</SelectItem><SelectItem value="medio">Médio — 3 pontos</SelectItem><SelectItem value="alto">Alto — 5 pontos</SelectItem></SelectContent></Select></label> : <label className="block text-sm">3.6 · Danos ao equipamento (R$)<Input aria-label={`Danos ${c.nome}`} type="number" min={0} step="0.01" value={Number(valores.dano || 0)} onChange={e=>upd(c.id,{op:{...valores,dano:Number(e.target.value)}})}/></label>}</>}</>}</CardContent></Card>;})}
    {area && <Button onClick={salvar} disabled={saving || loading || !colabs.length}><Save className="mr-2 h-4 w-4"/>{saving?"Salvando...":`Salvar — ${TITULOS[area]}`}</Button>}</div>;
}
