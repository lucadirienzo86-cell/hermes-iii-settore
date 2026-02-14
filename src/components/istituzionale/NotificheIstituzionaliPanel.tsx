import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  AlertTriangle, 
  UserPlus, 
  Calendar, 
  FileText, 
  CheckCircle2,
  ExternalLink,
  Clock
} from 'lucide-react';
import { useNotificheIstituzionali, NotificaIstituzionale } from '@/hooks/useNotificheIstituzionali';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

const getNotificaIcon = (tipo: string) => {
  switch (tipo) {
    case 'nuova_associazione':
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case 'scadenza_bando':
    case 'scadenza_progetto':
    case 'scadenza_rendiconto':
      return <Calendar className="h-4 w-4 text-orange-500" />;
    case 'documento_mancante':
    case 'registrazione_anomala':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'gara_pubblicazione':
    case 'determina_pubblicazione':
      return <FileText className="h-4 w-4 text-green-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const getPrioritaBadge = (priorita: string) => {
  const colors: Record<string, string> = {
    urgente: 'bg-red-100 text-red-700 border-red-200',
    alta: 'bg-orange-100 text-orange-700 border-orange-200',
    media: 'bg-blue-100 text-blue-700 border-blue-200',
    bassa: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return colors[priorita] || colors.media;
};

interface NotificaRowProps {
  notifica: NotificaIstituzionale;
  onMarkRead: (id: string) => void;
}

const NotificaRow = ({ notifica, onMarkRead }: NotificaRowProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notifica.letta) {
      onMarkRead(notifica.id);
    }
    if (notifica.link_azione) {
      navigate(notifica.link_azione);
    }
  };

  return (
    <div 
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        notifica.letta 
          ? 'bg-white border-border hover:bg-muted/50' 
          : 'bg-blue-50/50 border-blue-200 hover:bg-blue-50'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getNotificaIcon(notifica.tipo)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-sm font-medium truncate ${!notifica.letta ? 'text-foreground' : 'text-muted-foreground'}`}>
              {notifica.titolo}
            </p>
            {!notifica.letta && (
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            )}
          </div>
          {notifica.messaggio && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {notifica.messaggio}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getPrioritaBadge(notifica.priorita)}`}>
              {notifica.priorita}
            </Badge>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(notifica.created_at), { addSuffix: true, locale: it })}
            </span>
            {notifica.link_azione && (
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificheIstituzionaliPanel = () => {
  const navigate = useNavigate();
  const { notifiche, nonLette, isLoading, segnaComeLetta } = useNotificheIstituzionali();

  if (isLoading) {
    return (
      <Card className="ist-card">
        <CardHeader className="pb-2">
          <CardTitle className="ist-card-header">
            <Bell className="h-5 w-5" />
            Notifiche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="ist-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="ist-card-header">
            <Bell className="h-5 w-5" />
            Notifiche
            {nonLette > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                {nonLette}
              </Badge>
            )}
          </CardTitle>
          {notifiche.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => navigate('/istituzionale/notifiche')}
            >
              Vedi tutte
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifiche.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nessuna notifica</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-2">
              {notifiche.slice(0, 10).map((notifica) => (
                <NotificaRow 
                  key={notifica.id} 
                  notifica={notifica} 
                  onMarkRead={(id) => segnaComeLetta.mutate(id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
