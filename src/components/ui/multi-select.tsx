import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disableOthersWhen?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Seleziona opzioni...",
  disableOthersWhen,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (option: string) => {
    const isSelected = selected.includes(option);
    
    // Se è l'opzione speciale che disabilita le altre
    if (disableOthersWhen && option === disableOthersWhen) {
      if (isSelected) {
        onChange([]);
      } else {
        onChange([option]);
      }
      return;
    }

    // Se l'opzione speciale è già selezionata, deselezionala
    if (disableOthersWhen && selected.includes(disableOthersWhen)) {
      onChange([option]);
      return;
    }

    // Gestione normale multi-select
    if (isSelected) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const handleRemove = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== option));
  };

  const isOptionDisabled = (option: string) => {
    if (!disableOthersWhen) return false;
    if (option === disableOthersWhen) return false;
    return selected.includes(disableOthersWhen);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between min-h-[40px] h-auto py-2", className)}
        >
          <div className="flex flex-wrap gap-1.5 flex-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((item) => (
                <Badge
                  key={item}
                  variant="secondary"
                  className="mr-1 px-2.5 py-1 text-sm font-medium"
                >
                  {item}
                  <button
                    className="ml-1.5 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Cerca..." />
          <CommandList>
            <CommandEmpty>Nessuna opzione trovata.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option);
                const isDisabled = isOptionDisabled(option);
                
                return (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => !isDisabled && handleSelect(option)}
                    disabled={isDisabled}
                    className={cn(
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
