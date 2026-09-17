import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Loader2,
  Save,
  Send,
  ShieldCheck,
  Megaphone,
  Lock,
  Upload,
  AlertTriangle,
  Plus,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import {
  PILARES,
  PESOS_PADRAO,
  FONTES_DADO,
  CONDICOES_ELEGIBILIDADE,
  TIPOS_BARREIRA,
  STATUS_AVALIACAO,
  PPO_TEXTOS_LEGAIS,
  calcularResultado,
  converterNota,
  faixaAplicada,
  descreverFaixa,
  fmtNota,
  fmtData,
  rotuloFaixa,
  Faixa,
} from "@/lib/ppo";

export default function Apuracao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isRh, isGestor, isLideranca, podeAdminPPO } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [av, setAv] = useState<any>(null);
  const [ciclo, setCiclo] = useState<any>(null);
  const [colab, setColab] = useState<any>(null);
  const [indicadores, setIndicadores] = useState<any[]>([]);
  const [faixas, setFaixas] = useState<Record<string, Faixa[]>>({});
  const [itens, setItens] = useState<any[]>([]);
  const [pesos, setPesos] = useState(PESOS_PADRAO);
  const [barreiras, setBarreiras] = useState<any[]>([]);
  const [novaBarreira, setNovaBarreira] = useState({ tipo_barreira: "", descricao: "", evidencia_url: "", analise: "" });

  const somenteLeitura = av && ["encerrada"].includes(av.status);
  const podeApurar = (isLideranca || isRh || podeAdminPPO) && !somenteLeitura;

  const load = async () => {
    const { data, error } = await (supabase as any)
      .from("ppo_avaliacoes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) {
      toast.error("Avaliação não encontrada ou sem permissão de acesso.");
      setLoading(false);
      return;
    }
    setAv(data);

    const [cy, pf, its, br] = await Promise.all([
      data.ciclo_id
        ? (supabase as any).from("ppo_ciclos").select("*").eq("id", data.ciclo_id).maybeSingle()
        : Promise.resolve({ data: null }),
      (supabase as any).from("profiles").select("*").eq("id", data.colaborador_id).maybeSingle(),
      (supabase as any).from("ppo_avaliacao_itens").select("*").eq("avaliacao_id", id),
      (supabase as any).from("ppo_barreiras").select("*").eq("avaliacao_id", id),
    ]);
    setCiclo(cy.data);
    setColab(pf.data);
    setItens(its.data || []);
    setBarreiras(br.data || []);

    let q = (supabase as any).from("ppo_indicadores").select("*").eq("ativo", true);
    if (data.setor_id) q = q.or(`setor_id.eq.${data.setor_id},setor_id.is.null`);
    const ind = await q;
    setIndicadores(ind.data || []);

    const fx = await (supabase as any).from("ppo_faixas_indicador").select("*").order("ordem");
    const agr: Record<string, Faixa[]> = {};
    (fx.data || []).forEach((f: any) => {
      agr[f.indicador_id] = [...(agr[f.indicador_id] || []), f];
    });
    setFaixas(agr);

    // pesos efetivos do ciclo: cargo → setor → padrão do banco
    const { data: pp } = await (supabase as any)
      .from("ppo_pesos_pilar")
      .select("*")
      .or(`ciclo_id.eq.${data.ciclo_id || "00000000-0000-0000-0000-000000000000"},padrao.eq.true`);
    const lista = pp || [];
    const escolhido =
      lista.find((p: any) => p.cargo_id && p.cargo_id === data.cargo_id) ||
      lista.find((p: any) => p.setor_id && p.setor_id === data.setor_id) ||
      lista.find((p: any) => p.padrao) ||
      null;
    if (escolhido)
      setPesos({
        p1: Number(escolhido.p1),
        p2: Number(escolhido.p2),
        p3: Number(escolhido.p3),
        p4: Number(escolhido.p4),
      });

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const indPorId = useMemo(
    () => Object.fromEntries(indicadores.map((i) => [i.id, i])),
    [indicadores]
  );

  const resultado = useMemo(
    () =>
      calcularResultado(
        itens.map((it) => {
          const ind = indPorId[it.indicador_id];
          const nota =
            it.nota_manual != null
              ? Number(it.nota_manual)
              : converterNota(faixas[it.indicador_id] || [], it.valor_apurado != null ? Number(it.valor_apurado) : null);
          return {
            pilar: ind?.pilar ?? it.pilar,
            nota: ind?.requisito_minimo ? null : nota,
            peso: it.peso_aplicado ?? ind?.peso ?? 0,
          };
        }),
        pesos,
        { elegivel: av?.elegivel !== false, fatorProporcional: av?.proporcional ? av?.fator_proporcional : null }
      ),
    [itens, faixas, indPorId, pesos, av]
  );

  const carregarIndicadores = async () => {
    const existentes = new Set(itens.map((i) => i.indicador_id));
    const faltando = indicadores.filter((i) => !existentes.has(i.id));
    const incompletos = faltando.filter(
      (i) => !i.formula || i.meta == null || i.peso == null || !i.fonte_dado || !i.responsavel_id
    );
    const validos = faltando.filter((i) => !incompletos.includes(i));
    if (incompletos.length)
      toast.warning(
        `${incompletos.length} indicador(es) foram ignorados por estarem incompletos na Matriz de Indicadores.`
      );
    if (!validos.length) return toast.info("Nenhum indicador novo para carregar.");
    const { error } = await (supabase as any).from("ppo_avaliacao_itens").insert(
      validos.map((i) => ({
        avaliacao_id: id,
        indicador_id: i.id,
        pilar: i.pilar,
        peso_aplicado: i.peso,
        fonte_dado: i.fonte_dado,
      }))
    );
    if (error) return toast.error("Erro: " + error.message);
    toast.success(`${validos.length} indicador(es) carregado(s).`);
    load();
  };

  const setItem = (itemId: string, patch: any) =>
    setItens((p) => p.map((i) => (i.id === itemId ? { ...i, ...patch } : i)));

  const salvarItem = async (item: any) => {
    const { error } = await (supabase as any)
      .from("ppo_avaliacao_itens")
      .update({
        valor_apurado: item.valor_apurado === "" ? null : item.valor_apurado,
        fonte_dado: item.fonte_dado,
        evidencia_url: item.evidencia_url,
        evidencia_descricao: item.evidencia_descricao,
        requisito_minimo_atendido: item.requisito_minimo_atendido,
        observacao: item.observacao,
        apurado_por: user?.id,
        apurado_em: new Date().toISOString(),
      })
      .eq("id", item.id);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Indicador salvo.");
    load();
  };

  const enviarEvidencia = async (item: any, file: File) => {
    const path = `${id}/${item.id}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("ppo-evidencias").upload(path, file);
    if (error) return toast.error("Erro no envio da evidência: " + error.message);
    setItem(item.id, { evidencia_url: path });
    await (supabase as any)
      .from("ppo_avaliacao_itens")
      .update({ evidencia_url: path })
      .eq("id", item.id);
    toast.success("Evidência anexada.");
  };

  const salvarCabecalho = async (patch: any, msg = "Alterações salvas.") => {
    setSaving(true);
    const { error } = await (supabase as any).from("ppo_avaliacoes").update(patch).eq("id", id);
    setSaving(false);
    if (error) return toast.error("Erro: " + error.message);
    toast.success(msg);
    load();
  };

  const itensSemRastreabilidade = itens.filter(
    (i) => !i.fonte_dado || (!i.evidencia_url && !i.evidencia_descricao)
  );

  const enviarValidacao = () => {
    if (itens.length === 0) return toast.error("Carregue os indicadores antes de enviar.");
    if (itensSemRastreabilidade.length)
      return toast.error(
        "Todo indicador precisa de fonte de dado e evidência (anexo ou link) antes do envio para validação."
      );
    salvarCabecalho({ status: "aguardando_validacao" }, "Enviado para validação da gerência.");
  };

  const validar = () =>
    salvarCabecalho(
      { status: "validada", validado_por: user?.id, validado_em: new Date().toISOString() },
      "Avaliação validada."
    );

  const comunicar = async () => {
    const { data: termo } = await (supabase as any)
      .from("ppo_termos_ciencia")
      .select("id")
      .eq("ciclo_id", av.ciclo_id)
      .eq("colaborador_id", av.colaborador_id)
      .maybeSingle();
    if (!termo && !isRh && !podeAdminPPO)
      return toast.error("O colaborador ainda não registrou o termo de ciência do ciclo.");
    if (!termo)
      toast.warning("Termo de ciência não registrado — comunicação liberada por decisão do RH (registrada em auditoria).");
    salvarCabecalho(
      { status: "comunicada", comunicado_em: new Date().toISOString() },
      "Resultado comunicado ao colaborador."
    );
  };

  const encerrar = () =>
    salvarCabecalho(
      { status: "encerrada", encerrado_em: new Date().toISOString() },
      "Avaliação encerrada."
    );

  const adicionarBarreira = async () => {
    if (!novaBarreira.tipo_barreira || !novaBarreira.descricao || !novaBarreira.evidencia_url)
      return toast.error("Barreira exige tipo, descrição e comprovação formal.");
    const { error } = await (supabase as any).from("ppo_barreiras").insert({
      avaliacao_id: id,
      ...novaBarreira,
    });
    if (error) return toast.error("Erro: " + error.message);
    setNovaBarreira({ tipo_barreira: "", descricao: "", evidencia_url: "", analise: "" });
    toast.success("Barreira registrada. A inelegibilidade não constitui medida disciplinar.");
    load();
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (!av) return null;

  return (
    <div className="space-y-6">
      <PPONav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/ppo/avaliacoes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{colab?.nome || "Colaborador"}</h1>
            <p className="text-sm text-muted-foreground">
              Matrícula {colab?.matricula || "—"} · {colab?.cargo || "—"} · {colab?.setor || "—"} ·{" "}
              {ciclo?.nome || "Sem ciclo"} ({fmtData(ciclo?.periodo_inicio)} a {fmtData(ciclo?.periodo_fim)})
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{STATUS_AVALIACAO[av.status] || av.status}</Badge>
          {podeApurar && (
            <>
              <Button size="sm" variant="outline" onClick={carregarIndicadores}>
                <Plus className="mr-1 h-4 w-4" /> Carregar indicadores
              </Button>
              {["rascunho", "em_apuracao"].includes(av.status) && (
                <Button size="sm" onClick={enviarValidacao} disabled={saving}>
                  <Send className="mr-1 h-4 w-4" /> Enviar para validação
                </Button>
              )}
            </>
          )}
          {(isGestor || podeAdminPPO) && av.status === "aguardando_validacao" && (
            <Button size="sm" onClick={validar} disabled={saving}>
              <ShieldCheck className="mr-1 h-4 w-4" /> Validar
            </Button>
          )}
          {(isRh || podeAdminPPO) && av.status === "validada" && (
            <Button size="sm" onClick={comunicar} disabled={saving}>
              <Megaphone className="mr-1 h-4 w-4" /> Comunicar ao colaborador
            </Button>
          )}
          {(isRh || podeAdminPPO) && ["comunicada"].includes(av.status) && (
            <Button size="sm" variant="outline" onClick={encerrar} disabled={saving}>
              <Lock className="mr-1 h-4 w-4" /> Encerrar
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <Link to={`/ppo/feedback/${av.id}`}>
              <MessageSquare className="mr-1 h-4 w-4" /> Feedback
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Tabs defaultValue="1">
            <TabsList className="flex-wrap">
              {PILARES.map((p) => (
                <TabsTrigger key={p.numero} value={String(p.numero)}>
                  P{p.numero} — {p.nome}
                </TabsTrigger>
              ))}
            </TabsList>
            {PILARES.map((p) => {
              const doPilar = itens.filter(
                (i) => (indPorId[i.indicador_id]?.pilar ?? i.pilar) === p.numero
              );
              return (
                <TabsContent key={p.numero} value={String(p.numero)} className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Peso do pilar neste ciclo: {pesos[`p${p.numero}` as keyof typeof pesos]}%
                  </p>
                  {doPilar.length === 0 && (
                    <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
                      Nenhum indicador deste pilar carregado nesta avaliação.
                    </p>
                  )}
                  {doPilar.map((it) => {
                    const ind = indPorId[it.indicador_id] || {};
                    const fx = faixas[it.indicador_id] || [];
                    const valor = it.valor_apurado != null && it.valor_apurado !== "" ? Number(it.valor_apurado) : null;
                    const nota = it.nota_manual != null ? Number(it.nota_manual) : converterNota(fx, valor);
                    const aplicada = faixaAplicada(fx, valor);
                    const semRastro = !it.fonte_dado || (!it.evidencia_url && !it.evidencia_descricao);
                    return (
                      <Card key={it.id} className={semRastro ? "border-destructive/40" : ""}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">
                            {ind.nome}
                            {ind.requisito_minimo && (
                              <Badge variant="outline" className="ml-2 text-[10px]">
                                requisito mínimo — não pontua
                              </Badge>
                            )}
                            {ind.critico && (
                              <Badge variant="secondary" className="ml-2 text-[10px]">
                                crítico
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {ind.formula} · Meta {ind.meta} {ind.unidade} · Peso {it.peso_aplicado ?? ind.peso}%
                          </p>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-2">
                          {ind.requisito_minimo ? (
                            <div className="flex items-center gap-2 md:col-span-2">
                              <Checkbox
                                disabled={!podeApurar}
                                checked={!!it.requisito_minimo_atendido}
                                onCheckedChange={(v) =>
                                  setItem(it.id, { requisito_minimo_atendido: !!v })
                                }
                              />
                              <span className="text-sm">Requisito atendido</span>
                            </div>
                          ) : (
                            <>
                              <div className="space-y-1">
                                <Label className="text-xs">Valor apurado</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  disabled={!podeApurar}
                                  value={it.valor_apurado ?? ""}
                                  onChange={(e) => setItem(it.id, { valor_apurado: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Nota convertida</Label>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Input readOnly value={nota == null ? "—" : fmtNota(nota)} />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {aplicada
                                      ? `Faixa aplicada: ${descreverFaixa(aplicada)} → nota ${aplicada.nota}`
                                      : "Informe o valor apurado para converter a nota."}
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </>
                          )}
                          <div className="space-y-1">
                            <Label className="text-xs">Fonte do dado *</Label>
                            <Select
                              value={it.fonte_dado || ""}
                              onValueChange={(v) => setItem(it.id, { fonte_dado: v })}
                              disabled={!podeApurar}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {FONTES_DADO.map((f) => (
                                  <SelectItem key={f} value={f}>
                                    {f}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Evidência (link ou anexo) *</Label>
                            <div className="flex gap-2">
                              <Input
                                disabled={!podeApurar}
                                value={it.evidencia_url || ""}
                                placeholder="Link ou arquivo anexado"
                                onChange={(e) => setItem(it.id, { evidencia_url: e.target.value })}
                              />
                              {podeApurar && (
                                <Button size="icon" variant="outline" asChild>
                                  <label className="cursor-pointer">
                                    <Upload className="h-4 w-4" />
                                    <input
                                      type="file"
                                      className="hidden"
                                      onChange={(e) =>
                                        e.target.files?.[0] && enviarEvidencia(it, e.target.files[0])
                                      }
                                    />
                                  </label>
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <Label className="text-xs">Descrição da evidência</Label>
                            <Input
                              disabled={!podeApurar}
                              value={it.evidencia_descricao || ""}
                              onChange={(e) => setItem(it.id, { evidencia_descricao: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <Label className="text-xs">Observação</Label>
                            <Textarea
                              rows={2}
                              disabled={!podeApurar}
                              value={it.observacao || ""}
                              onChange={(e) => setItem(it.id, { observacao: e.target.value })}
                            />
                          </div>
                          {semRastro && (
                            <p className="flex items-center gap-1 text-xs text-destructive md:col-span-2">
                              <AlertTriangle className="h-3 w-3" /> Informação verbal não é evidência:
                              registre a fonte e o anexo/link antes de enviar para validação.
                            </p>
                          )}
                          {podeApurar && (
                            <div className="md:col-span-2">
                              <Button size="sm" onClick={() => salvarItem(it)}>
                                <Save className="mr-1 h-4 w-4" /> Salvar indicador
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </TabsContent>
              );
            })}
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Elegibilidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {CONDICOES_ELEGIBILIDADE.map((c) => (
                <div key={c.campo} className="flex items-center gap-2">
                  <Checkbox
                    disabled={!podeApurar}
                    checked={!!av[c.campo]}
                    onCheckedChange={(v) => salvarCabecalho({ [c.campo]: !!v }, "Elegibilidade atualizada.")}
                  />
                  <span className="text-sm">{c.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Checkbox
                  disabled={!podeApurar}
                  checked={!!av.requisito_ocupacional_atendido}
                  onCheckedChange={(v) =>
                    salvarCabecalho({ requisito_ocupacional_atendido: !!v }, "Registro atualizado.")
                  }
                />
                <span className="text-sm">Requisito ocupacional atendido</span>
              </div>
              <p className="text-xs text-muted-foreground">{PPO_TEXTOS_LEGAIS.lgpd}</p>
              <div className="space-y-1">
                <Label className="text-xs">Motivo de inelegibilidade (se houver)</Label>
                <Textarea
                  rows={2}
                  disabled={!podeApurar}
                  defaultValue={av.motivo_inelegibilidade || ""}
                  onBlur={(e) =>
                    e.target.value !== (av.motivo_inelegibilidade || "") &&
                    salvarCabecalho({
                      motivo_inelegibilidade: e.target.value || null,
                      elegivel: e.target.value ? false : true,
                    })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">{PPO_TEXTOS_LEGAIS.inelegibilidade}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Barreiras de inelegibilidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {barreiras.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma barreira registrada.</p>
              )}
              {barreiras.map((b) => (
                <div key={b.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{b.tipo_barreira}</p>
                  <p className="text-muted-foreground">{b.descricao}</p>
                  <p className="text-xs text-muted-foreground">Comprovação: {b.evidencia_url}</p>
                </div>
              ))}
              {(isRh || podeAdminPPO) && !somenteLeitura && (
                <div className="grid gap-2 md:grid-cols-2">
                  <Select
                    value={novaBarreira.tipo_barreira}
                    onValueChange={(v) => setNovaBarreira({ ...novaBarreira, tipo_barreira: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de barreira" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_BARREIRA.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Comprovação formal (link do documento)"
                    value={novaBarreira.evidencia_url}
                    onChange={(e) => setNovaBarreira({ ...novaBarreira, evidencia_url: e.target.value })}
                  />
                  <Textarea
                    className="md:col-span-2"
                    rows={2}
                    placeholder="Descrição do fato"
                    value={novaBarreira.descricao}
                    onChange={(e) => setNovaBarreira({ ...novaBarreira, descricao: e.target.value })}
                  />
                  <Textarea
                    className="md:col-span-2"
                    rows={2}
                    placeholder="Análise documentada"
                    value={novaBarreira.analise}
                    onChange={(e) => setNovaBarreira({ ...novaBarreira, analise: e.target.value })}
                  />
                  <Button className="md:col-span-2" size="sm" onClick={adicionarBarreira}>
                    Registrar barreira
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Medidas disciplinares como advertência ou suspensão não reduzem o resultado do PPO.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Proporcionalidade e análise do RH</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center gap-2 md:col-span-2">
                <Checkbox
                  disabled={!podeApurar}
                  checked={!!av.proporcional}
                  onCheckedChange={(v) => salvarCabecalho({ proporcional: !!v })}
                />
                <span className="text-sm">
                  Admissão, transferência, mudança de função, afastamento legal ou período insuficiente
                  no ciclo
                </span>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fator de proporcionalidade (%)</Label>
                <Input
                  type="number"
                  disabled={!podeApurar}
                  defaultValue={av.fator_proporcional ?? ""}
                  onBlur={(e) =>
                    salvarCabecalho({ fator_proporcional: e.target.value === "" ? null : Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Motivo</Label>
                <Input
                  disabled={!podeApurar}
                  defaultValue={av.proporcional_motivo || ""}
                  onBlur={(e) => salvarCabecalho({ proporcional_motivo: e.target.value || null })}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">Análise do RH (obrigatória para casos proporcionais)</Label>
                <Textarea
                  rows={2}
                  disabled={!(isRh || podeAdminPPO) || somenteLeitura}
                  defaultValue={av.analise_rh || ""}
                  onBlur={(e) =>
                    salvarCabecalho({
                      analise_rh: e.target.value || null,
                      analise_rh_por: user?.id,
                      analise_rh_em: new Date().toISOString(),
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cálculo ao vivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {PILARES.map((p) => (
                <div key={p.numero} className="flex justify-between">
                  <span className="text-muted-foreground">
                    P{p.numero} ({pesos[`p${p.numero}` as keyof typeof pesos]}%)
                  </span>
                  <span className="font-medium">
                    {fmtNota((resultado as any)[`p${p.numero}`])}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2">
                <div className="flex justify-between text-base font-semibold">
                  <span>Nota final</span>
                  <span>{fmtNota(resultado.final)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nota Final = (P1×{pesos.p1}%)+(P2×{pesos.p2}%)+(P3×{pesos.p3}%)+(P4×{pesos.p4}%)
                </p>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Faixa</span>
                <span>{rotuloFaixa(resultado.faixa)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Percentual de referência</span>
                <span>{resultado.percentual}%</span>
              </div>
              <p className="pt-2 text-xs text-muted-foreground">{PPO_TEXTOS_LEGAIS.faixas}</p>
              {(isRh || podeAdminPPO) && (
                <div className="space-y-1 pt-2">
                  <Label className="text-xs">Valor-base do reconhecimento (restrito)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    disabled={somenteLeitura}
                    defaultValue={av.valor_base ?? ""}
                    onBlur={(e) =>
                      salvarCabecalho({ valor_base: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 pt-6 text-xs text-muted-foreground">
              <p>{PPO_TEXTOS_LEGAIS.participacao}</p>
              <p>{PPO_TEXTOS_LEGAIS.naoSubstitui}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
