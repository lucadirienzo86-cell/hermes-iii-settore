import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Briefcase } from "lucide-react";

const PartnerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verify user has partner role
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      const roles = rolesData?.map((r) => r.role) || [];
      
      if (!roles.includes("partner" as any)) {
        await supabase.auth.signOut();
        throw new Error("Accesso non autorizzato. Questo portale è riservato ai Partner convenzionati.");
      }

      toast({
        title: "Accesso effettuato",
        description: "Benvenuto nel portale Partner!",
      });

      navigate("/partner/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore di accesso",
        description: error.message || "Credenziali non valide",
      });
    } finally {
      setIsLoading(false);
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
          <Briefcase className="h-8 w-8 text-white" />
        </div>
      </div>

      <Card className="w-full max-w-md border-[#e1e8ed] shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-[#2c3e50]">Accesso Partner</CardTitle>
          <CardDescription className="text-[#5a6c7d]">
            Inserisci le tue credenziali per accedere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#2c3e50]">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@partner.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-[#d1d9e0] focus:border-[#3498db]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#2c3e50]">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-[#d1d9e0] focus:border-[#3498db]"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#2c3e50] hover:bg-[#1a252f]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accesso in corso...
                </>
              ) : (
                "Accedi"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-[#7f8c9a] mt-6">
        Portale riservato ai Partner convenzionati
      </p>
    </div>
  );
};

export default PartnerLogin;
