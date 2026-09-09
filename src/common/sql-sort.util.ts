export function sqlSortOrder(value?: string): "ASC" | "DESC" {
  return String(value ?? "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
}

export function sqlSortField(
  value: string | undefined,
  allowed: readonly string[],
  fallback: string,
): string {
  return value && allowed.includes(value) ? value : fallback;
}
