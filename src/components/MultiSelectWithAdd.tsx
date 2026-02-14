import { useState } from "react";
import { Plus, X, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface MultiSelectWithAddProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onAddOption?: (newOption: string) => void;
  onDeleteOption?: (option: string) => void;
  placeholder?: string;
  isLoadingOptions?: boolean;
  isAddingOption?: boolean;
  isDeletingOption?: boolean;
  canAddNew?: boolean;
  canDelete?: boolean;
  className?: string;
}

export function MultiSelectWithAdd({
  options,
  selected,
  onChange,
  onAddOption,
  onDeleteOption,
  placeholder = "Seleziona opzioni...",
  isLoadingOptions = false,
  isAddingOption = false,
  isDeletingOption = false,
  canAddNew = false,
  canDelete = false,
  className,
}: MultiSelectWithAddProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newOptionInput, setNewOptionInput] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [optionToDelete, setOptionToDelete] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const handleRemove = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((s) => s !== option));
  };

  const handleAddNew = () => {
    if (newOptionInput.trim() && onAddOption) {
      onAddOption(newOptionInput.trim());
      setNewOptionInput("");
      setShowAddInput(false);
    }
  };

  const handleSelectAll = () => {
    onChange([...options]);
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Popover 
        open={isOpen} 
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setSearchTerm("");
          }
        }}
      >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn("w-full justify-start", className)}
        >
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selected.slice(0, 2).map((item) => (
                <Badge key={item} variant="secondary" className="mr-1">
                  {item}
                  <button
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRemove(item, e as any);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => handleRemove(item, e)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))}
              {selected.length > 2 && (
                <Badge variant="secondary">+{selected.length - 2}</Badge>
              )}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start" side="bottom" sideOffset={8}>
        <div className="p-2 border-b space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium">
              {selected.length} selezionat{selected.length === 1 ? "o" : "i"}
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={selected.length === options.length || isLoadingOptions}
              >
                Seleziona tutti
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                disabled={selected.length === 0}
              >
                Deseleziona tutti
              </Button>
            </div>
          </div>
          
          {canAddNew && (
            <>
              {!showAddInput ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowAddInput(true)}
                  disabled={isAddingOption}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi nuova opzione
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nuova opzione..."
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddNew();
                      } else if (e.key === "Escape") {
                        setShowAddInput(false);
                        setNewOptionInput("");
                      }
                    }}
                    disabled={isAddingOption}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleAddNew}
                    disabled={!newOptionInput.trim() || isAddingOption}
                  >
                    {isAddingOption ? "..." : "Salva"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowAddInput(false);
                      setNewOptionInput("");
                    }}
                    disabled={isAddingOption}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
          
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca opzioni..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <ScrollArea className="h-64">
          <div className="p-2">
            {isLoadingOptions ? (
              <div className="text-center py-4 text-muted-foreground">
                Caricamento...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {searchTerm ? "Nessun risultato" : "Nessuna opzione disponibile"}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  className="flex items-center space-x-2 p-2 hover:bg-accent rounded group"
                >
                  <div 
                    className="flex items-center space-x-2 flex-1 cursor-pointer"
                    onClick={() => handleSelect(option)}
                  >
                    <Checkbox checked={selected.includes(option)} />
                    <span className="text-sm flex-1">{option}</span>
                  </div>
                  {canDelete && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOptionToDelete(option);
                      }}
                      disabled={isDeletingOption}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>

    <AlertDialog open={!!optionToDelete} onOpenChange={(open) => !open && setOptionToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
          <AlertDialogDescription>
            Sei sicuro di voler eliminare "{optionToDelete}"? Questa opzione non sarà più disponibile per i nuovi bandi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeletingOption}>Annulla</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (optionToDelete && onDeleteOption) {
                onDeleteOption(optionToDelete);
                setOptionToDelete(null);
              }
            }}
            disabled={isDeletingOption}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeletingOption ? "Eliminazione..." : "Elimina"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
