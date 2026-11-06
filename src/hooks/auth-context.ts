import { createContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Modulo, Permissoes } from '@/lib/permissoes';

export type UserRole =
  | 'master'
  | 'admin'
  | 'gestor'
  | 'colaborador'
  | 'dp'
  | 'lider'
  | 'supervisor'
  | 'coordenador'
  | 'encarregado'
  | 'rh'
  | 'sesmt'
  | 'sgi'
  | 'juridico'
  | 'diretoria';

export interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  empresa: string | null;
  setor: string | null;
  matricula: string | null;
  ativo: boolean;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  isLoading: boolean;
  isMaster: boolean;
  isAdmin: boolean;
  isGestor: boolean;
  isRh: boolean;
  isSesmt: boolean;
  isSgi: boolean;
  isDiretoria: boolean;
  isLideranca: boolean;
  isAuditor: boolean;
  podeAdminPPO: boolean;
  permissoes: Permissoes;
  canAccess: (modulo: Modulo) => boolean;
  canRequest: boolean;
  isDP: boolean;
  refreshAccess: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
