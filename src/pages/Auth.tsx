import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: "Email non valida" }),
  password: z.string().min(6, { message: "La password deve essere di almeno 6 caratteri" }),
});

const resetSchema = z.object({
  email: z.string().email({ message: "Email non valida" }),
});

const Auth = () => {
  const { signIn, user, profile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'login' | 'forgot-password'>('login');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'azienda') {
        navigate('/app/auth');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, profile, navigate]);

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
    const { error } = await signIn(values.email, values.password);
    setIsLoading(false);
    if (!error) {
      navigate('/dashboard');
    }
  };

  const onResetPassword = async (values: z.infer<typeof resetSchema>) => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;
      
      setResetEmailSent(true);
      toast.success('Email inviata! Controlla la tua casella di posta');
    } catch (error: any) {
      toast.error(error.message || "Errore durante l'invio dell'email");
    } finally {
      setIsLoading(false);
    }
  };

  // View: Forgot Password
  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {resetEmailSent ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Email inviata!</CardTitle>
                <CardDescription>
                  Abbiamo inviato un link per reimpostare la password a <strong>{resetForm.getValues('email')}</strong>. 
                  Controlla la tua casella di posta (anche lo spam).
                </CardDescription>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Password dimenticata?</CardTitle>
                <CardDescription>
                  Inserisci la tua email e ti invieremo un link per reimpostare la password.
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {resetEmailSent ? (
              <Button 
                className="w-full" 
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="email@esempio.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Invio in corso...' : 'Invia link di reset'}
                    </Button>
                  </form>
                </Form>
                <button
                  onClick={() => {
                    setView('login');
                    resetForm.reset();
                  }}
                  className="mt-6 flex items-center justify-center gap-2 text-muted-foreground hover:text-primary text-sm w-full transition-colors"
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Accedi a Sonyc</CardTitle>
          <CardDescription>Inserisci le tue credenziali per accedere</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@esempio.com" type="email" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Accesso in corso...' : 'Accedi'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center">
            <button
              onClick={() => setView('forgot-password')}
              className="text-primary hover:underline text-sm font-medium"
            >
              Password dimenticata?
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
