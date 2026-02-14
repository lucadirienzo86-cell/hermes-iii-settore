import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Bell,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight
} from 'lucide-react';

const AssociazioneNotifiche = () => {
  // Mock data
  const notifiche = [
    {
      id: '1',
      tipo: 'scadenza_bando',
      titolo: 'Bando Cultura 2025 in scadenza',
      descrizione: 'Mancano 7 giorni alla chiusura del bando. Completa la candidatura.',
      data: '2025-02-08',
      letta: false,
      urgenza: 'alta'
    },
    {
      id: '2',
      tipo: 'scadenza_rendiconto',
      titolo: 'Rendiconto da presentare',
      descrizione: 'Il rendiconto del progetto "Festival della Cultura" deve essere presentato entro 15 giorni.',
      data: '2025-02-07',
      letta: false,
      urgenza: 'media'
    },
    {
      id: '3',
      tipo: 'documento_mancante',
      titolo: 'Documento mancante',
      descrizione: 'Manca il documento "Bilancio 2024" per completare la pratica.',
      data: '2025-02-05',
      letta: true,
      urgenza: 'alta'
    },
    {
      id: '4',
      tipo: 'info',
      titolo: 'Nuovo bando disponibile',
      descrizione: 'È stato pubblicato un nuovo bando che potrebbe interessarti: "Contributi Sport 2025".',
      data: '2025-02-04',
      letta: true,
      urgenza: 'bassa'
    },
    {
      id: '5',
      tipo: 'successo',
      titolo: 'Candidatura approvata',
      descrizione: 'La tua candidatura al bando "Formazione Volontari" è stata approvata!',
      data: '2025-02-01',
      letta: true,
      urgenza: 'bassa'
    }
  ];

  const getTipoIcon = (tipo: string, urgenza: string) => {
    const colorClass = urgenza === 'alta' ? 'text-red-600' : urgenza === 'media' ? 'text-amber-600' : 'text-primary';
    
    switch (tipo) {
      case 'scadenza_bando':
        return <Calendar className={`h-5 w-5 ${colorClass}`} />;
      case 'scadenza_rendiconto':
        return <Clock className={`h-5 w-5 ${colorClass}`} />;
      case 'documento_mancante':
        return <AlertTriangle className={`h-5 w-5 ${colorClass}`} />;
      case 'successo':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      default:
        return <FileText className={`h-5 w-5 ${colorClass}`} />;
    }
  };

  const getUrgenzaBadge = (urgenza: string) => {
    switch (urgenza) {
      case 'alta':
        return <Badge className="bg-red-100 text-red-800">Urgente</Badge>;
      case 'media':
        return <Badge className="bg-amber-100 text-amber-800">Attenzione</Badge>;
      default:
        return null;
    }
  };

  const notificheNonLette = notifiche.filter(n => !n.letta).length;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/associazione/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <div>
                  <h1 className="text-xl font-bold">Notifiche</h1>
                  <p className="text-sm text-muted-foreground">
                    {notificheNonLette > 0 ? `${notificheNonLette} da leggere` : 'Tutto letto'}
                  </p>
                </div>
              </div>
            </div>
            {notificheNonLette > 0 && (
              <Button variant="outline" size="sm">
                Segna tutte come lette
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Riepilogo scadenze */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-800">2</p>
                <p className="text-sm text-red-700">Scadenze urgenti</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-amber-800">1</p>
                <p className="text-sm text-amber-700">Rendiconti in scadenza</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-800">1</p>
                <p className="text-sm text-blue-700">Documenti mancanti</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista notifiche */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tutte le notifiche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {notifiche.map((notifica) => (
                <div 
                  key={notifica.id} 
                  className={`flex items-start gap-4 py-4 first:pt-0 last:pb-0 cursor-pointer hover:bg-muted/50 -mx-4 px-4 transition-colors ${!notifica.letta ? 'bg-primary/5' : ''}`}
                >
                  <div className={`p-2 rounded-lg ${notifica.urgenza === 'alta' ? 'bg-red-100' : notifica.urgenza === 'media' ? 'bg-amber-100' : 'bg-muted'}`}>
                    {getTipoIcon(notifica.tipo, notifica.urgenza)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-medium ${!notifica.letta ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notifica.titolo}
                      </p>
                      {!notifica.letta && (
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                      )}
                      {getUrgenzaBadge(notifica.urgenza)}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notifica.descrizione}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notifica.data).toLocaleDateString('it-IT', { 
                        day: 'numeric', 
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AssociazioneNotifiche;
