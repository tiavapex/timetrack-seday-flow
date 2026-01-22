import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const registros = [
  {
    id: 1,
    colaborador: "João Silva",
    matricula: "12345",
    empresa: "Avapex",
    setor: "Operações",
    data: "22/01/2026",
    horaInicio: "18:00",
    horaFim: "20:30",
    totalHoras: "2h 30min",
    motivo: "Fechamento mensal",
    status: "aprovado",
  },
  {
    id: 2,
    colaborador: "Maria Santos",
    matricula: "12346",
    empresa: "Seday",
    setor: "Administrativo",
    data: "21/01/2026",
    horaInicio: "18:00",
    horaFim: "22:00",
    totalHoras: "4h 00min",
    motivo: "Inventário",
    status: "pendente",
  },
  {
    id: 3,
    colaborador: "Carlos Lima",
    matricula: "12347",
    empresa: "Innomach",
    setor: "Manutenção",
    data: "21/01/2026",
    horaInicio: "17:30",
    horaFim: "19:15",
    totalHoras: "1h 45min",
    motivo: "Manutenção preventiva",
    status: "aprovado",
  },
  {
    id: 4,
    colaborador: "Ana Costa",
    matricula: "12348",
    empresa: "Avapex",
    setor: "Logística",
    data: "20/01/2026",
    horaInicio: "18:00",
    horaFim: "21:15",
    totalHoras: "3h 15min",
    motivo: "Carga urgente",
    status: "rejeitado",
  },
  {
    id: 5,
    colaborador: "Pedro Souza",
    matricula: "12349",
    empresa: "Seday",
    setor: "Produção",
    data: "20/01/2026",
    horaInicio: "18:00",
    horaFim: "20:00",
    totalHoras: "2h 00min",
    motivo: "Demanda extra",
    status: "pendente",
  },
];

const statusColors = {
  aprovado: "bg-success/10 text-success border-success/20",
  pendente: "bg-warning/10 text-warning border-warning/20",
  rejeitado: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels = {
  aprovado: "Aprovado",
  pendente: "Pendente",
  rejeitado: "Rejeitado",
};

export default function Registros() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filteredRegistros = registros.filter((registro) => {
    const matchesSearch =
      registro.colaborador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.matricula.includes(searchTerm);
    const matchesEmpresa =
      empresaFilter === "todas" || registro.empresa === empresaFilter;
    const matchesStatus =
      statusFilter === "todos" || registro.status === statusFilter;
    return matchesSearch && matchesEmpresa && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Registros de Horas Extras
          </h1>
          <p className="text-muted-foreground">
            Gerencie os registros de horas extras dos colaboradores
          </p>
        </div>
        <Button
          onClick={() => navigate("/registros/novo")}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Registro
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold">
              Todos os Registros
            </CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar colaborador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="Avapex">Avapex</SelectItem>
                  <SelectItem value="Seday">Seday</SelectItem>
                  <SelectItem value="Innomach">Innomach</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistros.map((registro) => (
                  <TableRow key={registro.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{registro.colaborador}</p>
                        <p className="text-xs text-muted-foreground">
                          Mat: {registro.matricula}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{registro.empresa}</TableCell>
                    <TableCell>{registro.setor}</TableCell>
                    <TableCell>{registro.data}</TableCell>
                    <TableCell>
                      {registro.horaInicio} - {registro.horaFim}
                    </TableCell>
                    <TableCell className="font-medium">
                      {registro.totalHoras}
                    </TableCell>
                    <TableCell className="max-w-32 truncate">
                      {registro.motivo}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          statusColors[
                            registro.status as keyof typeof statusColors
                          ]
                        }
                      >
                        {
                          statusLabels[
                            registro.status as keyof typeof statusLabels
                          ]
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem>Aprovar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRegistros.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Nenhum registro encontrado
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
