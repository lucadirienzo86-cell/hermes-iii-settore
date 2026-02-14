import { useState, useMemo } from "react";
import { useBadgeFormativi } from "@/hooks/useBadgeFormativi";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Search, X, FolderOpen, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeFormativiSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export function BadgeFormativiSelector({ selected, onChange, className }: BadgeFormativiSelectorProps) {
  const { badgeByCategoria, isLoading } = useBadgeFormativi();
  const [search, setSearch] = useState("");
  const [openCategorie, setOpenCategorie] = useState<Set<string>>(new Set());

  // Filtra badge in base alla ricerca
  const filteredByCategoria = useMemo(() => {
    if (!search.trim()) return badgeByCategoria;
    
    const searchLower = search.toLowerCase();
    return badgeByCategoria
      .map(group => ({
        ...group,
        badges: group.badges.filter(b => 
          b.nome.toLowerCase().includes(searchLower) ||
          b.descrizione?.toLowerCase().includes(searchLower)
        )
      }))
      .filter(group => group.badges.length > 0);
  }, [badgeByCategoria, search]);

  const toggleCategoria = (categoriaId: string) => {
    const newSet = new Set(openCategorie);
    if (newSet.has(categoriaId)) {
      newSet.delete(categoriaId);
    } else {
      newSet.add(categoriaId);
    }
    setOpenCategorie(newSet);
  };

  const toggleBadge = (badgeNome: string) => {
    if (selected.includes(badgeNome)) {
      onChange(selected.filter(b => b !== badgeNome));
    } else {
      onChange([...selected, badgeNome]);
    }
  };

  const selectAllInCategoria = (badgeNames: string[]) => {
    const allSelected = badgeNames.every(name => selected.includes(name));
    if (allSelected) {
      onChange(selected.filter(b => !badgeNames.includes(b)));
    } else {
      const newSelected = [...selected];
      badgeNames.forEach(name => {
        if (!newSelected.includes(name)) {
          newSelected.push(name);
        }
      });
      onChange(newSelected);
    }
  };

  const removeBadge = (badgeNome: string) => {
    onChange(selected.filter(b => b !== badgeNome));
  };

  const clearAll = () => {
    onChange([]);
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-4 bg-muted/20 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-3"></div>
        <div className="h-10 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg bg-card", className)}>
      {/* Search bar */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca badge..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Badge selezionati */}
      {selected.length > 0 && (
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              {selected.length} badge selezionati
            </span>
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 px-2 text-xs">
              Rimuovi tutti
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selected.map(badge => (
              <Badge
                key={badge}
                className="pr-1 gap-1 bg-purple-600 text-white hover:bg-purple-700"
              >
                {badge}
                <button
                  type="button"
                  onClick={() => removeBadge(badge)}
                  className="ml-1 hover:bg-purple-500 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Lista badge per categoria */}
      <div className="max-h-[300px] overflow-y-auto">
        {filteredByCategoria.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nessun badge trovato</p>
          </div>
        ) : (
          filteredByCategoria.map((group, index) => {
            const categoriaId = group.categoria?.id || "senza-categoria";
            const categoriaName = group.categoria?.nome || "Senza categoria";
            const isOpen = openCategorie.has(categoriaId) || search.trim() !== "";
            const badgeNames = group.badges.map(b => b.nome);
            const selectedInCategoria = badgeNames.filter(name => selected.includes(name)).length;
            const allSelectedInCategoria = badgeNames.every(name => selected.includes(name));

            return (
              <Collapsible
                key={categoriaId}
                open={isOpen}
                onOpenChange={() => !search.trim() && toggleCategoria(categoriaId)}
              >
                <CollapsibleTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                      index > 0 && "border-t"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen 
                        className="h-4 w-4" 
                        style={{ color: group.categoria?.colore || undefined }}
                      />
                      <span className="font-medium text-sm">{categoriaName}</span>
                      <Badge variant="outline" className="text-xs h-5">
                        {selectedInCategoria}/{group.badges.length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAllInCategoria(badgeNames);
                        }}
                      >
                        {allSelectedInCategoria ? "Deseleziona" : "Seleziona tutti"}
                      </Button>
                      {!search.trim() && (
                        isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-3 pb-3 space-y-1">
                      {group.badges.map(badge => {
                      const isSelected = selected.includes(badge.nome);
                      return (
                        <label
                          key={badge.id}
                          className={cn(
                            "flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors",
                            isSelected 
                              ? "bg-purple-100 border-2 border-purple-500 dark:bg-purple-900/40 dark:border-purple-400" 
                              : "hover:bg-muted/50 border border-transparent"
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleBadge(badge.nome)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-gray-300"
                                style={{ backgroundColor: badge.colore || '#9333ea' }}
                              />
                              <span className={cn(
                                "font-medium text-sm",
                                isSelected && "text-purple-700 dark:text-purple-300"
                              )}>{badge.nome}</span>
                            </div>
                            {badge.descrizione && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {badge.descrizione}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })
        )}
      </div>
    </div>
  );
}
