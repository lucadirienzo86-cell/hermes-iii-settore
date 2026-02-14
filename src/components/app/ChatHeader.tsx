import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HersBadge } from './HersBadge';

interface HersChatHeaderProps {
  titolo: string;
  stato?: string;
  onBack?: () => void;
}

export const HersChatHeader = ({ titolo, stato, onBack }: HersChatHeaderProps) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/app/pratiche');
    }
  };

  return (
    <header className="bg-background sticky top-0 z-40 px-4 py-3 border-b border-border/50">
      <div className="flex items-center gap-3">
        <button 
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground text-base line-clamp-1">
            {titolo}
          </h1>
          {stato && (
            <HersBadge variant="mint" className="mt-1">
              {stato}
            </HersBadge>
          )}
        </div>
        
        <button className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors">
          <MoreVertical className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
};

// Keep old export for compatibility
export const ChatHeader = ({ nomeBando }: { nomeBando: string }) => (
  <HersChatHeader titolo={nomeBando} />
);
