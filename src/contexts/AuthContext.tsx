import { createContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'admin' | 'editore' | 'gestore' | 'docente' | 'azienda' | 'gestore_pratiche' | 'comune' | 'assessorato_terzo_settore' | 'associazione' | 'pro_loco';

interface Profile {
  id: string;
  email: string;
  role?: UserRole;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, role: UserRole, additionalData: any) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile loading with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            loadUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('[AuthContext] Loading profile for user:', userId);
      
      // Load profile with maybeSingle to handle missing profiles gracefully
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      
      // If no profile exists, create a minimal one
      if (!profileData) {
        console.warn('[AuthContext] No profile found for user, using fallback');
        setProfile({
          id: userId,
          email: '',
          role: 'gestore'
        });
        setLoading(false);
        return;
      }
      
      console.log('[AuthContext] Profile loaded:', profileData);

      // Load ALL roles from user_roles table
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) throw rolesError;
      console.log('[AuthContext] Roles loaded:', rolesData);

      // Determine primary role with priority
      let primaryRole: UserRole = 'gestore'; // default
      
      if (rolesData && rolesData.length > 0) {
        const roles = rolesData.map(r => r.role);
        
        // Priority: admin first for institutional users, then specific roles
        if (roles.includes('admin')) primaryRole = 'admin';
        else if (roles.includes('azienda')) primaryRole = 'azienda';
        else if (roles.includes('comune')) primaryRole = 'comune';
        else if (roles.includes('assessorato_terzo_settore')) primaryRole = 'assessorato_terzo_settore';
        else if (roles.includes('editore')) primaryRole = 'editore';
        else if (roles.includes('pro_loco')) primaryRole = 'pro_loco';
        else if (roles.includes('associazione')) primaryRole = 'associazione';
        else if (roles.includes('gestore')) primaryRole = 'gestore';
        else if (roles.includes('gestore_pratiche')) primaryRole = 'gestore_pratiche';
        else if (roles.includes('docente')) primaryRole = 'docente';
      }

      console.log('[AuthContext] Primary role determined:', primaryRole);

      setProfile({
        ...profileData,
        role: primaryRole
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      // Set fallback profile to prevent infinite loading
      setProfile({
        id: userId,
        email: '',
        role: 'gestore'
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Attempting sign in for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      console.log('[AuthContext] Sign in successful, user:', data.user?.id);

      // Carica il profilo per determinare il ruolo
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);

      // Determina il ruolo primario
      let primaryRole: UserRole = 'gestore';
      if (rolesData && rolesData.length > 0) {
        const roles = rolesData.map(r => r.role);
        if (roles.includes('azienda')) primaryRole = 'azienda';
        else if (roles.includes('pro_loco' as any)) primaryRole = 'pro_loco';
        else if (roles.includes('admin')) primaryRole = 'admin';
        else if (roles.includes('editore')) primaryRole = 'editore';
        else if (roles.includes('comune')) primaryRole = 'comune';
        else if (roles.includes('assessorato_terzo_settore')) primaryRole = 'assessorato_terzo_settore';
        else if (roles.includes('gestore')) primaryRole = 'gestore';
        else if (roles.includes('gestore_pratiche')) primaryRole = 'gestore_pratiche';
        else if (roles.includes('docente')) primaryRole = 'docente';
        else if (roles.includes('associazione')) primaryRole = 'associazione';
      }

      toast({
        title: "Accesso effettuato",
        description: "Benvenuto!",
      });

      // Redirect in base al ruolo - DIRECT to dashboard, no intermediate redirects
      if (primaryRole === 'azienda') {
        navigate('/app/dashboard');
      } else if (primaryRole === 'pro_loco') {
        navigate('/proloco/dashboard');
      } else if (primaryRole === 'associazione') {
        navigate('/associazione/dashboard');
      } else if (primaryRole === 'comune' || primaryRole === 'assessorato_terzo_settore') {
        navigate('/istituzionale/dashboard');
      } else if (primaryRole === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }

      return { error: null };
    } catch (error: any) {
      console.error('[AuthContext] Sign in error:', error);
      toast({
        variant: "destructive",
        title: "Errore di accesso",
        description: error.message || "Credenziali non valide",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, role: UserRole, additionalData: any) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            role: role,
            nome: additionalData.nome,
            telefono: additionalData.telefono
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create role-specific profile
        if (role === 'azienda') {
          // Per le aziende, crea un record con email obbligatoria
          const { error: aziendaError } = await supabase
            .from('aziende')
            .insert({
              profile_id: data.user.id,
              email: email,
              ragione_sociale: additionalData.nome || 'Da completare',
              partita_iva: 'DA_COMPLETARE'
            });

          if (aziendaError) {
            console.error('Errore creazione azienda:', aziendaError);
            // Non bloccare la registrazione se fallisce la creazione azienda
          }
        } else {
          const { error: gestoreError } = await supabase
            .from('gestori')
            .insert({
              profile_id: data.user.id,
              nome: additionalData.nome,
              cognome: additionalData.cognome,
              telefono: additionalData.telefono,
              partita_iva: additionalData.partitaIva,
              ragione_sociale: additionalData.ragioneSociale,
            });

          if (gestoreError) throw gestoreError;
        }

        toast({
          title: "Registrazione completata",
          description: role === 'azienda' 
            ? "Account creato! Puoi accedere con la password di default." 
            : "Il tuo account è stato creato con successo",
        });

        // Per le aziende non fare redirect automatico
        if (role !== 'azienda') {
          navigate('/dashboard');
        }
      }

      return { error: null };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore di registrazione",
        description: error.message || "Si è verificato un errore durante la registrazione",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      navigate('/');
      toast({
        title: "Disconnesso",
        description: "A presto!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
