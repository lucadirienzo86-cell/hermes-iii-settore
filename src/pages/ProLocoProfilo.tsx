import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Building2, Save, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProLocoLayout from '@/layouts/ProLocoLayout';

interface ProLocoData {
  id?: string;
  denominazione: string;
  codice_fiscale: string;
  partita_iva: string;
  indirizzo: string;
  comune: string;
  provincia: string;
  regione: string;
  telefono: string;
  email: string;
  pec: string;
  sito_web: string;
  presidente: string;
  data_costituzione: string;
  quota_associativa: number;
  manu_pay_enabled: boolean;
}

const ProLocoProfilo = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [formData, setFormData] = useState<ProLocoData>({
    denominazione: '',
    codice_fiscale: '',
    partita_iva: '',
    indirizzo: '',
    comune: '',
    provincia: '',
    regione: '',
    telefono: '',
    email: '',
    pec: '',
    sito_web: '',
    presidente: '',
    data_costituzione: '',
    quota_associativa: 0,
    manu_pay_enabled: false,
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('pro_loco')
        .select('*')
        .eq('profile_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          id: data.id,
          denominazione: data.denominazione || '',
          codice_fiscale: data.codice_fiscale || '',
          partita_iva: data.partita_iva || '',
          indirizzo: data.indirizzo || '',
          comune: data.comune || '',
          provincia: data.provincia || '',
          regione: data.regione || '',
          telefono: data.telefono || '',
          email: data.email || '',
          pec: data.pec || '',
          sito_web: data.sito_web || '',
          presidente: data.presidente || '',
          data_costituzione: data.data_costituzione || '',
          quota_associativa: data.quota_associativa || 0,
          manu_pay_enabled: data.manu_pay_enabled || false,
        });
      } else {
        setIsNew(true);
      }
    } catch (error) {
      console.error('Errore caricamento profilo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.denominazione) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "La denominazione è obbligatoria.",
      });
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const { error } = await supabase
          .from('pro_loco')
          .insert({
            profile_id: user?.id,
            ...formData,
          });

        if (error) throw error;
        setIsNew(false);
        toast({
          title: "Profilo creato",
          description: "Il profilo della Pro Loco è stato creato con successo.",
        });
      } else {
        const { error } = await supabase
          .from('pro_loco')
          .update(formData)
          .eq('profile_id', user?.id);

        if (error) throw error;
        toast({
          title: "Profilo aggiornato",
          description: "Le modifiche sono state salvate con successo.",
        });
      }

      loadProfile();
    } catch (error) {
      console.error('Errore salvataggio:', error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile salvare le modifiche.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProLocoLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </ProLocoLayout>
    );
  }

  return (
    <ProLocoLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isNew ? 'Registra la tua Pro Loco' : 'Profilo Pro Loco'}
            </h1>
            <p className="text-muted-foreground">
              {isNew 
                ? 'Compila i dati per completare la registrazione'
                : 'Gestisci le informazioni della tua Pro Loco'}
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salva
              </>
            )}
          </Button>
        </div>

        {/* Dati Anagrafici */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dati Anagrafici
            </CardTitle>
            <CardDescription>
              Informazioni identificative della Pro Loco
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="denominazione">Denominazione *</Label>
              <Input
                id="denominazione"
                value={formData.denominazione}
                onChange={(e) => setFormData({ ...formData, denominazione: e.target.value })}
                placeholder="Pro Loco di..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codice_fiscale">Codice Fiscale</Label>
              <Input
                id="codice_fiscale"
                value={formData.codice_fiscale}
                onChange={(e) => setFormData({ ...formData, codice_fiscale: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partita_iva">Partita IVA</Label>
              <Input
                id="partita_iva"
                value={formData.partita_iva}
                onChange={(e) => setFormData({ ...formData, partita_iva: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="presidente">Presidente</Label>
              <Input
                id="presidente"
                value={formData.presidente}
                onChange={(e) => setFormData({ ...formData, presidente: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_costituzione">Data Costituzione</Label>
              <Input
                id="data_costituzione"
                type="date"
                value={formData.data_costituzione}
                onChange={(e) => setFormData({ ...formData, data_costituzione: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sede */}
        <Card>
          <CardHeader>
            <CardTitle>Sede</CardTitle>
            <CardDescription>Indirizzo e localizzazione</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="indirizzo">Indirizzo</Label>
              <Input
                id="indirizzo"
                value={formData.indirizzo}
                onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                placeholder="Via, numero civico"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comune">Comune</Label>
              <Input
                id="comune"
                value={formData.comune}
                onChange={(e) => setFormData({ ...formData, comune: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provincia">Provincia</Label>
              <Input
                id="provincia"
                value={formData.provincia}
                onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regione">Regione</Label>
              <Input
                id="regione"
                value={formData.regione}
                onChange={(e) => setFormData({ ...formData, regione: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contatti */}
        <Card>
          <CardHeader>
            <CardTitle>Contatti</CardTitle>
            <CardDescription>Recapiti e riferimenti online</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pec">PEC</Label>
              <Input
                id="pec"
                type="email"
                value={formData.pec}
                onChange={(e) => setFormData({ ...formData, pec: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Telefono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sito_web">Sito Web</Label>
              <Input
                id="sito_web"
                value={formData.sito_web}
                onChange={(e) => setFormData({ ...formData, sito_web: e.target.value })}
                placeholder="https://"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quote e Pagamenti */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Quote e Pagamenti
            </CardTitle>
            <CardDescription>
              Gestione quota associativa e integrazione Manu Pay
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="quota_associativa">Quota Associativa Annuale (€)</Label>
              <Input
                id="quota_associativa"
                type="number"
                step="0.01"
                min="0"
                value={formData.quota_associativa}
                onChange={(e) => setFormData({ ...formData, quota_associativa: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Abilita Manu Pay</p>
                <p className="text-sm text-muted-foreground">
                  Permetti alle associazioni affiliate di pagare la quota online
                </p>
              </div>
              <Switch
                checked={formData.manu_pay_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, manu_pay_enabled: checked })}
              />
            </div>
            {formData.manu_pay_enabled && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Per completare l'attivazione di Manu Pay, contatta il supporto per configurare 
                  il tuo account di pagamento.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProLocoLayout>
  );
};

export default ProLocoProfilo;
