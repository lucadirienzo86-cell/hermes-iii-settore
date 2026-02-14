import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Zap, GraduationCap, Search, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subYears, parseISO, isBefore, startOfDay } from "date-fns";
import AziendaContactDialog from "./AziendaContactDialog";

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

const getProgressColor = (percentuale: number) => {
  if (percentuale >= 80) return "bg-destructive";
  if (percentuale >= 60) return "bg-warning";
  return "bg-primary";
};

const HeroSection = () => {
  const ref = useRef<HTMLElement>(null);
  const [showAziendaDialog, setShowAziendaDialog] = useState(false);
  const [partitaIva, setPartitaIva] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RnaResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const titleY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const badgesY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const subtitleY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const ctaY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const badges = [
    { icon: Sparkles, label: "AI Matching" },
    { icon: Shield, label: "GDPR Compliant" },
    { icon: Zap, label: "Verifiche Istantanee" },
  ];

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

  return (
    <section ref={ref} className="relative pt-40 pb-20 px-4 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badges with parallax */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ y: badgesY, opacity }}
          className="flex flex-wrap justify-center gap-3 mb-8"
        >
          {badges.map((badge, i) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 border border-border text-sm font-medium text-foreground"
            >
              <badge.icon className="h-4 w-4 text-primary" />
              {badge.label}
            </motion.div>
          ))}
        </motion.div>

        {/* Main headline with parallax */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ y: titleY, opacity }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6"
        >
          Trova{" "}
        <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Bandi e Agevolazioni
          </span>
          <br />
          per la Tua Associazione
        </motion.h1>

        {/* Subtitle with parallax */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{ y: subtitleY, opacity }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Sonyc analizza automaticamente il profilo della tua azienda e ti propone 
          solo le opportunità di finanziamento più adatte. Niente più ricerche infinite.
        </motion.p>

        {/* De Minimis Verification Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          style={{ opacity }}
          className="max-w-2xl mx-auto mb-10"
        >
          <div className="p-6 rounded-2xl bg-card/80 backdrop-blur border border-border shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center justify-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Verifica il tuo Plafond De Minimis
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                placeholder="Inserisci la tua Partita IVA (11 cifre)"
                value={partitaIva}
                onChange={handlePartitaIvaChange}
                className="flex-1 h-12 text-base rounded-xl"
                disabled={isLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifica()}
              />
              <Button 
                onClick={handleVerifica} 
                disabled={isLoading || partitaIva.length !== 11}
                className="h-12 px-6 rounded-xl text-base gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifica...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Verifica Gratis
                  </>
                )}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Inline Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 pt-4 border-t border-border"
                >
                  <div className="flex items-center justify-center gap-2 text-primary mb-3">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Risultato Verifica</span>
                  </div>

                  {result.denominazione && (
                    <p className="text-sm font-medium text-foreground mb-3">
                      {result.denominazione}
                    </p>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                      <p className="text-lg md:text-xl font-bold text-foreground">
                        {formatCurrency(result.totaleUtilizzato)}
                      </p>
                      <p className="text-xs text-muted-foreground">Utilizzato</p>
                    </div>
                    <div className="bg-primary/10 rounded-xl p-3 text-center">
                      <p className="text-lg md:text-xl font-bold text-primary">
                        {formatCurrency(result.disponibile)}
                      </p>
                      <p className="text-xs text-muted-foreground">Disponibile</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                      <p className={`text-lg md:text-xl font-bold ${result.percentuale >= 80 ? 'text-destructive' : result.percentuale >= 60 ? 'text-warning' : 'text-foreground'}`}>
                        {result.percentuale.toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Occupato</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted mb-2">
                    <motion.div
                      className={`h-full ${getProgressColor(result.percentuale)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${result.percentuale}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {result.numeroAiuti > 0 
                      ? `📋 ${result.numeroAiuti} aiut${result.numeroAiuti === 1 ? 'o' : 'i'} negli ultimi 3 anni`
                      : "✨ Nessun aiuto De Minimis - Plafond completo!"
                    }
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Link informativo */}
            <a 
              href="/de-minimis" 
              className="inline-flex items-center justify-center gap-1 mt-4 text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
            >
              Scopri di più sui De Minimis
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </motion.div>

        {/* CTA Buttons with parallax */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{ y: ctaY, opacity }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button 
            size="lg" 
            className="rounded-full px-8 py-6 text-lg gap-2 bg-foreground text-background hover:bg-foreground/90"
            onClick={() => setShowAziendaDialog(true)}
          >
            Registra la tua Azienda
            <ArrowRight className="h-5 w-5" />
          </Button>
          <a href="#docenti">
            <Button variant="outline" size="lg" className="rounded-full px-8 py-6 text-lg gap-2">
              <GraduationCap className="h-5 w-5" />
              Sei un Docente o un Consulente?
            </Button>
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground"
        >
          <div className="flex -space-x-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-background flex items-center justify-center text-xs font-semibold text-primary"
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <p>
            <span className="font-semibold text-foreground">+500</span> imprese già registrate
          </p>
        </motion.div>
      </div>

      <AziendaContactDialog 
        open={showAziendaDialog} 
        onOpenChange={setShowAziendaDialog} 
      />
    </section>
  );
};

export default HeroSection;
