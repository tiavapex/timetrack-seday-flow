import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PPONav } from "./PPONav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, Plus, Trash2, Timer } from "lucide-react";
import { toast } from "sonner";

export default function SLA() {
  const { podeAdminPPO, isGestor } = useAuth();
  const podeEditar = podeAdminPPO || isGestor;
  const [rows, setRows] = useState<any[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    setor_id: "",
    processo: "",
    sla_valor: "",
    sla_unidade: "dias úteis",
    indicador_texto: "% dentro do SLA",
  });

  const load = async () => {
    const [sla, st] = await Promise.all([
      (supabase as any).from("ppo_sla").select("*").eq("ativo", true).order("setor_nome"),
      (supabase as any).from("ppo_setores").select("*").eq("ativo", true).order("nome"),
    ]);
    if (sla.error) toast.error("Erro: " + sla.error.message);
    setRows(sla.data || []);
    setSetores(st.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const salvar = async () => {
    if (!form.setor_id || !form.processo || !form.sla_valor)
      return toast.error("Informe setor, processo e o SLA.");
    setSaving(true);
    const setor = setores.find((s) => s.id === form.setor_id);
    const { error } = await (supabase as any).from("ppo_sla").insert({
      ...form,
      setor_nome: setor?.nome || null,
    });
    setSaving(false);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("SLA cadastrado.");
    setOpen(false);
    setForm({
      setor_id: "",
      processo: "",
      sla_valor: "",
      sla_unidade: "dias úteis",
      indicador_texto: "% dentro do SLA",
    });
    load();
  };

  const remover = async (id: string) => {
    const { error } = await (supabase as any).from("ppo_sla").update({ ativo: false }).eq("id", id);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("SLA inativado.");
    load();
  };

  const porSetor = rows.reduce((acc: Record<string, any[]>, r) => {
    const k = r.setor_nome || "Outros";
    acc[k] = [...(acc[k] || []), r];
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PPONav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Matriz de SLA</h1>
          <p className="text-muted-foreground">
            Parâmetros de nível de serviço por processo, base dos indicadores do Pilar 1.
          </p>
        </div>
        {podeEditar && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo SLA
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        Object.entries(porSetor).map(([setor, itens]: [string, any[]]) => (
          <Card key={setor}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Timer className="h-4 w-4" /> {setor}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Processo</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead>Indicador</TableHead>
                      {podeEditar && <TableHead className="w-12" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.processo}</TableCell>
                        <TableCell>
                          {r.sla_valor} {r.sla_unidade !== "—" ? r.sla_unidade : ""}
                        </TableCell>
                        <TableCell>{r.indicador_texto || "—"}</TableCell>
                        {podeEditar && (
                          <TableCell>
                            <Button size="icon" variant="ghost" onClick={() => remover(r.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      <p className="text-xs text-muted-foreground">
        Os demais setores devem possuir tabela específica conforme suas atividades.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo SLA</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Setor *</Label>
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
              <Label>Processo *</Label>
              <Input
                value={form.processo}
                onChange={(e) => setForm({ ...form, processo: e.target.value })}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>SLA *</Label>
                <Input
                  value={form.sla_valor}
                  placeholder="Ex.: 2"
                  onChange={(e) => setForm({ ...form, sla_valor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Input
                  value={form.sla_unidade}
                  onChange={(e) => setForm({ ...form, sla_unidade: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Indicador</Label>
              <Input
                value={form.indicador_texto}
                onChange={(e) => setForm({ ...form, indicador_texto: e.target.value })}
              />
            </div>
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
