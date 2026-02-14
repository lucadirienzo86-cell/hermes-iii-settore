import { CheckCircle2, XCircle, AlertCircle, MapPin, Building2, Users, Calendar, TrendingUp, Receipt, Factory } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppButton } from './AppButton';

interface CriterioVisivo {
  nome: string;
  icona: React.ReactNode;
  soddisfatto: boolean;
  vincolante: boolean;
  valoreBando: string | null;
  valoreAzienda: string | null;
  match?: string[]; // per investimenti/spese
}

interface MatchingCriteriaCardProps {
  criteriVisivi: CriterioVisivo[];
  compatibilitaPercentuale: number;
  criteriSoddisfatti: number;
  criteriTotali: number;
  compatibile: boolean;
  datiMancanti: boolean;
}

export const MatchingCriteriaCard = ({
  criteriVisivi,
  compatibilitaPercentuale,
  criteriSoddisfatti,
  criteriTotali,
  compatibile,
  datiMancanti,
}: MatchingCriteriaCardProps) => {
  if (datiMancanti) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-amber-800 mb-1">Dati profilo incompleti</h3>
            <p className="text-amber-700 text-sm mb-3">
              Completa il profilo della tua azienda per vedere la compatibilità con questo bando.
            </p>
            <Link to="/app/profilo">
              <AppButton variant="secondary" className="!bg-amber-600 !text-white text-sm py-1.5">
                Completa profilo
              </AppButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const criteriVincolanti = criteriVisivi.filter(c => c.vincolante);
  const criteriFacoltativi = criteriVisivi.filter(c => !c.vincolante);

  return (
    <div className="mb-6">
      {/* Riepilogo compatibilità */}
      <div className={`rounded-2xl p-5 mb-4 ${
        !compatibile 
          ? 'bg-red-50 border border-red-200' 
          : compatibilitaPercentuale >= 70 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-amber-50 border border-amber-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-bold text-lg ${
            !compatibile ? 'text-red-800' : compatibilitaPercentuale >= 70 ? 'text-green-800' : 'text-amber-800'
          }`}>
            {!compatibile 
              ? 'Non compatibile' 
              : compatibilitaPercentuale >= 70 
                ? 'Alta compatibilità' 
                : 'Compatibilità parziale'}
          </h3>
          <div className={`text-2xl font-bold ${
            !compatibile ? 'text-red-600' : compatibilitaPercentuale >= 70 ? 'text-green-600' : 'text-amber-600'
          }`}>
            {compatibile ? `${compatibilitaPercentuale}%` : '0%'}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-white rounded-full overflow-hidden mb-2">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              !compatibile ? 'bg-red-500' : compatibilitaPercentuale >= 70 ? 'bg-green-500' : 'bg-amber-500'
            }`}
            style={{ width: `${compatibile ? compatibilitaPercentuale : 0}%` }}
          />
        </div>
        
        <p className={`text-sm ${
          !compatibile ? 'text-red-700' : compatibilitaPercentuale >= 70 ? 'text-green-700' : 'text-amber-700'
        }`}>
          {!compatibile 
            ? 'Questo bando non è adatto alla tua azienda per i requisiti vincolanti'
            : criteriTotali > 0 
              ? `${criteriSoddisfatti} criteri soddisfatti su ${criteriTotali} verificati`
              : 'Tutti i requisiti vincolanti sono soddisfatti'}
        </p>
      </div>

      {/* Criteri Vincolanti */}
      {criteriVincolanti.length > 0 && (
        <div className="bg-gray-50 rounded-2xl p-5 mb-4">
          <h4 className="text-primary font-bold text-sm mb-4 uppercase tracking-wide flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Requisiti Vincolanti
          </h4>
          <div className="space-y-3">
            {criteriVincolanti.map((criterio, idx) => (
              <CriterioRow key={idx} criterio={criterio} />
            ))}
          </div>
        </div>
      )}

      {/* Criteri Facoltativi */}
      {criteriFacoltativi.length > 0 && (
        <div className="bg-gray-50 rounded-2xl p-5">
          <h4 className="text-gray-600 font-bold text-sm mb-4 uppercase tracking-wide">
            Altri Criteri
          </h4>
          <div className="space-y-3">
            {criteriFacoltativi.map((criterio, idx) => (
              <CriterioRow key={idx} criterio={criterio} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CriterioRow = ({ criterio }: { criterio: CriterioVisivo }) => {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl ${
      criterio.soddisfatto 
        ? 'bg-green-50 border border-green-100' 
        : criterio.vincolante 
          ? 'bg-red-50 border border-red-100'
          : 'bg-amber-50 border border-amber-100'
    }`}>
      {/* Icona stato */}
      <div className="flex-shrink-0 mt-0.5">
        {criterio.soddisfatto ? (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        ) : criterio.vincolante ? (
          <XCircle className="w-5 h-5 text-red-600" />
        ) : (
          <AlertCircle className="w-5 h-5 text-amber-600" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        {/* Titolo con icona */}
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-sm ${criterio.soddisfatto ? 'text-green-700' : criterio.vincolante ? 'text-red-700' : 'text-amber-700'}`}>
            {criterio.icona}
          </span>
          <span className={`font-semibold text-sm ${
            criterio.soddisfatto ? 'text-green-800' : criterio.vincolante ? 'text-red-800' : 'text-amber-800'
          }`}>
            {criterio.nome}
            {criterio.vincolante && (
              <span className="ml-1 text-xs font-normal opacity-75">(vincolante)</span>
            )}
          </span>
        </div>
        
        {/* Dettagli */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Bando richiede:</span>
            <p className={`font-medium ${criterio.soddisfatto ? 'text-green-700' : 'text-gray-700'}`}>
              {criterio.valoreBando || 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-gray-500">La tua azienda:</span>
            <p className={`font-medium ${criterio.soddisfatto ? 'text-green-700' : criterio.vincolante ? 'text-red-700' : 'text-amber-700'}`}>
              {criterio.valoreAzienda || 'Non specificato'}
            </p>
          </div>
        </div>
        
        {/* Match specifici per investimenti/spese */}
        {criterio.match && criterio.match.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {criterio.match.map((m, idx) => (
              <span key={idx} className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                ✓ {m}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper per creare i criteri visivi da passare al componente
export const buildCriteriVisivi = (
  bando: {
    settore_ateco?: string[] | null;
    zone_applicabilita?: string[] | null;
    sede_interesse?: string[] | null;
    tipo_azienda?: string[] | null;
    numero_dipendenti?: string[] | null;
    costituzione_societa?: string[] | null;
    investimenti_finanziabili?: string[] | null;
    spese_ammissibili?: string[] | null;
  },
  azienda: {
    codici_ateco?: string[] | null;
    codice_ateco?: string | null;
    regione?: string | null;
    sede_operativa?: string | null;
    dimensione_azienda?: string | null;
    numero_dipendenti?: string | null;
    costituzione_societa?: string | null;
    investimenti_interesse?: string[] | null;
    spese_interesse?: string[] | null;
  } | null,
  dettaglioCriteri: {
    settore: boolean;
    sede: boolean;
    dimensione: boolean;
    dipendenti: boolean;
    costituzione: boolean;
    investimenti: boolean;
    spese: boolean;
  },
  investimentiMatch: string[],
  speseMatch: string[]
): CriterioVisivo[] => {
  const criteri: CriterioVisivo[] = [];
  
  const getAtecoAzienda = () => {
    if (azienda?.codici_ateco && azienda.codici_ateco.length > 0) {
      return azienda.codici_ateco.slice(0, 3).join(', ') + (azienda.codici_ateco.length > 3 ? '...' : '');
    }
    return azienda?.codice_ateco || null;
  };

  // 1. ATECO (vincolante)
  if (bando.settore_ateco && bando.settore_ateco.length > 0) {
    criteri.push({
      nome: 'Settore ATECO',
      icona: <Factory className="w-4 h-4" />,
      soddisfatto: dettaglioCriteri.settore,
      vincolante: true,
      valoreBando: bando.settore_ateco.slice(0, 3).join(', ') + (bando.settore_ateco.length > 3 ? `... (+${bando.settore_ateco.length - 3})` : ''),
      valoreAzienda: getAtecoAzienda(),
    });
  }

  // 2. Zona (vincolante)
  const zone = bando.zone_applicabilita?.length ? bando.zone_applicabilita : bando.sede_interesse;
  if (zone && zone.length > 0) {
    criteri.push({
      nome: 'Zona Geografica',
      icona: <MapPin className="w-4 h-4" />,
      soddisfatto: dettaglioCriteri.sede,
      vincolante: true,
      valoreBando: zone.includes('Tutta Italia') ? 'Tutta Italia' : zone.slice(0, 3).join(', ') + (zone.length > 3 ? `... (+${zone.length - 3})` : ''),
      valoreAzienda: azienda?.sede_operativa || azienda?.regione || null,
    });
  }

  // 3. Tipo Azienda
  if (bando.tipo_azienda && bando.tipo_azienda.length > 0) {
    criteri.push({
      nome: 'Tipo Azienda',
      icona: <Building2 className="w-4 h-4" />,
      soddisfatto: dettaglioCriteri.dimensione,
      vincolante: false,
      valoreBando: bando.tipo_azienda.join(', '),
      valoreAzienda: azienda?.dimensione_azienda || null,
    });
  }

  // 4. Dipendenti
  if (bando.numero_dipendenti && bando.numero_dipendenti.length > 0) {
    criteri.push({
      nome: 'Numero Dipendenti',
      icona: <Users className="w-4 h-4" />,
      soddisfatto: dettaglioCriteri.dipendenti,
      vincolante: false,
      valoreBando: bando.numero_dipendenti.join(', '),
      valoreAzienda: azienda?.numero_dipendenti || null,
    });
  }

  // 5. Costituzione
  if (bando.costituzione_societa && bando.costituzione_societa.length > 0) {
    criteri.push({
      nome: 'Anzianità Azienda',
      icona: <Calendar className="w-4 h-4" />,
      soddisfatto: dettaglioCriteri.costituzione,
      vincolante: false,
      valoreBando: bando.costituzione_societa.join(', '),
      valoreAzienda: azienda?.costituzione_societa || null,
    });
  }

  // 6. Investimenti
  if (bando.investimenti_finanziabili && bando.investimenti_finanziabili.length > 0) {
    criteri.push({
      nome: 'Investimenti',
      icona: <TrendingUp className="w-4 h-4" />,
      soddisfatto: dettaglioCriteri.investimenti,
      vincolante: false,
      valoreBando: bando.investimenti_finanziabili.slice(0, 3).join(', ') + (bando.investimenti_finanziabili.length > 3 ? '...' : ''),
      valoreAzienda: azienda?.investimenti_interesse?.join(', ') || null,
      match: investimentiMatch,
    });
  }

  // 7. Spese
  if (bando.spese_ammissibili && bando.spese_ammissibili.length > 0) {
    criteri.push({
      nome: 'Spese Ammissibili',
      icona: <Receipt className="w-4 h-4" />,
      soddisfatto: dettaglioCriteri.spese,
      vincolante: false,
      valoreBando: bando.spese_ammissibili.slice(0, 3).join(', ') + (bando.spese_ammissibili.length > 3 ? '...' : ''),
      valoreAzienda: azienda?.spese_interesse?.join(', ') || null,
      match: speseMatch,
    });
  }

  return criteri;
};
