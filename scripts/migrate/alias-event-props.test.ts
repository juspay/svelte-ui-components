import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { planAliases } from './alias-event-props.ts';
import { deriveEventName } from './casing.ts';
import { readSignature } from './signatures.ts';

const root = process.cwd();
const baseline: readonly string[] = JSON.parse(
  readFileSync(join(root, 'scripts/event-casing-baseline.json'), 'utf8')
);

describe('phase 1 aliases', () => {
  it('has nothing left to do, because every alias is already applied', () => {
    // planAliases skips a prop whose target is already declared, so on an
    // aliased tree the plan is empty. This is also the idempotence check: a
    // second --apply would rewrite nothing.
    const { aliases } = planAliases(root);

    expect(aliases).toEqual([]);
  });

  it('declares the corrected spelling for every grandfathered prop', () => {
    const missing: string[] = [];
    for (const entry of baseline) {
      const [propertiesFile, prop] = entry.split('::');
      const absolute = join(root, propertiesFile);
      const derived = deriveEventName(prop, readSignature(absolute, prop));
      if (derived.kind === 'unresolved' || derived.kind === 'ok') {
        continue;
      }
      const source = readFileSync(absolute, 'utf8');
      if (!new RegExp(`^\\s*${derived.target}\\??\\s*:`, 'm').test(source)) {
        missing.push(`${propertiesFile}::${derived.target}`);
      }
    }

    expect(missing).toEqual([]);
  });

  it('keeps the old spelling declared alongside it, so nothing breaks yet', () => {
    // Phase 1 is purely additive. The old spellings are removed in 4.0.0, not
    // here, and a consumer on one must keep compiling until then.
    const dropped = baseline.filter((entry) => {
      const [propertiesFile, prop] = entry.split('::');
      const source = readFileSync(join(root, propertiesFile), 'utf8');
      return !new RegExp(`^\\s*${prop}\\??\\s*:`, 'm').test(source);
    });

    expect(dropped).toEqual([]);
  });

  it('wires both spellings to one value in every component it touched', () => {
    const unwired: string[] = [];
    for (const entry of baseline) {
      const [propertiesFile, prop] = entry.split('::');
      const derived = deriveEventName(prop, readSignature(join(root, propertiesFile), prop));
      if (derived.kind === 'unresolved' || derived.kind === 'ok') {
        continue;
      }
      const directory = propertiesFile.slice(0, propertiesFile.lastIndexOf('/'));
      const component = directory.slice(directory.lastIndexOf('/') + 1);
      const source = readFileSync(join(root, directory, `${component}.svelte`), 'utf8');
      // The component may not destructure the prop at all (it can be spread
      // through), but if it does, the derived has to be there.
      if (!source.includes(`${prop}Legacy`)) {
        continue;
      }
      // Whitespace-collapsed before matching: a long pair of names wraps the
      // derived across lines, and a literal single-line match would report a
      // perfectly correct component as unwired.
      const collapsed = source.replace(/\s+/g, ' ');
      if (
        !collapsed.includes(`const ${prop} = $derived( ${derived.target} ?? ${prop}Legacy )`) &&
        !collapsed.includes(`const ${prop} = $derived(${derived.target} ?? ${prop}Legacy)`)
      ) {
        unwired.push(`${component}.${prop}`);
      }
    }

    expect(unwired).toEqual([]);
  });

  it('never leaves a destructured default behind when it renames a binding', () => {
    // `onBlur = () => {}` becoming a bare `onBlurLegacy` would make the binding
    // undefined, and Input calls `onBlur(event)` unguarded. The default has to
    // travel with the renamed binding.
    const source = readFileSync(join(root, 'src/lib/Input/Input.svelte'), 'utf8');

    expect(source).toContain('onBlur: onBlurLegacy = () => {}');
    expect(source).toContain('const onBlur = $derived(onblur ?? onBlurLegacy)');
  });
});
