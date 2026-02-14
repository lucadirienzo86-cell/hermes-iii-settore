import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Send, Loader2, CheckCircle, Building2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isValidItalianPhone, getPhoneValidationError } from "@/lib/phoneValidation";

const CTASection = () => {
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    ruolo: '',
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
    
    if (!formData.nome || !formData.cognome || !formData.email || !formData.telefono || !formData.ruolo) {
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
      // Save to database
      const { error } = await supabase
        .from('richieste_contatto')
        .insert({
          nome: formData.nome,
          cognome: formData.cognome,
          email: formData.email,
          telefono: formData.telefono,
          messaggio: formData.messaggio || null,
          ruolo_richiesto: formData.ruolo
        });

      if (error) throw error;

      // Send notification email to admin
      try {
        await supabase.functions.invoke('notify-contact-request', {
          body: {
            nome: formData.nome,
            cognome: formData.cognome,
            email: formData.email,
            telefono: formData.telefono,
            ruolo_richiesto: formData.ruolo,
            messaggio: formData.messaggio || undefined
          }
        });
      } catch (emailError) {
        console.warn('Failed to send notification email:', emailError);
        // Don't fail the whole submission if email fails
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

  return (
    <section className="py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <div className="relative p-12 md:p-16 rounded-[2.5rem] bg-gradient-to-br from-primary to-secondary overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '32px 32px',
              }}
            />
          </div>

          {/* Floating elements */}
          <div className="absolute top-8 right-8 w-20 h-20 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-8 left-8 w-32 h-32 rounded-full bg-white/10 blur-3xl" />

          {/* Content */}
          <div className="relative z-10">
            {!showContactForm && !submitted ? (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="inline-flex p-3 rounded-2xl bg-white/10 text-primary-foreground mb-6"
                >
                  <Sparkles className="h-8 w-8" />
                </motion.div>

                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
                  Inizia Oggi a Trovare
                  <br />
                  Nuove Opportunità
                </h2>

                <p className="text-lg md:text-xl text-primary-foreground/80 max-w-xl mx-auto mb-10">
                  Scegli come vuoi iniziare: registra la tua azienda o contattaci per altri ruoli.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to="/app/auth">
                    <Button 
                      size="lg" 
                      className="rounded-full px-10 py-7 text-lg gap-2 bg-white text-primary hover:bg-white/90 shadow-lg"
                    >
                      <Building2 className="h-5 w-5" />
                      Registra la tua Azienda
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => setShowContactForm(true)}
                    className="rounded-full px-10 py-7 text-lg gap-2 bg-transparent border-2 border-white text-white hover:bg-white/10"
                  >
                    <UserPlus className="h-5 w-5" />
                    Contattaci per Altri Ruoli
                  </Button>
                </div>

                <p className="mt-6 text-sm text-primary-foreground/60">
                  Nessuna carta di credito richiesta • Setup in 2 minuti
                </p>
              </div>
            ) : submitted ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-primary-foreground mb-3">
                  Richiesta Inviata!
                </h3>
                <p className="text-primary-foreground/80 text-lg">
                  Ti contatteremo presto per discutere le opportunità disponibili.
                </p>
              </div>
            ) : (
              <div>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-primary-foreground mb-2">
                    Contattaci
                  </h3>
                  <p className="text-primary-foreground/80">
                    Compila il form e ti contatteremo per discutere le opportunità
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cta-nome" className="text-white">Nome *</Label>
                      <Input
                        id="cta-nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Mario"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cta-cognome" className="text-white">Cognome *</Label>
                      <Input
                        id="cta-cognome"
                        value={formData.cognome}
                        onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                        placeholder="Rossi"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cta-email" className="text-white">Email *</Label>
                    <Input
                      id="cta-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="mario.rossi@email.com"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cta-telefono" className="text-white">Telefono *</Label>
                    <Input
                      id="cta-telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => {
                        setFormData({ ...formData, telefono: e.target.value });
                        if (phoneError) validatePhone(e.target.value);
                      }}
                      onBlur={(e) => validatePhone(e.target.value)}
                      placeholder="+39 333 1234567"
                      className={`bg-white/10 border-white/20 text-white placeholder:text-white/50 ${phoneError ? 'border-red-400' : ''}`}
                      required
                    />
                    {phoneError && (
                      <p className="text-sm text-red-200">{phoneError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cta-ruolo" className="text-white">Ruolo di Interesse *</Label>
                    <Select value={formData.ruolo} onValueChange={(value) => setFormData({ ...formData, ruolo: value })}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Seleziona un ruolo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="azienda">Azienda</SelectItem>
                        <SelectItem value="docente">Docente / Formatore</SelectItem>
                        <SelectItem value="consulente">Consulente</SelectItem>
                        <SelectItem value="gestore">Professionista / Ente di Formazione</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cta-messaggio" className="text-white">Messaggio (opzionale)</Label>
                    <Textarea
                      id="cta-messaggio"
                      value={formData.messaggio}
                      onChange={(e) => setFormData({ ...formData, messaggio: e.target.value })}
                      placeholder="Raccontaci brevemente cosa ti interessa..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-start gap-3 pt-2">
                    <Checkbox
                      id="cta-privacy"
                      checked={privacyAccepted}
                      onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                      className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-primary"
                    />
                    <Label htmlFor="cta-privacy" className="text-sm text-white/80 leading-relaxed cursor-pointer">
                      Ho letto e accetto la{" "}
                      <Link to="/privacy" className="text-white underline hover:text-white/80" target="_blank">
                        Privacy Policy
                      </Link>{" "}
                      e acconsento al trattamento dei miei dati.
                    </Label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowContactForm(false)}
                      className="flex-1 rounded-xl bg-transparent border-white/30 text-white hover:bg-white/10"
                    >
                      Indietro
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 rounded-xl bg-white text-primary hover:bg-white/90"
                      disabled={loading || !privacyAccepted}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Invio...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Invia
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default CTASection;