import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, CheckCircle2, AlertCircle, Gift, TrendingUp, Bell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { subYears, parseISO, isBefore, startOfDay } from "date-fns";

const MASSIMALE_DEMINIMIS = 300000;

interface AiutoItem {
  dataConcessione?: string;
  importoAgevolazione?: number;
  denominazioneBeneficiario?: string;
}

interface RnaResult {
  totaleUtilizzato: number;
  disponibile: number;
  percentuale: number;
  numeroAiuti: number;
  denominazione: string | null;
}

const calcolaDeMinimis = (aiutiDeminimis: AiutoItem[]): RnaResult => {
  const oggi = startOfDay(new Date());
  const treAnniFa = subYears(oggi, 3);
  
  const aiutiRilevanti = aiutiDeminimis.filter(a => {
    if (!a.dataConcessione) return false;
    try {
      const dataConcessione = parseISO(a.dataConcessione);
      return !isBefore(dataConcessione, treAnniFa);
    } catch {
      return false;
    }
  });
  
  const totaleUtilizzato = aiutiRilevanti.reduce(
    (sum, a) => sum + (a.importoAgevolazione || 0), 0
  );
  
  return {
    totaleUtilizzato,
    disponibile: Math.max(0, MASSIMALE_DEMINIMIS - totaleUtilizzato),
    percentuale: Math.min(100, (totaleUtilizzato / MASSIMALE_DEMINIMIS) * 100),
    numeroAiuti: aiutiRilevanti.length,
    denominazione: aiutiDeminimis[0]?.denominazioneBeneficiario || null
  };
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const DeMinimisSection = () => {
  const [partitaIva, setPartitaIva] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RnaResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePartitaIvaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setPartitaIva(value);
    setError(null);
  };

  const handleVerifica = async () => {
    if (!partitaIva || partitaIva.length !== 11) {
      setError("Inserisci una Partita IVA valida (11 cifre)");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('rna-check', {
        body: { partitaIva }
      });
      
      if (fnError) throw fnError;
      
      const aiutiDeminimis = data?.rna?.aiutiDeminimis || [];
      const deMinimisData = calcolaDeMinimis(aiutiDeminimis);
      setResult(deMinimisData);
    } catch (err) {
      console.error("Errore verifica RNA:", err);
      setError("Errore durante la verifica. Riprova tra qualche istante.");
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressColor = (percentuale: number) => {
    if (percentuale >= 80) return "bg-destructive";
    if (percentuale >= 60) return "bg-warning";
    return "bg-primary";
  };

  return (
    <section id="deminimis" className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Verifica il tuo Plafond De Minimis
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Scopri gratuitamente quanto margine hai ancora disponibile per accedere a nuovi finanziamenti
          </p>
        </motion.div>

        {/* Verification Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-8 rounded-3xl bg-card border border-border shadow-lg"
        >
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              type="text"
              placeholder="Inserisci la tua Partita IVA (11 cifre)"
              value={partitaIva}
              onChange={handlePartitaIvaChange}
              className="flex-1 h-14 text-lg rounded-xl"
              disabled={isLoading}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifica()}
            />
            <Button 
              onClick={handleVerifica} 
              disabled={isLoading || partitaIva.length !== 11}
              className="h-14 px-8 rounded-xl text-lg gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verifica...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Verifica Gratis
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </motion.div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="mt-8 p-8 rounded-3xl bg-card border-2 border-primary shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-center gap-2 text-primary mb-6">
                <CheckCircle2 className="h-6 w-6" />
                <h3 className="text-xl font-bold">Risultato Verifica De Minimis</h3>
              </div>

              {result.denominazione && (
                <p className="text-center text-lg font-medium text-foreground mb-6">
                  {result.denominazione}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-muted/50 rounded-2xl p-5 text-center">
                  <p className="text-2xl md:text-3xl font-bold text-foreground">
                    {formatCurrency(result.totaleUtilizzato)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Utilizzato (3 anni)</p>
                </div>
                <div className="bg-primary/10 rounded-2xl p-5 text-center">
                  <p className="text-2xl md:text-3xl font-bold text-primary">
                    {formatCurrency(result.disponibile)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Disponibile</p>
                </div>
                <div className="bg-muted/50 rounded-2xl p-5 text-center">
                  <p className={`text-2xl md:text-3xl font-bold ${result.percentuale >= 80 ? 'text-destructive' : result.percentuale >= 60 ? 'text-warning' : 'text-foreground'}`}>
                    {result.percentuale.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Occupato</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={`h-full ${getProgressColor(result.percentuale)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${result.percentuale}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {result.numeroAiuti > 0 
                    ? `📋 ${result.numeroAiuti} aiut${result.numeroAiuti === 1 ? 'o' : 'i'} registrat${result.numeroAiuti === 1 ? 'o' : 'i'} negli ultimi 3 anni`
                    : "✨ Nessun aiuto De Minimis registrato - Plafond completo!"
                  }
                </p>
              </div>

              {/* CTA Registration */}
              <motion.div 
                className="bg-gradient-to-r from-primary/10 via-accent/30 to-primary/10 rounded-2xl p-6 border border-primary/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center justify-center gap-2 text-primary mb-4">
                  <Gift className="h-5 w-5" />
                  <span className="font-semibold">Registrati GRATIS per accedere a:</span>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {[
                    { icon: Search, text: "Dettaglio completo degli aiuti ricevuti" },
                    { icon: TrendingUp, text: "Bandi e agevolazioni compatibili con la tua azienda" },
                    { icon: Bell, text: "Alert quando nuove opportunità sono disponibili" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/auth" className="block">
                  <Button size="lg" className="w-full gap-2 text-lg py-6 rounded-xl">
                    Registrati Gratuitamente
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default DeMinimisSection;
