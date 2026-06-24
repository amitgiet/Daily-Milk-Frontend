export function parsePlanFeatures(features: unknown): string[] {
  if (features == null) return [];

  if (Array.isArray(features)) {
    return features
      .map((feature) => String(feature).trim())
      .filter(Boolean);
  }

  if (typeof features === "string") {
    const trimmed = features.trim();
    if (!trimmed) return [];
    if (trimmed === "[object Object]") return [];

    try {
      return parsePlanFeatures(JSON.parse(trimmed));
    } catch {
      return trimmed
        .split(",")
        .map((feature) => feature.trim())
        .filter(Boolean);
    }
  }

  if (typeof features === "object") {
    const values = Object.values(features as Record<string, unknown>);
    if (values.every((value) => typeof value === "string")) {
      return values.map((value) => value.trim()).filter(Boolean);
    }

    return values.flatMap((value) => parsePlanFeatures(value)).filter(Boolean);
  }

  return [];
}

export function stringifyPlanFeatures(features: string[]): string {
  if (!Array.isArray(features)) return JSON.stringify([]);

  try {
    return JSON.stringify(features);
  } catch {
    return JSON.stringify([]);
  }
}
