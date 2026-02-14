import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  Sparkles, 
  Award, 
  MapPin, 
  Building2, 
  Calendar,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Target,
  Filter,
  X
} from "lucide-react";

interface AvvisoFondo {
  id: string;
  titolo: string;
  descrizione: string | null;
  fondo_id: string;
  badge_formativi: string[] | null;
  regioni: string[] | null;
  data_apertura: string | null;
  data_chiusura: string | null;
  link_avviso: string | null;
  attivo: boolean | null;
  fondi_interprofessionali?: {
    id: string;
    nome: string;
  };
}

interface DocenteData {
  id: string;
  badge_formativi: string[] | null;
  zone_disponibilita: string[] | null;
}

interface MatchResult {
  avviso: AvvisoFondo;
  fondoNome: string;
  fondoId: string;
  matchPercentage: number;
  matchedBadges: string[];
  matchedZone: string[];
  hasBadgeMatch: boolean;
  hasZoneMatch: boolean;
}

interface Fondo {
  id: string;
  nome: string;
}

const DocenteMatching = () => {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [docente, setDocente] = useState<DocenteData | null>(null);
  const [avvisi, setAvvisi] = useState<AvvisoFondo[]>([]);
  const [fondi, setFondi] = useState<Fondo[]>([]);
  
  // Filters
  const [filterFondo, setFilterFondo] = useState<string>("all");
  const [filterMinPercentage, setFilterMinPercentage] = useState<number>(0);
  const [filterDataStato, setFilterDataStato] = useState<string>("all"); // all, aperti, in_scadenza
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'docente' && !authLoading) {
      navigate('/dashboard');
      return;
    }
    
    if (profile?.id) {
      loadData();
    }
  }, [profile, authLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load docente data
      const { data: docenteData, error: docenteError } = await supabase
        .from('docenti')
        .select('id, badge_formativi, zone_disponibilita')
        .eq('profile_id', profile?.id)
        .maybeSingle();

      if (docenteError) throw docenteError;
      setDocente(docenteData);

      // Load active avvisi with fondi info
      const { data: avvisiData, error: avvisiError } = await supabase
        .from('avvisi_fondi')
        .select(`
          id,
          titolo,
          descrizione,
          fondo_id,
          badge_formativi,
          regioni,
          data_apertura,
          data_chiusura,
          link_avviso,
          attivo,
          fondi_interprofessionali (
            id,
            nome
          )
        `)
        .eq('attivo', true);

      if (avvisiError) throw avvisiError;
      setAvvisi(avvisiData || []);

      // Load fondi for filter
      const { data: fondiData } = await supabase
        .from('fondi_interprofessionali')
        .select('id, nome')
        .eq('attivo', true)
        .order('nome');
      
      setFondi(fondiData || []);

    } catch (error: any) {
      console.error('Errore caricamento dati:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate matches
  const matches = useMemo<MatchResult[]>(() => {
    if (!docente || !avvisi.length) return [];

    const docenteBadges = docente.badge_formativi || [];
    const docenteZone = docente.zone_disponibilita || [];
    const isAllItaly = docenteZone.includes("Tutta Italia");

    return avvisi.map(avviso => {
      const avvisoBadges = avviso.badge_formativi || [];
      const avvisoRegioni = avviso.regioni || [];

      // Find matching badges
      const matchedBadges = docenteBadges.filter(b => 
        avvisoBadges.some(ab => ab.toLowerCase() === b.toLowerCase())
      );

      // Find matching zones
      const matchedZone = isAllItaly 
        ? avvisoRegioni 
        : docenteZone.filter(z => {
            const regione = z.split(" - ")[0];
            return avvisoRegioni.some(ar => 
              ar.toLowerCase() === regione.toLowerCase() ||
              ar.toLowerCase() === z.toLowerCase()
            );
          });

      const hasBadgeMatch = matchedBadges.length > 0 || avvisoBadges.length === 0;
      const hasZoneMatch = matchedZone.length > 0 || avvisoRegioni.length === 0 || isAllItaly;

      // Calculate percentage
      let percentage = 0;
      if (avvisoBadges.length > 0) {
        percentage += (matchedBadges.length / avvisoBadges.length) * 60;
      } else {
        percentage += 30; // No badge requirement
      }
      
      if (avvisoRegioni.length > 0) {
        if (isAllItaly) {
          percentage += 40;
        } else {
          percentage += (matchedZone.length > 0 ? 40 : 0);
        }
      } else {
        percentage += 20; // No zone requirement
      }

      return {
        avviso,
        fondoNome: avviso.fondi_interprofessionali?.nome || "N/A",
        fondoId: avviso.fondo_id,
        matchPercentage: Math.round(percentage),
        matchedBadges,
        matchedZone: isAllItaly ? ["Tutta Italia"] : matchedZone,
        hasBadgeMatch,
        hasZoneMatch
      };
    })
    .filter(m => m.hasBadgeMatch && m.hasZoneMatch)
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [docente, avvisi]);

  // Apply filters
  const filteredMatches = useMemo(() => {
    let result = matches;

    // Filter by fondo
    if (filterFondo !== "all") {
      result = result.filter(m => m.fondoId === filterFondo);
    }

    // Filter by percentage
    if (filterMinPercentage > 0) {
      result = result.filter(m => m.matchPercentage >= filterMinPercentage);
    }

    // Filter by date status
    if (filterDataStato !== "all") {
      const today = new Date();
      result = result.filter(m => {
        const apertura = m.avviso.data_apertura ? new Date(m.avviso.data_apertura) : null;
        const chiusura = m.avviso.data_chiusura ? new Date(m.avviso.data_chiusura) : null;
        
        if (filterDataStato === "aperti") {
          return (!apertura || apertura <= today) && (!chiusura || chiusura >= today);
        }
        if (filterDataStato === "in_scadenza") {
          if (!chiusura) return false;
          const daysUntilClose = Math.ceil((chiusura.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilClose >= 0 && daysUntilClose <= 30;
        }
        return true;
      });
    }

    return result;
  }, [matches, filterFondo, filterMinPercentage, filterDataStato]);

  const hasActiveFilters = filterFondo !== "all" || filterMinPercentage > 0 || filterDataStato !== "all";

  const resetFilters = () => {
    setFilterFondo("all");
    setFilterMinPercentage(0);
    setFilterDataStato("all");
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/D";
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const hasProfile = docente && (
    (docente.badge_formativi && docente.badge_formativi.length > 0) ||
    (docente.zone_disponibilita && docente.zone_disponibilita.length > 0)
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-background min-h-screen">
        {/* Header */}
        <div className="bg-card border-l-4 border-purple-500 rounded-lg p-8 mb-8 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Sparkles className="h-6 w-6 text-purple-500" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Avvisi Compatibili</h1>
          </div>
          <p className="text-muted-foreground">
            Avvisi fondi che corrispondono ai tuoi badge formativi e zone di disponibilità
          </p>
        </div>

        {/* Profile summary */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  I tuoi Badge Formativi
                </h3>
                <div className="flex flex-wrap gap-2">
                  {docente?.badge_formativi?.length ? (
                    docente.badge_formativi.map(badge => (
                      <Badge key={badge} className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        {badge}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Nessun badge configurato</span>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Le tue Zone di Disponibilità
                </h3>
                <div className="flex flex-wrap gap-2">
                  {docente?.zone_disponibilita?.length ? (
                    docente.zone_disponibilita.slice(0, 5).map(zona => (
                      <Badge key={zona} variant="outline">
                        {zona.includes(" - ") ? zona.split(" - ")[0] : zona}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Nessuna zona configurata</span>
                  )}
                  {(docente?.zone_disponibilita?.length || 0) > 5 && (
                    <Badge variant="outline">+{(docente?.zone_disponibilita?.length || 0) - 5}</Badge>
                  )}
                </div>
              </div>
            </div>
            {!hasProfile && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Completa il tuo profilo per vedere i matching
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                    Aggiungi badge formativi e zone di disponibilità per trovare avvisi compatibili
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate('/profilo-docente')}
                  >
                    Vai al profilo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        {hasProfile && matches.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtri
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1">
                      {[filterFondo !== "all", filterMinPercentage > 0, filterDataStato !== "all"].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground">
                    <X className="h-3 w-3" />
                    Reset
                  </Button>
                )}
              </div>
              
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="text-xs">Fondo</Label>
                    <Select value={filterFondo} onValueChange={setFilterFondo}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti i fondi</SelectItem>
                        {fondi.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Compatibilità minima: {filterMinPercentage}%</Label>
                    <Slider
                      value={[filterMinPercentage]}
                      onValueChange={(v) => setFilterMinPercentage(v[0])}
                      max={100}
                      step={10}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Stato temporale</Label>
                    <Select value={filterDataStato} onValueChange={setFilterDataStato}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti</SelectItem>
                        <SelectItem value="aperti">Attualmente aperti</SelectItem>
                        <SelectItem value="in_scadenza">In scadenza (30 gg)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {hasProfile && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {filteredMatches.length} Avvisi {hasActiveFilters && `(filtrati da ${matches.length})`}
              </h2>
            </div>

            {filteredMatches.length === 0 ? (
              <Card className="p-8 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {hasActiveFilters ? "Nessun avviso corrisponde ai filtri" : "Nessun avviso compatibile"}
                </h3>
                <p className="text-muted-foreground">
                  {hasActiveFilters 
                    ? "Prova a modificare i filtri per vedere più risultati"
                    : "Al momento non ci sono avvisi che corrispondono al tuo profilo."
                  }
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" className="mt-4" onClick={resetFilters}>
                    Rimuovi filtri
                  </Button>
                )}
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredMatches.map(({ avviso, fondoNome, matchPercentage, matchedBadges, matchedZone }) => (
                  <Card key={avviso.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        {/* Match percentage */}
                        <div className="flex-shrink-0 w-20">
                          <div className="relative w-16 h-16 mx-auto">
                            <svg className="w-16 h-16 transform -rotate-90">
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                className="text-muted/20"
                              />
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray={`${matchPercentage * 1.76} 176`}
                                className={matchPercentage >= 70 ? "text-green-500" : matchPercentage >= 50 ? "text-amber-500" : "text-orange-500"}
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                              {matchPercentage}%
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <Badge variant="secondary" className="mb-2">
                                <Building2 className="h-3 w-3 mr-1" />
                                {fondoNome}
                              </Badge>
                              <h3 className="text-lg font-semibold">{avviso.titolo}</h3>
                            </div>
                            {avviso.link_avviso && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(avviso.link_avviso!, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Dettagli
                              </Button>
                            )}
                          </div>

                          {avviso.descrizione && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {avviso.descrizione}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {formatDate(avviso.data_apertura)} - {formatDate(avviso.data_chiusura)}
                              </span>
                            </div>
                          </div>

                          <Separator className="my-3" />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                Badge Compatibili
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {matchedBadges.length > 0 ? (
                                  matchedBadges.map(b => (
                                    <Badge key={b} variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                      {b}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">Nessun requisito specifico</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                Zone Compatibili
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {matchedZone.length > 0 ? (
                                  matchedZone.slice(0, 3).map(z => (
                                    <Badge key={z} variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                      {z.includes(" - ") ? z.split(" - ")[0] : z}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">Nessun requisito specifico</span>
                                )}
                                {matchedZone.length > 3 && (
                                  <Badge variant="outline" className="text-xs">+{matchedZone.length - 3}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default DocenteMatching;
