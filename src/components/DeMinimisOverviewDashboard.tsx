import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  RefreshCw, 
  AlertTriangle, 
  Shield, 
  Euro,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Database,
  Play,
  Square
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { useAziendeDeMinimis, MASSIMALE_DEMINIMIS } from "@/hooks/useAziendeDeMinimis";
import { useBulkRnaCheck } from "@/hooks/useBulkRnaCheck";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
};

interface DeMinimisOverviewDashboardProps {
  title?: string;
  showBulkCheck?: boolean;
}

export const DeMinimisOverviewDashboard = ({
  title = "Status De Minimis Aziende",
  showBulkCheck = true
}: DeMinimisOverviewDashboardProps) => {
  const navigate = useNavigate();
  const { aziende, loading, error, summary, reload } = useAziendeDeMinimis();
  const { result: bulkResult, runBulkCheck, cancelCheck } = useBulkRnaCheck();
  const [showAll, setShowAll] = useState(false);

  const getStatusBadge = (percentuale: number) => {
    if (percentuale > 95) {
      return <Badge variant="destructive" className="font-semibold">Critico</Badge>;
    } else if (percentuale > 80) {
      return <Badge className="bg-amber-500 hover:bg-amber-600 font-semibold">Attenzione</Badge>;
    } else if (percentuale > 50) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 font-semibold">Moderato</Badge>;
    } else if (percentuale > 0) {
      return <Badge className="bg-green-500 hover:bg-green-600 font-semibold">Basso</Badge>;
    }
    return <Badge variant="secondary">Nessuno</Badge>;
  };

  const getProgressColor = (percentuale: number) => {
    if (percentuale > 95) return "bg-red-500";
    if (percentuale > 80) return "bg-amber-500";
    if (percentuale > 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const displayedAziende = showAll ? aziende : aziende.slice(0, 10);
  const aziendeWithWarnings = aziende.filter(a => a.hasWarning || a.hasDanger);

  const handleBulkCheck = async () => {
    await runBulkCheck();
    reload();
  };

  if (loading && !bulkResult.isLoading) {
    return (
      <Card className="bg-card border border-border shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border border-border shadow-sm">
        <CardContent className="flex items-center justify-center py-12 text-destructive">
          <AlertTriangle className="h-6 w-6 mr-2" />
          <span>{error}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>
            Panoramica de minimis e plafond disponibile per le aziende
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {showBulkCheck && !bulkResult.isLoading && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBulkCheck}
              className="gap-2"
            >
              <Database className="h-4 w-4" />
              Aggiorna RNA
            </Button>
          )}
          {bulkResult.isLoading && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={cancelCheck}
              className="gap-2"
            >
              <Square className="h-4 w-4" />
              Annulla
            </Button>
          )}
          <Button 
            variant="outline" 
            size="icon" 
            onClick={reload}
            disabled={loading || bulkResult.isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bulk Check */}
        {bulkResult.isLoading && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifica RNA in corso...
              </span>
              <span className="font-medium">{bulkResult.progress}%</span>
            </div>
            <Progress value={bulkResult.progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{bulkResult.currentAzienda || 'Inizializzazione...'}</span>
              <span>
                {bulkResult.processed}/{bulkResult.total} aziende • 
                {bulkResult.success} OK • {bulkResult.errors} errori
              </span>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-muted/30 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-foreground">{summary.totaleAziende}</div>
            <div className="text-xs text-muted-foreground">Aziende Totali</div>
          </div>
          <div className="bg-muted/30 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-primary">{summary.aziendeConRna}</div>
            <div className="text-xs text-muted-foreground">Con RNA Salvato</div>
          </div>
          <div className="bg-amber-500/10 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-amber-600">{summary.aziendeWarning}</div>
            <div className="text-xs text-muted-foreground">Attenzione (&gt;80%)</div>
          </div>
          <div className="bg-red-500/10 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{summary.aziendeDanger}</div>
            <div className="text-xs text-muted-foreground">Critico (&gt;95%)</div>
          </div>
          <div className="bg-muted/30 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(summary.totaleDeMinimisUtilizzato)}
            </div>
            <div className="text-xs text-muted-foreground">Totale Utilizzato</div>
          </div>
        </div>

        {/* Warnings Section */}
        {aziendeWithWarnings.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 h-auto bg-amber-500/10 hover:bg-amber-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">{aziendeWithWarnings.length} aziende richiedono attenzione</span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="space-y-2">
                {aziendeWithWarnings.map(azienda => (
                  <div 
                    key={azienda.id}
                    className={`p-3 rounded-lg flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity ${
                      azienda.hasDanger ? 'bg-red-500/10 border border-red-200' : 'bg-amber-500/10 border border-amber-200'
                    }`}
                    onClick={() => navigate(`/aziende/${azienda.id}`)}
                  >
                    <div>
                      <span className="font-medium">{azienda.ragione_sociale}</span>
                      <span className="text-muted-foreground text-sm ml-2">P.IVA: {azienda.partita_iva}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${azienda.hasDanger ? 'text-red-600' : 'text-amber-600'}`}>
                        {azienda.percentualePlafond}%
                      </span>
                      <span className="text-sm">{formatCurrency(azienda.totaleDeMinimis3Anni)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Table */}
        {aziende.length > 0 ? (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Azienda</TableHead>
                  <TableHead>P.IVA</TableHead>
                  <TableHead className="text-right">De Minimis (3 anni)</TableHead>
                  <TableHead className="text-center">Plafond</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ultimo Agg.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedAziende.map((azienda) => (
                  <TableRow 
                    key={azienda.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/aziende/${azienda.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {azienda.ragione_sociale}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">
                      {azienda.partita_iva}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Euro className="h-3 w-3 text-muted-foreground" />
                        {formatCurrency(azienda.totaleDeMinimis3Anni)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-medium">{azienda.percentualePlafond}%</span>
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getProgressColor(azienda.percentualePlafond)}`}
                            style={{ width: `${Math.min(azienda.percentualePlafond, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(azienda.percentualePlafond)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {azienda.hasRnaData ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-muted-foreground">
                              {formatDate(azienda.ultimoAggiornamento)}
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Mai verificato</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nessuna azienda trovata</p>
          </div>
        )}

        {/* Show more button */}
        {aziende.length > 10 && (
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => setShowAll(!showAll)}
              className="gap-2"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Mostra meno
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Mostra tutte ({aziende.length} aziende)
                </>
              )}
            </Button>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-4 border-t">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>0-50% Basso</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>51-80% Moderato</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>81-95% Attenzione</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>&gt;95% Critico</span>
          </div>
          <div className="ml-auto text-muted-foreground">
            Massimale De Minimis: {formatCurrency(MASSIMALE_DEMINIMIS)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
