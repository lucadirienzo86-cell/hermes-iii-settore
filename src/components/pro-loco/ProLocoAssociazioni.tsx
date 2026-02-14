import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, CreditCard, MoreHorizontal, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface ProLocoAssociazioniProps {
  proLocoId: string;
  onUpdate: () => void;
}

interface Associazione {
  id: string;
  associazione_id: string;
  data_adesione: string;
  stato: string;
  quota_pagata: boolean;
  data_ultimo_pagamento: string | null;
  note: string | null;
  associazione: {
    denominazione: string;
    email: string;
    telefono: string;
    tipologia: string;
  };
}

const ProLocoAssociazioni = ({ proLocoId, onUpdate }: ProLocoAssociazioniProps) => {
  const [associazioni, setAssociazioni] = useState<Associazione[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAssociazioni();
  }, [proLocoId]);

  const loadAssociazioni = async () => {
    try {
      const { data, error } = await supabase
        .from('pro_loco_associazioni')
        .select(`
          *,
          associazione:associazioni_terzo_settore(
            denominazione,
            email,
            telefono,
            tipologia
          )
        `)
        .eq('pro_loco_id', proLocoId)
        .order('data_adesione', { ascending: false });

      if (error) throw error;
      setAssociazioni(data || []);
    } catch (error) {
      console.error('Errore caricamento associazioni:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStato = async (id: string, stato: string) => {
    try {
      const { error } = await supabase
        .from('pro_loco_associazioni')
        .update({ stato })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Stato aggiornato",
        description: `Lo stato è stato modificato in "${stato}".`,
      });
      
      loadAssociazioni();
      onUpdate();
    } catch (error) {
      console.error('Errore aggiornamento stato:', error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile aggiornare lo stato.",
      });
    }
  };

  const toggleQuotaPagata = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('pro_loco_associazioni')
        .update({ 
          quota_pagata: !currentValue,
          data_ultimo_pagamento: !currentValue ? new Date().toISOString().split('T')[0] : null
        })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: !currentValue ? "Quota confermata" : "Quota annullata",
        description: !currentValue 
          ? "Il pagamento della quota è stato registrato."
          : "La registrazione del pagamento è stata annullata.",
      });
      
      loadAssociazioni();
      onUpdate();
    } catch (error) {
      console.error('Errore toggle quota:', error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile aggiornare lo stato del pagamento.",
      });
    }
  };

  const getStatoBadge = (stato: string) => {
    switch (stato) {
      case 'attiva':
        return <Badge variant="default">Attiva</Badge>;
      case 'sospesa':
        return <Badge variant="secondary">Sospesa</Badge>;
      case 'cessata':
        return <Badge variant="destructive">Cessata</Badge>;
      case 'in_attesa':
        return <Badge variant="outline">In Attesa</Badge>;
      default:
        return <Badge variant="outline">{stato}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Associazioni Affiliate
        </CardTitle>
        <CardDescription>
          Gestisci le associazioni collegate alla tua Pro Loco
        </CardDescription>
      </CardHeader>
      <CardContent>
        {associazioni.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nessuna associazione affiliata</p>
            <p className="text-sm">Invia un invito per collegare le associazioni alla tua Pro Loco</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Denominazione</TableHead>
                <TableHead>Tipologia</TableHead>
                <TableHead>Data Adesione</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Quota</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {associazioni.map((assoc) => (
                <TableRow key={assoc.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{assoc.associazione?.denominazione}</p>
                      <p className="text-xs text-muted-foreground">{assoc.associazione?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{assoc.associazione?.tipologia}</Badge>
                  </TableCell>
                  <TableCell>
                    {assoc.data_adesione 
                      ? format(new Date(assoc.data_adesione), 'dd MMM yyyy', { locale: it })
                      : '-'}
                  </TableCell>
                  <TableCell>{getStatoBadge(assoc.stato)}</TableCell>
                  <TableCell>
                    <Button
                      variant={assoc.quota_pagata ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleQuotaPagata(assoc.id, assoc.quota_pagata)}
                    >
                      {assoc.quota_pagata ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Pagata
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          In Attesa
                        </>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateStato(assoc.id, 'attiva')}>
                          Imposta Attiva
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStato(assoc.id, 'sospesa')}>
                          Sospendi
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateStato(assoc.id, 'cessata')}
                          className="text-destructive"
                        >
                          Cessa Affiliazione
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ProLocoAssociazioni;
