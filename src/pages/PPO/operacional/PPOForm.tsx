import { useEffect, useMemo, useState } from "react";
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
import { Loader2, Plus, Trash2, Save, ArrowLeft, Users } from "lucide-react";
import { toast } from "sonner";
import {
  PPO_PILARES,
  PPO_NOTA_OBS,
  getPilar,
  calcularTotal,
  totalMaximo,
} from "@/lib/ppo-criterios";

interface Linha {
  matricula: string;
  nome: string;
  funcao: string;
  criterios: Record<string, boolean>;
  observacao: string;
}

const EMPRESAS = ["Avapex", "Seday", "Innomach"];

export default function PPOForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loadingCol, setLoadingCol] = useState(false);

  const [tipo, setTipo] = useState("adm_rh");
  const [empresa, setEmpresa] = useState("Avapex");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [obs, setObs] = useState("");
  const [linhas, setLinhas] = useState<Linha[]>([]);

  const pilar = useMemo(() => getPilar(tipo), [tipo]);

  useEffect(() => {
    setLinhas((prev) => prev.map((l) => ({ ...l, criterios: {} })));
  }, [tipo]);

  const novaLinha = () =>
    setLinhas((p) => [
      ...p,
      { matricula: "", nome: "", funcao: "", criterios: {}, observacao: "" },
    ]);

  const carregarColaboradores = async () => {
    setLoadingCol(true);
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("matricula, nome, cargo, funcao_completa")
      .eq("ativo", true)
      .order("nome");
    if (error) toast.error("Erro ao carregar colaboradores: " + error.message);
    else {
      setLinhas(
        (data || []).map((p: any) => ({
          matricula: p.matricula || "",
          nome: p.nome,
          funcao: p.funcao_completa || p.cargo || "",
          criterios: {},
          observacao: "",
        }))
      );
      toast.success(`${data?.length || 0} colaboradores carregados`);
    }
    setLoadingCol(false);
  };

  const setLinha = (i: number, patch: Partial<Linha>) =>
    setLinhas((p) => p.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const toggleCriterio = (i: number, key: string, ok: boolean) =>
    setLinhas((p) =>
      p.map((l, idx) =>
        idx === i ? { ...l, criterios: { ...l.criterios, [key]: ok } } : l
      )
    );

  const salvar = async (status: "rascunho" | "pendente") => {
    if (!inicio || !fim) return toast.error("Informe o período da avaliação.");
    if (linhas.length === 0) return toast.error("Adicione pelo menos um colaborador.");
    if (linhas.some((l) => !l.nome.trim()))
      return toast.error("Todos os colaboradores precisam de nome.");

    const infracoesSemObs = linhas.some(
      (l) =>
        pilar.criterios.some((c) => l.criterios[c.key] === false) &&
        !l.observacao.trim()
    );
    if (infracoesSemObs)
      return toast.error(
        "Preencha a observação (data, frota e ocorrência) para os colaboradores com infração."
      );

    setSaving(true);
    const { data, error } = await (supabase as any)
      .from("ppo_avaliacoes")
      .insert({
        tipo,
        pilar: pilar.pilar,
        empresa,
        periodo_inicio: inicio,
        periodo_fim: fim,
        observacao: obs || null,
        status,
        criado_por: user?.id,
      })
      .select("id")
      .single();

    if (error) {
      setSaving(false);
      return toast.error("Erro ao salvar: " + error.message);
    }

    const itens = linhas.map((l, idx) => ({
      ppo_id: data.id,
      ordem: idx,
      matricula: l.matricula || null,
      nome: l.nome,
      funcao: l.funcao || null,
      criterios: pilar.criterios.reduce(
        (acc, c) => ({ ...acc, [c.key]: l.criterios[c.key] !== false }),
        {} as Record<string, boolean>
      ),
      total: calcularTotal(pilar, l.criterios),
      observacao: l.observacao || null,
    }));

    const { error: e2 } = await (supabase as any).from("ppo_itens").insert(itens);
    setSaving(false);
    if (e2) return toast.error("Erro ao salvar itens: " + e2.message);
    toast.success("Avaliação PPO salva!");
    navigate(`/ppo/${data.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/ppo")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nova Avaliação PPO</h1>
          <p className="text-muted-foreground">{pilar.titulo}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Pilar / Avaliação *</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PPO_PILARES.map((p) => (
                  <SelectItem key={p.tipo} value={p.tipo}>
                    {p.pilar} — {p.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Empresa</Label>
            <Select value={empresa} onValueChange={setEmpresa}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMPRESAS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div />
          <div className="space-y-2">
            <Label>Período — início *</Label>
            <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Período — fim *</Label>
            <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Colaboradores avaliados</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {pilar.modo === "pontuacao"
                ? `Desmarque o critério não cumprido — pontuação máxima: ${totalMaximo(pilar)}`
                : "Desmarque o critério não cumprido (marcado = ok)"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={carregarColaboradores} disabled={loadingCol}>
              {loadingCol ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Users className="mr-1 h-4 w-4" />
              )}
              Carregar ativos
            </Button>
            <Button size="sm" onClick={novaLinha}>
              <Plus className="mr-1 h-4 w-4" /> Linha
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {linhas.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nenhum colaborador adicionado.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">MAT</TableHead>
                    <TableHead className="min-w-[180px]">NOME</TableHead>
                    <TableHead className="min-w-[140px]">FUNÇÃO</TableHead>
                    {pilar.criterios.map((c) => (
                      <TableHead key={c.key} className="w-24 text-center text-[10px] leading-tight">
                        {c.label}
                        <div className="font-normal text-muted-foreground">{c.peso}</div>
                      </TableHead>
                    ))}
                    <TableHead className="w-16 text-center">TOTAL</TableHead>
                    <TableHead className="min-w-[160px]">Observação</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Input
                          className="h-8"
                          value={l.matricula}
                          onChange={(e) => setLinha(i, { matricula: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8"
                          value={l.nome}
                          onChange={(e) => setLinha(i, { nome: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8"
                          value={l.funcao}
                          onChange={(e) => setLinha(i, { funcao: e.target.value })}
                        />
                      </TableCell>
                      {pilar.criterios.map((c) => (
                        <TableCell key={c.key} className="text-center">
                          <Checkbox
                            checked={l.criterios[c.key] !== false}
                            onCheckedChange={(v) => toggleCriterio(i, c.key, !!v)}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-medium">
                        {calcularTotal(pilar, l.criterios)}
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8"
                          placeholder="Data, frota e ocorrência"
                          value={l.observacao}
                          onChange={(e) => setLinha(i, { observacao: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setLinhas((p) => p.filter((_, idx) => idx !== i))}
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
          <p className="mt-3 text-xs text-muted-foreground">{PPO_NOTA_OBS}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observação geral</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => salvar("rascunho")} disabled={saving}>
          Salvar rascunho
        </Button>
        <Button onClick={() => salvar("pendente")} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enviar avaliação
        </Button>
      </div>
    </div>
  );
}
