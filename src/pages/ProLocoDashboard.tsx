import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, FileText, Send, CreditCard, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProLocoLayout from '@/layouts/ProLocoLayout';
import ProLocoAssociazioni from '@/components/pro-loco/ProLocoAssociazioni';
import ProLocoInviti from '@/components/pro-loco/ProLocoInviti';
import ProLocoBandi from '@/components/pro-loco/ProLocoBandi';
import { QuoteGestione } from '@/components/pro-loco/QuoteGestione';

interface ProLocoData {
  id: string;
  denominazione: string;
  comune: string;
  provincia: string;
  numero_iscritti: number;
  quota_associativa: number;
  manu_pay_enabled: boolean;
}

interface Stats {
  associazioniAttive: number;
  quotePagate: number;
  invitiPendenti: number;
}

const ProLocoDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [proLoco, setProLoco] = useState<ProLocoData | null>(null);
  const [stats, setStats] = useState<Stats>({ associazioniAttive: 0, quotePagate: 0, invitiPendenti: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProLocoData();
    }
  }, [user]);

  const loadProLocoData = async () => {
    try {
      // Carica dati Pro Loco
      const { data: proLocoData, error: proLocoError } = await supabase
        .from('pro_loco')
        .select('*')
        .eq('profile_id', user?.id)
        .single();

      if (proLocoError) throw proLocoError;
      setProLoco(proLocoData);

      // Carica statistiche
      const { data: assocData } = await supabase
        .from('pro_loco_associazioni')
        .select('stato, quota_pagata')
        .eq('pro_loco_id', proLocoData.id);

      const { data: invitiData } = await supabase
        .from('pro_loco_inviti')
        .select('stato')
        .eq('pro_loco_id', proLocoData.id)
        .eq('stato', 'inviato');

      setStats({
        associazioniAttive: assocData?.filter(a => a.stato === 'attiva').length || 0,
        quotePagate: assocData?.filter(a => a.quota_pagata).length || 0,
        invitiPendenti: invitiData?.length || 0,
      });
    } catch (error) {
      console.error('Errore caricamento Pro Loco:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProLocoLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </ProLocoLayout>
    );
  }

  if (!proLoco) {
    return (
      <ProLocoLayout>
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Completa il tuo profilo</h2>
          <p className="text-muted-foreground mb-6">
            Per accedere alla dashboard, completa prima la registrazione della tua Pro Loco.
          </p>
          <Button onClick={() => navigate('/pro-loco/profilo')}>
            Completa Registrazione
          </Button>
        </div>
      </ProLocoLayout>
    );
  }

  return (
    <ProLocoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{proLoco.denominazione}</h1>
            <p className="text-muted-foreground">
              {proLoco.comune}, {proLoco.provincia}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/pro-loco/profilo')}>
              <Building2 className="h-4 w-4 mr-2" />
              Profilo
            </Button>
            <Button onClick={() => navigate('/trova-bandi')}>
              <Search className="h-4 w-4 mr-2" />
              Trova Bandi
            </Button>
          </div>
        </div>

        {/* Stats Cards - Clickable with navigation */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card 
            className="cursor-pointer hover:shadow-md transition-all group"
            onClick={() => {
              const tabsEl = document.querySelector('[data-state="active"][value="associazioni"]') as HTMLElement;
              if (!tabsEl) {
                // Click on the associazioni tab
                const trigger = document.querySelector('[value="associazioni"]') as HTMLElement;
                trigger?.click();
              }
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Associazioni Attive</CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  size="icon"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary hover:bg-primary/90 text-primary-foreground w-7 h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Trigger add action in the tab component
                    const trigger = document.querySelector('[value="inviti"]') as HTMLElement;
                    trigger?.click();
                  }}
                  title="Invita Associazione"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.associazioniAttive}</div>
              <p className="text-xs text-muted-foreground">Clicca per vedere l'elenco</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-all group"
            onClick={() => {
              const trigger = document.querySelector('[value="quote"]') as HTMLElement;
              trigger?.click();
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quote Pagate</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.quotePagate}</div>
              <p className="text-xs text-muted-foreground">
                su {stats.associazioniAttive} attive
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-all group"
            onClick={() => {
              const trigger = document.querySelector('[value="inviti"]') as HTMLElement;
              trigger?.click();
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inviti in Attesa</CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  size="icon"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-amber-600 hover:bg-amber-700 text-white w-7 h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    const trigger = document.querySelector('[value="inviti"]') as HTMLElement;
                    trigger?.click();
                  }}
                  title="Nuovo Invito"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Send className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.invitiPendenti}</div>
              <p className="text-xs text-muted-foreground">Clicca per vedere</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quota Associativa</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{proLoco.quota_associativa?.toFixed(2) || '0.00'}
              </div>
              {proLoco.manu_pay_enabled ? (
                <Badge variant="default" className="mt-1">Manu Pay Attivo</Badge>
              ) : (
                <Badge variant="outline" className="mt-1">Manu Pay Non Attivo</Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="associazioni" className="space-y-4">
          <TabsList>
            <TabsTrigger value="associazioni">
              <Users className="h-4 w-4 mr-2" />
              Associazioni
            </TabsTrigger>
            <TabsTrigger value="inviti">
              <Send className="h-4 w-4 mr-2" />
              Inviti
            </TabsTrigger>
            <TabsTrigger value="bandi">
              <FileText className="h-4 w-4 mr-2" />
              Bandi
            </TabsTrigger>
            <TabsTrigger value="quote">
              <CreditCard className="h-4 w-4 mr-2" />
              Quote
            </TabsTrigger>
          </TabsList>

          <TabsContent value="associazioni">
            <ProLocoAssociazioni proLocoId={proLoco.id} onUpdate={loadProLocoData} />
          </TabsContent>

          <TabsContent value="inviti">
            <ProLocoInviti proLocoId={proLoco.id} onUpdate={loadProLocoData} />
          </TabsContent>

          <TabsContent value="bandi">
            <ProLocoBandi />
          </TabsContent>

          <TabsContent value="quote">
            <QuoteGestione proLocoId={proLoco.id} quotaAnnuale={proLoco.quota_associativa || 50} />
          </TabsContent>
        </Tabs>
      </div>
    </ProLocoLayout>
  );
};

export default ProLocoDashboard;
