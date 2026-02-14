import { motion } from "framer-motion";
import { ArrowLeft, HelpCircle, Euro, Calendar, Building2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import GridBackground from "@/components/landing/GridBackground";

const DeMinimisInfo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative">
      <GridBackground />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-8 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna indietro
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Cosa sono gli Aiuti{" "}
            <span className="text-primary">De Minimis</span>?
          </h1>

          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="text-xl mb-8">
              Gli aiuti "de minimis" sono agevolazioni di importo limitato che gli Stati membri 
              dell'UE possono concedere alle imprese senza necessità di notifica alla Commissione Europea.
            </p>
          </div>
        </motion.div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-6 rounded-2xl bg-card border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-primary/10">
                <Euro className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Il Massimale</h2>
            </div>
            <p className="text-muted-foreground">
              Il massimale attuale è di <strong className="text-foreground">€300.000</strong> per 
              "impresa unica" nell'arco di tre anni (dal 1° gennaio 2024, precedentemente era €200.000).
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-6 rounded-2xl bg-card border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Il Periodo di Riferimento</h2>
            </div>
            <p className="text-muted-foreground">
              Il calcolo considera gli aiuti ricevuti negli <strong className="text-foreground">ultimi 3 anni</strong> 
              {" "}(esercizio fiscale in corso e i due precedenti), con un meccanismo di "scorrimento".
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-6 rounded-2xl bg-card border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Impresa Unica</h2>
            </div>
            <p className="text-muted-foreground">
              Il concetto di "impresa unica" comprende tutte le imprese tra cui intercorre almeno 
              una relazione di controllo (partecipazioni, voti, influenza dominante).
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="p-6 rounded-2xl bg-card border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-primary/10">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Il Registro RNA</h2>
            </div>
            <p className="text-muted-foreground">
              Il <strong className="text-foreground">Registro Nazionale Aiuti</strong> (RNA) è la banca dati 
              che raccoglie tutti gli aiuti di Stato concessi in Italia, inclusi quelli de minimis.
            </p>
          </motion.div>
        </div>

        {/* Important Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 p-6 rounded-2xl bg-warning/10 border border-warning/30"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-warning shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Attenzione</h3>
              <p className="text-muted-foreground">
                Il superamento del massimale comporta la revoca dell'aiuto e l'obbligo di 
                restituzione dell'importo eccedente con gli interessi. È fondamentale verificare 
                sempre il proprio plafond prima di richiedere nuove agevolazioni.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Perché verificare il tuo plafond con Sonyc?
          </h2>
          <div className="space-y-4">
            {[
              "Verifica istantanea interrogando direttamente il Registro Nazionale Aiuti",
              "Calcolo automatico del plafond disponibile negli ultimi 3 anni",
              "Nessuna registrazione richiesta per la verifica base",
              "Dati sempre aggiornati in tempo reale"
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <span className="text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-12 text-center"
        >
          <Button 
            size="lg" 
            onClick={() => navigate("/")}
            className="rounded-full px-8"
          >
            Verifica il tuo Plafond Gratis
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default DeMinimisInfo;
