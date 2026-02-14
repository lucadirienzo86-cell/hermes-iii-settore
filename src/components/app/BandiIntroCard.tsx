import { SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { ReactNode } from 'react';

interface BandiIntroCardProps {
  count: number;
  filterContent: ReactNode;
}

export const BandiIntroCard = ({ count, filterContent }: BandiIntroCardProps) => {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 mx-4 -mt-8 relative z-10">
      {/* Titolo */}
      <h1 className="text-primary text-3xl font-bold text-center mb-2">
        Finanza Agevolata
      </h1>
      
      {/* Sottotitolo */}
      <p className="text-gray-700 text-center text-base mb-4">
        Sfoglia i bandi di finanziamento agevolato per le tue esigenze
      </p>
      
      {/* Count + Filtro */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-gray-500 text-sm">
          {count} {count === 1 ? 'bando' : 'bandi'} disponibili
        </p>
        
        {/* Pulsante filtro */}
        <Sheet>
          <SheetTrigger className="bg-primary p-3 rounded-full hover:bg-primary/80 transition shadow-md">
            <SlidersHorizontal className="w-5 h-5 text-white" />
          </SheetTrigger>
          {filterContent}
        </Sheet>
      </div>
    </div>
  );
};
