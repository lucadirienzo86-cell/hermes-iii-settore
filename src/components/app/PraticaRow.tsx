import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PraticaRowProps {
  nomeBando: string;
  stato: string;
  unreadCount: number;
  hasUnread: boolean;
  onClick: () => void;
}

export const PraticaRow = ({ 
  nomeBando, 
  stato, 
  unreadCount, 
  hasUnread,
  onClick 
}: PraticaRowProps) => {
  return (
    <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
      {/* Card Bando */}
      <div className={cn(
        "rounded-xl shadow-sm px-3 py-2.5 flex items-center min-h-[55px]",
        hasUnread ? "bg-[#FFD68F]" : "bg-[#E5E5E5]"
      )}>
        <p className="text-gray-900 font-semibold text-xs leading-tight line-clamp-2">
          {nomeBando}
        </p>
      </div>
      
      {/* Card Stato */}
      <div className={cn(
        "rounded-xl shadow-sm px-3 py-2.5 flex items-center min-h-[55px]",
        hasUnread ? "bg-[#FFD68F]" : "bg-[#E5E5E5]"
      )}>
        <p className="text-gray-800 italic text-xs leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
          {stato}
        </p>
      </div>
      
      {/* Card Chat */}
      <div className={cn(
        "rounded-xl shadow-sm w-[60px] min-h-[55px] flex items-center justify-center",
        hasUnread ? "bg-[#FFD68F]" : "bg-[#E5E5E5]"
      )}>
        <button
          onClick={onClick}
          className="relative p-2 rounded-lg bg-white transition-all hover:scale-105"
        >
          <MessageCircle 
            className="w-5 h-5 text-white" 
            fill="white"
            stroke="#D9D9D9"
            strokeWidth={2}
          />
          
          {hasUnread && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#FF6B35] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-md">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
