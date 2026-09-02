import { readFileSync } from 'node:fs';

/**
 * Reads a prop's declared type out of a `properties.ts` file.
 *
 * Text rather than a TS parse on purpose: these declarations are a single
 * `name?: type;` line by repo convention, and the only thing needed here is
 * enough of the type to tell a DOM event from a domain object.
 */
export function readSignature(file: string, prop: string): string | undefined {
  const source = readFileSync(file, 'utf8');
  const match = new RegExp(`^\\s*${prop}\\??:\\s*([^;]+);`, 'm').exec(source);
  return match?.[1]?.replace(/\s+/g, ' ').trim();
}
