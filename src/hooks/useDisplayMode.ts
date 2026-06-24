import { useEffect, useState } from "react";
import {
  getSystemSettings,
  type DisplayMode,
  DISPLAY_MODE_CHANGED_EVENT,
} from "@/lib/systemSettingsStorage";

function readDisplayMode(): DisplayMode {
  return getSystemSettings().displayMode;
}

export function useDisplayMode() {
  const [displayMode, setDisplayMode] = useState<DisplayMode>(readDisplayMode);

  useEffect(() => {
    function syncDisplayMode() {
      setDisplayMode(readDisplayMode());
    }

    syncDisplayMode();
    window.addEventListener(DISPLAY_MODE_CHANGED_EVENT, syncDisplayMode);
    window.addEventListener("storage", syncDisplayMode);

    return () => {
      window.removeEventListener(DISPLAY_MODE_CHANGED_EVENT, syncDisplayMode);
      window.removeEventListener("storage", syncDisplayMode);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.displayMode = displayMode;
    root.classList.toggle("legacy-display", displayMode === "legacy");
  }, [displayMode]);

  return { displayMode };
}
