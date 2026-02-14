import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, Mail, Phone, MapPin, Calendar, 
  FileText, MessageSquare, History, CheckCircle, AlertCircle,
  Send, RefreshCw, Clock, User, Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { IstituzionaleLayout } from '@/layouts/IstituzionaleLayout';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Associazione {
  id: string;
  denominazione: string;
  codice_fiscale: string | null;
  partita_iva: string | null;
  tipologia: string;
  email: string | null;
  pec: string | null;
  telefono: string | null;
  indirizzo: string | null;
  comune: string | null;
  descrizione: string | null;
  stato_runts: string | null;
  stato_albo: string | null;
  fonte_dato: string | null;
  campi_completi: boolean | null;
  data_iscrizione_albo: string | null;
  data_costituzione: string | null;
  data_registrazione: string | null;
  settori_intervento: string[] | null;
  numero_iscritti: number | null;
  created_at: string;
  updated_at: string | null;
}

interface Comunicazione {
  id: string;
  oggetto: string;
  tipo: string;
  stato: string;
  data_invio: string | null;
  data_apertura: string | null;
  created_at: string;
}

interface AuditLog {
  id: string;
  azione: string;
  dettagli: unknown;
  created_at: string;
  eseguito_da: string | null;
}

const statoAlboConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  precaricata: { label: 'Precaricata', color: 'bg-gray-100 text-gray-700', icon: <Clock className="w-3 h-3" /> },
  attiva: { label: 'Attiva', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="w-3 h-3" /> },
  non_iscritta: { label: 'Non Iscritta', color: 'bg-amber-100 text-amber-700', icon: <AlertCircle className="w-3 h-3" /> },
  invitata: { label: 'Invitata', color: 'bg-blue-100 text-blue-700', icon: <Mail className="w-3 h-3" /> },
  in_revisione: { label: 'In Revisione', color: 'bg-purple-100 text-purple-700', icon: <FileText className="w-3 h-3" /> },
};

const AssociazioneDettaglio = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [associazione, setAssociazione] = useState<Associazione | null>(null);
  const [comunicazioni, setComunicazioni] = useState<Comunicazione[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteInterne, setNoteInterne] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAssociazione();
      fetchComunicazioni();
      fetchAuditLog();
    }
  }, [id]);

  const fetchAssociazione = async () => {
    try {
      const { data, error } = await supabase
        .from('associazioni_terzo_settore')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setAssociazione(data);
    } catch (error) {
      console.error('Error fetching associazione:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i dati dell\'associazione',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComunicazioni = async () => {
    try {
      const { data, error } = await supabase
        .from('comunicazioni_istituzionali')
        .select('id, oggetto, tipo, stato, data_invio, data_apertura, created_at')
        .eq('associazione_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComunicazioni(data || []);
    } catch (error) {
      console.error('Error fetching comunicazioni:', error);
    }
  };

  const fetchAuditLog = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_log_terzo_settore')
        .select('*')
        .eq('entity_type', 'associazione')
        .eq('entity_id', id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLog(data || []);
    } catch (error) {
      console.error('Error fetching audit log:', error);
    }
  };

  const handleUpdateStatoAlbo = async (nuovoStato: string) => {
    if (!associazione) return;

    const validStati = ['precaricata', 'attiva', 'non_iscritta', 'invitata', 'in_revisione'] as const;
    type StatoAlbo = typeof validStati[number];
    
    if (!validStati.includes(nuovoStato as StatoAlbo)) return;

    try {
      const { error } = await supabase
        .from('associazioni_terzo_settore')
        .update({ 
          stato_albo: nuovoStato as StatoAlbo,
          data_iscrizione_albo: nuovoStato === 'attiva' ? new Date().toISOString().split('T')[0] : associazione.data_iscrizione_albo
        })
        .eq('id', associazione.id);

      if (error) throw error;

      setAssociazione({ ...associazione, stato_albo: nuovoStato });
      toast({
        title: 'Stato aggiornato',
        description: `Lo stato è stato modificato in "${statoAlboConfig[nuovoStato]?.label || nuovoStato}"`,
      });
      fetchAuditLog();
    } catch (error) {
      console.error('Error updating stato:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile aggiornare lo stato',
        variant: 'destructive',
      });
    }
  };

  const handleInviaInvito = async (templateCodice: string) => {
    if (!associazione?.email) {
      toast({
        title: 'Errore',
        description: 'L\'associazione non ha un indirizzo email',
        variant: 'destructive',
      });
      return;
    }

    setSendingInvite(true);
    try {
      const { error } = await supabase.functions.invoke('send-comunicazione-istituzionale', {
        body: {
          associazioneId: associazione.id,
          templateCodice,
          email: associazione.email,
        },
      });

      if (error) throw error;

      toast({
        title: 'Comunicazione inviata',
        description: 'L\'email è stata inviata con successo',
      });

      // Update stato if sending invite
      if (templateCodice === 'INVITO_REGISTRAZIONE' && associazione.stato_albo === 'precaricata') {
        await handleUpdateStatoAlbo('invitata');
      }

      fetchComunicazioni();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile inviare la comunicazione',
        variant: 'destructive',
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const getStatoInfo = (statoAlbo: string | null | undefined) => {
    return statoAlboConfig[statoAlbo || 'precaricata'] || statoAlboConfig.precaricata;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: it });
    } catch {
      return dateString;
    }
  };

  const getAzioneLabel = (azione: string) => {
    const labels: Record<string, string> = {
      creazione: 'Creazione anagrafica',
      cambio_stato_albo: 'Modifica stato Albo',
      anagrafica_completata: 'Anagrafica completata',
      invio_comunicazione: 'Comunicazione inviata',
      cambio_stato_comunicazione: 'Stato comunicazione modificato',
    };
    return labels[azione] || azione;
  };

  if (loading) {
    return (
      <IstituzionaleLayout breadcrumbs={[
        { label: 'Anagrafe Associazioni', href: '/anagrafe-associazioni' },
        { label: 'Caricamento...' }
      ]}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Caricamento...</div>
        </div>
      </IstituzionaleLayout>
    );
  }

  if (!associazione) {
    return (
      <IstituzionaleLayout breadcrumbs={[
        { label: 'Anagrafe Associazioni', href: '/anagrafe-associazioni' },
        { label: 'Non trovata' }
      ]}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Associazione non trovata</p>
            <Button onClick={() => navigate('/anagrafe-associazioni')}>
              Torna all'anagrafe
            </Button>
          </div>
        </div>
      </IstituzionaleLayout>
    );
  }

  const statoInfo = getStatoInfo(associazione.stato_albo);

  return (
    <IstituzionaleLayout breadcrumbs={[
      { label: 'Anagrafe Associazioni', href: '/anagrafe-associazioni' },
      { label: associazione.denominazione }
    ]}>
      <div className="space-y-6">
        {/* Header Card */}
        <Card className="ist-card">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Scheda Associazione: {associazione.denominazione}</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {associazione.tipologia} • CF: {associazione.codice_fiscale || 'N/D'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Stato Attuale:</span>
                  <Badge className={`${statoInfo.color.includes('emerald') ? 'ist-badge-success' : statoInfo.color.includes('amber') ? 'ist-badge-warning' : 'ist-badge-info'} text-sm px-3 py-1`}>
                    {statoInfo.label}
                  </Badge>
                </div>
                <Select value={associazione.stato_albo || 'precaricata'} onValueChange={handleUpdateStatoAlbo}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Cambia stato" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statoAlboConfig).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="dati" className="space-y-6">
          <TabsList className="bg-card border">
            <TabsTrigger value="dati" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Dati Generali</span>
              <span className="sm:hidden">Dati</span>
            </TabsTrigger>
            <TabsTrigger value="documentazione" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Documentazione (Fascicolo)</span>
              <span className="sm:hidden">Doc.</span>
            </TabsTrigger>
            <TabsTrigger value="storico" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Storico & Protocollo</span>
              <span className="sm:hidden">Log</span>
            </TabsTrigger>
            <TabsTrigger value="comunicazioni" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Partecipazione Bandi</span>
              <span className="sm:hidden">Bandi</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Dati Anagrafici */}
          <TabsContent value="dati">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Informazioni Generali
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Denominazione</Label>
                      <p className="font-medium">{associazione.denominazione}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Tipologia</Label>
                      <p className="font-medium">{associazione.tipologia}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Codice Fiscale</Label>
                      <p className="font-mono">{associazione.codice_fiscale || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Partita IVA</Label>
                      <p className="font-mono">{associazione.partita_iva || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Data Costituzione</Label>
                      <p>{associazione.data_costituzione ? format(new Date(associazione.data_costituzione), 'dd/MM/yyyy') : '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Numero Iscritti</Label>
                      <p>{associazione.numero_iscritti || '-'}</p>
                    </div>
                  </div>

                  {associazione.descrizione && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Descrizione Attività</Label>
                      <p className="text-sm mt-1">{associazione.descrizione}</p>
                    </div>
                  )}

                  {associazione.settori_intervento && associazione.settori_intervento.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Settori di Intervento</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {associazione.settori_intervento.map((settore, idx) => (
                          <Badge key={idx} variant="secondary">{settore}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Contatti
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{associazione.email || '-'}</span>
                    </div>
                    {associazione.pec && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{associazione.pec} (PEC)</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{associazione.telefono || '-'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">
                        {associazione.indirizzo || '-'}
                        {associazione.comune && <>, {associazione.comune}</>}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Completezza Dati
                      </span>
                      {associazione.campi_completi ? (
                        <Badge className="bg-emerald-100 text-emerald-700">Completi</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700">Incompleti</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        {associazione.denominazione ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                        <span>Denominazione</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {associazione.codice_fiscale ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                        <span>Codice Fiscale</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {associazione.email ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                        <span>Email</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {associazione.telefono ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                        <span>Telefono</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {associazione.indirizzo ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                        <span>Indirizzo</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Stato Amministrativo */}
          <TabsContent value="stato">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Stato Iscrizione Albo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Stato attuale</p>
                      <Badge className={`${statoInfo.color} flex items-center gap-1 mt-1`}>
                        {statoInfo.icon}
                        {statoInfo.label}
                      </Badge>
                    </div>
                    {associazione.data_iscrizione_albo && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Data iscrizione</p>
                        <p className="font-medium">{format(new Date(associazione.data_iscrizione_albo), 'dd/MM/yyyy')}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Modifica Stato</Label>
                    <Select
                      value={associazione.stato_albo || 'precaricata'}
                      onValueChange={handleUpdateStatoAlbo}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statoAlboConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-2">
                              {config.icon}
                              {config.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Stato RUNTS</p>
                      <Badge variant="outline" className="mt-1">
                        {associazione.stato_runts === 'verificato' ? 'Verificato' : 
                         associazione.stato_runts === 'non_iscritto' ? 'Non Iscritto' : 'Dichiarato'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fonte Dato</p>
                      <Badge variant="outline" className="mt-1">
                        {associazione.fonte_dato === 'albo_comunale' ? 'Albo Comunale' : 'Registrazione Autonoma'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Note Interne
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Le note interne sono visibili solo agli operatori del Comune.
                  </p>
                  <Textarea
                    placeholder="Inserisci note interne sull'associazione..."
                    value={noteInterne}
                    onChange={(e) => setNoteInterne(e.target.value)}
                    rows={5}
                  />
                  <Button variant="outline" className="w-full" disabled>
                    Salva Note (in sviluppo)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 3: Comunicazioni */}
          <TabsContent value="comunicazioni">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Storico Comunicazioni
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {comunicazioni.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nessuna comunicazione inviata
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {comunicazioni.map((com) => (
                        <div key={com.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              com.stato === 'aperta' ? 'bg-emerald-500' :
                              com.stato === 'inviata' ? 'bg-blue-500' :
                              com.stato === 'errore' ? 'bg-red-500' : 'bg-gray-400'
                            }`} />
                            <div>
                              <p className="font-medium text-sm">{com.oggetto}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(com.data_invio || com.created_at)}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {com.stato}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Invia Comunicazione
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Seleziona un template per inviare una comunicazione ufficiale.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleInviaInvito('INVITO_REGISTRAZIONE')}
                    disabled={sendingInvite || !associazione.email}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Invito Registrazione
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleInviaInvito('SOLLECITO_DATI')}
                    disabled={sendingInvite || !associazione.email}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sollecito Dati
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleInviaInvito('RICHIESTA_ISCRIZIONE_ALBO')}
                    disabled={sendingInvite || !associazione.email}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Istruzioni Iscrizione Albo
                  </Button>
                  {!associazione.email && (
                    <p className="text-xs text-amber-600">
                      ⚠️ Nessuna email disponibile per questa associazione
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 4: Storico */}
          <TabsContent value="storico">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Log Eventi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {auditLog.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nessun evento registrato
                  </p>
                ) : (
                  <div className="space-y-4">
                    {auditLog.map((log) => (
                      <div key={log.id} className="flex items-start gap-4 p-4 border-l-2 border-blue-500 bg-muted/50 rounded-r-lg">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{getAzioneLabel(log.azione)}</p>
                          {log.dettagli && Object.keys(log.dettagli).length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {JSON.stringify(log.dettagli)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {formatDate(log.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </IstituzionaleLayout>
  );
};

export default AssociazioneDettaglio;
