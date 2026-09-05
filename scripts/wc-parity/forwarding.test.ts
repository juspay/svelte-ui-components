import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readCustomElementDeclaration } from './prop-parity.ts';

/**
 * A wrapper has to hand the props it declares to the component it wraps.
 *
 * `prop-parity.ts` already ratchets the other direction -- every prop the
 * component accepts is exposed by the element -- and
 * `tests/wc-event-casing-parity.spec.ts` proves in a browser that each declared
 * spelling is a real accessor. Neither asks whether setting that accessor
 * reaches the component, and a wrapper that declared a prop and then dropped it
 * would satisfy both: the setter exists, the component's props are all covered,
 * and the consumer's handler never fires.
 *
 * That gap matters here because the lowercase migration added 46 alias
 * declarations across these wrappers, and an alias exists precisely to be
 * forwarded. Rather than trying to match every shape a forward can take, this
 * pins the structural property that makes forwarding automatic: a wrapper
 * either binds the whole `$props()` object, or destructures with a rest
 * element. Both spread everything they did not name. Every wrapper does one of
 * these today, so a wrapper that starts naming props individually is the case
 * this catches -- and the fix is to forward them explicitly.
 */

const WC_DIR = join(process.cwd(), 'src/wc/components');

/** How a wrapper binds `$props()`: whole-object, rest destructure, or neither. */
const bindingShape = (source: string): 'whole' | 'rest' | 'named' | 'none' => {
  const destructured = /let\s*\{([\s\S]*?)\}\s*(?::\s*[\w<>[\],\s|]+\s*)?=\s*\$props\(\)/.exec(
    source
  );
  if (destructured !== null) {
    return /\.\.\.\w+/.test(destructured[1]) ? 'rest' : 'named';
  }
  return /let\s+\w+\s*(?::[^=]+)?=\s*\$props\(\)/.test(source) ? 'whole' : 'none';
};

const wrappers = readdirSync(WC_DIR)
  .filter((file) => file.endsWith('.wc.svelte'))
  .sort();

describe('custom-element wrappers forward the props they declare', () => {
  it('finds the wrappers at all', () => {
    expect(wrappers.length).toBeGreaterThan(50);
  });

  for (const file of wrappers) {
    const source = readFileSync(join(WC_DIR, file), 'utf8');
    const declared = readCustomElementDeclaration(source).props;
    const events = declared.filter((name) => /^on[A-Za-z]/.test(name));
    if (events.length === 0) {
      continue;
    }

    it(`${file} spreads its ${events.length} declared event prop(s) through`, () => {
      const shape = bindingShape(source);
      expect(
        shape,
        `${file} names props individually, so the ${events.length} event prop(s) it declares ` +
          `(${events.join(', ')}) reach the component only if it forwards each one by hand. ` +
          `Either keep a rest element, or forward them explicitly and relax this test.`
      ).not.toBe('named');
      expect(shape, `${file} never binds $props()`).not.toBe('none');
    });
  }
});
