import { ArrowLeft, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BandiHeader = () => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-primary py-6 px-4">
      <div className="flex items-center justify-between">
        {/* Freccia indietro */}
        <button 
          onClick={() => navigate('/app/dashboard')}
          className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white hover:bg-primary/80 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        {/* Titolo centrato */}
        <div className="flex-1 flex justify-center">
          <span className="text-xl font-bold text-primary-foreground">Sonyc</span>
        </div>
        
        {/* Icona profilo */}
        <button 
          onClick={() => navigate('/app/profilo')}
          className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white hover:bg-primary/80 transition"
        >
          <UserCircle className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
