export function isSystemOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}
