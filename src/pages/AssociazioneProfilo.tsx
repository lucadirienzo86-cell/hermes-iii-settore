import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAssociazione, useUpdateAssociazione, useProLocoInfo } from '@/hooks/useAssociazione';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  ArrowLeft, 
  Save,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

const TIPOLOGIE = ['APS', 'ETS', 'ODV', 'Cooperativa', 'Altro'];

const AssociazioneProfilo = () => {
  const { signOut } = useAuth();
  const { data: associazione, isLoading } = useAssociazione();
  const { data: proLoco } = useProLocoInfo(associazione?.pro_loco_id || null);
  const updateAssociazione = useUpdateAssociazione();
  
  const [formData, setFormData] = useState({
    denominazione: '',
    tipologia: 'Altro',
    codice_fiscale: '',
    partita_iva: '',
    email: '',
    pec: '',
    telefono: '',
    indirizzo: '',
    comune: '',
    descrizione: '',
    stato_runts: 'dichiarato',
    iscrizione_albo_comunale: false,
  });

  useEffect(() => {
    if (associazione) {
      setFormData({
        denominazione: associazione.denominazione || '',
        tipologia: associazione.tipologia || 'Altro',
        codice_fiscale: associazione.codice_fiscale || '',
        partita_iva: associazione.partita_iva || '',
        email: associazione.email || '',
        pec: associazione.pec || '',
        telefono: associazione.telefono || '',
        indirizzo: associazione.indirizzo || '',
        comune: associazione.comune || '',
        descrizione: associazione.descrizione || '',
        stato_runts: associazione.stato_runts || 'dichiarato',
        iscrizione_albo_comunale: associazione.iscrizione_albo_comunale || false,
      });
    }
  }, [associazione]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!associazione?.id) return;
    
    await updateAssociazione.mutateAsync({
      id: associazione.id,
      ...formData,
    });
  };

  const getStatoRegistrazioneBadge = () => {
    const stato = associazione?.stato_registrazione;
    switch (stato) {
      case 'verificata':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Verificata</Badge>;
      case 'respinta':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" /> Respinta</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800"><Clock className="h-3 w-3 mr-1" /> In attesa</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/associazione/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">Profilo Associazione</h1>
              <p className="text-sm text-muted-foreground">Gestisci i dati dell'associazione</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Esci
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Status Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-medium">Stato Registrazione</h3>
                <p className="text-sm text-muted-foreground">Lo stato della tua associazione nel sistema</p>
              </div>
              {getStatoRegistrazioneBadge()}
            </div>
            {proLoco && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-medium">Affiliazione</h3>
                <p className="text-sm text-muted-foreground">
                  Affiliata a: <span className="font-medium text-foreground">{proLoco.denominazione}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dati Anagrafici
            </CardTitle>
            <CardDescription>
              Modifica le informazioni della tua associazione
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="denominazione">Denominazione *</Label>
                <Input
                  id="denominazione"
                  value={formData.denominazione}
                  onChange={(e) => handleChange('denominazione', e.target.value)}
                  placeholder="Nome dell'associazione"
                />
              </div>
              
              <div>
                <Label htmlFor="tipologia">Tipologia *</Label>
                <Select
                  value={formData.tipologia}
                  onValueChange={(value) => handleChange('tipologia', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOLOGIE.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="stato_runts">Stato RUNTS</Label>
                <Select
                  value={formData.stato_runts}
                  onValueChange={(value) => handleChange('stato_runts', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dichiarato">Dichiarato</SelectItem>
                    <SelectItem value="verificato">Verificato</SelectItem>
                    <SelectItem value="non_iscritto">Non iscritto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="codice_fiscale">Codice Fiscale</Label>
                <Input
                  id="codice_fiscale"
                  value={formData.codice_fiscale}
                  onChange={(e) => handleChange('codice_fiscale', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="partita_iva">Partita IVA</Label>
                <Input
                  id="partita_iva"
                  value={formData.partita_iva}
                  onChange={(e) => handleChange('partita_iva', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="telefono">Telefono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="pec">PEC</Label>
                <Input
                  id="pec"
                  type="email"
                  value={formData.pec}
                  onChange={(e) => handleChange('pec', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="indirizzo">Indirizzo</Label>
                <Input
                  id="indirizzo"
                  value={formData.indirizzo}
                  onChange={(e) => handleChange('indirizzo', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="comune">Comune</Label>
                <Input
                  id="comune"
                  value={formData.comune}
                  onChange={(e) => handleChange('comune', e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4">
                <Switch
                  id="iscrizione_albo"
                  checked={formData.iscrizione_albo_comunale}
                  onCheckedChange={(checked) => handleChange('iscrizione_albo_comunale', checked)}
                />
                <Label htmlFor="iscrizione_albo">Iscritta all'Albo Comunale</Label>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="descrizione">Descrizione</Label>
                <Textarea
                  id="descrizione"
                  value={formData.descrizione}
                  onChange={(e) => handleChange('descrizione', e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={handleSave} 
                disabled={updateAssociazione.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateAssociazione.isPending ? 'Salvataggio...' : 'Salva modifiche'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AssociazioneProfilo;
