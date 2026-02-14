import { useState } from 'react';
import { ChevronDown, Calendar, Euro, Building2, MapPin, TrendingUp, Receipt, ExternalLink, FileText } from 'lucide-react';
import { AppButton } from './AppButton';

interface BandoDettaglioCardProps {
  nomeBando: string;
  dataInizio: string;
  dataFine: string;
  descrizione?: string | null;
  ente?: string | null;
  tipoAgevolazione?: string | null;
  importoMinimo?: number | null;
  importoMassimo?: number | null;
  tipoAzienda?: string[] | null;
  numeroDipendenti?: string[] | null;
  costituzioneSocieta?: string[] | null;
  zoneApplicabilita?: string[] | null;
  investimentiFinanziabili?: string[] | null;
  speseAmmissibili?: string[] | null;
  note?: string | null;
  linkBando?: string | null;
  pdfUrls?: string[] | null;
  praticaEsiste: boolean;
  submitting: boolean;
  onRichiestaValutazione: () => void;
  hideRequisitiSection?: boolean;
}

const formatCurrency = (value: number | null | undefined) => {
  if (!value) return null;
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
};

export const BandoDettaglioCard = ({
  nomeBando,
  dataInizio,
  dataFine,
  descrizione,
  ente,
  tipoAgevolazione,
  importoMinimo,
  importoMassimo,
  tipoAzienda,
  numeroDipendenti,
  costituzioneSocieta,
  zoneApplicabilita,
  investimentiFinanziabili,
  speseAmmissibili,
  note,
  linkBando,
  pdfUrls,
  praticaEsiste,
  submitting,
  onRichiestaValutazione,
  hideRequisitiSection = false
}: BandoDettaglioCardProps) => {
  const [showDettagli, setShowDettagli] = useState(true);

  const hasImporti = importoMinimo || importoMassimo;
  const hasRequisiti = (tipoAzienda && tipoAzienda.length > 0) || 
                       (numeroDipendenti && numeroDipendenti.length > 0) || 
                       (costituzioneSocieta && costituzioneSocieta.length > 0);
  const hasZone = zoneApplicabilita && zoneApplicabilita.length > 0;
  const hasInvestimenti = investimentiFinanziabili && investimentiFinanziabili.length > 0;
  const hasSpese = speseAmmissibili && speseAmmissibili.length > 0;
  const hasPdf = pdfUrls && pdfUrls.length > 0;

  return (
    <div className={`bg-white ${hideRequisitiSection ? '' : 'rounded-t-[40px] -mt-8'} relative z-10 px-6 pt-8 pb-6`}>
      {/* Titolo bando */}
      <h1 className="text-primary text-2xl font-bold text-center mb-4 leading-tight">
        {nomeBando}
      </h1>
      
      {/* Ente erogatore */}
      {ente && (
        <p className="text-center text-gray-600 text-base mb-4 flex items-center justify-center gap-2">
          <Building2 className="w-4 h-4" />
          {ente}
        </p>
      )}
      
      {/* Linea primaria */}
      <div className="h-1 bg-primary rounded-full mb-6"></div>

      {/* Date e Tipo Agevolazione */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Calendar className="w-4 h-4" />
            Apertura
          </div>
          <p className="font-bold text-gray-900 text-base">{dataInizio}</p>
        </div>
        <div className="bg-primary/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-primary text-sm mb-1">
            <Calendar className="w-4 h-4" />
            Chiusura
          </div>
          <p className="font-bold text-primary text-base">{dataFine}</p>
        </div>
      </div>

      {/* Tipo Agevolazione e Importi */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-5 mb-6">
        {tipoAgevolazione && (
          <div className="mb-4">
            <p className="text-gray-500 text-sm mb-1">Tipo Agevolazione</p>
            <span className="inline-block bg-primary text-white px-4 py-2 rounded-full font-semibold text-base">
              {tipoAgevolazione}
            </span>
          </div>
        )}
        
        {hasImporti && (
          <div className="flex items-center gap-2">
            <Euro className="w-5 h-5 text-primary" />
            <span className="text-gray-700 text-base">
              {importoMinimo && importoMassimo ? (
                <>Da <strong>{formatCurrency(importoMinimo)}</strong> a <strong>{formatCurrency(importoMassimo)}</strong></>
              ) : importoMassimo ? (
                <>Fino a <strong>{formatCurrency(importoMassimo)}</strong></>
              ) : (
                <>Da <strong>{formatCurrency(importoMinimo)}</strong></>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Descrizione */}
      {descrizione && (
        <div className="bg-gray-50 rounded-2xl p-5 mb-6">
          <h2 className="text-primary font-bold text-sm mb-3 uppercase tracking-wide">
            Descrizione
          </h2>
          <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
            {descrizione}
          </p>
        </div>
      )}

      {/* Toggle Dettagli */}
      <button
        onClick={() => setShowDettagli(!showDettagli)}
        className="w-full flex items-center justify-center gap-2 text-primary font-semibold text-base py-3 mb-4 hover:bg-primary/5 rounded-xl transition"
      >
        {showDettagli ? 'Nascondi dettagli' : 'Mostra tutti i dettagli'}
        <ChevronDown className={`w-5 h-5 transition-transform ${showDettagli ? 'rotate-180' : ''}`} />
      </button>

      {showDettagli && (
        <div className="space-y-5">
          {/* Zone di Applicabilità */}
          {hasZone && !hideRequisitiSection && (
            <div className="bg-gray-50 rounded-2xl p-5">
              <h2 className="text-primary font-bold text-sm mb-3 uppercase tracking-wide flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Zone di Applicabilità
              </h2>
              <div className="flex flex-wrap gap-2">
                {zoneApplicabilita.map((zona, idx) => (
                  <span key={idx} className="bg-white text-gray-700 px-3 py-1.5 rounded-full text-sm border border-gray-200 font-medium">
                    {zona}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Requisiti Azienda */}
          {hasRequisiti && !hideRequisitiSection && (
            <div className="bg-gray-50 rounded-2xl p-5">
              <h2 className="text-primary font-bold text-sm mb-3 uppercase tracking-wide flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Requisiti Azienda
              </h2>
              
              {tipoAzienda && tipoAzienda.length > 0 && (
                <div className="mb-4">
                  <p className="text-gray-500 text-sm mb-2">Tipologia</p>
                  <div className="flex flex-wrap gap-2">
                    {tipoAzienda.map((tipo, idx) => (
                      <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm border border-blue-200 font-medium">
                        {tipo}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {numeroDipendenti && numeroDipendenti.length > 0 && (
                <div className="mb-4">
                  <p className="text-gray-500 text-sm mb-2">N° Dipendenti</p>
                  <div className="flex flex-wrap gap-2">
                    {numeroDipendenti.map((n, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm border border-gray-200 font-medium">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {costituzioneSocieta && costituzioneSocieta.length > 0 && (
                <div>
                  <p className="text-gray-500 text-sm mb-2">Anzianità Azienda</p>
                  <div className="flex flex-wrap gap-2">
                    {costituzioneSocieta.map((c, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm border border-gray-200 font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Investimenti Finanziabili */}
          {hasInvestimenti && (
            <div className="bg-green-50 rounded-2xl p-5">
              <h2 className="text-green-700 font-bold text-sm mb-3 uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Investimenti Finanziabili
              </h2>
              <div className="flex flex-wrap gap-2">
                {investimentiFinanziabili.map((inv, idx) => (
                  <span key={idx} className="bg-white text-green-700 px-3 py-1.5 rounded-full text-sm border border-green-200 font-medium">
                    {inv}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Spese Ammissibili */}
          {hasSpese && (
            <div className="bg-blue-50 rounded-2xl p-5">
              <h2 className="text-blue-700 font-bold text-sm mb-3 uppercase tracking-wide flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Spese Ammissibili
              </h2>
              <div className="flex flex-wrap gap-2">
                {speseAmmissibili.map((spesa, idx) => (
                  <span key={idx} className="bg-white text-blue-700 px-3 py-1.5 rounded-full text-sm border border-blue-200 font-medium">
                    {spesa}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          {note && (
            <div className="bg-amber-50 rounded-2xl p-5">
              <h2 className="text-amber-700 font-bold text-sm mb-3 uppercase tracking-wide">
                Note e Dettagli
              </h2>
              <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                {note}
              </p>
            </div>
          )}

          {/* Link e PDF */}
          {(linkBando || hasPdf) && (
            <div className="bg-gray-50 rounded-2xl p-5">
              <h2 className="text-primary font-bold text-sm mb-3 uppercase tracking-wide">
                Documenti e Link
              </h2>
              <div className="space-y-3">
                {linkBando && (
                  <a
                    href={linkBando}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline text-base font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Vai al bando originale
                  </a>
                )}
                {hasPdf && pdfUrls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline text-base font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    Documento PDF {pdfUrls.length > 1 ? idx + 1 : ''}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pulsante richiesta valutazione */}
      <div className="mt-8">
        <AppButton
          onClick={onRichiestaValutazione}
          disabled={submitting || praticaEsiste}
          className="w-full shadow-lg"
          variant={praticaEsiste ? 'secondary' : 'primary'}
        >
          {praticaEsiste 
            ? 'Valutazione già richiesta' 
            : submitting 
            ? 'Invio in corso...' 
            : 'Richiedi valutazione pratica'}
        </AppButton>
      </div>
    </div>
  );
};
