import { useState } from 'react';
import { CheckCircle, XCircle, FileQuestion, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface Associazione {
  id: string;
  denominazione: string;
  email: string | null;
  stato_albo?: string;
}

interface GestioneAlboDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  associazione: Associazione | null;
  action: 'approva' | 'rifiuta' | 'integrazioni' | null;
}

const actionConfig = {
  approva: {
    title: 'Approva Iscrizione all\'Albo',
    description: 'Confermi l\'approvazione dell\'iscrizione all\'Albo Comunale per questa associazione?',
    icon: CheckCircle,
    iconColor: 'text-emerald-600',
    buttonText: 'Conferma Approvazione',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700',
    templateCodice: 'APPROVAZIONE_ALBO',
    newStatus: 'attiva',
    requiresNote: false,
  },
  rifiuta: {
    title: 'Rifiuta Iscrizione all\'Albo',
    description: 'Indica la motivazione del rifiuto. L\'associazione riceverà una notifica via email.',
    icon: XCircle,
    iconColor: 'text-destructive',
    buttonText: 'Conferma Rifiuto',
    buttonClass: 'bg-destructive hover:bg-destructive/90',
    templateCodice: 'RIFIUTO_ALBO',
    newStatus: 'non_iscritta',
    requiresNote: true,
  },
  integrazioni: {
    title: 'Richiedi Integrazioni Documentali',
    description: 'Specifica quali documenti o informazioni sono necessari. L\'associazione riceverà una notifica via email.',
    icon: FileQuestion,
    iconColor: 'text-amber-600',
    buttonText: 'Invia Richiesta',
    buttonClass: 'bg-amber-600 hover:bg-amber-700',
    templateCodice: 'RICHIESTA_INTEGRAZIONI',
    newStatus: 'in_revisione',
    requiresNote: true,
  },
};

export const GestioneAlboDialog = ({ 
  open, 
  onOpenChange, 
  associazione, 
  action 
}: GestioneAlboDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!action || !associazione) return null;

  const config = actionConfig[action];
  const Icon = config.icon;

  const handleSubmit = async () => {
    if (config.requiresNote && !note.trim()) {
      toast({
        title: 'Nota richiesta',
        description: 'Inserisci una motivazione o dettaglio per procedere.',
        variant: 'destructive',
      });
      return;
    }

    if (!associazione.email) {
      toast({
        title: 'Email mancante',
        description: 'L\'associazione non ha un indirizzo email configurato.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Update association status
      const updateData: Record<string, unknown> = {
        stato_albo: config.newStatus,
      };

      if (action === 'approva') {
        updateData.iscrizione_albo_comunale = true;
        updateData.data_iscrizione_albo = new Date().toISOString().split('T')[0];
      }

      const { error: updateError } = await supabase
        .from('associazioni_terzo_settore')
        .update(updateData)
        .eq('id', associazione.id);

      if (updateError) throw updateError;

      // 2. Send notification email via edge function
      const { data: session } = await supabase.auth.getSession();
      
      const emailPayload = {
        associazioneId: associazione.id,
        templateCodice: config.templateCodice,
        email: associazione.email,
        oggetto: getEmailSubject(action, associazione.denominazione),
        corpo: getEmailBody(action, associazione.denominazione, note),
      };

      const { error: emailError } = await supabase.functions.invoke(
        'send-comunicazione-istituzionale',
        {
          body: emailPayload,
          headers: {
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
        }
      );

      if (emailError) {
        console.error('Email error:', emailError);
        // Non-blocking: log but continue
      }

      // 3. Log the action
      await supabase.from('audit_log_terzo_settore').insert({
        entity_type: 'associazione',
        entity_id: associazione.id,
        azione: action === 'approva' ? 'approvazione_albo' : 
                action === 'rifiuta' ? 'rifiuto_albo' : 'richiesta_integrazioni',
        dettagli: { note, stato_precedente: associazione.stato_albo },
      });

      // 4. Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['associazioni-terzo-settore'] });
      queryClient.invalidateQueries({ queryKey: ['terzo-settore-stats'] });

      toast({
        title: 'Operazione completata',
        description: `${config.title} eseguita con successo. L'associazione è stata notificata via email.`,
      });

      setNote('');
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Error:', error);
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Si è verificato un errore',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-muted ${config.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>{config.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {associazione.denominazione}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">{config.description}</p>

          {config.requiresNote && (
            <div className="space-y-2">
              <Label htmlFor="note">
                {action === 'rifiuta' ? 'Motivazione del rifiuto *' : 'Documenti/Informazioni richieste *'}
              </Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  action === 'rifiuta' 
                    ? 'Inserisci la motivazione del rifiuto...'
                    : 'Elenca i documenti o le informazioni necessarie...'
                }
                rows={4}
              />
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium">Notifica automatica</p>
            <p className="text-muted-foreground mt-1">
              Un'email sarà inviata a: <span className="font-mono">{associazione.email || 'N/A'}</span>
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annulla
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className={config.buttonClass}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {config.buttonText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function getEmailSubject(action: string, denominazione: string): string {
  switch (action) {
    case 'approva':
      return `Iscrizione Albo Comunale Approvata - ${denominazione}`;
    case 'rifiuta':
      return `Comunicazione Iscrizione Albo Comunale - ${denominazione}`;
    case 'integrazioni':
      return `Richiesta Integrazioni Documentali - ${denominazione}`;
    default:
      return `Comunicazione Albo Comunale - ${denominazione}`;
  }
}

function getEmailBody(action: string, denominazione: string, note: string): string {
  switch (action) {
    case 'approva':
      return `Gentile ${denominazione},

siamo lieti di comunicarVi che la Vostra richiesta di iscrizione all'Albo Comunale delle Associazioni del Terzo Settore è stata APPROVATA.

Da oggi potrete beneficiare di:
• Partecipazione ai bandi comunali riservati
• Richiesta di patrocini comunali
• Accesso a contributi e agevolazioni

Per ulteriori informazioni, non esitate a contattarci.

Cordiali saluti,
Assessorato al Terzo Settore
Comune di Cassino`;

    case 'rifiuta':
      return `Gentile ${denominazione},

in riferimento alla Vostra richiesta di iscrizione all'Albo Comunale delle Associazioni del Terzo Settore, siamo spiacenti di comunicarVi che la stessa non può essere accolta per il seguente motivo:

${note}

Potrete presentare una nuova domanda una volta risolte le problematiche sopra indicate.

Per ulteriori chiarimenti, non esitate a contattarci.

Cordiali saluti,
Assessorato al Terzo Settore
Comune di Cassino`;

    case 'integrazioni':
      return `Gentile ${denominazione},

in riferimento alla Vostra richiesta di iscrizione all'Albo Comunale delle Associazioni del Terzo Settore, Vi informiamo che è necessario integrare la documentazione con quanto segue:

${note}

Vi preghiamo di provvedere al più presto accedendo al Vostro profilo sulla piattaforma.

Cordiali saluti,
Assessorato al Terzo Settore
Comune di Cassino`;

    default:
      return note;
  }
}
