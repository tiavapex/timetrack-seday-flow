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

export default function NovoRegistro() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tipo, setTipo] = useState<"produtiva" | "improdutiva">("produtiva");
  const [motivo, setMotivo] = useState("");


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Registro criado!",
        description: "O registro de horas extras foi salvo com sucesso.",
      });
      navigate("/registros");
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/registros")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Novo Registro
          </h1>
          <p className="text-muted-foreground">
            Registre as horas extras trabalhadas
          </p>
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
                <Label htmlFor="colaborador">Colaborador</Label>
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="joao">João Silva - 12345</SelectItem>
                    <SelectItem value="maria">Maria Santos - 12346</SelectItem>
                    <SelectItem value="carlos">Carlos Lima - 12347</SelectItem>
                    <SelectItem value="ana">Ana Costa - 12348</SelectItem>
                    <SelectItem value="pedro">Pedro Souza - 12349</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avapex">Avapex Transportes</SelectItem>
                    <SelectItem value="seday">Seday Equipamentos</SelectItem>
                    <SelectItem value="innomach">Innomach</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="setor">Setor</Label>
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operacoes">Operações</SelectItem>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                    <SelectItem value="producao">Produção</SelectItem>
                    <SelectItem value="logistica">Logística</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="ti">TI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <Input type="date" id="data" required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="horaInicio">Hora Início</Label>
                <Input type="time" id="horaInicio" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horaFim">Hora Fim</Label>
                <Input type="time" id="horaFim" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="intervalo">Intervalo (min)</Label>
                <Input
                  type="number"
                  id="intervalo"
                  placeholder="0"
                  min="0"
                  max="120"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Hora Extra</Label>
              <Select required defaultValue="produtiva">
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="produtiva">Produtiva</SelectItem>
                  <SelectItem value="improdutiva">Improdutiva</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Produtiva: trabalho efetivo. Improdutiva: tempo à disposição, espera ou sobreaviso.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo da Hora Extra</Label>
              <Textarea
                id="motivo"
                placeholder="Descreva o motivo da hora extra..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/registros")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            <Save className="h-4 w-4" />
            {isSubmitting ? "Salvando..." : "Salvar Registro"}
          </Button>
        </div>
      </form>
    </div>
  );
}
