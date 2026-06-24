import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown } from "lucide-react";
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

export interface FarmerSelectOption {
  id: number;
  name: string;
  phone?: string;
  farmerNumber?: string;
}

interface SearchableFarmerSelectProps {
  farmers: FarmerSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  id?: string;
  className?: string;
  tabIndex?: number;
  autoSelectByFarmerNumber?: boolean;
  onFarmerSelected?: () => void;
}

function findFarmerByNumber(
  farmers: FarmerSelectOption[],
  query: string,
): FarmerSelectOption | null {
  const normalized = query.trim();
  if (!normalized) return null;

  const matches = farmers.filter(
    (farmer) => farmer.farmerNumber?.trim() === normalized,
  );

  return matches.length === 1 ? matches[0] : null;
}

function formatFarmerLabel(farmer: FarmerSelectOption) {
  const farmerNumber = farmer.farmerNumber?.trim();
  if (farmerNumber) {
    return `${farmer.name} (#${farmerNumber})`;
  }
  return farmer.name;
}

export function SearchableFarmerSelect({
  farmers,
  value,
  onValueChange,
  disabled = false,
  placeholder,
  searchPlaceholder,
  id,
  className,
  tabIndex,
  autoSelectByFarmerNumber = false,
  onFarmerSelected,
}: SearchableFarmerSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedFarmer = farmers.find(
    (farmer) => farmer.id.toString() === value,
  );

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  function selectFarmer(farmerId: string) {
    onValueChange(farmerId);
    setOpen(false);
    setSearch("");
    onFarmerSelected?.();
  }

  function tryAutoSelectByFarmerNumber(query: string) {
    if (!autoSelectByFarmerNumber) return false;

    const match = findFarmerByNumber(farmers, query);
    if (!match) return false;

    selectFarmer(match.id.toString());
    return true;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          tabIndex={tabIndex}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">
            {selectedFarmer
              ? formatFarmerLabel(selectedFarmer)
              : (placeholder ?? t("milkCollection.selectFarmer"))}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter>
          <CommandInput
            id={id ? `${id}-search` : undefined}
            name={id ? `${id}-search` : undefined}
            autoComplete="off"
            value={search}
            onValueChange={(nextSearch) => {
              setSearch(nextSearch);
              tryAutoSelectByFarmerNumber(nextSearch);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
              if (tryAutoSelectByFarmerNumber(search)) {
                event.preventDefault();
              }
            }}
            placeholder={
              searchPlaceholder ?? t("dairyListing.searchFarmers")
            }
          />
          <CommandList>
            <CommandEmpty>{t("dairyListing.noFarmersFound")}</CommandEmpty>
            <CommandGroup>
              {farmers.map((farmer) => (
                <CommandItem
                  key={farmer.id}
                  value={`${farmer.farmerNumber ?? ""} ${farmer.name} ${farmer.phone ?? ""}`.trim()}
                  onSelect={() => {
                    selectFarmer(farmer.id.toString());
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === farmer.id.toString()
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate">{farmer.name}</p>
                    {farmer.farmerNumber || farmer.phone ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {[farmer.farmerNumber, farmer.phone]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
