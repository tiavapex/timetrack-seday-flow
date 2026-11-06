import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Modulo, Permissoes, podeAcessar, podeSolicitar } from '@/lib/permissoes';

type UserRole =
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

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  empresa: string | null;
  setor: string | null;
  matricula: string | null;
  ativo: boolean;
}

interface AuthContextType {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissoes, setPermissoes] = useState<Permissoes>({});

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile - using type assertion since types might not be synced yet
      const { data: profileData } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch roles
      const { data: rolesData } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const { data: access } = await supabase.from('user_module_permissions').select('module,enabled').eq('user_id', userId);
      setPermissoes(Object.fromEntries((access || []).map(p => [p.module, p.enabled])));
      if (rolesData) {
        setRoles(rolesData.map((r: any) => r.role as UserRole));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer Supabase calls with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            void fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setPermissoes({});
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        void fetchUserData(session.user.id);
      } else { setIsLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const refresh = () => { void fetchUserData(user.id); };
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => { window.removeEventListener('focus', refresh); window.clearInterval(timer); };
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { nome }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const has = (...r: UserRole[]) => r.some((x) => roles.includes(x));

  const isMaster = has('master');
  const isAdmin = has('master', 'admin');
  const isGestor = has('master', 'admin', 'gestor');
  const isRh = has('master', 'admin', 'rh', 'dp');
  const isSesmt = has('master', 'admin', 'sesmt');
  const isSgi = has('master', 'admin', 'sgi');
  const isDiretoria = has('master', 'admin', 'diretoria');
  const isLideranca = has('master', 'admin', 'gestor', 'coordenador', 'supervisor', 'encarregado', 'lider');
  const isAuditor = has('master', 'admin', 'sgi', 'diretoria', 'juridico');
  const podeAdminPPO = has('master', 'admin', 'rh', 'dp', 'diretoria');

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      roles,
      isLoading,
      isMaster,
      isAdmin,
      isGestor,
      isRh,
      isSesmt,
      isSgi,
      isDiretoria,
      isLideranca,
      isAuditor,
      podeAdminPPO,
      permissoes,
      canAccess: (modulo) => profile?.ativo !== false && podeAcessar(roles, permissoes, modulo),
      canRequest: podeSolicitar(roles),
      isDP: has('master', 'admin', 'dp'),
      refreshAccess: async () => { if (user) await fetchUserData(user.id); },
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
