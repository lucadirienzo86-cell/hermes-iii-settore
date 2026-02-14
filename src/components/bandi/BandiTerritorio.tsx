import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, Building2, Clock } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { it } from 'date-fns/locale';
import { LIVELLO_LABELS } from '@/lib/api/bandiApi';
import { useNavigate } from 'react-router-dom';

interface BandoTerritorioProps {
  limit?: number;
  showViewAll?: boolean;
}

export const BandiTerritorio = ({ limit = 5, showViewAll = true }: BandoTerritorioProps) => {
  const navigate = useNavigate();

  const { data: bandi, isLoading } = useQuery({
    queryKey: ['bandi-territorio', limit],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('bandi')
        .select('*')
        .eq('attivo', true)
        .gte('data_chiusura', today)
        .order('data_chiusura', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
  });

  const getStatusBadge = (dataChiusura: string | null) => {
    if (!dataChiusura) return null;
    
    const deadline = new Date(dataChiusura);
    const daysLeft = differenceInDays(deadline, new Date());

    if (isPast(deadline)) {
      return <Badge variant="destructive">Chiuso</Badge>;
    }
    if (daysLeft <= 7) {
      return <Badge className="bg-warning text-warning-foreground">Scade in {daysLeft}gg</Badge>;
    }
    if (daysLeft <= 30) {
      return <Badge className="bg-yellow-100 text-yellow-700">In scadenza</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700">Aperto</Badge>;
  };

  const getLivelloBadge = (livello: string | null) => {
    const colors: Record<string, string> = {
      UE: 'bg-blue-100 text-blue-700',
      NAZ: 'bg-purple-100 text-purple-700',
      REG: 'bg-orange-100 text-orange-700',
      COM: 'bg-teal-100 text-teal-700',
    };
    return (
      <Badge className={colors[livello || ''] || 'bg-muted text-muted-foreground'}>
        {LIVELLO_LABELS[livello || ''] || livello || 'N/D'}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="ist-card">
        <CardHeader>
          <CardTitle>Bandi sul Territorio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="ist-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="ist-card-header">
          <Building2 className="w-5 h-5" />
          Bandi sul Territorio
        </CardTitle>
        {showViewAll && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/trova-bandi')}
          >
            Vedi tutti
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {bandi && bandi.length > 0 ? (
          <div className="divide-y divide-border">
            {bandi.map((bando) => (
              <div key={bando.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {getLivelloBadge(bando.livello)}
                      {getStatusBadge(bando.data_chiusura)}
                    </div>
                    <h4 className="font-medium text-sm line-clamp-2 mb-1">
                      {bando.titolo}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {bando.ente && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {bando.ente}
                        </span>
                      )}
                      {bando.data_chiusura && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Scadenza: {format(new Date(bando.data_chiusura), 'dd/MM/yyyy', { locale: it })}
                        </span>
                      )}
                    </div>
                  </div>
                  {bando.link_bando && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => window.open(bando.link_bando, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nessun bando attivo sul territorio</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
