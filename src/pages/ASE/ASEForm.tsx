import { useEffect, useState } from "react";
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
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const CLIENTES = ["Usiminas", "Vale", "MRS", "Matriz"];
const CC_OPTIONS = [
  { v: "605", l: "605 - Matriz" },
  { v: "607", l: "607 - Contrato Empilhadeiras" },
  { v: "609", l: "609 - Transportes" },
];
const SETORES = ["ADM", "EMPILHADEIRA", "TRANSPORTE", "OUTRO"];

interface ProfileRow {
  user_id: string;
  nome: string;
  matricula: string | null;
  setor: string | null;
}

interface ColabLine {
  user_id: string | null;
  matricula: string;
  nome: string;
  cargo: string;
  escala_sim: boolean;
  numero: string;
  vt: boolean;
  alimentacao: boolean;
}

export default function ASEForm() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    periodo_data: new Date().toISOString().slice(0, 10),
    cliente: "",
    centro_custo: "605",
    responsavel: "",
    lider_gestor: "",
    setor: "ADM",
    setor_outro: "",
    horario_inicio: "18:00",
    horario_fim: "20:00",
    atividades: "",
    observacao: "",
  });

  const [colabs, setColabs] = useState<ColabLine[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("user_id, nome, matricula, setor")
        .eq("ativo", true)
        .order("nome");
      setProfiles(data || []);
    })();
    if (profile?.nome) setForm((f) => ({ ...f, responsavel: profile.nome }));
  }, [profile]);

  const addColab = () => {
    setColabs((c) => [
      ...c,
      {
        user_id: null,
        matricula: "",
        nome: "",
        cargo: "",
        escala_sim: false,
        numero: String(c.length + 1),
        vt: false,
        alimentacao: false,
      },
    ]);
  };

  const setColab = (i: number, patch: Partial<ColabLine>) => {
    setColabs((c) => c.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  };

  const pickProfile = (i: number, userId: string) => {
    const p = profiles.find((x) => x.user_id === userId);
    if (!p) return;
    setColab(i, {
      user_id: p.user_id,
      matricula: p.matricula || "",
      nome: p.nome,
    });
  };

  const removeColab = (i: number) =>
    setColabs((c) => c.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!form.cliente || !form.atividades) {
      toast.error("Cliente e Atividades são obrigatórios");
      return;
    }
    if (colabs.length === 0) {
      toast.error("Adicione pelo menos um colaborador");
      return;
    }
    setSaving(true);

    const { data: aseInserted, error } = await (supabase as any)
      .from("ases")
      .insert({
        periodo_data: form.periodo_data,
        cliente: form.cliente,
        centro_custo: form.centro_custo,
        responsavel: form.responsavel,
        lider_gestor: form.lider_gestor || null,
        setor: form.setor,
        setor_outro: form.setor === "OUTRO" ? form.setor_outro : null,
        horario_inicio: form.horario_inicio,
        horario_fim: form.horario_fim,
        atividades: form.atividades,
        observacao: form.observacao || null,
        status: "pendente",
        criado_por: user?.id,
      })
      .select()
      .single();

    if (error || !aseInserted) {
      toast.error("Erro ao salvar: " + (error?.message || ""));
      setSaving(false);
      return;
    }

    const { error: colabErr } = await (supabase as any)
      .from("ase_colaboradores")
      .insert(
        colabs.map((c) => ({
          ase_id: aseInserted.id,
          user_id: c.user_id,
          matricula: c.matricula || null,
          nome: c.nome,
          cargo: c.cargo || null,
          escala_sim: c.escala_sim,
          numero: c.numero ? Number(c.numero) : null,
          vt: c.vt,
          alimentacao: c.alimentacao,
        }))
      );

    if (colabErr) {
      toast.error("Erro nos colaboradores: " + colabErr.message);
      setSaving(false);
      return;
    }

    toast.success("ASE criada com sucesso");
    navigate(`/ase/${aseInserted.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/ase")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nova ASE</h1>
          <p className="text-muted-foreground">Autorização de Serviços Extraordinários</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cabeçalho</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Período</Label>
            <Input
              type="date"
              value={form.periodo_data}
              onChange={(e) => setForm({ ...form, periodo_data: e.target.value })}
            />
          </div>
          <div>
            <Label>Cliente</Label>
            <Select
              value={form.cliente}
              onValueChange={(v) => setForm({ ...form, cliente: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {CLIENTES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Centro de Custo</Label>
            <Select
              value={form.centro_custo}
              onValueChange={(v) => setForm({ ...form, centro_custo: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CC_OPTIONS.map((o) => (
                  <SelectItem key={o.v} value={o.v}>
                    {o.l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Responsável</Label>
            <Input
              value={form.responsavel}
              onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
            />
          </div>
          <div>
            <Label>Líder / Gestor / Encarregado</Label>
            <Input
              value={form.lider_gestor}
              onChange={(e) => setForm({ ...form, lider_gestor: e.target.value })}
            />
          </div>
          <div>
            <Label>Setor</Label>
            <Select
              value={form.setor}
              onValueChange={(v) => setForm({ ...form, setor: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SETORES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.setor === "OUTRO" && (
            <div className="md:col-span-3">
              <Label>Especifique o setor</Label>
              <Input
                value={form.setor_outro}
                onChange={(e) => setForm({ ...form, setor_outro: e.target.value })}
              />
            </div>
          )}
          <div>
            <Label>Horário início</Label>
            <Input
              type="time"
              value={form.horario_inicio}
              onChange={(e) => setForm({ ...form, horario_inicio: e.target.value })}
            />
          </div>
          <div>
            <Label>Horário fim</Label>
            <Input
              type="time"
              value={form.horario_fim}
              onChange={(e) => setForm({ ...form, horario_fim: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Colaboradores</CardTitle>
          <Button size="sm" onClick={addColab}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {colabs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhum colaborador adicionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Escala</TableHead>
                    <TableHead className="w-16">N°</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="w-16">VT</TableHead>
                    <TableHead className="w-20">Alim.</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colabs.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Checkbox
                          checked={c.escala_sim}
                          onCheckedChange={(v) => setColab(i, { escala_sim: !!v })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="w-14"
                          value={c.numero}
                          onChange={(e) => setColab(i, { numero: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={c.user_id || ""}
                          onValueChange={(v) => pickProfile(i, v)}
                        >
                          <SelectTrigger className="min-w-[200px]">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {profiles.map((p) => (
                              <SelectItem key={p.user_id} value={p.user_id}>
                                {p.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          className="w-24"
                          value={c.matricula}
                          onChange={(e) => setColab(i, { matricula: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={c.cargo}
                          onChange={(e) => setColab(i, { cargo: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={c.vt}
                          onCheckedChange={(v) => setColab(i, { vt: !!v })}
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={c.alimentacao}
                          onCheckedChange={(v) => setColab(i, { alimentacao: !!v })}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeColab(i)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atividades e Observação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Atividades</Label>
            <Textarea
              rows={4}
              value={form.atividades}
              onChange={(e) => setForm({ ...form, atividades: e.target.value })}
            />
          </div>
          <div>
            <Label>Observação</Label>
            <Textarea
              rows={3}
              value={form.observacao}
              onChange={(e) => setForm({ ...form, observacao: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate("/ase")}>
          Cancelar
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar ASE
        </Button>
      </div>
    </div>
  );
}
