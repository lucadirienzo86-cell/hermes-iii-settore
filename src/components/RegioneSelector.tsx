import { useState, useMemo } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { REGIONI_E_PROVINCE, Regione } from "@/data/regioni-province";
import { cn } from "@/lib/utils";

interface RegioneSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export function RegioneSelector({ selected, onChange, className }: RegioneSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openRegioni, setOpenRegioni] = useState<Set<string>>(new Set());

  // Filtra regioni e province in base alla ricerca
  const filteredRegioni = useMemo(() => {
    if (!searchTerm) return REGIONI_E_PROVINCE;
    
    const term = searchTerm.toLowerCase();
    return REGIONI_E_PROVINCE.map(regione => ({
      ...regione,
      province: regione.province.filter(provincia =>
        provincia.nome.toLowerCase().includes(term) ||
        provincia.sigla.toLowerCase().includes(term) ||
        regione.nome.toLowerCase().includes(term)
      )
    })).filter(regione => regione.province.length > 0);
  }, [searchTerm]);

  // Verifica se "Tutta Italia" è selezionato
  const isTuttaItaliaSelected = selected.includes("Tutta Italia");

  // Toggle selezione singola provincia (formato "Regione - Provincia (XX)")
  const toggleProvincia = (regione: string, provincia: string, sigla: string) => {
    const codice = `${regione} - ${provincia} (${sigla})`;
    if (selected.includes(codice)) {
      onChange(selected.filter(c => c !== codice));
    } else {
      // Rimuovi "Tutta Italia" se presente quando si seleziona una provincia specifica
      const newSelected = selected.filter(s => s !== "Tutta Italia");
      onChange([...newSelected, codice]);
    }
  };

  // Ottieni tutte le province di una regione nel formato completo
  const getAllProvinceInRegione = (regione: Regione): string[] => {
    return regione.province.map(p => `${regione.nome} - ${p.nome} (${p.sigla})`);
  };

  // Toggle selezione intera regione
  const toggleRegioneSelection = (regione: Regione) => {
    const allProvince = getAllProvinceInRegione(regione);
    const allSelected = allProvince.every(p => selected.includes(p));
    
    if (allSelected) {
      // Deseleziona tutte le province di questa regione
      onChange(selected.filter(s => !allProvince.includes(s)));
    } else {
      // Seleziona tutte le province di questa regione
      // Rimuovi "Tutta Italia" se presente
      const newSelected = selected.filter(s => s !== "Tutta Italia");
      onChange([...new Set([...newSelected, ...allProvince])]);
    }
  };

  // Calcola stato checkbox per regione
  const getRegioneCheckState = (regione: Regione) => {
    if (isTuttaItaliaSelected) {
      return { checked: true, indeterminate: false };
    }
    
    const allProvince = getAllProvinceInRegione(regione);
    const selectedCount = allProvince.filter(p => selected.includes(p)).length;
    
    if (selectedCount === 0) return { checked: false, indeterminate: false };
    if (selectedCount === allProvince.length) return { checked: true, indeterminate: false };
    return { checked: false, indeterminate: true };
  };

  // Toggle "Tutta Italia"
  const toggleTuttaItalia = () => {
    if (isTuttaItaliaSelected) {
      onChange([]); // Deseleziona tutto
    } else {
      onChange(["Tutta Italia"]); // Seleziona solo "Tutta Italia"
    }
  };

  // Deseleziona tutto
  const deselectAll = () => {
    onChange([]);
  };

  // Toggle apertura regione
  const toggleRegioneOpen = (nomeRegione: string) => {
    setOpenRegioni(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nomeRegione)) {
        newSet.delete(nomeRegione);
      } else {
        newSet.add(nomeRegione);
      }
      return newSet;
    });
  };

  // Conta province selezionate per regione
  const countSelectedInRegione = (regione: Regione) => {
    if (isTuttaItaliaSelected) {
      return { count: regione.province.length, total: regione.province.length };
    }
    const allProvince = getAllProvinceInRegione(regione);
    const count = allProvince.filter(p => selected.includes(p)).length;
    return { count, total: regione.province.length };
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("justify-start min-h-[40px] h-auto py-2", className)}>
          {selected.length === 0 ? (
            <span className="text-muted-foreground">Seleziona zone di applicabilità</span>
          ) : isTuttaItaliaSelected ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm px-2.5 py-1 font-medium">
                Tutta Italia
              </Badge>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 flex-1">
              <span className="text-sm font-medium mr-1">{selected.length} zone:</span>
              {selected.map(sede => {
                const parts = sede.split(" - ");
                const provincia = parts.length > 1 ? parts[1] : parts[0];
                return (
                  <Badge key={sede} variant="secondary" className="text-sm px-2.5 py-1 font-medium">
                    {provincia}
                  </Badge>
                );
              })}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] h-[500px] p-0 flex flex-col">
        <div className="p-4 border-b space-y-4">
          {/* Header con search e pulsanti */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cerca regione o provincia..."
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
              variant={isTuttaItaliaSelected ? "default" : "outline"}
              size="sm"
              onClick={toggleTuttaItalia}
            >
              {isTuttaItaliaSelected ? "Deseleziona" : "Tutta Italia"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deselectAll}
              disabled={selected.length === 0}
            >
              Reset
            </Button>
          </div>

          {/* Contatore selezioni */}
          {selected.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {isTuttaItaliaSelected 
                ? "Tutte le regioni e province selezionate"
                : `${selected.length} ${selected.length === 1 ? 'provincia selezionata' : 'province selezionate'}`
              }
            </div>
          )}
        </div>

        {/* Lista regioni con province */}
        <div className="flex-1 overflow-y-auto divide-y">
          {filteredRegioni.map((regione) => {
            const counts = countSelectedInRegione(regione);
            const regioneCheckState = getRegioneCheckState(regione);

            return (
              <Collapsible
                key={regione.nome}
                open={openRegioni.has(regione.nome) || !!searchTerm}
                onOpenChange={() => toggleRegioneOpen(regione.nome)}
              >
                <CollapsibleTrigger 
                  className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
                  disabled={isTuttaItaliaSelected}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={regioneCheckState.checked}
                      // @ts-ignore - indeterminate is supported but not in types
                      indeterminate={regioneCheckState.indeterminate}
                      onCheckedChange={() => {
                        if (!isTuttaItaliaSelected) {
                          toggleRegioneSelection(regione);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      disabled={isTuttaItaliaSelected}
                    />
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      (openRegioni.has(regione.nome) || searchTerm) && "rotate-180"
                    )} />
                    <span className="font-medium text-left">
                      {regione.nome}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {counts.count}/{counts.total}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-12 pb-2 space-y-1">
                    {regione.province.map((provincia) => {
                      const codice = `${regione.nome} - ${provincia.nome} (${provincia.sigla})`;
                      const isSelected = isTuttaItaliaSelected || selected.includes(codice);
                      
                      return (
                        <label
                          key={provincia.sigla}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                            !isTuttaItaliaSelected && "hover:bg-muted/20"
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => {
                              if (!isTuttaItaliaSelected) {
                                toggleProvincia(regione.nome, provincia.nome, provincia.sigla);
                              }
                            }}
                            disabled={isTuttaItaliaSelected}
                          />
                          <div className="flex-1">
                            <span className="text-sm">
                              {provincia.nome} <span className="text-muted-foreground">({provincia.sigla})</span>
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
          
          {filteredRegioni.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nessuna regione o provincia trovata per "{searchTerm}"
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
