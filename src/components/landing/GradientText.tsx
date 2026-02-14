import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
}

const GradientText = ({ children, className }: GradientTextProps) => {
  return (
    <span 
      className={cn(
        "bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient",
        className
      )}
    >
      {children}
    </span>
  );
};

export default GradientText;
