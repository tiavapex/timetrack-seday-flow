import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { COMPETENCIAS, NOTAS } from "@/lib/competencias";

export default function AvaliacoesForm() {
  const navigate = useNavigate();
  const { user, isGestor } = useAuth();
  const [saving, setSaving] = useState(false);
  const [colaboradores, setColaboradores] = useState<any[]>([]);

  const [form, setForm] = useState({
    colaborador_id: "",
    periodo: "30",
    nome: "",
    cargo: "",
    setor: "",
    matricula: "",
    data_admissao: "",
    data_termino: "",
    observacoes: "",
    medida: "",
    mobilizacao: "", // "sim" | "nao"
    data_mobilizacao: "",
    motivo_nao_mobilizacao: "",
  });

  const [notas, setNotas] = useState<Record<number, string>>({});

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("id, nome, cargo, setor, matricula")
        .eq("ativo", true)
        .order("nome");
      setColaboradores(data || []);
    })();
  }, []);

  const onPickColab = (id: string) => {
    const c = colaboradores.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      colaborador_id: id,
      nome: c?.nome || "",
      cargo: c?.cargo || "",
      setor: c?.setor || "",
      matricula: c?.matricula || "",
    }));
  };

  if (!isGestor) {
    return <p className="text-sm text-muted-foreground">Apenas gestores podem criar avaliações.</p>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.colaborador_id) return toast.error("Selecione o colaborador");
    if (!form.observacoes.trim()) return toast.error("O campo de observações é obrigatório");
    if (!form.medida) return toast.error("Selecione a medida a ser tomada");
    if (Object.keys(notas).length < COMPETENCIAS.length) {
      return toast.error("Avalie todas as competências");
    }
    if (form.mobilizacao !== "sim" && form.mobilizacao !== "nao") {
      return toast.error("Informe a mobilização (Sim/Não)");
    }
    if (form.mobilizacao === "sim" && !form.data_mobilizacao) {
      return toast.error("Informe a data de mobilização");
    }
    if (form.mobilizacao === "nao" && !form.motivo_nao_mobilizacao.trim()) {
      return toast.error("Informe o motivo da não mobilização");
    }

    setSaving(true);
    const payload = {
      colaborador_id: form.colaborador_id,
      avaliador_id: user!.id,
      periodo: form.periodo,
      nome: form.nome,
      cargo: form.cargo || null,
      setor: form.setor || null,
      matricula: form.matricula || null,
      data_admissao: form.data_admissao || null,
      data_termino: form.data_termino || null,
      observacoes: form.observacoes.trim(),
      medida: form.medida,
      mobilizacao: form.mobilizacao === "sim",
      data_mobilizacao: form.mobilizacao === "sim" ? form.data_mobilizacao : null,
      motivo_nao_mobilizacao: form.mobilizacao === "nao" ? form.motivo_nao_mobilizacao.trim() : null,
    };

    const { data, error } = await (supabase as any)
      .from("avaliacoes_competencias")
      .insert(payload)
      .select()
      .single();

    if (error) {
      setSaving(false);
      return toast.error(error.message);
    }

    const itensPayload = COMPETENCIAS.map((c, i) => ({
      avaliacao_id: data.id,
      ordem: i + 1,
      competencia: c.titulo,
      descricao: c.descricao,
      nota: notas[i],
    }));
    const { error: e2 } = await (supabase as any)
      .from("avaliacao_competencias_itens")
      .insert(itensPayload);

    setSaving(false);
    if (e2) return toast.error(e2.message);
    toast.success("Avaliação salva");
    navigate(`/avaliacoes/${data.id}`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/avaliacoes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Nova Avaliação de Competências</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Colaborador *</Label>
              <Select value={form.colaborador_id} onValueChange={onPickColab}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {colaboradores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Período *</Label>
              <Select value={form.periodo} onValueChange={(v) => setForm({ ...form, periodo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Cargo</Label><Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} /></div>
            <div><Label>Setor / Centro de custo</Label><Input value={form.setor} onChange={(e) => setForm({ ...form, setor: e.target.value })} /></div>
            <div><Label>Matrícula</Label><Input value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} /></div>
            <div>
              <Label>Mobilização *</Label>
              <RadioGroup
                className="flex gap-6 mt-2 h-10 items-center"
                value={form.mobilizacao}
                onValueChange={(v) => setForm({ ...form, mobilizacao: v })}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="sim" id="mob-sim-top" />
                  <Label htmlFor="mob-sim-top">Sim</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="nao" id="mob-nao-top" />
                  <Label htmlFor="mob-nao-top">Não</Label>
                </div>
              </RadioGroup>
            </div>
            <div><Label>Data de admissão</Label><Input type="date" value={form.data_admissao} onChange={(e) => setForm({ ...form, data_admissao: e.target.value })} /></div>
            <div><Label>Data de término</Label><Input type="date" value={form.data_termino} onChange={(e) => setForm({ ...form, data_termino: e.target.value })} /></div>
            {form.mobilizacao === "sim" && (
              <div>
                <Label>Data de mobilização *</Label>
                <Input
                  type="date"
                  required
                  value={form.data_mobilizacao}
                  onChange={(e) => setForm({ ...form, data_mobilizacao: e.target.value })}
                />
              </div>
            )}
            {form.mobilizacao === "nao" && (
              <div className="md:col-span-2">
                <Label>Motivo da não mobilização *</Label>
                <Textarea
                  required
                  rows={3}
                  value={form.motivo_nao_mobilizacao}
                  onChange={(e) => setForm({ ...form, motivo_nao_mobilizacao: e.target.value })}
                  placeholder="Explique o motivo..."
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Competências</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {COMPETENCIAS.map((c, i) => (
              <div key={i} className="border rounded-lg p-3">
                <p className="font-semibold text-sm">{i + 1}. {c.titulo}</p>
                <p className="text-xs text-muted-foreground mb-2">{c.descricao}</p>
                <Select value={notas[i] || ""} onValueChange={(v) => setNotas({ ...notas, [i]: v })}>
                  <SelectTrigger className="w-full md:w-72"><SelectValue placeholder="Selecione a avaliação..." /></SelectTrigger>
                  <SelectContent>
                    {NOTAS.map((n) => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Observações e medida</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Observações do avaliador *</Label>
              <Textarea
                required
                rows={4}
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Descreva observações sobre o desempenho do colaborador..."
              />
            </div>
            <div>
              <Label>Medida a ser tomada *</Label>
              <RadioGroup
                className="flex gap-6 mt-2"
                value={form.medida}
                onValueChange={(v) => setForm({ ...form, medida: v })}
              >
                {["prorrogar", "efetivar", "demitir"].map((m) => (
                  <div key={m} className="flex items-center gap-2">
                    <RadioGroupItem value={m} id={`m-${m}`} />
                    <Label htmlFor={`m-${m}`} className="capitalize">{m}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>


        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/avaliacoes")}>Cancelar</Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Avaliação
          </Button>
        </div>
      </form>
    </div>
  );
}
