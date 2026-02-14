import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield, Mail, Lock, ArrowRight } from 'lucide-react';
import comuneCassinoLogo from '@/assets/comune-cassino-logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Update ultimo_accesso
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ ultimo_accesso: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      toast({
        title: "Accesso effettuato",
        description: "Benvenuto nell'area istituzionale",
      });

      // Redirect to institutional dashboard
      navigate('/istituzionale');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Errore di accesso",
        description: error.message || "Credenziali non valide",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-start pt-12 p-4">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0D5EAF] via-[#1565C0] to-[#1976D2]" />
      
      {/* Decorative diagonal lines */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top right diagonal lines */}
        <div className="absolute -top-20 -right-20 w-[600px] h-[600px] opacity-20">
          <div className="absolute top-0 right-0 w-full h-[3px] bg-white/30 rotate-[-35deg] origin-right" style={{ transform: 'rotate(-35deg) translateY(0px)' }} />
          <div className="absolute top-0 right-0 w-full h-[3px] bg-white/30 rotate-[-35deg] origin-right" style={{ transform: 'rotate(-35deg) translateY(40px)' }} />
          <div className="absolute top-0 right-0 w-full h-[3px] bg-white/30 rotate-[-35deg] origin-right" style={{ transform: 'rotate(-35deg) translateY(80px)' }} />
          <div className="absolute top-0 right-0 w-full h-[3px] bg-white/30 rotate-[-35deg] origin-right" style={{ transform: 'rotate(-35deg) translateY(120px)' }} />
        </div>
        {/* Bottom left diagonal lines */}
        <div className="absolute -bottom-20 -left-20 w-[600px] h-[600px] opacity-20">
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/30" style={{ transform: 'rotate(-35deg) translateY(0px)' }} />
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/30" style={{ transform: 'rotate(-35deg) translateY(-40px)' }} />
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/30" style={{ transform: 'rotate(-35deg) translateY(-80px)' }} />
        </div>
        {/* Decorative star bottom right */}
        <div className="absolute bottom-8 right-12 w-6 h-6 text-[#FFD700] opacity-60">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      </div>

      {/* Header with Logo */}
      <div className="relative z-10 flex items-center gap-4 mb-10">
        <img 
          src={comuneCassinoLogo} 
          alt="Stemma Comune di Cassino" 
          className="w-20 h-20 object-contain drop-shadow-lg"
        />
        <h1 className="text-white text-3xl md:text-4xl font-semibold tracking-wide">
          Comune di Cassino
        </h1>
      </div>

      {/* Login Card */}
      <Card className="relative z-10 w-full max-w-md shadow-2xl border-0 bg-white/98 backdrop-blur-sm rounded-xl">
        <CardHeader className="text-center pb-2 pt-8">
          <CardTitle className="text-xl font-semibold text-[#1a1a2e]">
            Accesso Area Istituzionale
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Comune di Cassino – Terzo Settore
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium text-[#0D5EAF] ml-1">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nome.cognome@comune.cassino.fr.it"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 pl-11 border-muted-foreground/30 focus:border-[#0D5EAF] rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium text-[#0D5EAF] ml-1">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pl-11 border-muted-foreground/30 focus:border-[#0D5EAF] rounded-lg"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#0D5EAF] hover:bg-[#0A4D8F] text-white font-medium shadow-md rounded-full text-base mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accesso in corso...
                </>
              ) : (
                <>
                  Accedi
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5" />
              <span>Accesso riservato al personale autorizzato del Comune di Cassino</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
