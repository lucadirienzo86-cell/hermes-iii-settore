import { motion, useScroll, useTransform } from "framer-motion";
import { TrendingUp, Euro, FileText, Bell, CheckCircle2 } from "lucide-react";
import { useRef } from "react";

const LiveDashboardPreview = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 0.95]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [5, 0, -5]);
  
  const leftBadgeX = useTransform(scrollYProgress, [0, 1], [-50, 50]);
  const rightBadgeX = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const leftBadgeY = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const rightBadgeY = useTransform(scrollYProgress, [0, 1], [-20, 20]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      style={{ y, scale, rotateX, perspective: 1000 }}
      className="relative max-w-5xl mx-auto"
    >
      {/* Browser frame */}
      <div className="rounded-3xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Browser header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-warning/60" />
            <div className="w-3 h-3 rounded-full bg-success/60" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1 rounded-lg bg-background text-xs text-muted-foreground">
              app.sonyc.it/dashboard
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-6 bg-gradient-to-br from-muted/30 to-background">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* De Minimis Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="col-span-1 md:col-span-2 p-5 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-2 mb-4">
                <Euro className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Plafond De Minimis</span>
              </div>
              <div className="flex items-end gap-6">
                <div>
                  <p className="text-3xl font-bold text-foreground">€ 195.400</p>
                  <p className="text-sm text-muted-foreground">disponibili su €300.000</p>
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "35%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-right">35% utilizzato</p>
                </div>
              </div>
            </motion.div>

            {/* Bandi Match Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="p-5 rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">Bandi Compatibili</span>
              </div>
              <p className="text-4xl font-bold">12</p>
              <p className="text-sm opacity-80">opportunità attive</p>
            </motion.div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: FileText, label: "Pratiche Attive", value: "3" },
              { icon: Bell, label: "Nuovi Alert", value: "5" },
              { icon: CheckCircle2, label: "Approvate", value: "8" },
              { icon: Euro, label: "Finanziamenti", value: "€ 45K" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="p-4 rounded-xl bg-card border border-border"
              >
                <item.icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badges with parallax */}
      <motion.div
        initial={{ opacity: 0, x: -30, y: 20 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8 }}
        style={{ x: leftBadgeX, y: leftBadgeY }}
        className="absolute -left-4 md:-left-8 top-1/4 px-4 py-2 rounded-full bg-card border border-border shadow-lg"
      >
        <span className="text-sm font-medium text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Aggiornato in tempo reale
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30, y: -20 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1 }}
        style={{ x: rightBadgeX, y: rightBadgeY }}
        className="absolute -right-4 md:-right-8 bottom-1/3 px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-lg"
      >
        <span className="text-sm font-medium">✨ AI-Powered</span>
      </motion.div>
    </motion.div>
  );
};

export default LiveDashboardPreview;
