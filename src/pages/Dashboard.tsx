import { Clock, Users, TrendingUp, AlertTriangle, Plus } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
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
import { useNavigate } from "react-router-dom";

const recentRecords = [
  {
    id: 1,
    colaborador: "João Silva",
    empresa: "Avapex",
    data: "22/01/2026",
    horas: "2h 30min",
    status: "aprovado",
  },
  {
    id: 2,
    colaborador: "Maria Santos",
    empresa: "Seday",
    data: "21/01/2026",
    horas: "4h 00min",
    status: "pendente",
  },
  {
    id: 3,
    colaborador: "Carlos Lima",
    empresa: "Innomach",
    data: "21/01/2026",
    horas: "1h 45min",
    status: "aprovado",
  },
  {
    id: 4,
    colaborador: "Ana Costa",
    empresa: "Avapex",
    data: "20/01/2026",
    horas: "3h 15min",
    status: "rejeitado",
  },
  {
    id: 5,
    colaborador: "Pedro Souza",
    empresa: "Seday",
    data: "20/01/2026",
    horas: "2h 00min",
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

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Visão geral das horas extras do grupo
          </p>
        </div>
        <Button
          onClick={() => navigate("/registros/novo")}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Registrar Horas
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Horas Extras"
          value="248h"
          description="Este mês"
          icon={Clock}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Colaboradores Ativos"
          value="156"
          description="Com registros no mês"
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Custo Estimado"
          value="R$ 45.280"
          description="Este mês"
          icon={TrendingUp}
          trend={{ value: 8, isPositive: false }}
        />
        <StatCard
          title="Pendentes"
          value="23"
          description="Aguardando aprovação"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Registros Recentes
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/registros")}
            >
              Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.colaborador}
                    </TableCell>
                    <TableCell>{record.empresa}</TableCell>
                    <TableCell>{record.data}</TableCell>
                    <TableCell>{record.horas}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          statusColors[
                            record.status as keyof typeof statusColors
                          ]
                        }
                      >
                        {
                          statusLabels[
                            record.status as keyof typeof statusLabels
                          ]
                        }
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Por Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-accent" />
                  <span className="text-sm font-medium">Avapex</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">98h</p>
                  <p className="text-xs text-muted-foreground">39%</p>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[39%] rounded-full bg-accent" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm font-medium">Seday</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">82h</p>
                  <p className="text-xs text-muted-foreground">33%</p>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[33%] rounded-full bg-primary" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-destructive" />
                  <span className="text-sm font-medium">Innomach</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">68h</p>
                  <p className="text-xs text-muted-foreground">28%</p>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[28%] rounded-full bg-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
