import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PROP_PAIRS, directionConfig } from './map.ts';

/**
 * Reads the JSDoc block attached to a prop declaration in a `properties.ts`.
 *
 * The block sits immediately above the declaration, so walk upwards over the
 * contiguous comment lines and stop at the first line that is not one.
 */
function docBlockFor(source: string, prop: string): string | null {
  const lines = source.split('\n');
  const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const declaration = new RegExp(`^\\s*${escaped}\\??\\s*:`);
  const index = lines.findIndex((line) => declaration.test(line));
  if (index === -1) {
    return null;
  }
  const block: string[] = [];
  for (let i = index - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.length === 0 || !/^(\/\*\*|\*|\/\/)/.test(line)) {
      break;
    }
    block.unshift(line);
  }
  return block.join('\n');
}

const propertiesOf = (component: string): string =>
  readFileSync(join(process.cwd(), 'src/lib', component, 'properties.ts'), 'utf8');

describe('the prop map', () => {
  it('names a prop that the component really declares', () => {
    const missing = PROP_PAIRS.filter(
      (pair) => docBlockFor(propertiesOf(pair.component), pair.sui) === null
    ).map((pair) => `${pair.component}.${pair.sui}`);

    expect(missing).toEqual([]);
  });

  it('never rewrites a consumer onto a deprecated prop', () => {
    // The map was derived by matching names case-insensitively, and that rule
    // is deprecation-blind: where a component keeps a deprecated alias whose
    // lowercase spelling happens to match the fork's, the alias outranked the
    // canonical prop and won the pair. Landing a consumer on a prop that is
    // already slated for removal means they owe a second migration
    // immediately, so the target must be the supported spelling.
    const deprecated = PROP_PAIRS.filter((pair) =>
      (docBlockFor(propertiesOf(pair.component), pair.sui) ?? '').includes('@deprecated')
    ).map((pair) => `${pair.component}.${pair.sui}`);

    expect(deprecated).toEqual([]);
  });

  it('only departs from a casing-only rewrite to step over a deprecated alias', () => {
    // Every pair is a pure casing difference, with one licensed exception: the
    // fork's spelling matches a deprecated SUI alias, so the rewrite skips past
    // it to the canonical name. Anything else differing by more than case would
    // be a semantic rename, which cannot be applied mechanically.
    const unexplained = PROP_PAIRS.filter((pair) => {
      if (pair.sui.toLowerCase() === pair.poly.toLowerCase()) {
        return false;
      }
      return !(pair.suiDeprecatedAliases ?? []).some(
        (alias) => alias.toLowerCase() === pair.poly.toLowerCase()
      );
    }).map((pair) => `${pair.component}: ${pair.poly} -> ${pair.sui}`);

    expect(unexplained).toEqual([]);
  });

  it('declares every deprecated alias it claims, and marks each one deprecated', () => {
    const wrong: string[] = [];
    for (const pair of PROP_PAIRS) {
      for (const alias of pair.suiDeprecatedAliases ?? []) {
        const block = docBlockFor(propertiesOf(pair.component), alias);
        if (block === null) {
          wrong.push(`${pair.component}.${alias} is not declared`);
        } else if (!block.includes('@deprecated')) {
          wrong.push(`${pair.component}.${alias} is not marked @deprecated`);
        }
      }
    }

    expect(wrong).toEqual([]);
  });
});

describe('directionConfig', () => {
  it('migrates a fork consumer onto the canonical prop, not the deprecated alias', () => {
    const stepper = directionConfig('to-sui').renames.get('Stepper');

    expect(stepper?.get('onhandlestepclick')).toBe('onstepclick');
  });

  it('still recognises the deprecated alias when rewriting back to the fork', () => {
    // A SUI consumer may be on either spelling; both map to the fork's one.
    const stepper = directionConfig('to-poly').renames.get('Stepper');

    expect(stepper?.get('onstepclick')).toBe('onhandlestepclick');
    expect(stepper?.get('onhandleStepClick')).toBe('onhandlestepclick');
  });

  it('warns on a deprecated alias left behind in the to-poly direction', () => {
    expect(directionConfig('to-poly').allFromProps.has('onhandleStepClick')).toBe(true);
  });
});
