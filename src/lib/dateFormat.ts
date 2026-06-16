import { format, isValid, parse, parseISO } from "date-fns";

export const DISPLAY_DATE_FORMAT = "dd/MM/yyyy";
export const ISO_DATE_FORMAT = "yyyy-MM-dd";
export const DISPLAY_DATETIME_FORMAT = "dd/MM/yyyy HH:mm";
export const DISPLAY_DATE_LONG_FORMAT = "dd MMMM yyyy";
export const DISPLAY_DATE_SHORT_FORMAT = "dd/MM";

function toDate(value: string | Date | undefined | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? parseISO(value)
    : new Date(value);

  return isValid(normalized) ? normalized : null;
}

export function formatDisplayDate(
  value: string | Date | undefined | null,
  fallback = "-",
): string {
  const parsed = toDate(value);
  if (!parsed) return fallback;
  return format(parsed, DISPLAY_DATE_FORMAT);
}

export function formatDisplayDateTime(
  value: string | Date | undefined | null,
  fallback = "-",
): string {
  const parsed = toDate(value);
  if (!parsed) return fallback;
  return format(parsed, DISPLAY_DATETIME_FORMAT);
}

export function formatDisplayDateLong(
  value: string | Date | undefined | null,
  fallback = "Pick a date",
): string {
  const parsed = toDate(value);
  if (!parsed) return fallback;
  return format(parsed, DISPLAY_DATE_LONG_FORMAT);
}

export function formatDisplayDateShort(
  value: string | Date | undefined | null,
  fallback = "-",
): string {
  const parsed = toDate(value);
  if (!parsed) return fallback;
  return format(parsed, DISPLAY_DATE_SHORT_FORMAT);
}

export function toIsoDateString(
  value: string | Date | undefined | null,
): string | null {
  const parsed = toDate(value);
  if (!parsed) return null;
  return format(parsed, ISO_DATE_FORMAT);
}

function isValidCalendarDate(day: number, month: number, year: number): boolean {
  const parsed = new Date(year, month - 1, day);
  return (
    isValid(parsed) &&
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

export function parseDisplayDateInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return toIsoDateString(trimmed);
  }

  const slashMatch = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    if (isValidCalendarDate(day, month, year)) {
      return format(new Date(year, month - 1, day), ISO_DATE_FORMAT);
    }
  }

  for (const pattern of ["dd/MM/yyyy", "d/M/yyyy", "dd-MM-yyyy", "d-M-yyyy"]) {
    const parsed = parse(trimmed, pattern, new Date());
    if (isValid(parsed)) {
      return format(parsed, ISO_DATE_FORMAT);
    }
  }

  return null;
}
