import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppInput } from '@/components/app/AppInput';
import { AppButton } from '@/components/app/AppButton';
import { PWAInstallBanner } from '@/components/app/PWAInstallBanner';
import { toast } from 'sonner';
import { LogOut, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const AppAuth = () => {
  const [view, setView] = useState<'welcome' | 'login' | 'register' | 'forgot-password'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ragioneSociale, setRagioneSociale] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const { signIn, signUp, user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && profile) {
      if (profile.role !== 'azienda') {
        toast.error('Utilizza la piattaforma web per accedere con questo account');
        navigate('/auth');
      } else {
        navigate('/app/dashboard');
      }
    }
  }, [user, profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      navigate('/app/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Errore durante l\'autenticazione');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Le password non coincidono');
      return;
    }

    if (password.length < 6) {
      toast.error('La password deve essere di almeno 6 caratteri');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password, 'azienda', {
        ragioneSociale: ragioneSociale || undefined
      });
      if (error) throw error;
      toast.success('Registrazione completata! Benvenuto in Sonyc');
      navigate('/app/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Inserisci la tua email');
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/app/auth`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;
      
      setResetEmailSent(true);
      toast.success('Email inviata! Controlla la tua casella di posta');
    } catch (error: any) {
      toast.error(error.message || 'Errore durante l\'invio dell\'email');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Disconnesso con successo');
  };

  if (view === 'welcome') {
    return (
      <div className="min-h-screen bg-primary flex flex-col">
        {/* Header */}
        <div className="bg-primary px-4 py-6 flex justify-center">
          <span className="text-3xl font-bold text-primary-foreground">Sonyc</span>
        </div>

        {/* Contenuto centrale */}
        <div className="flex-1 flex items-center justify-center px-4 bg-background">
          <div className="w-full max-w-md">
            {/* PWA Install Banner */}
            <div className="mb-4">
              <PWAInstallBanner />
            </div>
            <div className="bg-card border-2 border-primary rounded-3xl p-8 shadow-lg">
              <h1 className="text-3xl font-bold text-primary text-center mb-6">
                Benvenuto in Sonyc!
              </h1>

              <div className="h-1 bg-primary mb-8 rounded-full"></div>

              <div className="space-y-4">
                <button
                  onClick={() => setView('login')}
                  className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:bg-primary/90 transition-colors shadow-md"
                >
                  Accedi
                </button>
                <button
                  onClick={() => setView('register')}
                  className="w-full bg-secondary text-secondary-foreground font-bold py-4 rounded-xl hover:bg-secondary/90 transition-colors shadow-md"
                >
                  Registra la tua Azienda
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Questa app è riservata alle aziende.
                <br />
                Sei un docente o consulente?{' '}
                <a href="/#docenti" className="text-primary hover:underline">
                  Visita il sito web
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-6 text-center bg-background">
          <div className="flex items-center justify-center gap-4">
            <div className="h-px bg-primary flex-1 max-w-[100px]"></div>
            <p className="text-muted-foreground text-sm">Sonyc © v.1.0.0</p>
            <div className="h-px bg-primary flex-1 max-w-[100px]"></div>
          </div>
        </div>
      </div>
    );
  }

  // View: Register
  if (view === 'register') {
    return (
      <div className="min-h-screen bg-primary flex flex-col">
        {/* Header */}
        <div className="bg-primary px-4 py-6 flex justify-center">
          <span className="text-3xl font-bold text-primary-foreground">Sonyc</span>
        </div>

        {/* Contenuto centrale */}
        <div className="flex-1 flex items-center justify-center px-4 bg-background">
          <div className="w-full max-w-md">
            {/* PWA Install Banner */}
            <div className="mb-4">
              <PWAInstallBanner />
            </div>
            <div className="bg-card border-2 border-primary rounded-3xl p-8 shadow-lg">
              <h1 className="text-3xl font-bold text-primary text-center mb-2">
                Registra la tua Azienda
              </h1>
              <p className="text-center text-muted-foreground text-sm mb-6">
                Crea un account gratuito per iniziare
              </p>

              <form onSubmit={handleRegister} className="space-y-4">
                <AppInput
                  label="Ragione Sociale (opzionale)"
                  type="text"
                  value={ragioneSociale}
                  onChange={(e) => setRagioneSociale(e.target.value)}
                  placeholder="Es. Mario Rossi SRL"
                />

                <AppInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <AppInput
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <AppInput
                  label="Conferma Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <AppButton
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Registrazione...' : 'Registrati'}
                </AppButton>
              </form>

              <div className="mt-6 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Hai già un account?{' '}
                  <button
                    onClick={() => setView('login')}
                    className="text-primary hover:underline font-medium"
                  >
                    Accedi
                  </button>
                </p>
                <button
                  onClick={() => setView('welcome')}
                  className="text-muted-foreground hover:underline text-sm"
                >
                  ← Torna indietro
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-6 text-center bg-background">
          <p className="text-muted-foreground text-sm">Sonyc © v.1.0.0</p>
        </div>
      </div>
    );
  }

  // View: Forgot Password
  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen bg-primary flex flex-col">
        {/* Header */}
        <div className="bg-primary px-4 py-6 flex justify-center">
          <span className="text-3xl font-bold text-primary-foreground">Sonyc</span>
        </div>

        {/* Contenuto centrale */}
        <div className="flex-1 flex items-center justify-center px-4 bg-background">
          <div className="w-full max-w-md">
            <div className="bg-card border-2 border-primary rounded-3xl p-8 shadow-lg">
              {resetEmailSent ? (
                // Conferma email inviata
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-primary mb-3">
                    Email inviata!
                  </h1>
                  <p className="text-muted-foreground mb-6">
                    Abbiamo inviato un link per reimpostare la password a <strong>{email}</strong>. 
                    Controlla la tua casella di posta (anche lo spam).
                  </p>
                  <AppButton
                    onClick={() => {
                      setView('login');
                      setResetEmailSent(false);
                      setEmail('');
                    }}
                    className="w-full"
                  >
                    Torna al login
                  </AppButton>
                </div>
              ) : (
                // Form reset password
                <>
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-primary text-center mb-2">
                    Password dimenticata?
                  </h1>
                  <p className="text-center text-muted-foreground text-sm mb-6">
                    Inserisci la tua email e ti invieremo un link per reimpostare la password.
                  </p>

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <AppInput
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="La tua email di registrazione"
                      required
                    />

                    <AppButton
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? 'Invio in corso...' : 'Invia link di reset'}
                    </AppButton>
                  </form>

                  <button
                    onClick={() => {
                      setView('login');
                      setEmail('');
                    }}
                    className="mt-6 flex items-center justify-center gap-2 text-muted-foreground hover:text-primary text-sm w-full transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Torna al login
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-6 text-center bg-background">
          <p className="text-muted-foreground text-sm">Sonyc © v.1.0.0</p>
        </div>
      </div>
    );
  }

  // View: Login
  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* Header */}
      <div className="bg-primary px-4 py-6 relative flex justify-center">
        <span className="text-3xl font-bold text-primary-foreground">Sonyc</span>
        {user && (
          <button
            onClick={handleLogout}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-primary-foreground hover:bg-primary-foreground/20 rounded-full transition"
            title="Disconnetti"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Contenuto centrale */}
      <div className="flex-1 flex items-center justify-center px-4 bg-background">
        <div className="w-full max-w-md">
          {/* PWA Install Banner */}
          <div className="mb-4">
            <PWAInstallBanner />
          </div>
          <div className="bg-card border-2 border-primary rounded-3xl p-8 shadow-lg">
            <h1 className="text-3xl font-bold text-primary text-center mb-8">
              Accedi
            </h1>

            <form onSubmit={handleLogin} className="space-y-4">
              <AppInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <AppInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <AppButton
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Caricamento...' : 'Accedi'}
              </AppButton>
            </form>

            <div className="mt-6 text-center space-y-2">
              <button
                onClick={() => setView('forgot-password')}
                className="text-primary hover:underline text-sm font-medium"
              >
                Password dimenticata?
              </button>
              <p className="text-sm text-muted-foreground">
                Non hai un account?{' '}
                <button
                  onClick={() => setView('register')}
                  className="text-primary hover:underline font-medium"
                >
                  Registrati
                </button>
              </p>
              <button
                onClick={() => setView('welcome')}
                className="text-muted-foreground hover:underline text-sm"
              >
                ← Torna indietro
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center bg-background">
        <p className="text-muted-foreground text-sm">Sonyc © v.1.0.0</p>
      </div>
    </div>
  );
};

export default AppAuth;