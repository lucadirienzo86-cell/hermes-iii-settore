import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle2, Building2, Shield } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: "Inserire un indirizzo email valido" }),
  password: z.string().min(6, { message: "La password deve contenere almeno 6 caratteri" }),
});

const resetSchema = z.object({
  email: z.string().email({ message: "Inserire un indirizzo email valido" }),
});

const ComuneAuth = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'login' | 'forgot-password'>('login');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const resetForm = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: '',
    },
  });

  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      // Verify this is a comune/assessorato user
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);

      const roles = rolesData?.map(r => r.role) || [];
      const isInstitutional = roles.includes('comune') || roles.includes('assessorato_terzo_settore');

      if (!isInstitutional) {
        await supabase.auth.signOut();
        toast.error("Accesso non autorizzato. Questa area è riservata al personale del Comune.");
        setIsLoading(false);
        return;
      }

      toast.success('Accesso effettuato con successo');
      navigate('/terzo-settore');
    } catch (error: any) {
      toast.error(error.message || "Credenziali non valide");
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (values: z.infer<typeof resetSchema>) => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/comune/auth`;
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;
      
      setResetEmailSent(true);
      toast.success('Email inviata. Controllare la casella di posta.');
    } catch (error: any) {
      toast.error(error.message || "Errore durante l'invio dell'email");
    } finally {
      setIsLoading(false);
    }
  };

  // View: Forgot Password
  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#003399] via-[#002266] to-[#001a4d] p-4">
        {/* EU Stars decoration */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-yellow-400/30">
          {[...Array(12)].map((_, i) => (
            <span key={i} className="text-xl">★</span>
          ))}
        </div>

        <Card className="w-full max-w-md bg-white/95 backdrop-blur shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            {resetEmailSent ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-[#003399]">Email inviata</h2>
                <CardDescription className="text-gray-600 mt-2">
                  È stato inviato un link per reimpostare la password a <strong>{resetForm.getValues('email')}</strong>. 
                  Controllare la casella di posta elettronica.
                </CardDescription>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-[#003399]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-[#003399]" />
                </div>
                <h2 className="text-xl font-semibold text-[#003399]">Recupero password</h2>
                <CardDescription className="text-gray-600 mt-2">
                  Inserire l'indirizzo email istituzionale per ricevere il link di reset.
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {resetEmailSent ? (
              <Button 
                className="w-full bg-[#003399] hover:bg-[#002266]" 
                onClick={() => {
                  setView('login');
                  setResetEmailSent(false);
                  resetForm.reset();
                }}
              >
                Torna al login
              </Button>
            ) : (
              <>
                <Form {...resetForm}>
                  <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
                    <FormField
                      control={resetForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Email istituzionale</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="nome.cognome@comune.cassino.fr.it" 
                              type="email" 
                              className="border-gray-300 focus:border-[#003399] focus:ring-[#003399]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-[#003399] hover:bg-[#002266]" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Invio in corso...' : 'Invia link di reset'}
                    </Button>
                  </form>
                </Form>
                <button
                  onClick={() => {
                    setView('login');
                    resetForm.reset();
                  }}
                  className="mt-6 flex items-center justify-center gap-2 text-gray-500 hover:text-[#003399] text-sm w-full transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Torna al login
                </button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#003399] via-[#002266] to-[#001a4d] p-4 relative overflow-hidden">
      {/* EU Stars decoration */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 text-yellow-400/20">
        {[...Array(12)].map((_, i) => (
          <span key={i} className="text-lg">★</span>
        ))}
      </div>

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-40 h-40 border border-white rounded-full" />
        <div className="absolute bottom-20 right-20 w-60 h-60 border border-white rounded-full" />
        <div className="absolute top-1/2 left-10 w-20 h-20 border border-white rounded-full" />
      </div>

      {/* Logo Comune */}
      <div className="mb-6 flex flex-col items-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
          <Building2 className="w-10 h-10 text-[#003399]" />
        </div>
        <h1 className="text-white text-2xl font-bold tracking-wide">COMUNE DI CASSINO</h1>
        <p className="text-blue-200 text-sm mt-1">Assessorato al Terzo Settore</p>
      </div>

      <Card className="w-full max-w-md bg-white/95 backdrop-blur shadow-2xl border-0">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-[#003399]" />
            <span className="text-sm font-medium text-[#003399] uppercase tracking-wider">Area Riservata</span>
          </div>
          <CardDescription className="text-gray-600">
            Accesso riservato al personale del Comune di Cassino
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Email istituzionale</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="nome.cognome@comune.cassino.fr.it" 
                        type="email" 
                        className="border-gray-300 focus:border-[#003399] focus:ring-[#003399]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Password</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="••••••••" 
                        type="password" 
                        className="border-gray-300 focus:border-[#003399] focus:ring-[#003399]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-[#003399] hover:bg-[#002266] text-white font-medium py-2.5" 
                disabled={isLoading}
              >
                {isLoading ? 'Accesso in corso...' : 'Accedi'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center">
            <button
              onClick={() => setView('forgot-password')}
              className="text-[#003399] hover:underline text-sm font-medium"
            >
              Password dimenticata?
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center text-blue-200/60 text-xs">
        <p>Piattaforma Istituzionale Terzo Settore</p>
        <p className="mt-1">© {new Date().getFullYear()} Comune di Cassino - Tutti i diritti riservati</p>
      </div>
    </div>
  );
};

export default ComuneAuth;
