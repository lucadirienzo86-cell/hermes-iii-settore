import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Torna alla Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Title */}
          <div className="text-center mb-12">
            <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-6">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Titolare del Trattamento</h2>
              <p className="text-muted-foreground leading-relaxed">
                Il Titolare del trattamento dei dati personali è <strong>Sonyc</strong>, con sede legale in Italia.
                Per qualsiasi informazione o richiesta relativa al trattamento dei dati personali, è possibile contattarci
                all'indirizzo email: <a href="mailto:info@sonyc.it" className="text-primary hover:underline">info@sonyc.it</a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">2. Dati Raccolti</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                I dati personali che raccogliamo includono:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Dati di contatto (nome, cognome, email, telefono)</li>
                <li>Dati aziendali (ragione sociale, partita IVA, sede)</li>
                <li>Dati di navigazione (indirizzo IP, browser, dispositivo)</li>
                <li>Preferenze e interessi professionali</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Finalità del Trattamento</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                I tuoi dati personali sono trattati per le seguenti finalità:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Rispondere alle richieste di contatto e informazioni</li>
                <li>Gestione del rapporto contrattuale e fornitura dei servizi</li>
                <li>Invio di comunicazioni relative ai servizi richiesti</li>
                <li>Adempimento di obblighi di legge</li>
                <li>Analisi e miglioramento dei nostri servizi</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Base Giuridica del Trattamento</h2>
              <p className="text-muted-foreground leading-relaxed">
                Il trattamento dei dati personali si basa sul consenso dell'interessato, sull'esecuzione di un contratto,
                su obblighi legali e sul legittimo interesse del Titolare nel migliorare i propri servizi.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Conservazione dei Dati</h2>
              <p className="text-muted-foreground leading-relaxed">
                I dati personali sono conservati per il tempo strettamente necessario al raggiungimento delle finalità
                per cui sono stati raccolti, e comunque nel rispetto dei termini di prescrizione previsti dalla legge.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Diritti dell'Interessato</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Ai sensi del Regolamento UE 2016/679 (GDPR), hai il diritto di:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Accedere ai tuoi dati personali</li>
                <li>Richiedere la rettifica di dati inesatti</li>
                <li>Richiedere la cancellazione dei tuoi dati</li>
                <li>Limitare il trattamento dei tuoi dati</li>
                <li>Richiedere la portabilità dei dati</li>
                <li>Opporti al trattamento</li>
                <li>Revocare il consenso in qualsiasi momento</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Per esercitare questi diritti, contattaci all'indirizzo: <a href="mailto:info@sonyc.it" className="text-primary hover:underline">info@sonyc.it</a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Sicurezza dei Dati</h2>
              <p className="text-muted-foreground leading-relaxed">
                Adottiamo misure di sicurezza tecniche e organizzative adeguate per proteggere i dati personali
                da accessi non autorizzati, perdita, distruzione o alterazione. I nostri sistemi sono regolarmente
                aggiornati e monitorati per garantire la massima protezione.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Cookie</h2>
              <p className="text-muted-foreground leading-relaxed">
                Il nostro sito utilizza cookie tecnici necessari al funzionamento della piattaforma.
                Non utilizziamo cookie di profilazione senza il tuo esplicito consenso.
                Per maggiori informazioni, consulta la nostra Cookie Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">9. Modifiche alla Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ci riserviamo il diritto di modificare questa Privacy Policy in qualsiasi momento.
                Le modifiche saranno pubblicate su questa pagina con indicazione della data di ultimo aggiornamento.
                Ti invitiamo a consultare periodicamente questa pagina.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">10. Contatti</h2>
              <p className="text-muted-foreground leading-relaxed">
                Per qualsiasi domanda relativa a questa Privacy Policy o al trattamento dei tuoi dati personali,
                puoi contattarci ai seguenti recapiti:
              </p>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <a href="mailto:info@sonyc.it" className="text-primary hover:underline font-medium">
                  info@sonyc.it
                </a>
              </div>
            </section>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Sonyc. Tutti i diritti riservati.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
