import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, ArrowLeft, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ProLocoAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    denominazione: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      // Verifica che sia una Pro Loco
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);

      const hasProLocoRole = roleData?.some(r => r.role === ('pro_loco' as any));

      if (!hasProLocoRole) {
        await supabase.auth.signOut();
        throw new Error('Questo account non è registrato come Pro Loco');
      }

      toast({
        title: "Accesso effettuato",
        description: "Benvenuto!",
      });

      navigate('/proloco/dashboard');
    } catch (error: any) {
      console.error('Errore login:', error);
      toast({
        variant: "destructive",
        title: "Errore di accesso",
        description: error.message || "Credenziali non valide",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Le password non coincidono",
      });
      return;
    }

    if (registerData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "La password deve essere di almeno 6 caratteri",
      });
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/proloco/dashboard`;

      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            role: 'pro_loco',
            denominazione: registerData.denominazione,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Crea il record Pro Loco
        const { error: proLocoError } = await supabase
          .from('pro_loco')
          .insert({
            profile_id: data.user.id,
            denominazione: registerData.denominazione || 'Pro Loco',
            email: registerData.email,
          });

        if (proLocoError) {
          console.error('Errore creazione Pro Loco:', proLocoError);
        }
      }

      toast({
        title: "Registrazione completata",
        description: "Controlla la tua email per confermare l'account.",
      });

      setActiveTab('login');
    } catch (error: any) {
      console.error('Errore registrazione:', error);
      toast({
        variant: "destructive",
        title: "Errore di registrazione",
        description: error.message || "Si è verificato un errore",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] flex flex-col items-center justify-center px-4 py-12">
      {/* Back Button */}
      <div className="w-full max-w-md mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[#5a6c7d] hover:text-[#2c3e50] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna alla home
        </Link>
      </div>

      {/* Logo */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-xl bg-[#2c3e50] flex items-center justify-center shadow-lg">
          <Users className="h-8 w-8 text-white" />
        </div>
      </div>

      <Card className="w-full max-w-md border-[#e1e8ed] shadow-md">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl text-[#2c3e50]">Accesso Pro Loco</CardTitle>
          <CardDescription className="text-[#5a6c7d]">
            Accedi o registra la tua Pro Loco
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login" className="gap-2">
                <LogIn className="h-4 w-4" />
                Accedi
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Registrati
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-[#2c3e50]">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="email@proloco.it"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    className="border-[#d1d9e0] focus:border-[#3498db]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-[#2c3e50]">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    className="border-[#d1d9e0] focus:border-[#3498db]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#2c3e50] hover:bg-[#1a252f]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Accesso in corso...
                    </>
                  ) : (
                    'Accedi'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-denominazione" className="text-[#2c3e50]">Denominazione Pro Loco *</Label>
                  <Input
                    id="reg-denominazione"
                    placeholder="Pro Loco di..."
                    value={registerData.denominazione}
                    onChange={(e) => setRegisterData({ ...registerData, denominazione: e.target.value })}
                    required
                    className="border-[#d1d9e0] focus:border-[#3498db]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-[#2c3e50]">Email *</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="email@proloco.it"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                    className="border-[#d1d9e0] focus:border-[#3498db]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-[#2c3e50]">Password *</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                    className="border-[#d1d9e0] focus:border-[#3498db]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm" className="text-[#2c3e50]">Conferma Password *</Label>
                  <Input
                    id="reg-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    required
                    className="border-[#d1d9e0] focus:border-[#3498db]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#2c3e50] hover:bg-[#1a252f]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrazione in corso...
                    </>
                  ) : (
                    'Registrati'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-[#7f8c9a] mt-6">
        Portale riservato alle Pro Loco del territorio
      </p>
    </div>
  );
};

export default ProLocoAuth;
