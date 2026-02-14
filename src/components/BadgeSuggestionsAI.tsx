import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  Sparkles, Loader2, ChevronDown, ChevronUp, Check, 
  RefreshCw, Lightbulb, X
} from "lucide-react";

interface BadgeSuggestion {
  badge: string;
  rilevanza: 'alta' | 'media' | 'bassa';
  motivazione: string;
  categoria?: string | null;
  count?: number;
}

interface BadgeSuggestionsAIProps {
  codiciAteco: string[];
  descrizioneAttivita?: string;
  dimensioneAzienda?: string;
  badgeDisponibili: { nome: string; descrizione?: string | null; categoria?: string | null }[];
  selectedBadges: string[];
  onBadgesChange: (badges: string[]) => void;
  autoFetch?: boolean; // Trigger automatico dopo PDF parsing
  onAutoFetchComplete?: () => void; // Callback quando auto-fetch completato
}

export function BadgeSuggestionsAI({
  codiciAteco,
  descrizioneAttivita,
  dimensioneAzienda,
  badgeDisponibili,
  selectedBadges,
  onBadgesChange,
  autoFetch = false,
  onAutoFetchComplete
}: BadgeSuggestionsAIProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<BadgeSuggestion[]>([]);
  const [motivazioneGenerale, setMotivazioneGenerale] = useState("");
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedMotivations, setExpandedMotivations] = useState<Set<string>>(new Set());
  const hasAutoFetched = useRef(false);

  const canSuggest = codiciAteco.length > 0;

  // Auto-fetch quando richiesto (dopo PDF parsing)
  useEffect(() => {
    if (autoFetch && canSuggest && !loading && suggestions.length === 0 && !hasAutoFetched.current) {
      hasAutoFetched.current = true;
      fetchSuggestionsAuto();
    }
  }, [autoFetch, canSuggest]);

  // Reset hasAutoFetched quando codici ATECO cambiano significativamente
  useEffect(() => {
    hasAutoFetched.current = false;
  }, [codiciAteco.join(',')]);

  const fetchSuggestionsAuto = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-badge-formativi', {
        body: {
          codici_ateco: codiciAteco,
          descrizione_attivita: descrizioneAttivita,
          dimensione_azienda: dimensioneAzienda,
          badge_disponibili: badgeDisponibili.map(b => ({
            nome: b.nome,
            descrizione: b.descrizione,
            categoria: b.categoria
          }))
        }
      });

      if (error) throw error;

      if (data?.success && data?.suggerimenti) {
        setSuggestions(data.suggerimenti);
        setMotivazioneGenerale(data.motivazione_generale || "");
        
        // Auto-applica badge ad alta rilevanza
        const highRelevanceBadges = data.suggerimenti
          .filter((s: BadgeSuggestion) => s.rilevanza === 'alta')
          .map((s: BadgeSuggestion) => s.badge);
        
        if (highRelevanceBadges.length > 0) {
          const newBadges = [...new Set([...selectedBadges, ...highRelevanceBadges])];
          onBadgesChange(newBadges);
          setSelectedSuggestions(new Set(highRelevanceBadges));
          
          toast({
            title: "Badge precompilati con AI!",
            description: `${highRelevanceBadges.length} badge ad alta rilevanza aggiunti automaticamente`
          });
        }
        
        setShowSuggestions(true);
      }
    } catch (error: any) {
      console.error('Errore auto-suggerimenti AI:', error);
    } finally {
      setLoading(false);
      onAutoFetchComplete?.();
    }
  };

  const fetchSuggestions = async () => {
    if (!canSuggest) {
      toast({
        title: "Seleziona almeno un codice ATECO",
        description: "I suggerimenti si basano sui codici ATECO dell'azienda",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-badge-formativi', {
        body: {
          codici_ateco: codiciAteco,
          descrizione_attivita: descrizioneAttivita,
          dimensione_azienda: dimensioneAzienda,
          badge_disponibili: badgeDisponibili.map(b => ({
            nome: b.nome,
            descrizione: b.descrizione,
            categoria: b.categoria
          }))
        }
      });

      if (error) throw error;

      if (data?.success && data?.suggerimenti) {
        setSuggestions(data.suggerimenti);
        setMotivazioneGenerale(data.motivazione_generale || "");
        
        // Pre-seleziona tutti i suggerimenti ad alta rilevanza
        const highRelevance = data.suggerimenti
          .filter((s: BadgeSuggestion) => s.rilevanza === 'alta')
          .map((s: BadgeSuggestion) => s.badge);
        setSelectedSuggestions(new Set(highRelevance));
        setShowSuggestions(true);

        toast({
          title: "Suggerimenti pronti!",
          description: `${data.suggerimenti.length} badge suggeriti basati sui codici ATECO`
        });
      } else {
        throw new Error(data?.error || "Errore nel recupero suggerimenti");
      }
    } catch (error: any) {
      console.error('Errore suggerimenti AI:', error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile ottenere suggerimenti",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestion = (badge: string) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(badge)) {
        newSet.delete(badge);
      } else {
        newSet.add(badge);
      }
      return newSet;
    });
  };

  const toggleMotivation = (badge: string) => {
    setExpandedMotivations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(badge)) {
        newSet.delete(badge);
      } else {
        newSet.add(badge);
      }
      return newSet;
    });
  };

  const applySelected = () => {
    const newBadges = [...new Set([...selectedBadges, ...selectedSuggestions])];
    onBadgesChange(newBadges);
    toast({
      title: "Badge applicati!",
      description: `${selectedSuggestions.size} badge aggiunti alla selezione`
    });
    setShowSuggestions(false);
  };

  const selectAll = () => {
    setSelectedSuggestions(new Set(suggestions.map(s => s.badge)));
  };

  const deselectAll = () => {
    setSelectedSuggestions(new Set());
  };

  const getRilevanzaColor = (rilevanza: string) => {
    switch (rilevanza) {
      case 'alta': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'media': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'bassa': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      default: return '';
    }
  };

  const getRilevanzaLabel = (rilevanza: string) => {
    switch (rilevanza) {
      case 'alta': return 'Alta';
      case 'media': return 'Media';
      case 'bassa': return 'Bassa';
      default: return rilevanza;
    }
  };

  return (
    <div className="space-y-3">
      {/* Loading indicator per auto-fetch */}
      {loading && !showSuggestions && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent animate-pulse">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium">Analisi AI in corso...</p>
                <p className="text-xs text-muted-foreground">
                  Suggerendo badge formativi in base ai codici ATECO
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Bottone Suggerisci */}
      {!showSuggestions && !loading && (
        <Button
          type="button"
          variant="outline"
          onClick={fetchSuggestions}
          disabled={loading || !canSuggest}
          className={cn(
            "w-full border-dashed gap-2 h-auto py-3",
            canSuggest && "hover:border-primary hover:bg-primary/5"
          )}
        >
          <Sparkles className="h-4 w-4" />
          <span>Suggerisci Badge con AI</span>
          {!canSuggest && (
            <span className="text-xs text-muted-foreground ml-1">(seleziona prima i codici ATECO)</span>
          )}
        </Button>
      )}

      {/* Pannello Suggerimenti */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                Suggerimenti AI basati sui codici ATECO
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowSuggestions(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Motivazione generale */}
            {motivazioneGenerale && (
              <div className="p-3 rounded-lg bg-background/80 border border-primary/20">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground italic">
                    {motivazioneGenerale}
                  </p>
                </div>
              </div>
            )}

            {/* Lista suggerimenti */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {suggestions.map((suggestion) => {
                const isSelected = selectedSuggestions.has(suggestion.badge);
                const isExpanded = expandedMotivations.has(suggestion.badge);
                const alreadySelected = selectedBadges.includes(suggestion.badge);

                return (
                  <div
                    key={suggestion.badge}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      isSelected && !alreadySelected && "bg-primary/10 border-primary/30",
                      alreadySelected && "bg-muted/50 border-muted",
                      !isSelected && !alreadySelected && "bg-background hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected || alreadySelected}
                        disabled={alreadySelected}
                        onCheckedChange={() => toggleSuggestion(suggestion.badge)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            "font-medium text-sm",
                            alreadySelected && "text-muted-foreground"
                          )}>
                            {suggestion.badge}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs px-1.5 py-0", getRilevanzaColor(suggestion.rilevanza))}
                          >
                            {getRilevanzaLabel(suggestion.rilevanza)}
                          </Badge>
                          {suggestion.categoria && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              {suggestion.categoria}
                            </Badge>
                          )}
                          {alreadySelected && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              <Check className="h-3 w-3 mr-1" />
                              Già selezionato
                            </Badge>
                          )}
                        </div>
                        
                        {/* Motivazione collapsible */}
                        <Collapsible open={isExpanded} onOpenChange={() => toggleMotivation(suggestion.badge)}>
                          <CollapsibleTrigger asChild>
                            <button 
                              type="button"
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                              {isExpanded ? "Nascondi motivazione" : "Mostra motivazione"}
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <p className="text-xs text-muted-foreground mt-2 pl-4 border-l-2 border-primary/20">
                              {suggestion.motivazione}
                            </p>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <Button
                type="button"
                size="sm"
                onClick={applySelected}
                disabled={selectedSuggestions.size === 0}
                className="gap-1"
              >
                <Check className="h-3 w-3" />
                Applica selezionati ({selectedSuggestions.size})
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAll}
                className="text-xs"
              >
                Seleziona tutti
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={deselectAll}
                className="text-xs"
              >
                Deseleziona
              </Button>
              <div className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={fetchSuggestions}
                disabled={loading}
                className="gap-1 text-xs"
              >
                <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
                Nuovi suggerimenti
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
