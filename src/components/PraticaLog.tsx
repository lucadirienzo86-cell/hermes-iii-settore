import { usePraticaLog } from '@/hooks/usePraticaLog';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  FileText, 
  MessageSquare, 
  Upload, 
  Trash2, 
  UserCheck, 
  RefreshCw,
  Plus,
  Clock,
  User,
  Loader2
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PraticaLogProps {
  praticaId: string;
}

const getIconForAction = (azione: string) => {
  switch (azione) {
    case 'creazione':
    case 'richiesta_pratica':
      return <Plus className="w-4 h-4" />;
    case 'cambio_stato':
      return <RefreshCw className="w-4 h-4" />;
    case 'messaggio':
      return <MessageSquare className="w-4 h-4" />;
    case 'documento_caricato':
      return <Upload className="w-4 h-4" />;
    case 'documento_eliminato':
      return <Trash2 className="w-4 h-4" />;
    case 'presa_in_carico':
      return <UserCheck className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getActionLabel = (azione: string): string => {
  switch (azione) {
    case 'creazione':
      return 'Pratica creata';
    case 'richiesta_pratica':
      return 'Pratica richiesta';
    case 'cambio_stato':
      return 'Stato modificato';
    case 'messaggio':
      return 'Messaggio inviato';
    case 'documento_caricato':
      return 'Documento caricato';
    case 'documento_eliminato':
      return 'Documento eliminato';
    case 'presa_in_carico':
      return 'Pratica presa in carico';
    case 'richiesta_documenti':
      return 'Documenti richiesti';
    default:
      return azione;
  }
};

const getUserTypeLabel = (userType: string): string => {
  switch (userType) {
    case 'azienda':
      return 'Azienda';
    case 'gestore':
      return 'Professionista';
    case 'docente':
      return 'Docente';
    case 'admin':
      return 'Amministratore';
    case 'gestore_pratiche':
      return 'Gestore Pratiche';
    case 'editore':
      return 'Editore';
    default:
      return userType;
  }
};

const getColorForAction = (azione: string): string => {
  switch (azione) {
    case 'creazione':
    case 'richiesta_pratica':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'cambio_stato':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'messaggio':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'documento_caricato':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'documento_eliminato':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'presa_in_carico':
      return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
};

export const PraticaLog = ({ praticaId }: PraticaLogProps) => {
  const { logs, loading } = usePraticaLog(praticaId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Nessuna attività registrata</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
        
        <div className="space-y-4">
          {logs.map((log, index) => (
            <div key={log.id} className="relative flex gap-4">
              {/* Icon */}
              <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${getColorForAction(log.azione)}`}>
                {getIconForAction(log.azione)}
              </div>
              
              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{getActionLabel(log.azione)}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <User className="w-3 h-3" />
                      <span>{log.user_name}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
                        {getUserTypeLabel(log.user_type)}
                      </span>
                    </div>
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.created_at), 'd MMM yyyy, HH:mm', { locale: it })}
                  </time>
                </div>
                
                {/* Details */}
                {log.dettagli && Object.keys(log.dettagli).length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                    {log.dettagli.stato_precedente && log.dettagli.stato_nuovo && (
                      <p>
                        Da <span className="font-medium">{log.dettagli.stato_precedente}</span> a{' '}
                        <span className="font-medium">{log.dettagli.stato_nuovo}</span>
                      </p>
                    )}
                    {log.dettagli.file_name && (
                      <p>File: <span className="font-medium">{log.dettagli.file_name}</span></p>
                    )}
                    {log.dettagli.anteprima && (
                      <p className="italic">"{log.dettagli.anteprima}..."</p>
                    )}
                    {log.dettagli.titolo && (
                      <p>Bando: <span className="font-medium">{log.dettagli.titolo}</span></p>
                    )}
                    {log.dettagli.note && (
                      <p>Note: {log.dettagli.note}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
};
