import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const CCS = [
  "605 Administrativo",
  "607 Empilhadeiras",
  "609 Transportes",
  "522 Administrativo",
  "Outro",
];

export default function FeriasForm() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    matricula: "",
    colaborador_nome: "",
    cargo: "",
    empresa: "",
    centro_custo: CCS[0],
    data_emissao: today,
    periodo_aquisitivo_inicio: "",
    periodo_aquisitivo_fim: "",
    data_inicio: "",
    dias_descanso: 30,
    abono_data_inicio: "",
    abono_dias: 0,
    observacao: "",
  });

  useEffect(() => {
    if (profile) {
      setForm((f) => ({
        ...f,
        matricula: profile.matricula || "",
        colaborador_nome: profile.nome || "",
        empresa: profile.empresa || "",
      }));
    }
  }, [profile]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!user) return;
    if (
      !form.colaborador_nome ||
      !form.data_inicio ||
      !form.periodo_aquisitivo_inicio ||
      !form.periodo_aquisitivo_fim ||
      !form.dias_descanso
    ) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    // Regra: solicitação até o dia 10 do mês anterior ao período de gozo
    const [yy, mm, dd] = form.data_inicio.split("-").map(Number);
    const inicioGozo = new Date(yy, mm - 1, dd);
    const deadline = new Date(inicioGozo.getFullYear(), inicioGozo.getMonth() - 1, 10, 23, 59, 59);
    const hoje = new Date();
    if (hoje > deadline) {
      const dl = deadline.toLocaleDateString("pt-BR");
      toast.error(
        `Solicitação fora do prazo. O pedido deve ser feito até o dia 10 do mês anterior ao gozo (limite: ${dl}).`
      );
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      abono_data_inicio: form.abono_data_inicio || null,
      abono_dias: form.abono_dias || null,
      observacao: form.observacao || null,
      user_id: user.id,
      criado_por: user.id,
      status: "pendente",
    };
    const { data, error } = await (supabase as any)
      .from("ferias_solicitacoes")
      .insert(payload)
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success("Solicitação enviada para aprovação");
    navigate(`/ferias/${data.id}`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nova solicitação de férias</h1>
          <p className="text-muted-foreground">Preencha os dados conforme o formulário oficial</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/ferias")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Data de Emissão</Label>
            <Input type="date" value={form.data_emissao} onChange={(e) => set("data_emissao", e.target.value)} />
          </div>
          <div>
            <Label>Centro de Custo</Label>
            <Select value={form.centro_custo} onValueChange={(v) => set("centro_custo", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CCS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Matrícula</Label>
            <Input value={form.matricula} onChange={(e) => set("matricula", e.target.value)} />
          </div>
          <div>
            <Label>Colaborador *</Label>
            <Input value={form.colaborador_nome} onChange={(e) => set("colaborador_nome", e.target.value)} />
          </div>
          <div>
            <Label>Cargo</Label>
            <Input value={form.cargo} onChange={(e) => set("cargo", e.target.value)} />
          </div>
          <div>
            <Label>Empresa</Label>
            <Input value={form.empresa} onChange={(e) => set("empresa", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Período Aquisitivo</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Início *</Label>
            <Input type="date" value={form.periodo_aquisitivo_inicio} onChange={(e) => set("periodo_aquisitivo_inicio", e.target.value)} />
          </div>
          <div>
            <Label>Fim *</Label>
            <Input type="date" value={form.periodo_aquisitivo_fim} onChange={(e) => set("periodo_aquisitivo_fim", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Férias</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Data de Início *</Label>
            <Input type="date" value={form.data_inicio} onChange={(e) => set("data_inicio", e.target.value)} />
          </div>
          <div>
            <Label>Descanso - quantidade de dias *</Label>
            <Input type="number" min={1} max={30} value={form.dias_descanso} onChange={(e) => set("dias_descanso", parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <Label>Abono - data de início</Label>
            <Input type="date" value={form.abono_data_inicio} onChange={(e) => set("abono_data_inicio", e.target.value)} />
          </div>
          <div>
            <Label>Abono - dias trabalhados</Label>
            <Input type="number" min={0} max={10} value={form.abono_dias} onChange={(e) => set("abono_dias", parseInt(e.target.value) || 0)} />
          </div>
          <div className="md:col-span-2">
            <Label>Observação</Label>
            <Textarea value={form.observacao} onChange={(e) => set("observacao", e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate("/ferias")}>Cancelar</Button>
        <Button onClick={submit} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Enviar para aprovação
        </Button>
      </div>
    </div>
  );
}
