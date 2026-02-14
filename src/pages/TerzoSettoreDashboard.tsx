import { useState } from 'react';
import { Building2, FileText, Briefcase, Calendar, Wallet, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTerzoSettoreStats } from '@/hooks/useTerzoSettoreStats';
import { TSDashboardPanoramica } from '@/components/terzo-settore/TSDashboardPanoramica';
import { TSDashboardBandi } from '@/components/terzo-settore/TSDashboardBandi';
import { TSDashboardProgetti } from '@/components/terzo-settore/TSDashboardProgetti';
import { TSDashboardAttivita } from '@/components/terzo-settore/TSDashboardAttivita';
import { TSDashboardPlafond } from '@/components/terzo-settore/TSDashboardPlafond';
import { IstituzionaleLayout } from '@/layouts/IstituzionaleLayout';

const TerzoSettoreDashboard = () => {
  const [activeTab, setActiveTab] = useState('panoramica');
  const { data: stats, isLoading, error } = useTerzoSettoreStats();

  if (isLoading) {
    return (
      <IstituzionaleLayout breadcrumbs={[{ label: 'Gestione Bandi & Avvisi' }]}>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </IstituzionaleLayout>
    );
  }

  if (error || !stats) {
    return (
      <IstituzionaleLayout breadcrumbs={[{ label: 'Gestione Bandi & Avvisi' }]}>
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-destructive">Errore nel caricamento dei dati</p>
        </div>
      </IstituzionaleLayout>
    );
  }

  return (
    <IstituzionaleLayout breadcrumbs={[{ label: 'Gestione Bandi & Avvisi' }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dashboard Terzo Settore</h1>
            <p className="text-muted-foreground">Gestione Bandi e Avvisi per le Associazioni</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border">
            <TabsTrigger value="panoramica" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Panoramica</span>
            </TabsTrigger>
            <TabsTrigger value="bandi" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Bandi</span>
            </TabsTrigger>
            <TabsTrigger value="progetti" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Progetti</span>
            </TabsTrigger>
            <TabsTrigger value="attivita" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Attività</span>
            </TabsTrigger>
            <TabsTrigger value="plafond" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Plafond</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="panoramica">
            <TSDashboardPanoramica stats={stats} />
          </TabsContent>

          <TabsContent value="bandi">
            <TSDashboardBandi 
              stats={stats} 
              onCreateBando={() => console.log('Create bando')}
            />
          </TabsContent>

          <TabsContent value="progetti">
            <TSDashboardProgetti stats={stats} />
          </TabsContent>

          <TabsContent value="attivita">
            <TSDashboardAttivita stats={stats} />
          </TabsContent>

          <TabsContent value="plafond">
            <TSDashboardPlafond stats={stats} />
          </TabsContent>
        </Tabs>
      </div>
    </IstituzionaleLayout>
  );
};

export default TerzoSettoreDashboard;
