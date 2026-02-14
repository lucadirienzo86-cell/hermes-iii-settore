import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { User, Building2, Phone, Mail, FileText, Save, Shield, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface GestoreData {
  id: string;
  nome: string;
  cognome: string;
  ragione_sociale: string | null;
  partita_iva: string | null;
  telefono: string | null;
}

const ProfiloGestore = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gestore, setGestore] = useState<GestoreData | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    cognome: "",
    ragione_sociale: "",
    partita_iva: "",
    telefono: "",
  });

  useEffect(() => {
    const fetchGestore = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("gestori")
        .select("*")
        .eq("profile_id", user.id)
        .single();

      if (error) {
        console.error("Errore nel recupero dati gestore:", error);
        toast.error("Errore nel caricamento del profilo");
      } else if (data) {
        setGestore(data);
        setFormData({
          nome: data.nome || "",
          cognome: data.cognome || "",
          ragione_sociale: data.ragione_sociale || "",
          partita_iva: data.partita_iva || "",
          telefono: data.telefono || "",
        });
      }
      setLoading(false);
    };

    fetchGestore();
  }, [user]);

  const handleSave = async () => {
    if (!gestore) return;

    setSaving(true);
    const { error } = await supabase
      .from("gestori")
      .update({
        nome: formData.nome,
        cognome: formData.cognome,
        ragione_sociale: formData.ragione_sociale || null,
        partita_iva: formData.partita_iva || null,
        telefono: formData.telefono || null,
      })
      .eq("id", gestore.id);

    if (error) {
      console.error("Errore nel salvataggio:", error);
      toast.error("Errore nel salvataggio del profilo");
    } else {
      toast.success("Profilo aggiornato con successo");
    }
    setSaving(false);
  };

  const getInitials = () => {
    const nome = formData.nome || "";
    const cognome = formData.cognome || "";
    return `${nome.charAt(0)}${cognome.charAt(0)}`.toUpperCase() || "?";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Header con Avatar */}
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-8 border border-primary/20">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24 border-4 border-primary/30 shadow-lg">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      {formData.nome && formData.cognome 
                        ? `${formData.nome} ${formData.cognome}` 
                        : "Il mio Profilo"}
                    </h1>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Professionista
                    </p>
                    {formData.ragione_sociale && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {formData.ragione_sociale}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dati Account */}
              <Card className="shadow-md border-l-4 border-l-primary">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    Dati Account
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground text-sm">Email</Label>
                      <Input 
                        value={profile?.email || ""} 
                        disabled 
                        className="bg-muted/50 mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        L'email non può essere modificata
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dati Personali */}
              <Card className="shadow-md border-l-4 border-l-blue-500">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <User className="h-5 w-5 text-blue-500" />
                    </div>
                    Dati Personali
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Il tuo nome"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cognome">Cognome *</Label>
                      <Input
                        id="cognome"
                        value={formData.cognome}
                        onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                        placeholder="Il tuo cognome"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Telefono</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="telefono"
                          value={formData.telefono}
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                          placeholder="+39 333 1234567"
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dati Aziendali */}
              <Card className="shadow-md border-l-4 border-l-emerald-500">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-emerald-500" />
                    </div>
                    Dati Aziendali
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="ragione_sociale">Ragione Sociale</Label>
                      <Input
                        id="ragione_sociale"
                        value={formData.ragione_sociale}
                        onChange={(e) => setFormData({ ...formData, ragione_sociale: e.target.value })}
                        placeholder="Nome della tua azienda"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partita_iva">Partita IVA</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="partita_iva"
                          value={formData.partita_iva}
                          onChange={(e) => setFormData({ ...formData, partita_iva: e.target.value })}
                          placeholder="12345678901"
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pulsante Salva */}
              <div className="flex justify-end pt-2">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  size="lg"
                  className="px-8"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salva Modifiche
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfiloGestore;
