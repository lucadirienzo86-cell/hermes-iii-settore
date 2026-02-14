import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

export const getStatoConfig = (stato: string) => {
  const configs: Record<string, { color: string; icon: string }> = {
    // Nuovi stati workflow
    'richiesta': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '📝' },
    'presa_in_carico': { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '👤' },
    'documenti_mancanti': { color: 'bg-orange-100 text-orange-800 border-orange-300', icon: '📄' },
    'in_corso': { color: 'bg-purple-100 text-purple-800 border-purple-300', icon: '⚙️' },
    'accettata': { color: 'bg-green-100 text-green-800 border-green-300', icon: '✅' },
    'rifiutata': { color: 'bg-red-100 text-red-800 border-red-300', icon: '❌' },
    'in_erogazione': { color: 'bg-cyan-100 text-cyan-800 border-cyan-300', icon: '💰' },
    'erogata': { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: '💸' },
    // Stati legacy per compatibilità
    'bozza': { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: '📋' },
    'Generata': { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '🆕' },
    'In attesa di documentazione dal cliente': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '⏳' },
    'In revisione': { color: 'bg-purple-100 text-purple-800 border-purple-300', icon: '🔍' },
    'Protocollata': { color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: '📋' },
    'Esito Positivo': { color: 'bg-green-100 text-green-800 border-green-300', icon: '✅' },
    'Esito negativo': { color: 'bg-red-100 text-red-800 border-red-300', icon: '❌' },
    'Documentazione mancante': { color: 'bg-orange-100 text-orange-800 border-orange-300', icon: '⚠️' },
    'In attesa di Rendicontazione': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '💰' },
    'Erogata': { color: 'bg-green-100 text-green-800 border-green-300', icon: '💸' },
    'Archiviata': { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: '📦' },
    'Contattato': { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '📞' },
    'Pratica in valutazione dal cliente': { color: 'bg-cyan-100 text-cyan-800 border-cyan-300', icon: '🤔' },
    'Pratica in attesa di doc per avvio pratica': { color: 'bg-amber-100 text-amber-800 border-amber-300', icon: '📄' },
    'In attesa di raggiungimento plafond spesa per avvio pratica': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '💵' },
  };
  return configs[stato] || { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: '❓' };
};

// Labels friendly per i nuovi stati
export const getStatoLabel = (stato: string): string => {
  const labels: Record<string, string> = {
    'richiesta': 'Richiesta',
    'presa_in_carico': 'Presa in carico',
    'documenti_mancanti': 'Documenti mancanti',
    'in_corso': 'In corso',
    'accettata': 'Accettata',
    'rifiutata': 'Rifiutata',
    'in_erogazione': 'In erogazione',
    'erogata': 'Erogata',
  };
  return labels[stato] || stato;
};

interface StatoPraticaBadgeProps {
  stato: string;
  showIcon?: boolean;
  clickable?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const StatoPraticaBadge = ({ stato, showIcon = true, clickable = false, onClick }: StatoPraticaBadgeProps) => {
  const { color, icon } = getStatoConfig(stato);
  const label = getStatoLabel(stato);
  
  return (
    <Badge 
      className={cn(
        color, 
        'border text-sm px-3 py-1.5 font-medium',
        clickable && 'cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-primary/30 transition-all'
      )}
      onClick={onClick}
    >
      {showIcon && <span className="mr-1.5 text-base">{icon}</span>}
      {label}
      {clickable && <Pencil className="w-3.5 h-3.5 ml-1.5" />}
    </Badge>
  );
};
