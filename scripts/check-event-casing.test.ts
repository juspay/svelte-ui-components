import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * The gate that keeps DESIGN_PRINCIPLES §3 true, checked against cases where
 * it must fail and cases where it must stay quiet.
 *
 * It had no test until now, which is the worst shape for a lint to be in: the
 * only signal it gives on a healthy repo is silence, and a rule that quietly
 * stopped matching anything produces exactly the same silence. Every other
 * piece of the migration is guarded by something that fails loudly when it
 * breaks; this one would have let the rule erode with a green build.
 *
 * Each case is one of the script's own decisions -- what counts as an event
 * prop, what an `@deprecated` tag buys, and which declarations are out of
 * scope because they are config-object keys rather than props a consumer
 * writes on a tag. That last rule is the subtle one: it is the reason
 * `TableColumn.onToggle` keeps its spelling while `Table`'s own `onRowClick`
 * does not, and it is enforced by a two-space indent check that would be very
 * easy to break without noticing.
 */

const SCRIPT = join(process.cwd(), 'scripts/check-event-casing.js');

const roots: string[] = [];

afterEach(() => {
  while (roots.length > 0) {
    const root = roots.pop();
    if (typeof root === 'string') {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

/** A throwaway repo root holding one component's `properties.ts`. */
const fixture = (component: string, contents: string): string => {
  const root = mkdtempSync(join(tmpdir(), 'sui-event-casing-'));
  roots.push(root);
  const dir = join(root, 'src', 'lib', component);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'properties.ts'), contents);
  return root;
};

type Run = { readonly code: number; readonly out: string };

const run = (root: string): Run => {
  try {
    return { code: 0, out: execFileSync(process.execPath, [SCRIPT, root], { encoding: 'utf8' }) };
  } catch (error: unknown) {
    // A non-zero exit is the behaviour under test, and execFileSync reports it
    // by throwing an error carrying the status and the captured output.
    if (error !== null && typeof error === 'object' && 'status' in error && 'stdout' in error) {
      const { status, stdout } = error;
      return {
        code: typeof status === 'number' ? status : -1,
        out: typeof stdout === 'string' ? stdout : ''
      };
    }
    throw error;
  }
};

describe('the event-casing gate', () => {
  it('passes a component whose event prop is already lowercase', () => {
    const root = fixture(
      'Toggle',
      'export type ToggleProperties = {\n  onclick?: (checked: boolean) => void;\n};\n'
    );

    const { code, out } = run(root);

    expect(code).toBe(0);
    expect(out).toContain('0 event-casing violation(s)');
  });

  it('fails an uppercase event prop and names the spelling that replaces it', () => {
    const root = fixture(
      'Toggle',
      'export type ToggleProperties = {\n  onClick?: (checked: boolean) => void;\n};\n'
    );

    const { code, out } = run(root);

    expect(code, 'an undeprecated camelCase event prop did not fail the gate').toBe(1);
    expect(out).toContain('onClick');
    expect(out).toContain('onclick');
    expect(out).toContain('1 event-casing violation(s)');
  });

  it('accepts an uppercase spelling that is marked @deprecated, and counts it', () => {
    const root = fixture(
      'Toggle',
      'export type ToggleProperties = {\n' +
        '  onclick?: (checked: boolean) => void;\n' +
        '  /** @deprecated Use `onclick` instead; both work until 4.0.0. */\n' +
        '  onClick?: (checked: boolean) => void;\n' +
        '};\n'
    );

    const { code, out } = run(root);

    expect(code, 'the alias every 3.x consumer still relies on was rejected').toBe(0);
    expect(out).toContain('1 deprecated alias(es)');
  });

  it('ignores a callback key on a config object, which is not a prop on a tag', () => {
    // `TableColumn` is not a `…Properties` type, so `onToggle` here is a key a
    // consumer writes inside an object, and renaming it would be a breaking
    // change to a data shape rather than an event-casing fix.
    const root = fixture(
      'Table',
      'export type TableColumn = {\n  onToggle?: (id: string) => void;\n};\n' +
        'export type TableProperties = {\n  onrowclick?: (row: number) => void;\n};\n'
    );

    const { code, out } = run(root);

    expect(code, 'a config-object callback key was treated as a component prop').toBe(0);
    expect(out).toContain('0 event-casing violation(s)');
  });

  it('ignores a callback nested below the props type’s own members', () => {
    // Four spaces of indent means it belongs to an inline object inside a prop,
    // not to the component.
    const root = fixture(
      'Chat',
      'export type ChatProperties = {\n' +
        '  adapter?: {\n' +
        '    onSend?: (text: string) => void;\n' +
        '  };\n' +
        '};\n'
    );

    const { code, out } = run(root);

    expect(code, 'a nested callback was treated as a component prop').toBe(0);
    expect(out).toContain('0 event-casing violation(s)');
  });

  it('ignores an on-prefixed prop that is not a callback', () => {
    // `onErrorMessage: string` is a label, not an event, and lowercasing it
    // would be meaningless -- the gate decides by the declared type.
    const root = fixture(
      'Input',
      'export type InputProperties = {\n  onErrorMessage?: string;\n};\n'
    );

    const { code, out } = run(root);

    expect(code, 'a non-callback prop was treated as an event').toBe(0);
    expect(out).toContain('0 event-casing violation(s)');
  });

  it('catches an event prop that borrows its type by indexed access', () => {
    // The shape that got past this gate in 3.x. `Chat` declared
    // `onScrollState?: ChatMessageListProperties['onscrollstate']` — an event
    // prop with no `=>` of its own, so the callback check skipped it, and an
    // uppercase spelling shipped undeprecated. Worse, the lowercase twin beside
    // it carried the `@deprecated` tag, pointing consumers at the camelCase
    // name and inverting the rule for one component.
    const root = fixture(
      'Chat',
      'export type ChatProperties = {\n' +
        "  onScrollState?: ChatMessageListProperties['onscrollstate'];\n" +
        '};\n'
    );

    const { code, out } = run(root);

    expect(code, 'an indexed-access event prop slipped past the gate').toBe(1);
    expect(out).toContain('onScrollState');
  });

  it('still ignores an indexed access that is not an event', () => {
    // The narrowing has to stay narrow: only a key that reads like an event
    // makes the declaration one.
    const root = fixture(
      'Chat',
      'export type ChatProperties = {\n' +
        "  onErrorMessage?: InputProperties['errorMessage'];\n" +
        '};\n'
    );

    const { code } = run(root);

    expect(code, 'a non-event indexed access was treated as an event').toBe(0);
  });

  it('reports every offending file, not just the first', () => {
    const root = mkdtempSync(join(tmpdir(), 'sui-event-casing-'));
    roots.push(root);
    for (const name of ['Toggle', 'Modal']) {
      const dir = join(root, 'src', 'lib', name);
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        join(dir, 'properties.ts'),
        `export type ${name}Properties = {\n  onClose?: () => void;\n};\n`
      );
    }

    const { code, out } = run(root);

    expect(code).toBe(1);
    expect(out).toContain('2 event-casing violation(s)');
    expect(out).toContain('Toggle');
    expect(out).toContain('Modal');
  });
});
