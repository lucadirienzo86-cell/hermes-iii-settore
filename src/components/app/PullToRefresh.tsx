import { useState, useRef, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export const PullToRefresh = ({ children, onRefresh, className }: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isDragging = useRef(false);
  
  const y = useMotionValue(0);
  const pullProgress = useTransform(y, [0, PULL_THRESHOLD], [0, 1]);
  const rotate = useTransform(y, [0, PULL_THRESHOLD, MAX_PULL], [0, 180, 360]);
  const scale = useTransform(y, [0, PULL_THRESHOLD / 2, PULL_THRESHOLD], [0.6, 0.8, 1]);
  const opacity = useTransform(y, [0, PULL_THRESHOLD / 3, PULL_THRESHOLD], [0, 0.5, 1]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      // Apply resistance as user pulls further
      const resistance = Math.min(diff * 0.5, MAX_PULL);
      y.set(resistance);
    }
  };

  const handleTouchEnd = async () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const currentPull = y.get();
    
    if (currentPull >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      // Animate to loading position
      animate(y, 60, { duration: 0.2, ease: 'easeOut' });
      
      try {
        await onRefresh();
      } finally {
        // Small delay for visual feedback
        setTimeout(() => {
          animate(y, 0, { duration: 0.3, ease: 'easeOut' });
          setIsRefreshing(false);
        }, 300);
      }
    } else {
      // Spring back
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div 
        className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        style={{ 
          y: useTransform(y, [0, MAX_PULL], [-40, 40]),
          opacity 
        }}
      >
        <motion.div 
          className={cn(
            "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center",
            isRefreshing && "bg-primary/20"
          )}
          style={{ scale }}
        >
          <motion.div style={{ rotate }}>
            <RefreshCw 
              className={cn(
                "w-5 h-5 text-primary",
                isRefreshing && "animate-spin"
              )} 
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
};
