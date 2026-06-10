import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function NovoRegistro() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tipo, setTipo] = useState<"produtiva" | "improdutiva">("produtiva");
  const [motivo, setMotivo] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [setor, setSetor] = useState("");
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [intervalo, setIntervalo] = useState("0");
  const [cliente, setCliente] = useState("");
  const [setorSolicitante, setSetorSolicitante] = useState("");
  const [solicitante, setSolicitante] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const calcularTotalMinutos = () => {
    if (!horaInicio || !horaFim) return 0;
    const [h1, m1] = horaInicio.split(":").map(Number);
    const [h2, m2] = horaFim.split(":").map(Number);
    let total = h2 * 60 + m2 - (h1 * 60 + m1);
    if (total < 0) total += 24 * 60;
    total -= Number(intervalo || 0);
    return Math.max(0, total);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Não autenticado", description: "Faça login novamente.", variant: "destructive" });
      return;
    }

    const totalMinutos = calcularTotalMinutos();
    if (totalMinutos <= 0) {
      toast({ title: "Período inválido", description: "Verifique os horários e o intervalo.", variant: "destructive" });
      return;
    }

    let motivoFinal = "";
    if (tipo === "improdutiva") {
      motivoFinal = motivo;
    } else {
      if (!cliente || !setorSolicitante || !solicitante) {
        toast({ title: "Preencha o solicitante", description: "Cliente, setor e nome do solicitante são obrigatórios.", variant: "destructive" });
        return;
      }
      motivoFinal = `Cliente: ${cliente} | Setor: ${setorSolicitante} | Solicitante: ${solicitante}`;
    }

    setIsSubmitting(true);
    const { error } = await (supabase as any).from("horas_extras").insert({
      user_id: user.id,
      colaborador_nome: profile?.nome ?? user.email ?? "Colaborador",
      matricula: profile?.matricula ?? null,
      empresa,
      setor,
      data,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      intervalo_minutos: Number(intervalo || 0),
      total_minutos: totalMinutos,
      tipo,
      motivo: motivoFinal,
      observacoes: observacoes || null,
      status: "pendente",
    });
    setIsSubmitting(false);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Registro criado!", description: "O registro de horas extras foi salvo com sucesso." });
    navigate("/registros");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/registros")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Novo Registro</h1>
          <p className="text-muted-foreground">Registre as horas extras trabalhadas</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Dados do Registro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Colaborador</Label>
                <Input value={profile?.nome ?? user?.email ?? ""} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Select required value={empresa} onValueChange={setEmpresa}>
                  <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Avapex">Avapex Transportes</SelectItem>
                    <SelectItem value="Seday">Seday Equipamentos</SelectItem>
                    <SelectItem value="Innomach">Innomach</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="setor">Setor</Label>
                <Select required value={setor} onValueChange={setSetor}>
                  <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operações">Operações</SelectItem>
                    <SelectItem value="Administrativo">Administrativo</SelectItem>
                    <SelectItem value="Produção">Produção</SelectItem>
                    <SelectItem value="Logística">Logística</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="TI">TI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <Input type="date" id="data" required value={data} onChange={(e) => setData(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="horaInicio">Hora Início</Label>
                <Input type="time" id="horaInicio" required value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horaFim">Hora Fim</Label>
                <Input type="time" id="horaFim" required value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervalo">Intervalo (min)</Label>
                <Input type="number" id="intervalo" placeholder="0" min="0" max="120" value={intervalo} onChange={(e) => setIntervalo(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Hora Extra</Label>
              <Select
                required
                value={tipo}
                onValueChange={(v) => {
                  setTipo(v as "produtiva" | "improdutiva");
                  setMotivo("");
                  setCliente("");
                  setSetorSolicitante("");
                  setSolicitante("");
                }}
              >
                <SelectTrigger id="tipo"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="produtiva">Produtiva</SelectItem>
                  <SelectItem value="improdutiva">Improdutiva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tipo === "improdutiva" ? (
              <div className="space-y-2">
                <Label htmlFor="motivoImprodutiva">Motivo da HE Improdutiva</Label>
                <Select required value={motivo} onValueChange={setMotivo}>
                  <SelectTrigger id="motivoImprodutiva"><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ausência de colaborador">Ausência de colaborador</SelectItem>
                    <SelectItem value="Atestado">Atestado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cliente">Cliente Solicitante</Label>
                    <Select required value={cliente} onValueChange={setCliente}>
                      <SelectTrigger id="cliente"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Usiminas">Usiminas</SelectItem>
                        <SelectItem value="Vale">Vale</SelectItem>
                        <SelectItem value="MRS">MRS</SelectItem>
                        <SelectItem value="Matriz">Matriz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setorSolicitante">Setor Solicitante</Label>
                    <Select required value={setorSolicitante} onValueChange={setSetorSolicitante}>
                      <SelectTrigger id="setorSolicitante"><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operações">Operações</SelectItem>
                        <SelectItem value="Administrativo">Administrativo</SelectItem>
                        <SelectItem value="Produção">Produção</SelectItem>
                        <SelectItem value="Logística">Logística</SelectItem>
                        <SelectItem value="Manutenção">Manutenção</SelectItem>
                        <SelectItem value="Manutenção">Manutenção</SelectItem>
                        <SelectItem value="TI">TI</SelectItem>
                        <SelectItem value="Comercial">Comercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="solicitante">Nome do Solicitante</Label>
                  <Input
                    id="solicitante"
                    type="text"
                    placeholder="Nome da pessoa que solicitou a hora extra"
                    required
                    value={solicitante}
                    onChange={(e) => setSolicitante(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea id="observacoes" placeholder="Observações adicionais..." rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/registros")}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            <Save className="h-4 w-4" />
            {isSubmitting ? "Salvando..." : "Salvar Registro"}
          </Button>
        </div>
      </form>
    </div>
  );
}
