import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  delay?: number;
}

const FeatureCard = ({ icon: Icon, title, description, className, delay = 0 }: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={cn(
        "group relative p-8 rounded-3xl bg-card border border-border/50",
        "hover:shadow-hover hover:-translate-y-1 transition-all duration-300",
        "overflow-hidden",
        className
      )}
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Icon */}
      <div className="relative mb-5 inline-flex p-4 rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-7 w-7" />
      </div>
      
      {/* Content */}
      <h3 className="relative text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="relative text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
};

export default FeatureCard;
