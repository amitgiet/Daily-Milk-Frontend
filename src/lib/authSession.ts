export function getAuthDairyId(): number | null {
  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const user = JSON.parse(rawUser) as {
        dairyId?: number | null;
        subscription?: { dairyId?: number | null } | null;
      };

      if (user.dairyId != null) {
        const dairyId = Number(user.dairyId);
        if (!Number.isNaN(dairyId) && dairyId > 0) return dairyId;
      }

      if (user.subscription?.dairyId != null) {
        const dairyId = Number(user.subscription.dairyId);
        if (!Number.isNaN(dairyId) && dairyId > 0) return dairyId;
      }
    }

    const rawSubscription = localStorage.getItem("dairySubscription");
    if (rawSubscription) {
      const subscription = JSON.parse(rawSubscription) as { dairyId?: number | null };
      if (subscription.dairyId != null) {
        const dairyId = Number(subscription.dairyId);
        if (!Number.isNaN(dairyId) && dairyId > 0) return dairyId;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function belongsToAuthDairy(dairyId?: number | null): boolean {
  const authDairyId = getAuthDairyId();
  if (authDairyId == null) return false;
  if (dairyId == null) return false;
  return Number(dairyId) === authDairyId;
}
