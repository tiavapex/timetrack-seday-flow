import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Loader2, FileText, Printer, Plus, Trash2, CheckCircle2,
  XCircle, Snowflake, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { exportVagaToPDF } from "@/lib/vaga-export";

const STATUS_LABEL: Record<string, string> = {
  pendente_aprovacao: "Pendente Aprovação",
  aprovada: "Aprovada",
  congelada: "Congelada",
  cancelada: "Cancelada",
  fechada: "Fechada",
};

export default function VagasDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, roles } = useAuth();
  const isDP = isAdmin || roles.includes("dp" as any);
  const [vaga, setVaga] = useState<any>(null);
  const [cvs, setCvs] = useState<any[]>([]);
  const [cands, setCands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: v }, { data: c1 }, { data: c2 }] = await Promise.all([
      (supabase as any).from("vagas").select("*").eq("id", id).maybeSingle(),
      (supabase as any).from("vaga_curriculos").select("*").eq("vaga_id", id).order("enviado_gestor_em", { ascending: false }),
      (supabase as any).from("vaga_candidatos").select("*").eq("vaga_id", id).order("created_at", { ascending: false }),
    ]);
    setVaga(v); setCvs(c1 || []); setCands(c2 || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const updStatus = async (status: string, extra: any = {}) => {
    const { error } = await (supabase as any).from("vagas").update({ status, ...extra }).eq("id", id);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Status atualizado");
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!vaga) return <div>Vaga não encontrada</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/vagas")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Vaga Nº {vaga.numero} — {vaga.cargo_solicitado}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge>{STATUS_LABEL[vaga.status]}</Badge>
              <span className="text-sm text-muted-foreground">
                {vaga.unidade} • {vaga.area_departamento}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => exportVagaToPDF(vaga)}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir / PDF
          </Button>
          {isDP && vaga.status === "pendente_aprovacao" && (
            <Button onClick={() => updStatus("aprovada", { data_aprovacao: new Date().toISOString().slice(0, 10), data_abertura: new Date().toISOString().slice(0, 10) })}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Marcar Aprovada
            </Button>
          )}
          {isDP && vaga.status === "aprovada" && (
            <>
              <Button variant="outline" onClick={() => updStatus("congelada")}>
                <Snowflake className="mr-2 h-4 w-4" /> Congelar
              </Button>
              <Button variant="outline" onClick={() => updStatus("fechada", { data_fechamento: new Date().toISOString().slice(0, 10) })}>
                <Lock className="mr-2 h-4 w-4" /> Fechar
              </Button>
            </>
          )}
          {isDP && ["pendente_aprovacao", "aprovada", "congelada"].includes(vaga.status) && (
            <Button variant="destructive" onClick={() => updStatus("cancelada")}>
              <XCircle className="mr-2 h-4 w-4" /> Cancelar
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados da Vaga</TabsTrigger>
          <TabsTrigger value="curriculos" disabled={vaga.status === "pendente_aprovacao"}>Currículos</TabsTrigger>
          <TabsTrigger value="candidatos" disabled={vaga.status === "pendente_aprovacao"}>Candidatos</TabsTrigger>
          <TabsTrigger value="rh">Controle RH</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Resumo</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
              <Info label="Solicitante" v={vaga.solicitante_nome} />
              <Info label="Cargo solicitante" v={vaga.solicitante_cargo} />
              <Info label="Contato" v={vaga.solicitante_contato} />
              <Info label="Tipo" v={vaga.tipo_vaga} />
              <Info label="Cargo substituído" v={vaga.cargo_substituido} />
              <Info label="Motivo subst." v={vaga.motivo_substituicao} />
              <Info label="C.Custo" v={vaga.centro_custo} />
              <Info label="Reporta-se a" v={vaga.reporta_se_a} />
              <Info label="Escala" v={vaga.escala_trabalho} />
              <Info label="Nº vagas" v={vaga.numero_vagas} />
              <Info label="Sigilosa" v={vaga.vaga_sigilosa ? "Sim" : "Não"} />
              <Info label="Local" v={vaga.local_trabalho} />
              <Info label="Regime" v={vaga.regime_contratacao} />
              <Info label="Faixa salarial" v={vaga.faixa_salarial} />
              <Info label="Prazo" v={vaga.prazo_atendimento ? new Date(vaga.prazo_atendimento + "T00:00:00").toLocaleDateString("pt-BR") : ""} />
              <Info label="Escolaridade" v={vaga.escolaridade} />
              <Info label="Formação" v={vaga.formacao} />
              <Info label="Experiência" v={vaga.tempo_experiencia} />
              <div className="md:col-span-3"><Info label="Atividades" v={vaga.atividades_realizadas} /></div>
              <div className="md:col-span-3"><Info label="Motivo necessidade" v={vaga.motivo_necessidade} /></div>
              <div className="md:col-span-3"><Info label="Impacto" v={vaga.impacto_nao_preenchida} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curriculos">
          <CurriculosTab vagaId={id!} cvs={cvs} isDP={isDP} reload={load} />
        </TabsContent>

        <TabsContent value="candidatos">
          <CandidatosTab vagaId={id!} cands={cands} isDP={isDP} reload={load} />
        </TabsContent>

        <TabsContent value="rh">
          <ControleRHTab vaga={vaga} isDP={isDP} reload={load} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, v }: { label: string; v: any }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium whitespace-pre-wrap">{v || "—"}</div>
    </div>
  );
}

function CurriculosTab({ vagaId, cvs, isDP, reload }: any) {
  const { user } = useAuth();
  const [nome, setNome] = useState("");
  const [obs, setObs] = useState("");
  const add = async () => {
    if (!nome) return toast.error("Informe o nome do candidato");
    const { error } = await (supabase as any).from("vaga_curriculos").insert({
      vaga_id: vagaId, candidato_nome: nome, observacao: obs, criado_por: user!.id,
    });
    if (error) return toast.error(error.message);
    setNome(""); setObs(""); reload();
    toast.success("Currículo registrado");
  };
  const registrarRetorno = async (id: string) => {
    const txt = prompt("Retorno do gestor:");
    if (txt == null) return;
    const data_entrevista = prompt("Data/hora da entrevista (YYYY-MM-DD HH:MM) — opcional:");
    const upd: any = { retorno_gestor_em: new Date().toISOString(), retorno_gestor_texto: txt };
    if (data_entrevista) upd.data_entrevista = new Date(data_entrevista.replace(" ", "T")).toISOString();
    const { error } = await (supabase as any).from("vaga_curriculos").update(upd).eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  };
  const del = async (id: string) => {
    if (!confirm("Excluir?")) return;
    await (supabase as any).from("vaga_curriculos").delete().eq("id", id);
    reload();
  };
  return (
    <Card>
      <CardHeader><CardTitle>Currículos enviados ao Gestor</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {isDP && (
          <div className="grid md:grid-cols-3 gap-3 items-end">
            <div><Label className="text-xs">Nome do candidato</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
            <div><Label className="text-xs">Observação</Label><Input value={obs} onChange={(e) => setObs(e.target.value)} /></div>
            <Button onClick={add}><Plus className="mr-2 h-4 w-4" /> Registrar envio</Button>
          </div>
        )}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidato</TableHead>
                <TableHead>Enviado ao gestor</TableHead>
                <TableHead>Retorno gestor</TableHead>
                <TableHead>Entrevista agendada</TableHead>
                <TableHead>Observação</TableHead>
                {isDP && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cvs.length === 0 && (
                <TableRow><TableCell colSpan={isDP ? 6 : 5} className="text-center text-sm text-muted-foreground py-6">Nenhum currículo registrado.</TableCell></TableRow>
              )}
              {cvs.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.candidato_nome}</TableCell>
                  <TableCell>{new Date(c.enviado_gestor_em).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>
                    {c.retorno_gestor_em ? (
                      <div className="text-xs">
                        <div className="text-muted-foreground">{new Date(c.retorno_gestor_em).toLocaleString("pt-BR")}</div>
                        <div>{c.retorno_gestor_texto}</div>
                      </div>
                    ) : isDP ? (
                      <Button size="sm" variant="outline" onClick={() => registrarRetorno(c.id)}>Registrar</Button>
                    ) : "—"}
                  </TableCell>
                  <TableCell>{c.data_entrevista ? new Date(c.data_entrevista).toLocaleString("pt-BR") : "—"}</TableCell>
                  <TableCell className="text-xs">{c.observacao || "—"}</TableCell>
                  {isDP && (
                    <TableCell><Button size="icon" variant="ghost" onClick={() => del(c.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function CandidatosTab({ vagaId, cands, isDP, reload }: any) {
  const { user } = useAuth();
  const [nome, setNome] = useState("");
  const add = async () => {
    if (!nome) return toast.error("Nome obrigatório");
    const { error } = await (supabase as any).from("vaga_candidatos").insert({
      vaga_id: vagaId, nome, criado_por: user!.id,
    });
    if (error) return toast.error(error.message);
    setNome(""); reload();
  };
  const updField = async (id: string, field: string, value: any) => {
    const { error } = await (supabase as any).from("vaga_candidatos").update({ [field]: value || null }).eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  };
  const del = async (id: string) => {
    if (!confirm("Excluir?")) return;
    await (supabase as any).from("vaga_candidatos").delete().eq("id", id);
    reload();
  };
  return (
    <Card>
      <CardHeader><CardTitle>Acompanhamento de Candidatos</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {isDP && (
          <div className="flex gap-3 items-end">
            <div className="flex-1"><Label className="text-xs">Novo candidato</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
            <Button onClick={add}><Plus className="mr-2 h-4 w-4" /> Adicionar</Button>
          </div>
        )}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Entrevista</TableHead>
                <TableHead>Exame</TableHead>
                <TableHead>Solic. docs</TableHead>
                <TableHead>Envio docs</TableHead>
                <TableHead>Efetivação</TableHead>
                <TableHead>Status</TableHead>
                {isDP && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cands.length === 0 && (
                <TableRow><TableCell colSpan={isDP ? 8 : 7} className="text-center text-sm text-muted-foreground py-6">Nenhum candidato.</TableCell></TableRow>
              )}
              {cands.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell><Input type="date" disabled={!isDP} defaultValue={c.data_entrevista || ""} onBlur={(e) => e.target.value !== (c.data_entrevista || "") && updField(c.id, "data_entrevista", e.target.value)} className="w-36" /></TableCell>
                  <TableCell><Input type="date" disabled={!isDP} defaultValue={c.data_encaminhamento_exame || ""} onBlur={(e) => e.target.value !== (c.data_encaminhamento_exame || "") && updField(c.id, "data_encaminhamento_exame", e.target.value)} className="w-36" /></TableCell>
                  <TableCell><Input type="date" disabled={!isDP} defaultValue={c.data_solicitacao_documentos || ""} onBlur={(e) => e.target.value !== (c.data_solicitacao_documentos || "") && updField(c.id, "data_solicitacao_documentos", e.target.value)} className="w-36" /></TableCell>
                  <TableCell><Input type="date" disabled={!isDP} defaultValue={c.data_envio_documentos || ""} onBlur={(e) => e.target.value !== (c.data_envio_documentos || "") && updField(c.id, "data_envio_documentos", e.target.value)} className="w-36" /></TableCell>
                  <TableCell><Input type="date" disabled={!isDP} defaultValue={c.data_efetivacao || ""} onBlur={(e) => e.target.value !== (c.data_efetivacao || "") && updField(c.id, "data_efetivacao", e.target.value)} className="w-36" /></TableCell>
                  <TableCell>
                    {isDP ? (
                      <Select value={c.status} onValueChange={(v) => updField(c.id, "status", v)}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="em_processo">Em processo</SelectItem>
                          <SelectItem value="aprovado">Aprovado</SelectItem>
                          <SelectItem value="reprovado">Reprovado</SelectItem>
                          <SelectItem value="desistente">Desistente</SelectItem>
                          <SelectItem value="contratado">Contratado</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{c.status}</Badge>
                    )}
                  </TableCell>
                  {isDP && (
                    <TableCell><Button size="icon" variant="ghost" onClick={() => del(c.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ControleRHTab({ vaga, isDP, reload }: any) {
  const [f, setF] = useState({
    responsavel_recrutamento: vaga.responsavel_recrutamento || "",
    fonte_recrutamento: vaga.fonte_recrutamento || "",
    data_abertura: vaga.data_abertura || "",
    data_fechamento: vaga.data_fechamento || "",
    data_admissao: vaga.data_admissao || "",
    comunicacao_areas: vaga.comunicacao_areas || "",
    data_comunicacao: vaga.data_comunicacao || "",
    observacoes_rh: vaga.observacoes_rh || "",
  });
  const save = async () => {
    const payload: any = { ...f };
    ["data_abertura", "data_fechamento", "data_admissao", "data_comunicacao"].forEach((k) => {
      if (!payload[k]) payload[k] = null;
    });
    const { error } = await (supabase as any).from("vagas").update(payload).eq("id", vaga.id);
    if (error) return toast.error(error.message);
    toast.success("Salvo"); reload();
  };
  return (
    <Card>
      <CardHeader><CardTitle>Controle Interno do RH</CardTitle></CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-4">
        <div><Label className="text-xs">Resp. Recrutamento</Label><Input disabled={!isDP} value={f.responsavel_recrutamento} onChange={(e) => setF({ ...f, responsavel_recrutamento: e.target.value })} /></div>
        <div><Label className="text-xs">Fonte recrutamento</Label><Input disabled={!isDP} value={f.fonte_recrutamento} onChange={(e) => setF({ ...f, fonte_recrutamento: e.target.value })} /></div>
        <div><Label className="text-xs">Data abertura</Label><Input type="date" disabled={!isDP} value={f.data_abertura} onChange={(e) => setF({ ...f, data_abertura: e.target.value })} /></div>
        <div><Label className="text-xs">Data fechamento</Label><Input type="date" disabled={!isDP} value={f.data_fechamento} onChange={(e) => setF({ ...f, data_fechamento: e.target.value })} /></div>
        <div><Label className="text-xs">Data admissão</Label><Input type="date" disabled={!isDP} value={f.data_admissao} onChange={(e) => setF({ ...f, data_admissao: e.target.value })} /></div>
        <div><Label className="text-xs">Data comunicação</Label><Input type="date" disabled={!isDP} value={f.data_comunicacao} onChange={(e) => setF({ ...f, data_comunicacao: e.target.value })} /></div>
        <div className="md:col-span-3"><Label className="text-xs">Comunicação áreas</Label><Textarea disabled={!isDP} value={f.comunicacao_areas} onChange={(e) => setF({ ...f, comunicacao_areas: e.target.value })} /></div>
        <div className="md:col-span-3"><Label className="text-xs">Observações</Label><Textarea disabled={!isDP} value={f.observacoes_rh} onChange={(e) => setF({ ...f, observacoes_rh: e.target.value })} /></div>
        {isDP && <div className="md:col-span-3"><Button onClick={save}>Salvar</Button></div>}
      </CardContent>
    </Card>
  );
}
