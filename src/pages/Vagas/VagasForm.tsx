import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const UNIDADES = [
  "AVAPEX MATRIZ", "SEDAY MATRIZ", "SEDAY USIMINAS", "SEDAY VALE",
  "INNOMACH MATRIZ", "INNOMACH MS",
];
const AREAS = [
  "Administrativo", "Almoxarifado", "Comercial", "Diretoria", "Financeiro",
  "Logistica", "Manutenção", "Marketing", "Planejamento", "RH / DP",
  "Segurança do Trabalho", "SGI", "Suprimentos", "TI", "Outro",
];
const ESCOLARIDADES = [
  "Ensino Fundamental Completo", "Ensino Médio Incompleto", "Ensino Médio Completo",
  "Técnico", "Tecnólogo", "Superior Incompleto", "Superior Completo",
  "Pós-Graduação", "Especialização", "Mestrado", "Doutorado",
];
const REGIMES = ["CLT", "PJ", "Estágio", "Temporário"];
const TIPOS_VAGA = ["Nova Vaga", "Mobilização", "Substituição"];
const MOTIVOS_SUBST = ["Demissão", "Afastamento", "Promoção", "Férias"];

export default function VagasForm() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState<any>({
    solicitante_nome: profile?.nome || "",
    solicitante_cargo: "",
    solicitante_contato: profile?.email || "",
    unidade: "",
    area_departamento: "",
    centro_custo: "",
    tipo_vaga: "Nova Vaga",
    cargo_substituido: "",
    motivo_substituicao: "",
    cargo_solicitado: "",
    reporta_se_a: "",
    area_setor: "",
    escala_trabalho: "",
    numero_vagas: 1,
    vaga_sigilosa: false,
    local_trabalho: "",
    regime_contratacao: "CLT",
    faixa_salarial: "",
    beneficios: "",
    motivo_necessidade: "",
    impacto_nao_preenchida: "",
    prazo_atendimento: "",
    escolaridade: "",
    formacao: "",
    tempo_experiencia: "",
    registro_profissional: "",
    idiomas: "",
    informatica: "",
    cnh: "",
    residir_regiao: "",
    disp_viagens: "",
    disp_mudanca: "",
    cursos_ferramentas: "",
    alt_realocacao: false,
    alt_promocao: false,
    alt_banco_talentos: false,
    alt_terceirizacao: false,
    alt_na: false,
    justificativa_sem_alternativa: "",
    experiencia_necessaria: "",
    atividades_realizadas: "",
    soft_skills: "",
    observacoes_particularidades: "",
    recursos_ti: "",
    recursos_logistica: "",
    recursos_infraestrutura: "",
    recursos_sst: "",
    recursos_financeiro: "",
  });

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!user) return;
    if (!f.solicitante_nome || !f.unidade || !f.area_departamento || !f.tipo_vaga || !f.cargo_solicitado) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    setSaving(true);
    const payload = {
      ...f,
      numero_vagas: Number(f.numero_vagas) || 1,
      prazo_atendimento: f.prazo_atendimento || null,
      criado_por: user.id,
      status: "pendente_aprovacao",
    };
    const { data, error } = await (supabase as any).from("vagas").insert(payload).select("id").single();
    setSaving(false);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Vaga criada! Imprima o PDF e leve para assinatura da Diretoria.");
    navigate(`/vagas/${data.id}`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/vagas")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nova Vaga</h1>
            <p className="text-muted-foreground">Formulário de abertura de vaga (FO-RH-03)</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Solicitante *"><Input value={f.solicitante_nome} onChange={(e) => set("solicitante_nome", e.target.value)} /></Field>
          <Field label="Cargo"><Input value={f.solicitante_cargo} onChange={(e) => set("solicitante_cargo", e.target.value)} /></Field>
          <Field label="Telefone / E-mail"><Input value={f.solicitante_contato} onChange={(e) => set("solicitante_contato", e.target.value)} /></Field>
          <Field label="Unidade *">
            <Select value={f.unidade} onValueChange={(v) => set("unidade", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Área / Departamento *">
            <Select value={f.area_departamento} onValueChange={(v) => set("area_departamento", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Centro de Custo"><Input value={f.centro_custo} onChange={(e) => set("centro_custo", e.target.value)} /></Field>
          <Field label="Tipo de Vaga *">
            <Select value={f.tipo_vaga} onValueChange={(v) => set("tipo_vaga", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TIPOS_VAGA.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Cargo Substituído"><Input value={f.cargo_substituido} onChange={(e) => set("cargo_substituido", e.target.value)} /></Field>
          <Field label="Motivo Substituição">
            <Select value={f.motivo_substituicao} onValueChange={(v) => set("motivo_substituicao", v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{MOTIVOS_SUBST.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Informações da Vaga</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Cargo Solicitado *"><Input value={f.cargo_solicitado} onChange={(e) => set("cargo_solicitado", e.target.value)} /></Field>
          <Field label="Reporta-se a (cargo)"><Input value={f.reporta_se_a} onChange={(e) => set("reporta_se_a", e.target.value)} /></Field>
          <Field label="Área / Setor"><Input value={f.area_setor} onChange={(e) => set("area_setor", e.target.value)} /></Field>
          <Field label="Escala de Trabalho"><Input value={f.escala_trabalho} onChange={(e) => set("escala_trabalho", e.target.value)} /></Field>
          <Field label="Nº de Vagas"><Input type="number" min={1} value={f.numero_vagas} onChange={(e) => set("numero_vagas", e.target.value)} /></Field>
          <Field label="Vaga Sigilosa">
            <div className="flex items-center gap-2 h-10">
              <Checkbox checked={f.vaga_sigilosa} onCheckedChange={(v) => set("vaga_sigilosa", !!v)} />
              <span className="text-sm">Sim</span>
            </div>
          </Field>
          <Field label="Local de Trabalho"><Input value={f.local_trabalho} onChange={(e) => set("local_trabalho", e.target.value)} /></Field>
          <Field label="Regime de Contratação">
            <Select value={f.regime_contratacao} onValueChange={(v) => set("regime_contratacao", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{REGIMES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Faixa Salarial"><Input value={f.faixa_salarial} onChange={(e) => set("faixa_salarial", e.target.value)} /></Field>
          <Field label="Prazo desejado"><Input type="date" value={f.prazo_atendimento} onChange={(e) => set("prazo_atendimento", e.target.value)} /></Field>
          <div className="md:col-span-3">
            <Field label="Benefícios"><Textarea value={f.beneficios} onChange={(e) => set("beneficios", e.target.value)} /></Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Justificativa</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Motivo da necessidade"><Textarea rows={4} value={f.motivo_necessidade} onChange={(e) => set("motivo_necessidade", e.target.value)} /></Field>
          <Field label="Impacto caso não preenchida"><Textarea rows={4} value={f.impacto_nao_preenchida} onChange={(e) => set("impacto_nao_preenchida", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Perfil do Candidato</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Escolaridade">
            <Select value={f.escolaridade} onValueChange={(v) => set("escolaridade", v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{ESCOLARIDADES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Formação"><Input value={f.formacao} onChange={(e) => set("formacao", e.target.value)} /></Field>
          <Field label="Tempo de Experiência"><Input value={f.tempo_experiencia} onChange={(e) => set("tempo_experiencia", e.target.value)} /></Field>
          <Field label="Registro Profissional"><Input value={f.registro_profissional} onChange={(e) => set("registro_profissional", e.target.value)} /></Field>
          <Field label="Idiomas"><Input value={f.idiomas} onChange={(e) => set("idiomas", e.target.value)} /></Field>
          <Field label="Informática"><Input value={f.informatica} onChange={(e) => set("informatica", e.target.value)} /></Field>
          <Field label="CNH"><Input value={f.cnh} onChange={(e) => set("cnh", e.target.value)} /></Field>
          <Field label="Residir na região"><Input value={f.residir_regiao} onChange={(e) => set("residir_regiao", e.target.value)} /></Field>
          <Field label="Disp. p/ viagens"><Input value={f.disp_viagens} onChange={(e) => set("disp_viagens", e.target.value)} /></Field>
          <Field label="Disp. de mudança (UF)"><Input value={f.disp_mudanca} onChange={(e) => set("disp_mudanca", e.target.value)} /></Field>
          <div className="md:col-span-3">
            <Field label="Cursos / Ferramentas desejadas"><Textarea value={f.cursos_ferramentas} onChange={(e) => set("cursos_ferramentas", e.target.value)} /></Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Avaliação de Alternativas</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-6">
            {[
              ["alt_realocacao", "Realocação interna"],
              ["alt_promocao", "Promoção interna"],
              ["alt_banco_talentos", "Banco de talentos"],
              ["alt_terceirizacao", "Terceirização"],
              ["alt_na", "N/A"],
            ].map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <Checkbox checked={f[k as string]} onCheckedChange={(v) => set(k as string, !!v)} />
                {l}
              </label>
            ))}
          </div>
          <Field label="Justificativa caso não haja alternativa interna">
            <Textarea rows={3} value={f.justificativa_sem_alternativa} onChange={(e) => set("justificativa_sem_alternativa", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Descrição do Cargo</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Experiência necessária"><Textarea rows={4} value={f.experiencia_necessaria} onChange={(e) => set("experiencia_necessaria", e.target.value)} /></Field>
          <Field label="Atividades a serem realizadas"><Textarea rows={4} value={f.atividades_realizadas} onChange={(e) => set("atividades_realizadas", e.target.value)} /></Field>
          <Field label="Soft Skills"><Textarea rows={3} value={f.soft_skills} onChange={(e) => set("soft_skills", e.target.value)} /></Field>
          <Field label="Observações / Particularidades"><Textarea rows={3} value={f.observacoes_particularidades} onChange={(e) => set("observacoes_particularidades", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recursos Necessários</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="TI (computador, e-mail, acessos, softwares)"><Textarea value={f.recursos_ti} onChange={(e) => set("recursos_ti", e.target.value)} /></Field>
          <Field label="Logística (carro, outros)"><Textarea value={f.recursos_logistica} onChange={(e) => set("recursos_logistica", e.target.value)} /></Field>
          <Field label="Infraestrutura (mesa, cadeira, material)"><Textarea value={f.recursos_infraestrutura} onChange={(e) => set("recursos_infraestrutura", e.target.value)} /></Field>
          <Field label="SST (uniforme, EPI)"><Textarea value={f.recursos_sst} onChange={(e) => set("recursos_sst", e.target.value)} /></Field>
          <div className="md:col-span-2">
            <Field label="Financeiro"><Textarea value={f.recursos_financeiro} onChange={(e) => set("recursos_financeiro", e.target.value)} /></Field>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/vagas")} disabled={saving}>Cancelar</Button>
        <Button onClick={submit} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Vaga
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
