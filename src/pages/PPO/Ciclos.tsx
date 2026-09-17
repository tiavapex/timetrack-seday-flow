import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PPONav } from "./PPONav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Plus, Users, CalendarClock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { STATUS_CICLO, fmtData, PPO_DOC } from "@/lib/ppo";

export default function Ciclos() {
  const { podeAdminPPO } = useAuth();
  const [ciclos, setCiclos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gerando, setGerando] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    nome: "",
    ano: new Date().getFullYear(),
    periodo_inicio: "",
    periodo_fim: "",
    data_corte: "",
    status: "rascunho",
    observacoes: "",
  });

  const load = async () => {
    const { data, error } = await (supabase as any)
      .from("ppo_ciclos")
      .select("*")
      .order("periodo_inicio", { ascending: false });
    if (error) toast.error("Erro ao carregar ciclos: " + error.message);
    else setCiclos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const salvar = async () => {
    if (!form.nome || !form.periodo_inicio || !form.periodo_fim)
      return toast.error("Informe nome e período do ciclo.");
    setSaving(true);
    const { error } = await (supabase as any).from("ppo_ciclos").insert({
      ...form,
      ano: Number(form.ano),
      data_corte: form.data_corte || null,
      observacoes: form.observacoes || null,
    });
    setSaving(false);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Ciclo criado.");
    setOpen(false);
    setForm({
      nome: "",
      ano: new Date().getFullYear(),
      periodo_inicio: "",
      periodo_fim: "",
      data_corte: "",
      status: "rascunho",
      observacoes: "",
    });
    load();
  };

  const mudarStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "encerrado") patch.observacoes = undefined;
    const { error } = await (supabase as any).from("ppo_ciclos").update({ status }).eq("id", id);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Situação do ciclo atualizada.");
    load();
  };

  const gerarAvaliacoes = async (ciclo: any) => {
    setGerando(ciclo.id);
    const { data: profs, error } = await (supabase as any)
      .from("profiles")
      .select("id, nome, cargo, setor")
      .eq("ativo", true);
    if (error) {
      setGerando(null);
      return toast.error("Erro ao buscar colaboradores: " + error.message);
    }
    const { data: existentes } = await (supabase as any)
      .from("ppo_avaliacoes")
      .select("colaborador_id")
      .eq("ciclo_id", ciclo.id);
    const jaTem = new Set((existentes || []).map((e: any) => e.colaborador_id));
    const novas = (profs || [])
      .filter((p: any) => !jaTem.has(p.id))
      .map((p: any) => ({
        ciclo_id: ciclo.id,
        colaborador_id: p.id,
        status: "rascunho",
      }));
    if (novas.length === 0) {
      setGerando(null);
      return toast.info("Todos os colaboradores elegíveis já possuem avaliação neste ciclo.");
    }
    const { error: e2 } = await (supabase as any).from("ppo_avaliacoes").insert(novas);
    setGerando(null);
    if (e2) return toast.error("Erro ao gerar avaliações: " + e2.message);
    toast.success(`${novas.length} avaliação(ões) gerada(s).`);
  };

  const checklistEncerramento = async (ciclo: any) => {
    const { data } = await (supabase as any)
      .from("ppo_avaliacoes")
      .select("status")
      .eq("ciclo_id", ciclo.id);
    const total = (data || []).length;
    const pendentes = (data || []).filter(
      (a: any) => !["comunicada", "encerrada"].includes(a.status)
    ).length;
    const { data: cont } = await (supabase as any)
      .from("ppo_contestacoes")
      .select("id, decisao, avaliacao_id")
      .is("decisao", null);
    if (pendentes > 0)
      return toast.error(
        `Não é possível encerrar: ${pendentes} de ${total} avaliações ainda não foram comunicadas.`
      );
    if ((cont || []).length > 0)
      return toast.error("Existem contestações sem decisão registrada.");
    mudarStatus(ciclo.id, "encerrado");
  };

  return (
    <div className="space-y-6">
      <PPONav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ciclos de avaliação</h1>
          <p className="text-muted-foreground">
            Calendário do programa, data de corte e geração das avaliações — {PPO_DOC}
          </p>
        </div>
        {podeAdminPPO && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo ciclo
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" /> Ciclos cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : ciclos.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhum ciclo cadastrado.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Data de corte</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ciclos.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell>{c.ano}</TableCell>
                      <TableCell>
                        {fmtData(c.periodo_inicio)} a {fmtData(c.periodo_fim)}
                      </TableCell>
                      <TableCell>{fmtData(c.data_corte)}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "encerrado" ? "outline" : "secondary"}>
                          {STATUS_CICLO[c.status] || c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        {podeAdminPPO && (
                          <>
                            <Select value={c.status} onValueChange={(v) => mudarStatus(c.id, v)}>
                              <SelectTrigger className="inline-flex h-8 w-[150px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_CICLO).map(([k, v]) => (
                                  <SelectItem key={k} value={k}>
                                    {v}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={gerando === c.id}
                              onClick={() => gerarAvaliacoes(c)}
                            >
                              {gerando === c.id ? (
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              ) : (
                                <Users className="mr-1 h-4 w-4" />
                              )}
                              Gerar avaliações
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => checklistEncerramento(c)}
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" /> Encerrar
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Alterações de ciclo exigem comunicação prévia aos colaboradores e ficam registradas na
            trilha de auditoria.
          </p>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo ciclo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome do ciclo *</Label>
              <Input
                value={form.nome}
                placeholder="Ex.: 1º semestre 2026"
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Ano *</Label>
              <Input
                type="number"
                value={form.ano}
                onChange={(e) => setForm({ ...form, ano: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de corte</Label>
              <Input
                type="date"
                value={form.data_corte}
                onChange={(e) => setForm({ ...form, data_corte: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Início do período *</Label>
              <Input
                type="date"
                value={form.periodo_inicio}
                onChange={(e) => setForm({ ...form, periodo_inicio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fim do período *</Label>
              <Input
                type="date"
                value={form.periodo_fim}
                onChange={(e) => setForm({ ...form, periodo_fim: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Textarea
                rows={2}
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
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
