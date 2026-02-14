import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Phone, Mail, Building2, FileText, Users, Save, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

interface GestorePratiche {
  id: string;
  profile_id: string;
  nome: string;
  cognome: string;
  telefono: string | null;
  categoria: string;
  attivo: boolean;
  note_admin: string | null;
  created_at: string;
}

interface Assegnazione {
  id: string;
  gestore_id: string | null;
  docente_id: string | null;
  gestore?: { id: string; nome: string; cognome: string };
  docente?: { id: string; nome: string; cognome: string };
}

const ProfiloGestorePratiche = () => {
  const { profile, loading: authLoading } = useAuth();
  const [gestorePratiche, setGestorePratiche] = useState<GestorePratiche | null>(null);
  const [assegnazioni, setAssegnazioni] = useState<Assegnazione[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    pratiche: 0,
    aziende: 0
  });

  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    telefono: ''
  });

  useEffect(() => {
    if (profile?.id) {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    try {
      // Carica dati gestore pratiche
      const { data: gpData, error: gpError } = await supabase
        .from('gestori_pratiche')
        .select('*')
        .eq('profile_id', profile?.id)
        .maybeSingle();

      if (gpError) throw gpError;

      if (gpData) {
        setGestorePratiche(gpData);
        setFormData({
          nome: gpData.nome,
          cognome: gpData.cognome,
          telefono: gpData.telefono || ''
        });

        // Carica assegnazioni
        const { data: assegnData, error: assegnError } = await supabase
          .from('gestori_pratiche_assegnazioni')
          .select(`
            id,
            gestore_id,
            docente_id,
            gestori:gestore_id(id, nome, cognome),
            docenti:docente_id(id, nome, cognome)
          `)
          .eq('gestore_pratiche_id', gpData.id);

        if (!assegnError && assegnData) {
          const formattedAssegnazioni = assegnData.map(a => ({
            id: a.id,
            gestore_id: a.gestore_id,
            docente_id: a.docente_id,
            gestore: a.gestori as any,
            docente: a.docenti as any
          }));
          setAssegnazioni(formattedAssegnazioni);

          // Carica statistiche pratiche/aziende
          await loadStats(formattedAssegnazioni);
        }
      }
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (currentAssegnazioni: Assegnazione[]) => {
    try {
      const gestoreIds = currentAssegnazioni
        .filter(a => a.gestore_id)
        .map(a => a.gestore_id);
      const docenteIds = currentAssegnazioni
        .filter(a => a.docente_id)
        .map(a => a.docente_id);

      let aziendeCount = 0;
      let praticheCount = 0;

      // Conta aziende dei professionisti assegnati
      if (gestoreIds.length > 0) {
        const { count: gestoreAziende } = await supabase
          .from('aziende')
          .select('id', { count: 'exact', head: true })
          .in('inserita_da_gestore_id', gestoreIds as string[]);
        aziendeCount += gestoreAziende || 0;
      }

      // Conta aziende dei docenti assegnati
      if (docenteIds.length > 0) {
        const { count: docenteAziende } = await supabase
          .from('aziende')
          .select('id', { count: 'exact', head: true })
          .in('inserita_da_docente_id', docenteIds as string[]);
        aziendeCount += docenteAziende || 0;
      }

      // Conta pratiche (le RLS policies filtrano automaticamente)
      const { count: praticheTotal } = await supabase
        .from('pratiche')
        .select('id', { count: 'exact', head: true });
      praticheCount = praticheTotal || 0;

      setStats({
        aziende: aziendeCount,
        pratiche: praticheCount
      });
    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
    }
  };

  const handleSave = async () => {
    if (!gestorePratiche) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('gestori_pratiche')
        .update({
          nome: formData.nome,
          cognome: formData.cognome,
          telefono: formData.telefono || null
        })
        .eq('id', gestorePratiche.id);

      if (error) throw error;

      toast.success('Profilo aggiornato con successo');
      loadData();
    } catch (error) {
      console.error('Errore salvataggio:', error);
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!gestorePratiche) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold">Profilo non trovato</h1>
          <p className="text-muted-foreground">Il tuo profilo Gestore Pratiche non è stato configurato.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <PageHeader
          title="Il Mio Profilo"
          description={`${formData.nome} ${formData.cognome} • Gestore Pratiche`}
          icon={<User className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
            { label: 'Profilo', icon: 'profilo' }
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonna sinistra - Dati profilo */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dati Personali
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cognome">Cognome</Label>
                    <Input
                      id="cognome"
                      value={formData.cognome}
                      onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="telefono">Telefono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefono"
                      className="pl-10"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      value={profile?.email || ''}
                      disabled
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Categoria</Label>
                    <div className="mt-1">
                      <Badge variant={gestorePratiche.categoria === 'avvisi' ? 'default' : 'secondary'}>
                        {gestorePratiche.categoria === 'avvisi' ? '📋 Avvisi Fondi' : '📄 Bandi'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>Stato</Label>
                    <div className="mt-1">
                      <Badge variant={gestorePratiche.attivo ? 'default' : 'destructive'}>
                        {gestorePratiche.attivo ? '✓ Attivo' : '✗ Disattivato'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                </Button>
              </CardContent>
            </Card>

            {/* Professionisti/Docenti assegnati */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Professionisti e Docenti Assegnati
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assegnazioni.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nessuna assegnazione configurata
                  </p>
                ) : (
                  <div className="space-y-3">
                    {assegnazioni.map((assegnazione) => (
                      <div
                        key={assegnazione.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {assegnazione.gestore ? (
                            <>
                              <Briefcase className="h-5 w-5 text-blue-500" />
                              <div>
                                <p className="font-medium">
                                  {assegnazione.gestore.nome} {assegnazione.gestore.cognome}
                                </p>
                                <p className="text-xs text-muted-foreground">Professionista</p>
                              </div>
                            </>
                          ) : assegnazione.docente ? (
                            <>
                              <User className="h-5 w-5 text-purple-500" />
                              <div>
                                <p className="font-medium">
                                  {assegnazione.docente.nome} {assegnazione.docente.cognome}
                                </p>
                                <p className="text-xs text-muted-foreground">Docente</p>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Colonna destra - Statistiche */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Statistiche
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.pratiche}</p>
                      <p className="text-sm text-muted-foreground">Pratiche Gestite</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.aziende}</p>
                      <p className="text-sm text-muted-foreground">Aziende Collegate</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{assegnazioni.length}</p>
                      <p className="text-sm text-muted-foreground">Assegnazioni</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfiloGestorePratiche;
