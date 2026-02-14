import { useState } from 'react';
import { 
  Building2, Users, FileText, Mail, BarChart3, 
  Clock, CheckCircle, Send, Eye, AlertTriangle, Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAssociazioniTerzoSettore } from '@/hooks/useAssociazioniTerzoSettore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { IstituzionaleLayout } from '@/layouts/IstituzionaleLayout';

const AnagraficheAssessorato = () => {
  const { data: associazioni } = useAssociazioniTerzoSettore();
  const [activeTab, setActiveTab] = useState('panoramica');

  // Query per comunicazioni
  const { data: comunicazioni } = useQuery({
    queryKey: ['comunicazioni-istituzionali'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comunicazioni_istituzionali')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Stats derivate
  const stats = {
    totaleAssociazioni: associazioni?.length || 0,
    registrazioniAutonome: associazioni?.filter((a: any) => a.fonte_dato === 'registrazione_autonoma').length || 0,
    daAlbo: associazioni?.filter((a: any) => a.fonte_dato === 'albo_comunale').length || 0,
    inAttesaVerifica: associazioni?.filter((a: any) => a.stato_albo === 'in_revisione').length || 0,
    comunicazioniInviate: comunicazioni?.filter((c: any) => c.stato === 'inviata').length || 0,
    comunicazioniAperte: comunicazioni?.filter((c: any) => c.stato === 'aperta').length || 0,
    comunicazioniCompletate: comunicazioni?.filter((c: any) => c.stato === 'completata').length || 0,
  };

  const getStatoComunicazioneBadge = (stato: string) => {
    switch (stato) {
      case 'bozza':
        return <Badge variant="outline">Bozza</Badge>;
      case 'inviata':
        return <Badge className="bg-blue-100 text-blue-700"><Send className="w-3 h-3 mr-1" />Inviata</Badge>;
      case 'aperta':
        return <Badge className="bg-emerald-100 text-emerald-700"><Eye className="w-3 h-3 mr-1" />Aperta</Badge>;
      case 'non_aperta':
        return <Badge className="bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" />Non aperta</Badge>;
      case 'completata':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Completata</Badge>;
      case 'errore':
        return <Badge className="bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Errore</Badge>;
      default:
        return <Badge variant="outline">{stato}</Badge>;
    }
  };

  return (
    <IstituzionaleLayout breadcrumbs={[{ label: 'Reportistica Semplificata' }]}>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-card border">
            <TabsTrigger value="panoramica" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Panoramica
            </TabsTrigger>
            <TabsTrigger value="comunicazioni" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Comunicazioni
            </TabsTrigger>
            <TabsTrigger value="configurazione" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurazione
            </TabsTrigger>
          </TabsList>

          <TabsContent value="panoramica">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Totale Associazioni</p>
                      <p className="text-2xl font-bold">{stats.totaleAssociazioni}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Da Albo Comunale</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.daAlbo}</p>
                    </div>
                    <Building2 className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Registrazioni Autonome</p>
                      <p className="text-2xl font-bold text-emerald-600">{stats.registrazioniAutonome}</p>
                    </div>
                    <FileText className="w-8 h-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">In Attesa Verifica</p>
                      <p className="text-2xl font-bold text-amber-600">{stats.inAttesaVerifica}</p>
                    </div>
                    <Clock className="w-8 h-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comunicazioni Stats */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Stato Comunicazioni
                </CardTitle>
                <CardDescription>
                  Monitoraggio delle comunicazioni istituzionali inviate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-blue-600">{stats.comunicazioniInviate}</p>
                    <p className="text-sm text-blue-600/80">Inviate</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-emerald-600">{stats.comunicazioniAperte}</p>
                    <p className="text-sm text-emerald-600/80">Aperte</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-green-600">{stats.comunicazioniCompletate}</p>
                    <p className="text-sm text-green-600/80">Completate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Azioni Rapide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                    <Send className="w-6 h-6" />
                    <span>Nuova Comunicazione</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Users className="w-6 h-6" />
                    <span>Gestisci Anagrafe</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                    <FileText className="w-6 h-6" />
                    <span>Esporta Dati</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                    <BarChart3 className="w-6 h-6" />
                    <span>Report Attività</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comunicazioni">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Storico Comunicazioni</CardTitle>
                  <CardDescription>Tutte le comunicazioni inviate alle associazioni</CardDescription>
                </div>
                <Button>
                  <Send className="w-4 h-4 mr-2" />
                  Nuova Comunicazione
                </Button>
              </CardHeader>
              <CardContent>
                {!comunicazioni || comunicazioni.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nessuna comunicazione inviata
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Oggetto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Destinatario</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comunicazioni.map((com: any) => (
                        <TableRow key={com.id}>
                          <TableCell className="text-sm">
                            {new Date(com.created_at).toLocaleDateString('it-IT')}
                          </TableCell>
                          <TableCell className="font-medium">{com.oggetto}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {com.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatoComunicazioneBadge(com.stato)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {com.email_destinatario || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configurazione">
            <Card>
              <CardHeader>
                <CardTitle>Configurazione Sistema</CardTitle>
                <CardDescription>
                  Impostazioni per la gestione delle comunicazioni e delle anagrafiche
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Template Email</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configura i template per le comunicazioni automatiche
                    </p>
                    <Button variant="outline">Gestisci Template</Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Import Massivo</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Carica le anagrafiche da file Excel o CSV
                    </p>
                    <Button variant="outline">Importa Dati</Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Notifiche</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configura le notifiche per nuove registrazioni
                    </p>
                    <Button variant="outline">Impostazioni Notifiche</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </IstituzionaleLayout>
  );
};

export default AnagraficheAssessorato;
