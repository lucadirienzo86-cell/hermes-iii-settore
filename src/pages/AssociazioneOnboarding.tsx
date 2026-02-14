import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAssociazione, useUpdateAssociazione, useCompleteOnboarding } from '@/hooks/useAssociazione';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Building2,
  Info
} from 'lucide-react';

const TIPOLOGIE = ['APS', 'ETS', 'ODV', 'Cooperativa', 'Altro'];
const STATI_RUNTS = ['dichiarato', 'verificato', 'non_iscritto'];

const AssociazioneOnboarding = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: associazione, isLoading } = useAssociazione();
  const updateAssociazione = useUpdateAssociazione();
  const completeOnboarding = useCompleteOnboarding();
  
  const [step, setStep] = useState(1);
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
      
      // If onboarding is already complete, redirect to dashboard
      if (associazione.onboarding_completato) {
        navigate('/associazione/dashboard');
      }
    }
  }, [associazione, navigate]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveStep = async () => {
    if (!associazione?.id) return;
    
    await updateAssociazione.mutateAsync({
      id: associazione.id,
      ...formData,
    });
  };

  const handleComplete = async () => {
    if (!associazione?.id) return;
    
    await handleSaveStep();
    await completeOnboarding.mutateAsync(associazione.id);
    navigate('/associazione/dashboard');
  };

  const nextStep = async () => {
    await handleSaveStep();
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
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
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Completa il profilo</h1>
              <p className="text-sm text-muted-foreground">Passo {step} di 3</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Esci
          </Button>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                s <= step ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-500'
              }`}>
                {s < step ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 mx-2 ${s < step ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Dati Anagrafici */}
        {step === 1 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dati Anagrafici
              </CardTitle>
              <CardDescription>
                Inserisci i dati principali della tua associazione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <Label htmlFor="codice_fiscale">Codice Fiscale</Label>
                  <Input
                    id="codice_fiscale"
                    value={formData.codice_fiscale}
                    onChange={(e) => handleChange('codice_fiscale', e.target.value)}
                    placeholder="Codice fiscale"
                  />
                </div>

                <div>
                  <Label htmlFor="partita_iva">Partita IVA</Label>
                  <Input
                    id="partita_iva"
                    value={formData.partita_iva}
                    onChange={(e) => handleChange('partita_iva', e.target.value)}
                    placeholder="Partita IVA (se presente)"
                  />
                </div>

                <div>
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => handleChange('telefono', e.target.value)}
                    placeholder="+39..."
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="email@esempio.it"
                  />
                </div>

                <div>
                  <Label htmlFor="pec">PEC</Label>
                  <Input
                    id="pec"
                    type="email"
                    value={formData.pec}
                    onChange={(e) => handleChange('pec', e.target.value)}
                    placeholder="pec@esempio.it"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="indirizzo">Indirizzo</Label>
                  <Input
                    id="indirizzo"
                    value={formData.indirizzo}
                    onChange={(e) => handleChange('indirizzo', e.target.value)}
                    placeholder="Via, numero civico"
                  />
                </div>

                <div>
                  <Label htmlFor="comune">Comune</Label>
                  <Input
                    id="comune"
                    value={formData.comune}
                    onChange={(e) => handleChange('comune', e.target.value)}
                    placeholder="Comune"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={nextStep} disabled={!formData.denominazione}>
                  Avanti <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Stato RUNTS e Albo */}
        {step === 2 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Stato e Registri
              </CardTitle>
              <CardDescription>
                Indica lo stato dell'associazione nei registri pubblici
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                <p className="text-sm text-muted-foreground mt-1">
                  Registro Unico Nazionale del Terzo Settore
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="iscrizione_albo" className="text-base font-medium">
                    Iscritta all'Albo Comunale
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    L'associazione è iscritta all'albo delle associazioni del Comune?
                  </p>
                </div>
                <Switch
                  id="iscrizione_albo"
                  checked={formData.iscrizione_albo_comunale}
                  onCheckedChange={(checked) => handleChange('iscrizione_albo_comunale', checked)}
                />
              </div>

              {!formData.iscrizione_albo_comunale && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Iscrizione all'Albo Comunale</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Per accedere ad alcuni bandi e contributi comunali, potrebbe essere necessaria l'iscrizione all'Albo delle Associazioni del Comune.
                    <br /><br />
                    <strong>Come iscriversi:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Contattare l'Ufficio Associazioni del Comune</li>
                      <li>Compilare il modulo di richiesta iscrizione</li>
                      <li>Allegare statuto e atto costitutivo</li>
                      <li>Attendere la verifica e l'approvazione</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="descrizione">Descrizione dell'associazione</Label>
                <Textarea
                  id="descrizione"
                  value={formData.descrizione}
                  onChange={(e) => handleChange('descrizione', e.target.value)}
                  placeholder="Descrivi brevemente le attività e gli scopi dell'associazione..."
                  rows={4}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
                </Button>
                <Button onClick={nextStep}>
                  Avanti <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Riepilogo e Conferma */}
        {step === 3 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Riepilogo
              </CardTitle>
              <CardDescription>
                Verifica i dati inseriti prima di confermare
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Dati Anagrafici</h4>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">Denominazione:</dt>
                    <dd className="font-medium">{formData.denominazione}</dd>
                    <dt className="text-muted-foreground">Tipologia:</dt>
                    <dd>{formData.tipologia}</dd>
                    <dt className="text-muted-foreground">Codice Fiscale:</dt>
                    <dd>{formData.codice_fiscale || '-'}</dd>
                    <dt className="text-muted-foreground">Email:</dt>
                    <dd>{formData.email || '-'}</dd>
                    <dt className="text-muted-foreground">Telefono:</dt>
                    <dd>{formData.telefono || '-'}</dd>
                    <dt className="text-muted-foreground">Comune:</dt>
                    <dd>{formData.comune || '-'}</dd>
                  </dl>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Stato Registri</h4>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">Stato RUNTS:</dt>
                    <dd className="capitalize">{formData.stato_runts}</dd>
                    <dt className="text-muted-foreground">Albo Comunale:</dt>
                    <dd>{formData.iscrizione_albo_comunale ? 'Iscritta' : 'Non iscritta'}</dd>
                  </dl>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Prossimi passi</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Dopo aver completato la registrazione, potrai:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Consultare i bandi disponibili per la tua tipologia</li>
                    <li>Ricevere notifiche su nuove opportunità</li>
                    <li>Gestire il profilo della tua associazione</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
                </Button>
                <Button 
                  onClick={handleComplete}
                  disabled={completeOnboarding.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {completeOnboarding.isPending ? 'Salvataggio...' : 'Completa Registrazione'}
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AssociazioneOnboarding;
