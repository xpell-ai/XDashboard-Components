export type XDashboardSemanticClassField =
  | "_variant"
  | "_tone"
  | "_size"
  | "_density"
  | "_elevation";

export function splitDashboardClassNames(value: string): string[] {
  return value
    .split(/\s+/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export function buildDashboardRootClassName(
  baseClass: string,
  existingClass: string,
  source: Record<string, any>,
  fields: XDashboardSemanticClassField[],
  extraClasses: string[] = []
): string {
  const managedPrefixes = fields
    .filter((field) => {
      const value = source[field];
      return value !== undefined && value !== null && value !== "";
    })
    .map((field) => `${baseClass}--${field.slice(1)}-`);
  const filtered = splitDashboardClassNames(existingClass).filter(
    (className) =>
      className !== baseClass &&
      !managedPrefixes.some((prefix) => className.startsWith(prefix))
  );
  const semanticClasses = fields
    .map((field) => {
      const value = source[field];
      if (value === undefined || value === null || value === "") return undefined;
      return `${baseClass}--${field.slice(1)}-${String(value)}`;
    })
    .filter(Boolean) as string[];

  return Array.from(
    new Set([baseClass, ...filtered, ...semanticClasses, ...extraClasses])
  ).join(" ");
}
