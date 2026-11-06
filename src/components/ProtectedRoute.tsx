import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { moduloDaRota } from '@/lib/permissoes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'master' | 'admin' | 'gestor' | 'colaborador';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, isMaster, isAdmin, isGestor, canAccess, profile, canRequest, roles } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const modulo = moduloDaRota(location.pathname);
  if (profile?.ativo === false || (modulo && !canAccess(modulo))) {
    return <div className="p-8 text-center"><h1 className="text-xl font-semibold">Acesso restrito</h1><p className="text-muted-foreground">Seu usuário não tem permissão para esta tela.</p></div>;
  }

  if (!canRequest && ["/registros/novo","/ferias/nova","/vagas/nova","/qp/nova","/ppo/avaliar","/ppo/operacional/nova"].includes(location.pathname)) return <Navigate to="/dashboard" replace />;

  // Check role requirements
  if (requiredRole) {
    const hasAccess = 
      requiredRole === 'master' ? isMaster :
      requiredRole === 'admin' ? isAdmin :
      requiredRole === 'gestor' ? isGestor :
      true;

    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
