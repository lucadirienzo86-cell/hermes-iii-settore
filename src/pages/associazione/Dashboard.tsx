import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAssociazione, useProLocoInfo } from '@/hooks/useAssociazione';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  LogOut, 
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  ClipboardList,
  Building2
} from 'lucide-react';
import AssociazioneDashboardCards from '@/components/associazione/AssociazioneDashboardCards';

const AssociazioneDashboardPage = () => {
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const { data: associazione, isLoading } = useAssociazione();
  const { data: proLoco } = useProLocoInfo(associazione?.pro_loco_id || null);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!isLoading && associazione && !associazione.onboarding_completato) {
      navigate('/associazione/onboarding');
    }
  }, [associazione, isLoading, navigate]);

  const isAnagraficaCompleta = associazione?.campi_completi ?? false;
  const isIscrizioneAlbo = associazione?.iscrizione_albo_comunale ?? false;

  const getStatoRegistrazioneBadge = () => {
    const stato = associazione?.stato_registrazione;
    switch (stato) {
      case 'verificata':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            <CheckCircle className="h-3 w-3 mr-1" /> Verificata
          </Badge>
        );
      case 'respinta':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertCircle className="h-3 w-3 mr-1" /> Respinta
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            <Clock className="h-3 w-3 mr-1" /> In attesa di verifica
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">{associazione?.denominazione || 'La mia Associazione'}</h1>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatoRegistrazioneBadge()}
            <Button variant="ghost" size="sm" asChild>
              <Link to="/associazione/profilo">
                <User className="h-4 w-4 mr-2" />
                Profilo
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Esci
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Banner: Non iscritta all'Albo */}
        {!isIscrizioneAlbo && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800">Iscrizione all'Albo Comunale</AlertTitle>
            <AlertDescription className="text-amber-700">
              <p className="mb-3">
                Per accedere a contributi e patrocini, richiedi l'iscrizione all'Albo Comunale.
              </p>
              <Button 
                variant="outline"
                size="sm"
                className="border-amber-400 text-amber-700 hover:bg-amber-100"
                asChild
              >
                <Link to="/associazione/profilo">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Richiedi iscrizione
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Affiliazione Pro Loco */}
        {proLoco && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border rounded-lg px-4 py-3">
            <Building2 className="h-4 w-4" />
            <span>Affiliata a: <strong className="text-foreground">{proLoco.denominazione}</strong></span>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Benvenuto nella tua area riservata
          </h2>
          <p className="text-muted-foreground">
            Da qui puoi gestire bandi, progetti, rendiconti e tutta la documentazione della tua associazione.
          </p>
        </div>

        {/* Dashboard Cards Grid */}
        <AssociazioneDashboardCards 
          bandiAperti={3}
          progettiAttivi={1}
          ultimoRendiconto={{ stato: 'in_lavorazione' }}
          abbonamentoAttivo={true}
          documentiCaricati={12}
          notifichePendenti={2}
          scadenzeImminenti={1}
        />

        {/* Status Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Anagrafica</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              {isAnagraficaCompleta ? (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-emerald-700">Completa</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-700">Incompleta</span>
                </>
              )}
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Albo Comunale</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              {isIscrizioneAlbo ? (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-emerald-700">Iscritta</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-700">Non iscritta</span>
                </>
              )}
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Tipologia</p>
            <p className="font-medium mt-1">{associazione?.tipologia || '-'}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">RUNTS</p>
            <Badge variant={associazione?.stato_runts === 'verificato' ? 'default' : 'secondary'} className="mt-1">
              {associazione?.stato_runts === 'verificato' ? 'Verificato' : 
               associazione?.stato_runts === 'non_iscritto' ? 'Non iscritto' : 'Dichiarato'}
            </Badge>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssociazioneDashboardPage;
