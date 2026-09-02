import { readFileSync } from 'node:fs';

/**
 * Reads a prop's declared type out of a `properties.ts` file.
 *
 * Text rather than a TS parse on purpose: these declarations are a single
 * `name?: type;` line by repo convention, and the only thing needed here is
 * enough of the type to tell a DOM event from a domain object.
 */
export function readSignature(file: string, prop: string): string | null {
  const source = readFileSync(file, 'utf8');
  // Escaped so a prop name is matched literally rather than as a pattern.
  const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`^\\s*${escaped}\\??:\\s*([^;]+);`, 'm').exec(source);
  const captured = match === null ? null : match[1];
  return typeof captured === 'string' ? captured.replace(/\s+/g, ' ').trim() : null;
}
