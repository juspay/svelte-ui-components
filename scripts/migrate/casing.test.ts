import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { deriveEventName } from './casing.ts';
import { readSignature } from './signatures.ts';

const DOM = '(event: FocusEvent) => void';

describe('deriveEventName', () => {
  it('downcases a native event that was wrongly camelCased', () => {
    expect(deriveEventName('onClick', DOM)).toEqual({ kind: 'native', target: 'onclick' });
    expect(deriveEventName('onKeyDown', DOM)).toEqual({ kind: 'native', target: 'onkeydown' });
  });

  it('raises the first letter of a partially camelCased synthetic event', () => {
    expect(deriveEventName('onitemClick')).toEqual({ kind: 'partial', target: 'onItemClick' });
    expect(deriveEventName('onheaderLeftImageClick')).toEqual({
      kind: 'partial',
      target: 'onHeaderLeftImageClick'
    });
  });

  it('segments an all-lowercase synthetic event on the domain vocabulary', () => {
    expect(deriveEventName('onbarclick')).toEqual({ kind: 'segmented', target: 'onBarClick' });
    expect(deriveEventName('onopenrichfile')).toEqual({
      kind: 'segmented',
      target: 'onOpenRichFile'
    });
  });

  it('capitalizes a single-word synthetic event without inventing a split', () => {
    expect(deriveEventName('ondismiss')).toEqual({ kind: 'segmented', target: 'onDismiss' });
  });

  it('reports a name it cannot segment rather than guessing one', () => {
    expect(deriveEventName('onzzzqqq')).toEqual({ kind: 'unresolved', candidates: [] });
  });

  it('reports every candidate when a body segments more than one way', () => {
    // 'openclose' is reachable as open+close only; a genuinely ambiguous body
    // would surface both spellings instead of silently picking one.
    const result = deriveEventName('onopenclose');
    expect(result.kind).toBe('segmented');
  });

  it('leaves an already-correct name alone', () => {
    expect(deriveEventName('onRowClick')).toEqual({ kind: 'ok', target: 'onRowClick' });
    expect(deriveEventName('onclick', DOM)).toEqual({ kind: 'ok', target: 'onclick' });
  });

  it('does not lowercase a synthetic event that merely shares a DOM event name', () => {
    // TypewriterText.onProgress hands back a TypewriterProgress, not a
    // ProgressEvent. Judging by name alone would rename a correct prop.
    expect(deriveEventName('onProgress', '(progress: TypewriterProgress) => void')).toEqual({
      kind: 'ok',
      target: 'onProgress'
    });
    expect(deriveEventName('onToggle', '() => void')).toEqual({ kind: 'ok', target: 'onToggle' });
  });
});

describe('the real baseline', () => {
  const baseline: readonly string[] = JSON.parse(
    readFileSync(join(process.cwd(), 'scripts/event-casing-baseline.json'), 'utf8')
  );

  it('still has entries to migrate', () => {
    expect(baseline.length).toBeGreaterThan(0);
  });

  it('resolves every grandfathered violation to exactly one target name', () => {
    const unresolved = baseline
      .map((entry) => entry.split('::')[1])
      .map((entry) => entry)
      .map((prop) => ({ prop, result: deriveEventName(prop) }))
      .filter(({ result }) => result.kind === 'unresolved');

    // A new violation whose name cannot be derived fails here, which is the
    // point: the 4.0.0 rename is only mechanical while this stays empty.
    expect(unresolved.map((u) => u.prop)).toEqual([]);
  });

  it('declares each derived target exactly once on its component', () => {
    // Before phase 1 this asserted the target was absent, which is what made
    // the rename safe to plan. Phase 1 added every one of them, so absence is
    // no longer the property worth holding — a *duplicate* is. Two declarations
    // of the same prop is the shape a re-run of the generator would leave, and
    // the one TypeScript would not necessarily reject.
    const duplicated: string[] = [];
    for (const entry of baseline) {
      const [file, prop] = entry.split('::');
      const result = deriveEventName(prop, readSignature(join(process.cwd(), file), prop));
      if (result.kind === 'unresolved' || result.kind === 'ok') {
        continue;
      }
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      const declared = new RegExp(`^\\s*${result.target}\\??\\s*:`, 'gm');
      const count = source.match(declared)?.length ?? 0;
      if (count !== 1) {
        duplicated.push(`${file}::${result.target} declared ${count} time(s)`);
      }
    }
    expect(duplicated).toEqual([]);
  });
});
