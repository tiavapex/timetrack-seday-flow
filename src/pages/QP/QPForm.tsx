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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const EMPRESAS = ["Avapex", "Seday", "Innomach"];
const AREAS_AVAPEX = ["ADM", "Empilhadeira", "Transporte"];
const AREAS_OUTRAS = ["ADM", "Obra"];

const TIPOS: { key: string; label: string }[] = [
  { key: "tp_admissao", label: "Admissão" },
  { key: "tp_advertencia", label: "Advertência / Suspensão" },
  { key: "tp_troca", label: "Troca" },
  { key: "tp_demissao", label: "Demissão" },
  { key: "tp_abono", label: "Abono" },
  { key: "tp_compensacao", label: "Compensação" },
  { key: "tp_reembolso", label: "Reembolso" },
  { key: "tp_acerto_ponto", label: "Acerto de ponto" },
  { key: "tp_folga", label: "Folga" },
];

const RECS: { key: string; label: string }[] = [
  { key: "rec_aprovado", label: "Aprovado" },
  { key: "rec_curriculo", label: "Currículo" },
  { key: "rec_treinamento", label: "Treinamento" },
  { key: "rec_cursos", label: "Cursos" },
  { key: "rec_reprovado", label: "Reprovado" },
  { key: "rec_outros", label: "Outros" },
];

export default function QPForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const hoje = new Date().toISOString().slice(0, 10);

  const [f, setF] = useState<Record<string, any>>({
    empresa: "Avapex",
    area: "ADM",
    data_evento: hoje,
    data_entrega: hoje,
    nome: "",
    cargo: "",
    salario: "",
    matricula: "",
    motivo: "",
    indicado_por: "",
    tempo_experiencia: "",
    data_necessidade_admissao: "",
    data_exame_admissional: "",
    data_admissao: "",
    ben_ad_funcao: false,
    ben_ad_funcao_valor: "",
    ben_va_vr: "VA",
    ben_va_vr_ativo: false,
    ben_va_vr_valor: "",
    ben_ppo: false,
    ben_ppo_valor: "",
    ben_vt: false,
    ben_vt_valor: "",
    ben_plano_saude: false,
    ben_plano_saude_fob: "",
    ben_plano_odonto: false,
    ben_outro: "",
    ben_obs: "",
    unif_calca: "",
    unif_camisa: "",
    unif_jaqueta: "",
    unif_botina: "",
    unif_capa_chuva: "",
    observacoes: "",
  });

  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  const areas = f.empresa === "Avapex" ? AREAS_AVAPEX : AREAS_OUTRAS;

  const salvar = async (status: "rascunho" | "pendente") => {
    if (!f.nome.trim()) return toast.error("Informe o nome do colaborador.");
    if (!f.motivo.trim()) return toast.error("O motivo é obrigatório.");
    if (!TIPOS.some((t) => f[t.key])) return toast.error("Selecione ao menos um tipo de solicitação.");

    setSaving(true);
    const payload: Record<string, any> = { status, criado_por: user?.id };
    Object.entries(f).forEach(([k, v]) => {
      payload[k] = v === "" ? null : v;
    });
    TIPOS.forEach((t) => (payload[t.key] = !!f[t.key]));
    RECS.forEach((r) => (payload[r.key] = !!f[r.key]));

    const { data, error } = await (supabase as any)
      .from("qp_solicitacoes")
      .insert(payload)
      .select("id")
      .single();
    setSaving(false);
    if (error) return toast.error("Erro ao salvar: " + error.message);
    toast.success("QP registrada!");
    navigate(`/qp/${data.id}`);
  };

  const beneficio = (
    label: string,
    key: string,
    valorKey?: string,
    valorLabel = "Valor"
  ) => (
    <div className="flex flex-wrap items-center gap-3 rounded-md border p-3">
      <Switch checked={!!f[key]} onCheckedChange={(v) => set(key, v)} />
      <span className="min-w-[180px] text-sm font-medium">{label}</span>
      {valorKey && (
        <Input
          className="h-8 max-w-[160px]"
          placeholder={valorLabel}
          value={f[valorKey]}
          onChange={(e) => set(valorKey, e.target.value)}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/qp")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nova QP</h1>
          <p className="text-muted-foreground">Queira Providenciar — Rev. 02</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identificação do evento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Empresa *</Label>
            <Select value={f.empresa} onValueChange={(v) => { set("empresa", v); set("area", "ADM"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EMPRESAS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Área *</Label>
            <Select value={f.area} onValueChange={(v) => set("area", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data do evento *</Label>
            <Input type="date" value={f.data_evento} onChange={(e) => set("data_evento", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Data de entrega</Label>
            <Input type="date" value={f.data_entrega} onChange={(e) => set("data_entrega", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipo de solicitação *</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {TIPOS.map((t) => (
            <label key={t.key} className="flex items-center gap-2 text-sm">
              <Checkbox checked={!!f[t.key]} onCheckedChange={(v) => set(t.key, !!v)} />
              {t.label}
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Colaborador</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Nome *</Label>
            <Input value={f.nome} onChange={(e) => set("nome", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cargo</Label>
            <Input value={f.cargo} onChange={(e) => set("cargo", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Matrícula</Label>
            <Input value={f.matricula} onChange={(e) => set("matricula", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Salário</Label>
            <Input value={f.salario} onChange={(e) => set("salario", e.target.value)} placeholder="R$ 0,00 / mês" />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label>Motivo *</Label>
            <Input value={f.motivo} onChange={(e) => set("motivo", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recrutamento e seleção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {RECS.map((r) => (
              <label key={r.key} className="flex items-center gap-2 text-sm">
                <Checkbox checked={!!f[r.key]} onCheckedChange={(v) => set(r.key, !!v)} />
                {r.label}
              </label>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Indicado por</Label>
              <Input value={f.indicado_por} onChange={(e) => set("indicado_por", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tempo de experiência</Label>
              <Input value={f.tempo_experiencia} onChange={(e) => set("tempo_experiencia", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Necessidade para admissão</Label>
              <Input type="date" value={f.data_necessidade_admissao} onChange={(e) => set("data_necessidade_admissao", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Exame admissional</Label>
              <Input type="date" value={f.data_exame_admissional} onChange={(e) => set("data_exame_admissional", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Admissão</Label>
              <Input type="date" value={f.data_admissao} onChange={(e) => set("data_admissao", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Benefícios</CardTitle>
            <p className="text-xs text-muted-foreground">
              Outros acordos na contratação devem ser especificados no campo de observações.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {beneficio("AD função / gratificação", "ben_ad_funcao", "ben_ad_funcao_valor", "Valor (%)")}
            <div className="flex flex-wrap items-center gap-3 rounded-md border p-3">
              <Switch checked={!!f.ben_va_vr_ativo} onCheckedChange={(v) => set("ben_va_vr_ativo", v)} />
              <Select value={f.ben_va_vr} onValueChange={(v) => set("ben_va_vr", v)}>
                <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VA">VA</SelectItem>
                  <SelectItem value="VR">VR</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm font-medium">(valor dia)</span>
              <Input
                className="h-8 max-w-[140px]"
                placeholder="Valor"
                value={f.ben_va_vr_valor}
                onChange={(e) => set("ben_va_vr_valor", e.target.value)}
              />
            </div>
            {beneficio("PPO", "ben_ppo", "ben_ppo_valor")}
            {beneficio("VT / auxílio (valor dia)", "ben_vt", "ben_vt_valor")}
            <div className="flex flex-wrap items-center gap-3 rounded-md border p-3">
              <Switch checked={!!f.ben_plano_saude} onCheckedChange={(v) => set("ben_plano_saude", v)} />
              <span className="min-w-[120px] text-sm font-medium">Plano de saúde</span>
              <Select value={f.ben_plano_saude_fob || ""} onValueChange={(v) => set("ben_plano_saude_fob", v)}>
                <SelectTrigger className="h-8 w-40"><SelectValue placeholder="FOB" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sem FOB">Sem FOB</SelectItem>
                  <SelectItem value="Com FOB">Com FOB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {beneficio("Plano odontológico", "ben_plano_odonto")}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Outro</Label>
                <Input value={f.ben_outro} onChange={(e) => set("ben_outro", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Obs. benefícios</Label>
                <Input value={f.ben_obs} onChange={(e) => set("ben_obs", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uniforme</CardTitle>
            <p className="text-xs text-muted-foreground">Tamanho / numeração</p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {[
              ["unif_calca", "Calça"],
              ["unif_camisa", "Camisa"],
              ["unif_jaqueta", "Jaqueta"],
              ["unif_botina", "Botina"],
              ["unif_capa_chuva", "Capa de chuva"],
            ].map(([k, l]) => (
              <div key={k} className="space-y-2">
                <Label>{l}</Label>
                <Input value={f[k]} onChange={(e) => set(k, e.target.value)} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea rows={4} value={f.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => salvar("rascunho")} disabled={saving}>
          Salvar rascunho
        </Button>
        <Button onClick={() => salvar("pendente")} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Enviar para aprovação
        </Button>
      </div>
    </div>
  );
}
