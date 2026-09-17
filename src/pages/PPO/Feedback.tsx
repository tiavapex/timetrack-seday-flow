import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PPONav } from "./PPONav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { fmtDataHora } from "@/lib/ppo";

export default function Feedback() {
  const { avaliacaoId } = useParams();
  const navigate = useNavigate();
  const { user, isRh, isGestor, isLideranca, podeAdminPPO } = useAuth();
  const podeEditar = isRh || isGestor || isLideranca || podeAdminPPO;

  const [loading, setLoading] = useState(true);
  const [fb, setFb] = useState<any>(null);
  const [acoes, setAcoes] = useState<any[]>([]);
  const [meuPerfil, setMeuPerfil] = useState<any>(null);
  const [av, setAv] = useState<any>(null);
  const [nova, setNova] = useState({ acao: "", responsavel_nome: "", prazo: "" });

  const load = async () => {
    const [a, f, me] = await Promise.all([
      (supabase as any).from("ppo_avaliacoes").select("*").eq("id", avaliacaoId).maybeSingle(),
      (supabase as any).from("ppo_feedbacks").select("*").eq("avaliacao_id", avaliacaoId).maybeSingle(),
      user ? (supabase as any).from("profiles").select("id").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    setAv(a.data);
    setFb(
      f.data || {
        avaliacao_id: avaliacaoId,
        pontos_positivos: "",
        indicadores_destaque: "",
        oportunidades: "",
        expectativas: "",
      }
    );
    setMeuPerfil(me.data);
    if (f.data) {
      const { data: pa } = await (supabase as any)
        .from("ppo_plano_acao")
        .select("*")
        .eq("feedback_id", f.data.id)
        .order("created_at");
      setAcoes(pa || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [avaliacaoId, user]);

  const salvar = async () => {
    const payload = {
      avaliacao_id: avaliacaoId,
      pontos_positivos: fb.pontos_positivos,
      indicadores_destaque: fb.indicadores_destaque,
      oportunidades: fb.oportunidades,
      expectativas: fb.expectativas,
      gestor_id: user?.id,
      realizado_em: new Date().toISOString(),
    };
    const { error } = fb.id
      ? await (supabase as any).from("ppo_feedbacks").update(payload).eq("id", fb.id)
      : await (supabase as any).from("ppo_feedbacks").insert(payload);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Feedback registrado.");
    load();
  };

  const addAcao = async () => {
    if (!fb?.id) return toast.error("Salve o feedback antes de incluir o plano de ação.");
    if (!nova.acao) return toast.error("Descreva a ação.");
    const { error } = await (supabase as any).from("ppo_plano_acao").insert({
      feedback_id: fb.id,
      acao: nova.acao,
      responsavel_nome: nova.responsavel_nome || null,
      prazo: nova.prazo || null,
      status: "pendente",
    });
    if (error) return toast.error("Erro: " + error.message);
    setNova({ acao: "", responsavel_nome: "", prazo: "" });
    load();
  };

  const removerAcao = async (id: string) => {
    await (supabase as any).from("ppo_plano_acao").delete().eq("id", id);
    load();
  };

  const darCiencia = async (quem: "gestor" | "colaborador") => {
    const patch =
      quem === "gestor"
        ? { ciente_gestor: true, ciente_gestor_em: new Date().toISOString() }
        : { ciente_colaborador: true, ciente_em: new Date().toISOString() };
    const { error } = await (supabase as any).from("ppo_feedbacks").update(patch).eq("id", fb.id);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Ciência registrada.");
    load();
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  const souOColaborador = meuPerfil && av && meuPerfil.id === av.colaborador_id;

  return (
    <div className="space-y-6">
      <PPONav />
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Avaliação e feedback</h1>
          <p className="text-muted-foreground">
            O feedback é orientado ao desenvolvimento e não pode ser usado como constrangimento ou
            exposição.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registro do feedback</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {[
            ["pontos_positivos", "Pontos positivos"],
            ["indicadores_destaque", "Indicadores de destaque"],
            ["oportunidades", "Oportunidades de melhoria"],
            ["expectativas", "Expectativas para o próximo ciclo"],
          ].map(([campo, label]) => (
            <div key={campo} className="space-y-2">
              <Label>{label}</Label>
              <Textarea
                rows={3}
                disabled={!podeEditar}
                value={fb[campo] || ""}
                onChange={(e) => setFb({ ...fb, [campo]: e.target.value })}
              />
            </div>
          ))}
          {podeEditar && (
            <Button className="w-fit" onClick={salvar}>
              <Save className="mr-1 h-4 w-4" /> Salvar feedback
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plano de ação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ação</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Situação</TableHead>
                  {podeEditar && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {acoes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      Nenhuma ação registrada.
                    </TableCell>
                  </TableRow>
                )}
                {acoes.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.acao}</TableCell>
                    <TableCell>{a.responsavel_nome || "—"}</TableCell>
                    <TableCell>{a.prazo || "—"}</TableCell>
                    <TableCell>{a.status}</TableCell>
                    {podeEditar && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => removerAcao(a.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {podeEditar && (
            <div className="grid gap-2 md:grid-cols-4">
              <Input
                className="md:col-span-2"
                placeholder="Ação"
                value={nova.acao}
                onChange={(e) => setNova({ ...nova, acao: e.target.value })}
              />
              <Input
                placeholder="Responsável"
                value={nova.responsavel_nome}
                onChange={(e) => setNova({ ...nova, responsavel_nome: e.target.value })}
              />
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={nova.prazo}
                  onChange={(e) => setNova({ ...nova, prazo: e.target.value })}
                />
                <Button size="icon" onClick={addAcao}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {fb?.id && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ciência eletrônica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Gestor:{" "}
              {fb.ciente_gestor ? `ciente em ${fmtDataHora(fb.ciente_gestor_em)}` : "pendente"}
            </p>
            <p>
              Colaborador:{" "}
              {fb.ciente_colaborador ? `ciente em ${fmtDataHora(fb.ciente_em)}` : "pendente"}
            </p>
            <div className="flex gap-2 pt-2">
              {podeEditar && !fb.ciente_gestor && (
                <Button size="sm" variant="outline" onClick={() => darCiencia("gestor")}>
                  Registrar ciência do gestor
                </Button>
              )}
              {souOColaborador && !fb.ciente_colaborador && (
                <Button size="sm" onClick={() => darCiencia("colaborador")}>
                  Declarar ciência
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
