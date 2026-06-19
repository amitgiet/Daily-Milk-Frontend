import { useState } from "react";
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
}

interface SearchableFarmerSelectProps {
  farmers: FarmerSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  className?: string;
}

export function SearchableFarmerSelect({
  farmers,
  value,
  onValueChange,
  disabled = false,
  placeholder,
  id,
  className,
}: SearchableFarmerSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const selectedFarmer = farmers.find(
    (farmer) => farmer.id.toString() === value,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
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
            {selectedFarmer?.name ??
              placeholder ??
              t("milkCollection.selectFarmer")}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={t("dairyListing.searchFarmers")} />
          <CommandList>
            <CommandEmpty>{t("dairyListing.noFarmersFound")}</CommandEmpty>
            <CommandGroup>
              {farmers.map((farmer) => (
                <CommandItem
                  key={farmer.id}
                  value={`${farmer.name} ${farmer.phone ?? ""}`.trim()}
                  onSelect={() => {
                    onValueChange(farmer.id.toString());
                    setOpen(false);
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
                    {farmer.phone ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {farmer.phone}
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
