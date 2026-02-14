import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Send, CheckCircle, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isValidItalianPhone, getPhoneValidationError } from "@/lib/phoneValidation";
import { Link } from "react-router-dom";

interface AziendaContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AziendaContactDialog = ({ open, onOpenChange }: AziendaContactDialogProps) => {
  const [formData, setFormData] = useState({
    nomeAzienda: '',
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    messaggio: ''
  });
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const validatePhone = (value: string) => {
    const error = getPhoneValidationError(value);
    setPhoneError(error);
    return !error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nomeAzienda || !formData.nome || !formData.cognome || !formData.email || !formData.telefono) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    if (!privacyAccepted) {
      toast.error('Devi accettare la Privacy Policy per continuare');
      return;
    }

    if (!validatePhone(formData.telefono)) {
      toast.error('Inserisci un numero di telefono italiano valido');
      return;
    }

    setLoading(true);

    try {
      // Save to database with nome azienda in messaggio
      const messaggioCompleto = formData.nomeAzienda + (formData.messaggio ? `\n\n${formData.messaggio}` : '');
      
      const { error } = await supabase
        .from('richieste_contatto')
        .insert({
          nome: formData.nome,
          cognome: formData.cognome,
          email: formData.email,
          telefono: formData.telefono,
          messaggio: messaggioCompleto,
          ruolo_richiesto: 'azienda'
        });

      if (error) throw error;

      // Send notification email
      try {
        await supabase.functions.invoke('notify-contact-request', {
          body: {
            nome: formData.nome,
            cognome: formData.cognome,
            email: formData.email,
            telefono: formData.telefono,
            ruolo_richiesto: 'azienda',
            messaggio: messaggioCompleto
          }
        });
      } catch (emailError) {
        console.warn('Failed to send notification email:', emailError);
      }

      setSubmitted(true);
      toast.success('Richiesta inviata con successo! Ti contatteremo presto.');
    } catch (error: any) {
      console.error('Error submitting contact request:', error);
      toast.error('Errore durante l\'invio. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after dialog closes
    setTimeout(() => {
      setFormData({
        nomeAzienda: '',
        nome: '',
        cognome: '',
        email: '',
        telefono: '',
        messaggio: ''
      });
      setPrivacyAccepted(false);
      setSubmitted(false);
      setPhoneError(null);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Richiesta Inviata!
            </h3>
            <p className="text-muted-foreground mb-6">
              Ti contatteremo presto per discutere le opportunità disponibili per la tua azienda.
            </p>
            <Button onClick={handleClose}>Chiudi</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle>Registra la tua Azienda</DialogTitle>
                  <DialogDescription>
                    Compila il form e ti contatteremo per completare la registrazione
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="azienda-nome-azienda">Nome Azienda *</Label>
                <Input
                  id="azienda-nome-azienda"
                  value={formData.nomeAzienda}
                  onChange={(e) => setFormData({ ...formData, nomeAzienda: e.target.value })}
                  placeholder="Es. Rossi S.r.l."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="azienda-nome">Nome Referente *</Label>
                  <Input
                    id="azienda-nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Mario"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="azienda-cognome">Cognome *</Label>
                  <Input
                    id="azienda-cognome"
                    value={formData.cognome}
                    onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                    placeholder="Rossi"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="azienda-email">Email *</Label>
                <Input
                  id="azienda-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="mario.rossi@azienda.it"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="azienda-telefono">Telefono *</Label>
                <Input
                  id="azienda-telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => {
                    setFormData({ ...formData, telefono: e.target.value });
                    if (phoneError) validatePhone(e.target.value);
                  }}
                  onBlur={(e) => validatePhone(e.target.value)}
                  placeholder="+39 333 1234567"
                  className={phoneError ? 'border-destructive' : ''}
                  required
                />
                {phoneError && (
                  <p className="text-sm text-destructive">{phoneError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="azienda-messaggio">Messaggio (opzionale)</Label>
                <Textarea
                  id="azienda-messaggio"
                  value={formData.messaggio}
                  onChange={(e) => setFormData({ ...formData, messaggio: e.target.value })}
                  placeholder="Raccontaci brevemente le esigenze della tua azienda..."
                  rows={3}
                />
              </div>

              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="azienda-privacy"
                  checked={privacyAccepted}
                  onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                />
                <Label htmlFor="azienda-privacy" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  Ho letto e accetto la{" "}
                  <Link to="/privacy" className="text-primary hover:underline" target="_blank">
                    Privacy Policy
                  </Link>{" "}
                  e acconsento al trattamento dei miei dati per essere ricontattato.
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl py-6"
                disabled={loading || !privacyAccepted}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Invia Richiesta
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AziendaContactDialog;
