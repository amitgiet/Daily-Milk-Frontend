import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";
import {
  getOfflineMilkEntries,
  isUnsyncedEntry,
  OFFLINE_MILK_ENTRIES_UPDATED_EVENT,
} from "@/lib/milkCollectionStorage";

export function useHasOfflineMilkEntries() {
  const { user } = useAuth();
  const [hasOfflineMilkEntries, setHasOfflineMilkEntries] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const entries = await getOfflineMilkEntries();
      let unsynced = entries.filter(isUnsyncedEntry);

      if (user?.roleId === UserRole.FARMER && user.id) {
        unsynced = unsynced.filter((entry) => entry.farmerId === user.id);
      }

      setHasOfflineMilkEntries(unsynced.length > 0);
    } catch (error) {
      console.error("Failed to check offline milk entries:", error);
      setHasOfflineMilkEntries(false);
    }
  }, [user?.id, user?.roleId]);

  useEffect(() => {
    void refresh();

    function handleEntriesUpdated() {
      void refresh();
    }

    window.addEventListener(
      OFFLINE_MILK_ENTRIES_UPDATED_EVENT,
      handleEntriesUpdated,
    );

    return () => {
      window.removeEventListener(
        OFFLINE_MILK_ENTRIES_UPDATED_EVENT,
        handleEntriesUpdated,
      );
    };
  }, [refresh]);

  return hasOfflineMilkEntries;
}
