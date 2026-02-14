import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Sparkles, FileCheck, Users, Calendar, Award, Send, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isValidItalianPhone, getPhoneValidationError } from "@/lib/phoneValidation";

const docentiFeatures = [
  {
    icon: GraduationCap,
    title: "Profilo Professionale",
    description: "Crea il tuo profilo con competenze, settori di expertise e badge formativi certificati.",
  },
  {
    icon: Sparkles,
    title: "Matching Intelligente",
    description: "Ricevi avvisi dei fondi interprofessionali compatibili con le tue competenze e disponibilità.",
  },
  {
    icon: FileCheck,
    title: "Gestione Completa",
    description: "Documenti, dati fiscali, CV e disponibilità organizzati in un unico posto sicuro.",
  },
  {
    icon: Users,
    title: "Network Aziende",
    description: "Connettiti con aziende che cercano formatori qualificati nel tuo settore di competenza.",
  },
  {
    icon: Calendar,
    title: "Gestione Disponibilità",
    description: "Indica le tue disponibilità e zone operative per ricevere proposte pertinenti.",
  },
  {
    icon: Award,
    title: "Badge Certificati",
    description: "Ottieni badge formativi che attestano le tue competenze e aumentano la tua visibilità.",
  },
];

const DocentiSection = () => {
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
    <section id="docenti" className="py-24 px-4 relative z-10 bg-gradient-to-b from-primary/5 to-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Per Docenti e Consulenti
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Sei un Docente o Consulente?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sonyc ti connette con le migliori opportunità di formazione finanziata. 
            Gestisci il tuo profilo, ricevi proposte compatibili e fai crescere la tua attività.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {docentiFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-xl mx-auto"
        >
          <div className="bg-card border border-border rounded-3xl p-8 shadow-lg">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Richiesta Inviata!
                </h3>
                <p className="text-muted-foreground">
                  Ti contatteremo presto per discutere le opportunità disponibili.
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Richiedi di Entrare come Docente o Consulente
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Compila il form e ti contatteremo per completare la registrazione
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Mario"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cognome">Cognome *</Label>
                      <Input
                        id="cognome"
                        value={formData.cognome}
                        onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                        placeholder="Rossi"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="mario.rossi@email.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Telefono *</Label>
                    <Input
                      id="telefono"
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
                    <Label htmlFor="ruolo">Ruolo *</Label>
                    <Select value={formData.ruolo} onValueChange={(value) => setFormData({ ...formData, ruolo: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona il tuo ruolo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="docente">Docente / Formatore</SelectItem>
                        <SelectItem value="consulente">Consulente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="messaggio">Messaggio (opzionale)</Label>
                    <Textarea
                      id="messaggio"
                      value={formData.messaggio}
                      onChange={(e) => setFormData({ ...formData, messaggio: e.target.value })}
                      placeholder="Raccontaci brevemente la tua esperienza e le tue competenze..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-start gap-3 pt-2">
                    <Checkbox
                      id="docenti-privacy"
                      checked={privacyAccepted}
                      onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                    />
                    <Label htmlFor="docenti-privacy" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
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
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DocentiSection;