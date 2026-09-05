import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LEGACY_PAIRS, legacyProps, legacyRenameTable } from './legacy-pairs.ts';
import { computeLegacyPairs } from './generate-maps.ts';

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

// Step's props live in Stepper's shared properties.ts (see generate-maps.ts).
const propertiesDirectory = (component: string): string =>
  component === 'Step' ? 'Stepper' : component;

const propertiesOf = (component: string): string =>
  readFileSync(
    join(process.cwd(), 'src/lib', propertiesDirectory(component), 'properties.ts'),
    'utf8'
  );

describe('LEGACY_PAIRS', () => {
  it('has exactly 191 entries — every @deprecated event prop in src/lib', () => {
    expect(LEGACY_PAIRS.length).toBe(191);
  });

  it('matches what generate-maps.ts derives from the @deprecated tags', () => {
    // `computeLegacyPairs` re-reads every properties.ts and takes each
    // deprecated prop's replacement from its own tag. Asserting the committed
    // array equals its output means every entry here really is what the
    // library declares, and a new deprecation fails this test until
    // `LEGACY_PAIRS` is regenerated to match.
    expect(LEGACY_PAIRS).toEqual(computeLegacyPairs());
  });

  it('never claims a legacy spelling equals its own correction', () => {
    const noOps = LEGACY_PAIRS.filter((pair) => pair.legacy === pair.corrected).map(
      (pair) => `${pair.component}.${pair.legacy}`
    );

    expect(noOps).toEqual([]);
  });

  it('marks every legacy spelling @deprecated where the component declares it', () => {
    // The codemod only earns its keep if the spelling it moves a consumer off
    // is really the one on notice. A legacy prop without the tag would be a
    // rename nobody asked for.
    const wrong = LEGACY_PAIRS.flatMap((pair) => {
      const block = docBlockFor(propertiesOf(pair.component), pair.legacy);
      if (block === null) {
        return [`${pair.component}.${pair.legacy} is not declared`];
      }
      return block.includes('@deprecated')
        ? []
        : [`${pair.component}.${pair.legacy} is not marked @deprecated`];
    });

    expect(wrong).toEqual([]);
  });

  it('never rewrites a consumer onto a deprecated prop', () => {
    // Landing a consumer on a prop that is itself slated for removal means
    // they owe a second migration immediately, so every target must be the
    // supported spelling.
    const deprecated = LEGACY_PAIRS.filter((pair) =>
      (docBlockFor(propertiesOf(pair.component), pair.corrected) ?? '').includes('@deprecated')
    ).map((pair) => `${pair.component}.${pair.corrected}`);

    expect(deprecated).toEqual([]);
  });
});

describe('legacyRenameTable', () => {
  it('maps every deprecated spelling of a component to its corrected one', () => {
    const stepper = legacyRenameTable().get('Stepper');

    expect(stepper?.get('onstepclick')).toBe('onhandlestepclick');
    expect(stepper?.get('onStepClick')).toBe('onhandlestepclick');
    expect(stepper?.get('onhandleStepClick')).toBe('onhandlestepclick');
  });

  it('lists every legacy spelling for unresolved-tag warnings', () => {
    expect(legacyProps().has('onStepClick')).toBe(true);
    expect(legacyProps().has('onhandlestepclick')).toBe(false);
  });
});
