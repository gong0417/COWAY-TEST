/** Stitch-style severity chips (Korean + English keywords). */
export function severityPillClass(raw?: string): string {
  if (!raw) {
    return "bg-surface-container-high text-on-surface-variant";
  }
  const v = raw.toLowerCase();
  if (
    v.includes("critical") ||
    v.includes("high") ||
    v.includes("치명") ||
    v.includes("상")
  ) {
    return "bg-error-container text-on-error-container";
  }
  if (
    v.includes("major") ||
    v.includes("medium") ||
    v.includes("moderate") ||
    v.includes("중")
  ) {
    return "bg-secondary-fixed text-on-secondary-fixed-variant";
  }
  if (v.includes("minor") || v.includes("low") || v.includes("하")) {
    return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
  }
  return "bg-primary-fixed/40 text-on-primary-fixed-variant";
}
