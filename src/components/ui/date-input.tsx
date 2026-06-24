import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  DISPLAY_DATE_FORMAT,
  formatDisplayDate,
  parseDisplayDateInput,
} from "@/lib/dateFormat";

export interface DateInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  disableDate?: (date: Date) => boolean;
  tabIndex?: number;
}

export function DateInput({
  id,
  name,
  value,
  onChange,
  className,
  inputClassName,
  required,
  disabled,
  placeholder = DISPLAY_DATE_FORMAT,
  disableDate,
  tabIndex,
}: DateInputProps) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState(() => formatDisplayDate(value, ""));

  React.useEffect(() => {
    setText(formatDisplayDate(value, ""));
  }, [value]);

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  function commitText(nextText: string) {
    const parsed = parseDisplayDateInput(nextText);
    if (parsed) {
      onChange(parsed);
      setText(formatDisplayDate(parsed, ""));
      return;
    }

    if (!nextText.trim()) {
      onChange("");
      setText("");
      return;
    }

    setText(formatDisplayDate(value, ""));
  }

  return (
    <div
      className={cn(
        "relative flex w-full items-center rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className,
      )}
    >
      <Input
        id={id}
        name={name}
        tabIndex={tabIndex}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={(event) => commitText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitText(text);
            const form = event.currentTarget.form;
            if (form) {
              event.stopPropagation();
              form.requestSubmit();
              return;
            }
            event.currentTarget.blur();
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={cn(
          "h-10 flex-1 border-0 bg-transparent px-3 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
          inputClassName,
        )}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            tabIndex={tabIndex === -1 ? -1 : undefined}
            disabled={disabled}
            className="h-10 w-9 shrink-0 rounded-none rounded-r-md text-muted-foreground hover:bg-transparent hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            aria-label="Open calendar"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selectedDate}
            disabled={disableDate}
            onSelect={(date) => {
              if (!date) return;
              const isoDate = format(date, "yyyy-MM-dd");
              onChange(isoDate);
              setText(formatDisplayDate(isoDate, ""));
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
