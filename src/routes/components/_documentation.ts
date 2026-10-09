/** Resolve an example's display label to an existing documentation basename. */
export function documentationName(
  displayName: string,
  available: ReadonlySet<string>
): string | null {
  if (available.has(displayName)) {
    return displayName;
  }
  const compactName = displayName.replace(/\s+/g, '');
  return available.has(compactName) ? compactName : null;
}
