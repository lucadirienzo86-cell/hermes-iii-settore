import { ChevronRight, TrendingUp, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BandoSimpleCardProps {
  title: string;
  description?: string;
  compatibilita?: number;
  investimentiMatch?: string[];
  speseMatch?: string[];
  onClick: () => void;
  className?: string;
}

export const BandoSimpleCard = ({ 
  title, 
  description,
  compatibilita,
  investimentiMatch = [],
  speseMatch = [],
  onClick,
  className 
}: BandoSimpleCardProps) => {
  const hasMatches = investimentiMatch.length > 0 || speseMatch.length > 0;
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-gray-100 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Titolo */}
          <h3 className="text-gray-900 font-bold text-lg mb-2 leading-tight">
            {title}
          </h3>
          
          {/* Descrizione */}
          {description && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
              {description}
            </p>
          )}
        </div>
        
        {/* Compatibilità e Freccia */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {compatibilita !== undefined && (
            <span className={cn(
              "text-sm font-bold px-2 py-1 rounded-full",
              compatibilita >= 80 ? "bg-green-100 text-green-700" :
              compatibilita >= 60 ? "bg-yellow-100 text-yellow-700" :
              "bg-orange-100 text-orange-700"
            )}>
              {compatibilita}%
            </span>
          )}
          <ChevronRight className="w-6 h-6 text-primary" />
        </div>
      </div>
      
      {/* Match badges */}
      {hasMatches && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          {/* Investimenti match */}
          {investimentiMatch.length > 0 && (
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1.5">
                {investimentiMatch.map((inv, idx) => (
                  <span 
                    key={idx}
                    className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200 font-medium"
                  >
                    {inv}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Spese match */}
          {speseMatch.length > 0 && (
            <div className="flex items-start gap-3">
              <Receipt className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1.5">
                {speseMatch.map((spesa, idx) => (
                  <span 
                    key={idx}
                    className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200 font-medium"
                  >
                    {spesa}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
