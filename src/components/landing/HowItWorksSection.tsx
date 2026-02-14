import { motion } from "framer-motion";
import { Building2, Search, TrendingUp, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Building2,
    title: "Registra la tua Azienda",
    description: "Inserisci i dati della tua impresa e ottieni automaticamente il profilo completo grazie alla nostra integrazione con le banche dati ufficiali.",
  },
  {
    icon: Search,
    title: "Scopri i Bandi Compatibili",
    description: "Il nostro algoritmo AI analizza il tuo profilo e ti mostra solo i bandi e le agevolazioni più adatte alla tua realtà aziendale.",
  },
  {
    icon: TrendingUp,
    title: "Monitora le Opportunità",
    description: "Ricevi notifiche quando nuovi bandi compatibili vengono pubblicati o quando ci sono scadenze importanti.",
  },
  {
    icon: CheckCircle,
    title: "Presenta la Domanda",
    description: "Segui il processo guidato per preparare tutta la documentazione necessaria e presenta la tua domanda in modo semplice.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Come Funziona
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Quattro semplici passaggi per accedere ai finanziamenti giusti per la tua impresa
          </p>
        </motion.div>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-border hidden md:block" />

          <div className="space-y-12 md:space-y-24">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex flex-col md:flex-row items-center gap-6 md:gap-12 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Step number */}
                <div className="absolute left-8 md:left-1/2 md:-translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm z-10">
                  {index + 1}
                </div>

                {/* Content */}
                <div className={`flex-1 pl-20 md:pl-0 ${index % 2 === 0 ? 'md:text-right md:pr-16' : 'md:text-left md:pl-16'}`}>
                  <div className={`inline-flex p-4 rounded-2xl bg-primary/10 text-primary mb-4 ${
                    index % 2 === 0 ? 'md:ml-auto' : ''
                  }`}>
                    <step.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden md:block flex-1" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
