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
import { Checkbox } from "@/components/ui/checkbox";
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
import { Loader2, Plus, AlertOctagon } from "lucide-react";
import { toast } from "sonner";
import {
  TIPOS_OCORRENCIA,
  STATUS_OCORRENCIA,
  fmtData,
  fmtDataHora,
  PPO_TEXTOS_LEGAIS,
} from "@/lib/ppo";

export default function Ocorrencias() {
  const { user, isRh, isGestor, isLideranca, podeAdminPPO } = useAuth();
  const podeGerir = isRh || isGestor || isLideranca || podeAdminPPO;

  const [rows, setRows] = useState<any[]>([]);
  const [perfis, setPerfis] = useState<any[]>([]);
  const [ciclos, setCiclos] = useState<any[]>([]);
  const [meuPerfil, setMeuPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detalhe, setDetalhe] = useState<any>(null);
  const [form, setForm] = useState<any>({
    colaborador_id: "",
    ciclo_id: "",
    tipo: "indicador",
    data_ocorrencia: new Date().toISOString().slice(0, 10),
    descricao: "",
    evidencia_url: "",
    analise_lideranca: "",
  });

  const load = async () => {
    const [oc, pf, cy, me] = await Promise.all([
      (supabase as any).from("ppo_ocorrencias").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("profiles").select("id, nome, matricula, setor, cargo").order("nome"),
      (supabase as any).from("ppo_ciclos").select("id, nome").order("periodo_inicio", { ascending: false }),
      user ? (supabase as any).from("profiles").select("id").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    if (oc.error) toast.error("Erro: " + oc.error.message);
    setRows(oc.data || []);
    setPerfis(pf.data || []);
    setCiclos(cy.data || []);
    setMeuPerfil(me.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const salvar = async () => {
    if (!form.colaborador_id || !form.descricao || !form.evidencia_url)
      return toast.error("Colaborador, descrição objetiva e evidência são obrigatórios.");
    setSaving(true);
    const { error } = await (supabase as any).from("ppo_ocorrencias").insert({
      ...form,
      ciclo_id: form.ciclo_id || null,
      status: "registrada",
    });
    setSaving(false);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Ocorrência registrada.");
    setOpen(false);
    setForm({ ...form, colaborador_id: "", descricao: "", evidencia_url: "", analise_lideranca: "" });
    load();
  };

  const atualizar = async (patch: any, msg = "Ocorrência atualizada.") => {
    const { error } = await (supabase as any).from("ppo_ocorrencias").update(patch).eq("id", detalhe.id);
    if (error) return toast.error("Erro: " + error.message);
    toast.success(msg);
    setDetalhe(null);
    load();
  };

  const nome = (idp: string) => perfis.find((p) => p.id === idp)?.nome || "—";
  const souODono = detalhe && meuPerfil && detalhe.colaborador_id === meuPerfil.id;

  return (
    <div className="space-y-6">
      <PPONav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registro de ocorrências</h1>
          <p className="text-muted-foreground">
            Nenhuma ocorrência afeta resultado sem registro formal, evidência, manifestação e decisão
            documentada.
          </p>
        </div>
        {podeGerir && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova ocorrência
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5" /> Ocorrências
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma ocorrência registrada.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Impacta nota</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{fmtData(r.data_ocorrencia)}</TableCell>
                      <TableCell className="font-medium">{nome(r.colaborador_id)}</TableCell>
                      <TableCell>
                        {TIPOS_OCORRENCIA.find((t) => t.value === r.tipo)?.label || r.tipo}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {STATUS_OCORRENCIA.find((s) => s.value === r.status)?.label || r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{r.impacta_nota ? "Sim" : "Não"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setDetalhe(r)}>
                          Abrir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">{PPO_TEXTOS_LEGAIS.inelegibilidade}</p>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova ocorrência</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Colaborador *</Label>
              <Select
                value={form.colaborador_id}
                onValueChange={(v) => setForm({ ...form, colaborador_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {perfis.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ciclo</Label>
              <Select value={form.ciclo_id} onValueChange={(v) => setForm({ ...form, ciclo_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ciclos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_OCORRENCIA.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input
                type="date"
                value={form.data_ocorrencia}
                onChange={(e) => setForm({ ...form, data_ocorrencia: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Descrição objetiva do fato *</Label>
              <Textarea
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Evidência (link do documento/registro) *</Label>
              <Input
                value={form.evidencia_url}
                onChange={(e) => setForm({ ...form, evidencia_url: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Análise da liderança</Label>
              <Textarea
                rows={2}
                value={form.analise_lideranca}
                onChange={(e) => setForm({ ...form, analise_lideranca: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detalhe} onOpenChange={(v) => !v && setDetalhe(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ocorrência</DialogTitle>
          </DialogHeader>
          {detalhe && (
            <div className="space-y-4 text-sm">
              <p>
                <strong>{nome(detalhe.colaborador_id)}</strong> ·{" "}
                {fmtData(detalhe.data_ocorrencia)} ·{" "}
                {TIPOS_OCORRENCIA.find((t) => t.value === detalhe.tipo)?.label}
              </p>
              <p>{detalhe.descricao}</p>
              <p className="text-xs text-muted-foreground">Evidência: {detalhe.evidencia_url}</p>

              {podeGerir && (
                <div className="space-y-2">
                  <Label>Análise da liderança</Label>
                  <Textarea
                    rows={2}
                    defaultValue={detalhe.analise_lideranca || ""}
                    onBlur={(e) => setDetalhe({ ...detalhe, analise_lideranca: e.target.value })}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        atualizar({
                          status: "em_analise",
                          analise_lideranca: detalhe.analise_lideranca,
                        })
                      }
                    >
                      Em análise
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        atualizar(
                          {
                            status: "aguardando_manifestacao",
                            analise_lideranca: detalhe.analise_lideranca,
                            prazo_manifestacao: new Date(Date.now() + 3 * 86400000)
                              .toISOString()
                              .slice(0, 10),
                          },
                          "Colaborador notificado para manifestação."
                        )
                      }
                    >
                      Solicitar manifestação
                    </Button>
                  </div>
                </div>
              )}

              {souODono && detalhe.status === "aguardando_manifestacao" && (
                <div className="space-y-2">
                  <Label>Sua manifestação</Label>
                  <Textarea
                    rows={3}
                    defaultValue={detalhe.manifestacao_colaborador || ""}
                    onBlur={(e) => setDetalhe({ ...detalhe, manifestacao_colaborador: e.target.value })}
                  />
                  <Button
                    size="sm"
                    onClick={() =>
                      atualizar(
                        {
                          manifestacao_colaborador: detalhe.manifestacao_colaborador,
                          manifestacao_em: new Date().toISOString(),
                        },
                        "Manifestação registrada."
                      )
                    }
                  >
                    Enviar manifestação
                  </Button>
                </div>
              )}

              {detalhe.manifestacao_colaborador && (
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">
                    Manifestação do colaborador em {fmtDataHora(detalhe.manifestacao_em)}
                  </p>
                  <p>{detalhe.manifestacao_colaborador}</p>
                </div>
              )}

              {podeGerir && (
                <div className="space-y-2 border-t pt-3">
                  <Label>Decisão</Label>
                  <Textarea
                    rows={2}
                    defaultValue={detalhe.decisao || ""}
                    onBlur={(e) => setDetalhe({ ...detalhe, decisao: e.target.value })}
                  />
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!detalhe.impacta_nota}
                      disabled={!detalhe.manifestacao_em && !detalhe.prazo_manifestacao}
                      onCheckedChange={(v) => setDetalhe({ ...detalhe, impacta_nota: !!v })}
                    />
                    <span>
                      Impacta indicador (permitido apenas após manifestação registrada ou prazo
                      decorrido)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        atualizar(
                          {
                            status: "decidida",
                            decisao: detalhe.decisao,
                            impacta_nota: detalhe.impacta_nota,
                            decidido_por: user?.id,
                            decidido_em: new Date().toISOString(),
                          },
                          "Decisão registrada."
                        )
                      }
                    >
                      Registrar decisão
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => atualizar({ status: "arquivada" })}>
                      Arquivar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
