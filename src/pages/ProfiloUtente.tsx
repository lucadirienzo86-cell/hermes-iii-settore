import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Building2, 
  Shield, 
  Calendar, 
  ArrowLeft,
  CheckCircle2,
  LayoutDashboard,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface ProfileData {
  id: string;
  email: string;
  nome: string | null;
  cognome: string | null;
  ruolo_istituzionale: string | null;
  ultimo_accesso: string | null;
  attivo: boolean | null;
  ente: {
    id: string;
    nome_ente: string;
    tipo_ente: string;
    stato_runts: string | null;
  } | null;
}

const ProfiloUtente = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            nome,
            cognome,
            ruolo_istituzionale,
            ultimo_accesso,
            attivo,
            ente:enti(id, nome_ente, tipo_ente, stato_runts)
          `)
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfileData(data as ProfileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Devi effettuare l'accesso per visualizzare il profilo</p>
            <Button onClick={() => navigate('/login')}>Accedi</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isInstitutional = profile.role === 'comune' || profile.role === 'assessorato_terzo_settore';
  const isAssociazione = profile.role === 'associazione';

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'comune': 'Comune',
      'assessorato_terzo_settore': 'Assessorato Terzo Settore',
      'associazione': 'Associazione',
      'admin': 'Amministratore',
      'editore': 'Editore',
      'gestore': 'Gestore',
      'docente': 'Docente',
      'azienda': 'Azienda',
      'gestore_pratiche': 'Gestore Pratiche',
    };
    return labels[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'comune' || role === 'assessorato_terzo_settore') return 'default';
    if (role === 'admin') return 'destructive';
    return 'secondary';
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Indietro
        </Button>

        {/* Profile Card */}
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {profileData?.nome && profileData?.cognome 
                      ? `${profileData.nome} ${profileData.cognome}`
                      : 'Profilo Utente'
                    }
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Mail className="w-3.5 h-3.5" />
                    {profileData?.email || user.email}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={getRoleBadgeVariant(profile.role || '')}>
                {getRoleLabel(profile.role || '')}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome
                </p>
                <p className="font-medium">{profileData?.nome || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Cognome
                </p>
                <p className="font-medium">{profileData?.cognome || '—'}</p>
              </div>
            </div>

            <Separator />

            {/* Role-specific info */}
            {isInstitutional && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Informazioni Istituzionali
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Ruolo Istituzionale</p>
                    <p className="font-medium">{profileData?.ruolo_istituzionale || 'Funzionario'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Ente di Appartenenza
                    </p>
                    <p className="font-medium">{profileData?.ente?.nome_ente || 'Comune di Cassino'}</p>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Accesso Area Istituzionale</p>
                    <p className="text-sm text-muted-foreground">Abilitato alla Dashboard Comune</p>
                  </div>
                </div>

                <Button 
                  onClick={() => navigate('/terzo-settore')}
                  className="w-full"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Vai alla Dashboard Comune
                </Button>
              </div>
            )}

            {isAssociazione && profileData?.ente && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Informazioni Associazione
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Nome Associazione</p>
                    <p className="font-medium">{profileData.ente.nome_ente}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Tipologia Ente</p>
                    <Badge variant="outline">{profileData.ente.tipo_ente}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Stato RUNTS</p>
                    <Badge 
                      variant={profileData.ente.stato_runts === 'verificato' ? 'default' : 'secondary'}
                    >
                      {profileData.ente.stato_runts || 'dichiarato'}
                    </Badge>
                  </div>
                </div>

                <Button 
                  variant="outline"
                  onClick={() => navigate('/app/bandi')}
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Visualizza Bandi Disponibili
                </Button>
              </div>
            )}

            <Separator />

            {/* Access Info */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Informazioni Accesso
              </h3>
              <div className="text-sm text-muted-foreground">
                {profileData?.ultimo_accesso ? (
                  <p>
                    Ultimo accesso: {format(new Date(profileData.ultimo_accesso), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                  </p>
                ) : (
                  <p>Primo accesso al sistema</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info note */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          I dati del profilo sono gestiti dall'amministrazione. Per modifiche contattare l'ufficio competente.
        </p>
      </div>
    </div>
  );
};

export default ProfiloUtente;
