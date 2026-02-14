import { motion, useScroll, useTransform } from "framer-motion";

const GridBackground = () => {
  const { scrollYProgress } = useScroll();
  
  const orb1Y = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const orb3Y = useTransform(scrollYProgress, [0, 1], [0, -400]);
  const orb1X = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const orb2X = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const gridOpacity = useTransform(scrollYProgress, [0, 0.3], [0.03, 0.01]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Subtle grid pattern with parallax opacity */}
      <motion.div 
        className="absolute inset-0"
        style={{
          opacity: gridOpacity,
          backgroundImage: `
            linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Gradient orbs with parallax */}
      <motion.div 
        className="absolute top-20 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl"
        style={{ y: orb1Y, x: orb1X }}
      />
      <motion.div 
        className="absolute top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-accent/20 to-transparent blur-3xl"
        style={{ y: orb2Y, x: orb2X }}
      />
      <motion.div 
        className="absolute bottom-20 left-1/3 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-secondary/10 to-transparent blur-3xl"
        style={{ y: orb3Y }}
      />
    </div>
  );
};

export default GridBackground;
