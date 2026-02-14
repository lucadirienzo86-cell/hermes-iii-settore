import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Calendar,
  Building2,
  ExternalLink,
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Filter
} from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { LIVELLO_LABELS } from '@/lib/api/bandiApi';

interface AssociazioneData {
  id: string;
  denominazione: string;
  tipologia: string;
  stato_runts: string;
  settori_intervento: string[];
}

const BandiAssociazione = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('compatibili');
  const [associazione, setAssociazione] = useState<AssociazioneData | null>(null);

  // Fetch associazione data
  useEffect(() => {
    const loadAssociazione = async () => {
      if (!profile?.id) return;

      const { data } = await supabase
        .from('associazioni_terzo_settore')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (data) {
        setAssociazione(data as AssociazioneData);
      }
    };

    loadAssociazione();
  }, [profile]);

  // Fetch bandi
  const { data: bandi, isLoading } = useQuery({
    queryKey: ['bandi-associazione'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('bandi')
        .select('*')
        .eq('attivo', true)
        .order('data_chiusura', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch comunicazioni
  const { data: comunicazioni } = useQuery({
    queryKey: ['comunicazioni-associazione', associazione?.id],
    queryFn: async () => {
      if (!associazione?.id) return [];

      const { data, error } = await supabase
        .from('comunicazioni_istituzionali')
        .select('*')
        .eq('associazione_id', associazione.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!associazione?.id,
  });

  // Calculate compatibility
  const bandiCompatibili = useMemo(() => {
    if (!bandi || !associazione) return [];

    return bandi.map(bando => {
      let score = 0;
      let totalCriteria = 0;

      // Check settori match
      if (bando.settore_ateco && bando.settore_ateco.length > 0) {
        totalCriteria++;
        const hasMatch = associazione.settori_intervento?.some(s => 
          bando.settore_ateco.includes(s)
        );
        if (hasMatch) score++;
      }

      // Check tipologia (terzo settore specific)
      if (bando.beneficiari && bando.beneficiari.length > 0) {
        totalCriteria++;
        if (bando.beneficiari.includes(associazione.tipologia) || 
            bando.beneficiari.includes('Terzo Settore')) {
          score++;
        }
      }

      // If no criteria, assume compatible
      const compatibilita = totalCriteria > 0 
        ? Math.round((score / totalCriteria) * 100) 
        : 80;

      return {
        ...bando,
        compatibilita,
        isCompatibile: compatibilita >= 50,
      };
    }).filter(b => b.isCompatibile).sort((a, b) => b.compatibilita - a.compatibilita);
  }, [bandi, associazione]);

  const getStatusBadge = (bando: { data_chiusura: string | null }) => {
    if (!bando.data_chiusura) {
      return <Badge className="bg-green-100 text-green-700">Sempre Aperto</Badge>;
    }
    
    const deadline = new Date(bando.data_chiusura);
    const daysLeft = differenceInDays(deadline, new Date());

    if (isPast(deadline)) {
      return <Badge variant="destructive">Chiuso</Badge>;
    }
    if (daysLeft <= 7) {
      return <Badge className="bg-warning text-warning-foreground">Scade in {daysLeft}gg</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700">Aperto</Badge>;
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Bandi & Opportunità</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Consulta i bandi compatibili con il tuo profilo
          </p>
        </div>

        {/* Association profile summary */}
        {associazione && (
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{associazione.denominazione}</p>
                  <p className="text-sm text-muted-foreground">
                    {associazione.tipologia} • {associazione.stato_runts || 'Non iscritto RUNTS'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compatibili" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Compatibili ({bandiCompatibili.length})
            </TabsTrigger>
            <TabsTrigger value="comunicazioni" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Comunicazioni ({comunicazioni?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Bandi Compatibili Tab */}
          <TabsContent value="compatibili" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : bandiCompatibili.length > 0 ? (
              bandiCompatibili.map((bando) => (
                <Card key={bando.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    {/* Compatibility bar */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(bando)}
                        <Badge variant="outline">
                          {LIVELLO_LABELS[bando.livello] || bando.livello}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">
                          {bando.compatibilita}%
                        </span>
                        <div className="w-16">
                          <Progress value={bando.compatibilita} className="h-2" />
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold mb-2 line-clamp-2">
                      {bando.titolo}
                    </h3>

                    {/* Description */}
                    {bando.descrizione && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {bando.descrizione}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      {bando.ente && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {bando.ente}
                        </span>
                      )}
                      {bando.data_chiusura && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(bando.data_chiusura), 'dd/MM/yyyy', { locale: it })}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {bando.link_bando && (
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => window.open(bando.link_bando, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Vai al Bando
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-1">Nessun bando compatibile</h3>
                  <p className="text-sm text-muted-foreground">
                    Completa il tuo profilo per trovare bandi compatibili
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Comunicazioni Tab */}
          <TabsContent value="comunicazioni" className="space-y-4 mt-4">
            {comunicazioni && comunicazioni.length > 0 ? (
              comunicazioni.map((com: any) => (
                <Card key={com.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        com.stato === 'inviata' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        <Bell className={`w-5 h-5 ${
                          com.stato === 'inviata' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium line-clamp-1">{com.oggetto}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {com.corpo}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(com.created_at), 'dd MMMM yyyy, HH:mm', { locale: it })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-1">Nessuna comunicazione</h3>
                  <p className="text-sm text-muted-foreground">
                    Le comunicazioni istituzionali appariranno qui
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <Card className="bg-muted/50 border-muted">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Nota Informativa</p>
                <p>
                  Questo sistema fornisce informazioni sui bandi pubblici a scopo consultivo.
                  Non costituisce consulenza legale né garantisce l'ottenimento di finanziamenti.
                  Per informazioni ufficiali, fare sempre riferimento agli enti erogatori.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default BandiAssociazione;
