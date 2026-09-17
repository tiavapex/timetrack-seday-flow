import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Registros from "@/pages/Registros";
import NovoRegistro from "@/pages/NovoRegistro";
import Colaboradores from "@/pages/Colaboradores";
import ImportarColaboradores from "@/pages/Colaboradores/ImportarColaboradores";
import DepartamentoPessoal from "@/pages/DepartamentoPessoal";
import FeriasList from "@/pages/Ferias/FeriasList";
import FeriasForm from "@/pages/Ferias/FeriasForm";
import FeriasDetalhe from "@/pages/Ferias/FeriasDetalhe";
import VagasList from "@/pages/Vagas/VagasList";
import VagasForm from "@/pages/Vagas/VagasForm";
import VagasDetalhe from "@/pages/Vagas/VagasDetalhe";
import PPOList from "@/pages/PPO/operacional/PPOList";
import PPOForm from "@/pages/PPO/operacional/PPOForm";
import PPODetalhe from "@/pages/PPO/operacional/PPODetalhe";
import PPOHome from "@/pages/PPO/PPOHome";
import PPOCiclos from "@/pages/PPO/Ciclos";
import PPOIndicadores from "@/pages/PPO/Indicadores";
import PPOSla from "@/pages/PPO/SLA";
import PPOAvaliacoes from "@/pages/PPO/Avaliacoes";
import PPOApuracao from "@/pages/PPO/Apuracao";
import PPOOcorrencias from "@/pages/PPO/Ocorrencias";
import PPOFeedback from "@/pages/PPO/Feedback";
import PPOTermo from "@/pages/PPO/Termo";
import PPOContestacoes from "@/pages/PPO/Contestacoes";
import PPOMeuResultado from "@/pages/PPO/MeuResultado";
import PPOGovernanca from "@/pages/PPO/Governanca";
import PPOAuditoria from "@/pages/PPO/Auditoria";
import QPList from "@/pages/QP/QPList";
import QPForm from "@/pages/QP/QPForm";
import QPDetalhe from "@/pages/QP/QPDetalhe";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/registros" element={<Registros />} />
              <Route path="/registros/novo" element={<NovoRegistro />} />
              <Route path="/colaboradores" element={<Colaboradores />} />
              <Route path="/colaboradores/importar" element={<ImportarColaboradores />} />
              <Route path="/departamento-pessoal" element={<DepartamentoPessoal />} />
              <Route path="/ferias" element={<FeriasList />} />
              <Route path="/ferias/nova" element={<FeriasForm />} />
              <Route path="/ferias/:id" element={<FeriasDetalhe />} />
              <Route path="/vagas" element={<VagasList />} />
              <Route path="/vagas/nova" element={<VagasForm />} />
              <Route path="/vagas/:id" element={<VagasDetalhe />} />
              <Route path="/ppo" element={<PPOHome />} />
              <Route path="/ppo/ciclos" element={<PPOCiclos />} />
              <Route path="/ppo/indicadores" element={<PPOIndicadores />} />
              <Route path="/ppo/sla" element={<PPOSla />} />
              <Route path="/ppo/avaliacoes" element={<PPOAvaliacoes />} />
              <Route path="/ppo/avaliacoes/:id" element={<PPOApuracao />} />
              <Route path="/ppo/ocorrencias" element={<PPOOcorrencias />} />
              <Route path="/ppo/feedback/:avaliacaoId" element={<PPOFeedback />} />
              <Route path="/ppo/termo" element={<PPOTermo />} />
              <Route path="/ppo/contestacoes" element={<PPOContestacoes />} />
              <Route path="/ppo/meu-resultado" element={<PPOMeuResultado />} />
              <Route path="/ppo/governanca" element={<PPOGovernanca />} />
              <Route path="/ppo/auditoria" element={<PPOAuditoria />} />
              <Route path="/ppo/operacional" element={<PPOList />} />
              <Route path="/ppo/operacional/nova" element={<PPOForm />} />
              <Route path="/ppo/operacional/:id" element={<PPODetalhe />} />
              <Route path="/qp" element={<QPList />} />
              <Route path="/qp/nova" element={<QPForm />} />
              <Route path="/qp/:id" element={<QPDetalhe />} />
              <Route path="/relatorios" element={<Dashboard />} />
              <Route path="/configuracoes" element={<Dashboard />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
