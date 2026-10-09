/** ARIA boolean states use explicit tokens, unlike HTML presence attributes. */
export function ariaBoolean(value: unknown): boolean | undefined {
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return undefined;
}
