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

/** Coerce attributes whose absence lets the component decide its own default. */
export function optionalBooleanAttribute(value: unknown, name?: string): boolean | null {
  if (value === null || typeof value === 'undefined') {
    return null;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const text = String(value).trim().toLowerCase();
  if (text === 'false') {
    return false;
  }
  return text === '' || text === 'true' || text === name ? true : null;
}
