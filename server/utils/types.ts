// Helper functions for type conversions
export function nullToUndefined<T>(value: T | null): T | undefined {
  return value ?? undefined;
}

export function undefinedToNull<T>(value: T | undefined): T | null {
  return value ?? null;
}

// Database value normalization
export function normalizeDbValue<T>(value: T | null | undefined): T | undefined {
  if (value === null) return undefined;
  return value;
}
