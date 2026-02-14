import { useState, useMemo } from "react";
import { Search, X, ChevronDown, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CODICI_ATECO, AtecoDivisione, AtecoGruppo, AtecoSezione } from "@/data/ateco";
import { cn } from "@/lib/utils";

interface AtecoSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

// Calcolo totale codici ATECO disponibili
const TOTAL_CODICI = CODICI_ATECO.reduce(
  (acc, s) => acc + s.divisioni.reduce((a, d) => a + d.gruppi.length, 0), 0
);

export function AtecoSelector({ selected, onChange, className }: AtecoSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [openDivisioni, setOpenDivisioni] = useState<Set<string>>(new Set());

  // Filtra i codici in base alla ricerca (2 livelli: sezione, divisione, gruppo)
  const filteredSections = useMemo(() => {
    if (!searchTerm) return CODICI_ATECO;
    
    const term = searchTerm.toLowerCase();
    return CODICI_ATECO.map(sezione => ({
      ...sezione,
      divisioni: sezione.divisioni.map(div => ({
        ...div,
        gruppi: div.gruppi.filter(gruppo =>
          gruppo.codice.includes(term) ||
          gruppo.descrizione.toLowerCase().includes(term) ||
          div.codice.includes(term) ||
          div.descrizione.toLowerCase().includes(term) ||
          sezione.titolo.toLowerCase().includes(term)
        )
      })).filter(div => div.gruppi.length > 0)
    })).filter(sezione => sezione.divisioni.length > 0);
  }, [searchTerm]);

  // Toggle selezione singolo gruppo (formato XX.X)
  const toggleGruppo = (codice: string) => {
    if (selected.includes(codice)) {
      onChange(selected.filter(c => c !== codice));
    } else {
      onChange([...selected, codice]);
    }
  };

  // Funzioni helper per raccogliere tutti i codici gruppo di una categoria
  const getAllGruppiInSezione = (sezione: AtecoSezione): string[] => {
    const gruppi: string[] = [];
    sezione.divisioni.forEach(div => {
      div.gruppi.forEach(gruppo => {
        gruppi.push(gruppo.codice);
      });
    });
    return gruppi;
  };

  const getAllGruppiInDivisione = (divisione: AtecoDivisione): string[] => {
    return divisione.gruppi.map(g => g.codice);
  };

  // Toggle selezione intera sezione
  const toggleSezioneSelection = (sezione: AtecoSezione) => {
    const allGruppi = getAllGruppiInSezione(sezione);
    const allSelected = allGruppi.every(g => selected.includes(g));
    
    if (allSelected) {
      onChange(selected.filter(c => !allGruppi.includes(c)));
    } else {
      onChange([...new Set([...selected, ...allGruppi])]);
    }
  };

  // Toggle selezione intera divisione
  const toggleDivisioneSelection = (divisione: AtecoDivisione) => {
    const allGruppi = getAllGruppiInDivisione(divisione);
    const allSelected = allGruppi.every(g => selected.includes(g));
    
    if (allSelected) {
      onChange(selected.filter(c => !allGruppi.includes(c)));
    } else {
      onChange([...new Set([...selected, ...allGruppi])]);
    }
  };

  // Calcola stato checkbox per sezione
  const getSezioneCheckState = (sezione: AtecoSezione) => {
    const allGruppi = getAllGruppiInSezione(sezione);
    const selectedCount = allGruppi.filter(g => selected.includes(g)).length;
    
    if (selectedCount === 0) return { checked: false, indeterminate: false };
    if (selectedCount === allGruppi.length) return { checked: true, indeterminate: false };
    return { checked: false, indeterminate: true };
  };

  // Calcola stato checkbox per divisione
  const getDivisioneCheckState = (divisione: AtecoDivisione) => {
    const allGruppi = getAllGruppiInDivisione(divisione);
    const selectedCount = allGruppi.filter(g => selected.includes(g)).length;
    
    if (selectedCount === 0) return { checked: false, indeterminate: false };
    if (selectedCount === allGruppi.length) return { checked: true, indeterminate: false };
    return { checked: false, indeterminate: true };
  };

  // Seleziona tutti i gruppi
  const selectAll = () => {
    const allGruppi: string[] = [];
    CODICI_ATECO.forEach(sezione => {
      sezione.divisioni.forEach(div => {
        div.gruppi.forEach(gruppo => {
          allGruppi.push(gruppo.codice);
        });
      });
    });
    onChange(allGruppi);
  };

  // Deseleziona tutto
  const deselectAll = () => {
    onChange([]);
  };

  // Toggle apertura sezione
  const toggleSection = (codiceSezione: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(codiceSezione)) {
        newSet.delete(codiceSezione);
      } else {
        newSet.add(codiceSezione);
      }
      return newSet;
    });
  };

  // Toggle apertura divisione
  const toggleDivisioneOpen = (codiceDivisione: string) => {
    setOpenDivisioni(prev => {
      const newSet = new Set(prev);
      if (newSet.has(codiceDivisione)) {
        newSet.delete(codiceDivisione);
      } else {
        newSet.add(codiceDivisione);
      }
      return newSet;
    });
  };

  // Conta gruppi selezionati per divisione
  const countSelectedInDivisione = (divisione: AtecoDivisione) => {
    let count = 0;
    divisione.gruppi.forEach(gruppo => {
      if (selected.includes(gruppo.codice)) count++;
    });
    return { count, total: divisione.gruppi.length };
  };

  // Riepilogo per sezione
  const sectionSummary = useMemo(() => {
    return CODICI_ATECO.map(sezione => {
      const totalGruppi = sezione.divisioni.reduce(
        (acc, div) => acc + div.gruppi.length, 0
      );
      const selectedGruppi = sezione.divisioni.reduce(
        (acc, div) => acc + div.gruppi.filter(g => selected.includes(g.codice)).length, 0
      );
      return {
        codice: sezione.codice,
        titolo: sezione.titolo,
        selected: selectedGruppi,
        total: totalGruppi,
        isComplete: selectedGruppi === totalGruppi && totalGruppi > 0,
        isPartial: selectedGruppi > 0 && selectedGruppi < totalGruppi
      };
    }).filter(s => s.selected > 0);
  }, [selected]);

  const allSelected = selected.length === TOTAL_CODICI;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("justify-start min-h-[40px] h-auto py-2 text-left", className)}>
          {selected.length === 0 ? (
            <span className="text-muted-foreground">Seleziona codici ATECO</span>
          ) : allSelected ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="font-medium">Tutti i settori ATECO ({TOTAL_CODICI})</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <span className="text-sm font-medium">{selected.length} codici ATECO selezionati</span>
              <div className="flex flex-wrap gap-1">
                {sectionSummary.slice(0, 8).map(s => (
                  <Badge 
                    key={s.codice} 
                    variant={s.isComplete ? "default" : "outline"}
                    className={cn(
                      "text-xs px-1.5 py-0.5",
                      s.isComplete && "bg-green-600 hover:bg-green-700"
                    )}
                  >
                    {s.codice} {s.isComplete ? '✓' : `${s.selected}/${s.total}`}
                  </Badge>
                ))}
                {sectionSummary.length > 8 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    +{sectionSummary.length - 8}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[700px] h-[600px] p-0 flex flex-col" align="start" side="bottom" sideOffset={8}>
        <div className="p-4 border-b space-y-4">
          {/* Header con search e deseleziona tutto */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cerca settore..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              disabled={selected.length === CODICI_ATECO.reduce((acc, s) => acc + s.divisioni.reduce((a, d) => a + d.gruppi.length, 0), 0)}
            >
              Seleziona tutti
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deselectAll}
              disabled={selected.length === 0}
            >
              Deseleziona tutti
            </Button>
          </div>

          {/* Contatore selezioni */}
          {selected.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selected.length} {selected.length === 1 ? 'settore selezionato' : 'settori selezionati'}
            </div>
          )}
        </div>

        {/* Lista sezioni con divisioni e gruppi (solo 3 livelli gerarchici) */}
        <div className="flex-1 overflow-y-auto divide-y">
          {filteredSections.map((sezione) => {
            const totalGruppi = sezione.divisioni.reduce((acc, div) => acc + div.gruppi.length, 0);
            const selectedGruppi = selected.filter(s => 
              sezione.divisioni.some(div => 
                div.gruppi.some(gruppo => gruppo.codice === s)
              )
            ).length;
            const sezioneCheckState = getSezioneCheckState(sezione);

            return (
              <Collapsible
                key={sezione.codice}
                open={openSections.has(sezione.codice) || !!searchTerm}
                onOpenChange={() => toggleSection(sezione.codice)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={sezioneCheckState.checked}
                      // @ts-ignore - indeterminate is supported but not in types
                      indeterminate={sezioneCheckState.indeterminate}
                      onCheckedChange={() => {
                        toggleSezioneSelection(sezione);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      (openSections.has(sezione.codice) || searchTerm) && "rotate-180"
                    )} />
                    <span className="font-medium text-left">
                      {sezione.codice} - {sezione.titolo}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {selectedGruppi}/{totalGruppi}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-4 divide-y">
                    {sezione.divisioni.map((divisione) => {
                      const divCounts = countSelectedInDivisione(divisione);
                      const divisioneCheckState = getDivisioneCheckState(divisione);
                      
                      return (
                        <Collapsible
                          key={divisione.codice}
                          open={openDivisioni.has(divisione.codice) || !!searchTerm}
                          onOpenChange={() => toggleDivisioneOpen(divisione.codice)}
                        >
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={divisioneCheckState.checked}
                                // @ts-ignore - indeterminate is supported but not in types
                                indeterminate={divisioneCheckState.indeterminate}
                                onCheckedChange={() => {
                                  toggleDivisioneSelection(divisione);
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <ChevronDown className={cn(
                                "h-3 w-3 transition-transform",
                                (openDivisioni.has(divisione.codice) || searchTerm) && "rotate-180"
                              )} />
                              <span className="text-sm font-medium text-left">
                                {divisione.codice} - {divisione.descrizione}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {divCounts.count}/{divCounts.total}
                            </span>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="pl-6 pb-2 space-y-1">
                              {divisione.gruppi.map((gruppo) => (
                                <label
                                  key={gruppo.codice}
                                  className="flex items-start gap-2 p-2 rounded hover:bg-muted/20 cursor-pointer transition-colors"
                                >
                                  <Checkbox
                                    checked={selected.includes(gruppo.codice)}
                                    onCheckedChange={() => toggleGruppo(gruppo.codice)}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1">
                                    <div className="text-sm">
                                      <span className="font-medium">{gruppo.codice}</span> - {gruppo.descrizione}
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
          
          {filteredSections.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nessun settore trovato per "{searchTerm}"
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
