import { describe, expect, it } from 'vitest';
import { REPO_SCAN_TIMEOUT_MS } from './repo-scan-timeout.ts';
import { groupDeclarations, scanDeclarations } from './lowercase-event-props.ts';
import type { ComponentNote } from './lowercase-event-props.ts';
import {
  planRemoval,
  removeAliasesFromComponent,
  removeDeprecatedDeclarations
} from './remove-event-aliases.ts';

const PROPERTIES = [
  'export type ToggleEventProperties = {',
  '  /** Fires after the toggle state changes. */',
  '  onclick?: (checked: boolean) => void;',
  '  /** @deprecated Use `onclick` instead; both work until 4.0.0. */',
  '  onClick?: (checked: boolean) => void;',
  '  onErrorMessage?: string | null;',
  '};',
  ''
].join('\n');

describe('removeDeprecatedDeclarations', () => {
  it('drops the deprecated alias, keeping the canonical declaration and its description', () => {
    const out = removeDeprecatedDeclarations('Toggle', PROPERTIES);
    expect(out).toBe(
      [
        'export type ToggleEventProperties = {',
        '  /** Fires after the toggle state changes. */',
        '  onclick?: (checked: boolean) => void;',
        '  onErrorMessage?: string | null;',
        '};',
        ''
      ].join('\n')
    );
  });

  it('keeps the description when it currently sits on the canonical declaration', () => {
    const out = removeDeprecatedDeclarations(
      'Table',
      [
        'type TProperties = {',
        '  /** Row click. */',
        '  onrowclick?: (rowIndex: number) => void;',
        '  /** @deprecated Use `onrowclick` instead; both work until 4.0.0. */',
        '  onRowClick?: (rowIndex: number) => void;',
        '};',
        ''
      ].join('\n')
    );
    expect(out).toBe(
      [
        'type TProperties = {',
        '  /** Row click. */',
        '  onrowclick?: (rowIndex: number) => void;',
        '};',
        ''
      ].join('\n')
    );
  });

  it('collapses several deprecated aliases onto the one canonical declaration', () => {
    const out = removeDeprecatedDeclarations(
      'Stepper',
      [
        'export type StepperEventProperties = {',
        '  onhandlestepclick?: (event: { selectedIndex: number }) => void;',
        '  /** @deprecated Use `onhandlestepclick` instead; both work until 4.0.0. */',
        '  onstepclick?: (event: { selectedIndex: number }) => void;',
        '  /** @deprecated Use `onhandlestepclick` instead; both work until 4.0.0. */',
        '  onStepClick?: (event: { selectedIndex: number }) => void;',
        '  /** @deprecated Use `onhandlestepclick` instead; both work until 4.0.0. */',
        '  onhandleStepClick?: (event: { selectedIndex: number }) => void;',
        '  /** @deprecated Use `onhandlestepclick` instead; both work until 4.0.0. */',
        '  onHandleStepClick?: (event: { selectedIndex: number }) => void;',
        '};',
        ''
      ].join('\n')
    );
    expect(out).toBe(
      [
        'export type StepperEventProperties = {',
        '  onhandlestepclick?: (event: { selectedIndex: number }) => void;',
        '};',
        ''
      ].join('\n')
    );
  });

  it('leaves a group with no deprecated member untouched', () => {
    const source =
      'type TProperties = {\n  onErrorMessage?: string;\n  onclick?: () => void;\n};\n';
    expect(removeDeprecatedDeclarations('Button', source)).toBe(source);
  });

  it('is a fixed point', () => {
    const once = removeDeprecatedDeclarations('Toggle', PROPERTIES);
    expect(removeDeprecatedDeclarations('Toggle', once)).toBe(once);
  });
});

describe('removeAliasesFromComponent', () => {
  const groups = groupDeclarations('Toggle', scanDeclarations(PROPERTIES));

  it('drops the alias binding and the resolver when the identifier already matched the canonical name', () => {
    const source = [
      '<script lang="ts">',
      "  import type { ToggleProperties } from './properties';",
      "  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';",
      '',
      '  let { checked = false, onclick: onclickProp, onClick }: ToggleProperties = $props();',
      '',
      '  // Every spelling this component still accepts resolves to one value; the lowercase one wins.',
      '  const onclick = $derived(',
      "    resolveDeprecatedProp('Toggle', 'onClick', 'onclick', onClick, onclickProp)",
      '  );',
      '',
      '  // Read once at mount so an old spelling is reported even if the event never fires.',
      '  $effect.pre(() => {',
      '    readDeprecatedProps(onclick);',
      '  });',
      '',
      '  const handleCheckboxClick = (): void => {',
      '    onclick?.(checked);',
      '  };',
      '</script>',
      ''
    ].join('\n');
    const notes: ComponentNote[] = [];
    const out = removeAliasesFromComponent('Toggle', 'Toggle.svelte', source, groups, notes);
    expect(notes).toEqual([]);
    expect(out).toContain('let { checked = false, onclick }: ToggleProperties = $props();');
    expect(out).toContain('onclick?.(checked);');
    expect(out).not.toMatch(/\bonClick\b/);
    expect(out).not.toContain('resolveDeprecatedProp');
    expect(out).not.toContain('readDeprecatedProps');
    expect(out).not.toContain("from '../deprecation'");
    expect(out).not.toContain('Every spelling this component still accepts');
  });

  it('keeps the banner when a sibling group in the same file is left with a live resolver', () => {
    const mixedGroups = groupDeclarations(
      'Toggle',
      scanDeclarations(
        [
          ...PROPERTIES.split('\n').slice(0, -2),
          '  onhold?: () => void;',
          '  /** @deprecated Use `onhold` instead; both work until 4.0.0. */',
          '  onHold?: () => void;',
          '};',
          ''
        ].join('\n')
      )
    );
    // onHold is destructured and has a resolver, but onhold (the canonical name) is
    // not — the component is left alone rather than guessed at, so its resolver
    // statement (and the resolveDeprecatedProp call inside it) survives untouched.
    const source = [
      '<script lang="ts">',
      "  import type { ToggleProperties } from './properties';",
      "  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';",
      '',
      '  let { checked = false, onclick: onclickProp, onClick, onHold }: ToggleProperties = $props();',
      '',
      '  // Every spelling this component still accepts resolves to one value; the lowercase one wins.',
      '  const onclick = $derived(',
      "    resolveDeprecatedProp('Toggle', 'onClick', 'onclick', onClick, onclickProp)",
      '  );',
      '  const onhold = $derived(',
      "    resolveDeprecatedProp('Toggle', 'onHold', 'onhold', onHold, undefined)",
      '  );',
      '',
      '  // Read once at mount so an old spelling is reported even if the event never fires.',
      '  $effect.pre(() => {',
      '    readDeprecatedProps(onclick);',
      '  });',
      '</script>',
      ''
    ].join('\n');
    const notes: ComponentNote[] = [];
    const out = removeAliasesFromComponent('Toggle', 'Toggle.svelte', source, mixedGroups, notes);
    expect(notes).toEqual([
      {
        file: 'Toggle.svelte',
        message:
          'onhold is not destructured even though a resolver exists; left untouched for a manual pass'
      }
    ]);
    expect(out).toContain('Every spelling this component still accepts');
    expect(out).toContain("resolveDeprecatedProp('Toggle', 'onHold', 'onhold', onHold, undefined)");
  });

  it('renames the resolved identifier to the canonical spelling when they differed', () => {
    const tableGroups = groupDeclarations(
      'Table',
      scanDeclarations(
        [
          'type TProperties = {',
          '  onrowclick?: (rowIndex: number) => void;',
          '  /** @deprecated Use `onrowclick` instead; both work until 4.0.0. */',
          '  onRowClick?: (rowIndex: number) => void;',
          '};',
          ''
        ].join('\n')
      )
    );
    const source = [
      '<script lang="ts">',
      "  import type { TableProperties } from './properties';",
      "  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';",
      '',
      '  let { rows = [], onRowClick: onRowClickProp, onrowclick }: TableProperties = $props();',
      '',
      "  const onRowClick = $derived(resolveDeprecatedProp('Table', 'onRowClick', 'onrowclick', onRowClickProp, onrowclick));",
      '',
      '  // Read once at mount so an old spelling is reported even if the event never fires.',
      '  $effect.pre(() => {',
      '    readDeprecatedProps(onRowClick);',
      '  });',
      '',
      '  const handle = (i: number): void => {',
      '    onRowClick?.(i);',
      '  };',
      '',
      '  const isClickable = $derived(typeof onRowClick === "function");',
      '</script>',
      ''
    ].join('\n');
    const notes: ComponentNote[] = [];
    const out = removeAliasesFromComponent('Table', 'Table.svelte', source, tableGroups, notes);
    expect(notes).toEqual([]);
    expect(out).toContain('let { rows = [], onrowclick }: TableProperties = $props();');
    expect(out).toContain('onrowclick?.(i);');
    expect(out).toContain('typeof onrowclick === "function"');
    expect(out).not.toMatch(/\bonRowClick\b/);
    expect(out).not.toContain('resolveDeprecatedProp');
    expect(out).not.toContain("from '../deprecation'");
  });

  it('unwinds a chain of nested resolvers and renames every remaining reference, including in markup', () => {
    const stepperGroups = groupDeclarations(
      'Stepper',
      scanDeclarations(
        [
          'export type StepperEventProperties = {',
          '  onhandlestepclick?: (event: { selectedIndex: number }) => void;',
          '  /** @deprecated Use `onhandlestepclick` instead; both work until 4.0.0. */',
          '  onstepclick?: (event: { selectedIndex: number }) => void;',
          '  /** @deprecated Use `onhandlestepclick` instead; both work until 4.0.0. */',
          '  onStepClick?: (event: { selectedIndex: number }) => void;',
          '};',
          ''
        ].join('\n')
      )
    );
    const source = [
      '<script lang="ts">',
      "  import type { StepperProperties } from './properties';",
      "  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';",
      '',
      '  let {',
      '    steps,',
      '    onstepclick,',
      '    onStepClick,',
      '    onhandlestepclick',
      '  }: StepperProperties = $props();',
      '',
      '  const onhandleStepClick = $derived(',
      "    resolveDeprecatedProp('Stepper', 'onstepclick', 'onhandlestepclick', onstepclick,",
      "      resolveDeprecatedProp('Stepper', 'onStepClick', 'onhandlestepclick', onStepClick, onhandlestepclick))",
      '  );',
      '',
      '  // Read once at mount so an old spelling is reported even if the event never fires.',
      '  $effect.pre(() => {',
      '    readDeprecatedProps(onhandleStepClick);',
      '  });',
      '</script>',
      '',
      '<div onclick={onhandleStepClick}></div>',
      ''
    ].join('\n');
    const notes: ComponentNote[] = [];
    const out = removeAliasesFromComponent(
      'Stepper',
      'Stepper.svelte',
      source,
      stepperGroups,
      notes
    );
    expect(notes).toEqual([]);
    expect(out).toContain(
      'let {\n    steps,\n    onhandlestepclick\n  }: StepperProperties = $props();'
    );
    expect(out).toContain('<div onclick={onhandlestepclick}></div>');
    expect(out).not.toMatch(/\bonstepclick\b,/);
    expect(out).not.toMatch(/\bonStepClick\b/);
    expect(out).not.toMatch(/\bonhandleStepClick\b/);
    expect(out).not.toContain('resolveDeprecatedProp');
    expect(out).not.toContain("from '../deprecation'");
  });

  it('leaves the file untouched when it destructures none of the group', () => {
    const source = [
      '<script lang="ts">',
      "  import type { P } from './properties';",
      '  let { checked = false }: P = $props();',
      '</script>',
      ''
    ].join('\n');
    expect(removeAliasesFromComponent('Toggle', 'Other.svelte', source, groups, [])).toBeNull();
  });

  it('notes rather than guesses when no resolver statement matches the group', () => {
    const source = [
      '<script lang="ts">',
      "  import type { ToggleProperties } from './properties';",
      '  let { onclick, onClick }: ToggleProperties = $props();',
      '</script>',
      ''
    ].join('\n');
    const notes: ComponentNote[] = [];
    const out = removeAliasesFromComponent('Toggle', 'Odd.svelte', source, groups, notes);
    expect(out).toBeNull();
    expect(notes).toHaveLength(1);
    expect(notes[0].message).toContain('no resolveDeprecatedProp statement found');
  });
});

describe('the repository', () => {
  it(
    'has nothing left for the generator to do',
    () => {
      const { changes, notes } = planRemoval(process.cwd());
      expect(changes.map((change) => change.file)).toEqual([]);
      expect(notes).toEqual([]);
    },
    REPO_SCAN_TIMEOUT_MS
  );
});
