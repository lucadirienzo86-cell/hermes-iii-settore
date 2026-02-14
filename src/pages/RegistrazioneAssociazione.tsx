import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle, ArrowRight, ArrowLeft, Users, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import comuneCassinoLogo from '@/assets/comune-cassino-logo.png';

const tipologie = [
  { value: 'APS', label: 'Associazione di Promozione Sociale (APS)' },
  { value: 'ODV', label: 'Organizzazione di Volontariato (ODV)' },
  { value: 'ETS', label: 'Ente del Terzo Settore (ETS)' },
  { value: 'Cooperativa', label: 'Cooperativa Sociale' },
  { value: 'Altro', label: 'Altro tipo di associazione' },
];

const settoriIntervento = [
  'Assistenza sociale',
  'Sanità',
  'Cultura e arte',
  'Sport e ricreazione',
  'Ambiente',
  'Protezione civile',
  'Tutela diritti',
  'Educazione e formazione',
  'Sviluppo economico',
  'Cooperazione internazionale',
  'Altro',
];

const RegistrazioneAssociazione = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const [formData, setFormData] = useState({
    denominazione: '',
    codice_fiscale: '',
    partita_iva: '',
    tipologia: '',
    email: '',
    pec: '',
    telefono: '',
    indirizzo: '',
    comune: 'Cassino',
    descrizione: '',
    settori_intervento: [] as string[],
    referente_nome: '',
    referente_cognome: '',
    referente_email: '',
    referente_telefono: '',
    privacy_accepted: false,
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSettore = (settore: string) => {
    setFormData(prev => ({
      ...prev,
      settori_intervento: prev.settori_intervento.includes(settore)
        ? prev.settori_intervento.filter(s => s !== settore)
        : [...prev.settori_intervento, settore]
    }));
  };

  const validateStep = (stepNum: number): boolean => {
    switch (stepNum) {
      case 1:
        return !!(formData.denominazione && formData.codice_fiscale && formData.tipologia);
      case 2:
        return !!(formData.email && formData.telefono);
      case 3:
        return formData.privacy_accepted;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      toast({
        title: 'Errore',
        description: 'Devi accettare la privacy policy per continuare',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Inserisci l'associazione
      const { data, error } = await supabase
        .from('associazioni_terzo_settore')
        .insert({
          denominazione: formData.denominazione,
          codice_fiscale: formData.codice_fiscale,
          partita_iva: formData.partita_iva || null,
          tipologia: formData.tipologia as any,
          email: formData.email,
          pec: formData.pec || null,
          telefono: formData.telefono,
          indirizzo: formData.indirizzo || null,
          comune: formData.comune,
          descrizione: formData.descrizione || null,
          settori_intervento: formData.settori_intervento.length > 0 ? formData.settori_intervento : null,
          stato_runts: 'dichiarato',
          fonte_dato: 'registrazione_autonoma',
          stato_albo: 'non_iscritta',
          notifica_assessorato: true,
          data_notifica_assessorato: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Invia notifica all'assessorato (via edge function in futuro)
      // Per ora tracciamo solo la registrazione
      
      setIsCompleted(true);
      toast({
        title: 'Registrazione completata',
        description: 'La tua richiesta è stata inviata con successo',
      });

    } catch (error: any) {
      console.error('Errore registrazione:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Si è verificato un errore durante la registrazione',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D5EAF] via-[#1976D2] to-[#2196F3] flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Registrazione Completata!</h2>
            <p className="text-muted-foreground mb-6">
              La tua richiesta di registrazione è stata inviata con successo. 
              L'Assessorato al Terzo Settore del Comune di Cassino esaminerà 
              la tua richiesta e ti contatterà all'indirizzo email fornito.
            </p>
            <div className="p-4 bg-blue-50 rounded-lg mb-6">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Se la tua associazione non è ancora iscritta 
                all'Albo comunale, riceverai istruzioni per completare la procedura 
                di iscrizione.
              </p>
            </div>
            <Button onClick={() => navigate('/')} className="w-full">
              Torna alla Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D5EAF] via-[#1976D2] to-[#2196F3]">
      {/* Header */}
      <header className="py-6">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={comuneCassinoLogo} 
                alt="Stemma Comune di Cassino" 
                className="w-14 h-14 object-contain"
              />
              <div>
                <h1 className="text-white text-xl font-semibold">Comune di Cassino</h1>
                <p className="text-white/70 text-sm">Registrazione Associazione</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna al sito
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="container mx-auto px-6 mb-8">
        <div className="flex items-center justify-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-medium
                ${step >= s ? 'bg-white text-[#0D5EAF]' : 'bg-white/20 text-white'}
              `}>
                {s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 rounded ${step > s ? 'bg-white' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-2">
          <p className="text-white/80 text-sm">
            {step === 1 && 'Dati Associazione'}
            {step === 2 && 'Contatti e Attività'}
            {step === 3 && 'Conferma'}
          </p>
        </div>
      </div>

      {/* Form */}
      <main className="container mx-auto px-6 pb-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Dati dell\'Associazione'}
              {step === 2 && 'Contatti e Settori di Attività'}
              {step === 3 && 'Conferma e Invio'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Inserisci i dati identificativi della tua associazione'}
              {step === 2 && 'Fornisci i recapiti e indica i settori di intervento'}
              {step === 3 && 'Verifica i dati e conferma la registrazione'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Denominazione *</Label>
                  <Input
                    value={formData.denominazione}
                    onChange={(e) => updateField('denominazione', e.target.value)}
                    placeholder="Nome completo dell'associazione"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Codice Fiscale *</Label>
                    <Input
                      value={formData.codice_fiscale}
                      onChange={(e) => updateField('codice_fiscale', e.target.value)}
                      placeholder="00000000000"
                      maxLength={16}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Partita IVA (se presente)</Label>
                    <Input
                      value={formData.partita_iva}
                      onChange={(e) => updateField('partita_iva', e.target.value)}
                      placeholder="00000000000"
                      maxLength={11}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipologia *</Label>
                  <Select value={formData.tipologia} onValueChange={(v) => updateField('tipologia', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona tipologia" />
                    </SelectTrigger>
                    <SelectContent>
                      {tipologie.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="email@associazione.it"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PEC</Label>
                    <Input
                      type="email"
                      value={formData.pec}
                      onChange={(e) => updateField('pec', e.target.value)}
                      placeholder="pec@pec.it"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefono *</Label>
                    <Input
                      value={formData.telefono}
                      onChange={(e) => updateField('telefono', e.target.value)}
                      placeholder="+39 000 0000000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Comune</Label>
                    <Input
                      value={formData.comune}
                      onChange={(e) => updateField('comune', e.target.value)}
                      placeholder="Cassino"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Indirizzo sede</Label>
                  <Input
                    value={formData.indirizzo}
                    onChange={(e) => updateField('indirizzo', e.target.value)}
                    placeholder="Via, numero civico, CAP"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrizione attività</Label>
                  <Textarea
                    value={formData.descrizione}
                    onChange={(e) => updateField('descrizione', e.target.value)}
                    placeholder="Descrivi brevemente le attività dell'associazione..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Settori di intervento</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {settoriIntervento.map((settore) => (
                      <div key={settore} className="flex items-center space-x-2">
                        <Checkbox
                          id={settore}
                          checked={formData.settori_intervento.includes(settore)}
                          onCheckedChange={() => toggleSettore(settore)}
                        />
                        <label htmlFor={settore} className="text-sm cursor-pointer">
                          {settore}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <h4 className="font-medium">Riepilogo dati</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Denominazione:</span>
                      <p className="font-medium">{formData.denominazione}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Codice Fiscale:</span>
                      <p className="font-medium">{formData.codice_fiscale}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tipologia:</span>
                      <p className="font-medium">{formData.tipologia}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{formData.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Telefono:</span>
                      <p className="font-medium">{formData.telefono}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Comune:</span>
                      <p className="font-medium">{formData.comune}</p>
                    </div>
                  </div>
                  {formData.settori_intervento.length > 0 && (
                    <div>
                      <span className="text-muted-foreground text-sm">Settori:</span>
                      <p className="font-medium text-sm">{formData.settori_intervento.join(', ')}</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> L'Assessorato al Terzo Settore verificherà 
                    se la tua associazione è iscritta all'Albo comunale. In caso contrario, 
                    riceverai istruzioni per completare l'iscrizione.
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="privacy"
                    checked={formData.privacy_accepted}
                    onCheckedChange={(checked) => updateField('privacy_accepted', checked)}
                  />
                  <label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
                    Ho letto e accetto la <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a> e 
                    autorizzo il trattamento dei dati personali ai sensi del GDPR 2016/679 per 
                    le finalità connesse alla gestione del Terzo Settore comunale.
                  </label>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Indietro
                </Button>
              ) : (
                <div />
              )}
              
              {step < 3 ? (
                <Button 
                  onClick={() => setStep(step + 1)}
                  disabled={!validateStep(step)}
                >
                  Continua
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.privacy_accepted}
                >
                  {isSubmitting ? 'Invio in corso...' : 'Invia Registrazione'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RegistrazioneAssociazione;
