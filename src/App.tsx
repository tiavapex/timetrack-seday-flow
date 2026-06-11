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
import ASEList from "@/pages/ASE/ASEList";
import ASEForm from "@/pages/ASE/ASEForm";
import ASEDetalhe from "@/pages/ASE/ASEDetalhe";
import FeriasList from "@/pages/Ferias/FeriasList";
import FeriasForm from "@/pages/Ferias/FeriasForm";
import FeriasDetalhe from "@/pages/Ferias/FeriasDetalhe";
import VagasList from "@/pages/Vagas/VagasList";
import VagasForm from "@/pages/Vagas/VagasForm";
import VagasDetalhe from "@/pages/Vagas/VagasDetalhe";
import AvaliacoesList from "@/pages/Avaliacoes/AvaliacoesList";
import AvaliacoesForm from "@/pages/Avaliacoes/AvaliacoesForm";
import AvaliacoesDetalhe from "@/pages/Avaliacoes/AvaliacoesDetalhe";
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
              <Route path="/ase" element={<ASEList />} />
              <Route path="/ase/nova" element={<ASEForm />} />
              <Route path="/ase/:id" element={<ASEDetalhe />} />
              <Route path="/ferias" element={<FeriasList />} />
              <Route path="/ferias/nova" element={<FeriasForm />} />
              <Route path="/ferias/:id" element={<FeriasDetalhe />} />
              <Route path="/vagas" element={<VagasList />} />
              <Route path="/vagas/nova" element={<VagasForm />} />
              <Route path="/vagas/:id" element={<VagasDetalhe />} />
              <Route path="/avaliacoes" element={<AvaliacoesList />} />
              <Route path="/avaliacoes/nova" element={<AvaliacoesForm />} />
              <Route path="/avaliacoes/:id" element={<AvaliacoesDetalhe />} />
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
