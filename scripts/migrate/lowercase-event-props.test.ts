import { describe, expect, it } from 'vitest';
import {
  lowercaseComponent,
  lowercaseProperties,
  planLowercase,
  scanDeclarations,
  groupDeclarations
} from './lowercase-event-props.ts';
import type { ComponentNote } from './lowercase-event-props.ts';

const PROPERTIES = [
  'export type ToggleEventProperties = {',
  '  /** @deprecated Use `onClick` instead; both work until 4.0.0. */',
  '  onclick?: (checked: boolean) => void;',
  '  /** Fires after the toggle state changes. */',
  '  onClick?: (checked: boolean) => void;',
  '  onErrorMessage?: string | null;',
  '};',
  ''
].join('\n');

describe('lowercaseProperties', () => {
  it('makes the lowercase spelling canonical, carrying the description, and deprecates the rest', () => {
    const out = lowercaseProperties('Toggle', PROPERTIES);
    expect(out).toBe(
      [
        'export type ToggleEventProperties = {',
        '  /** Fires after the toggle state changes. */',
        '  onclick?: (checked: boolean) => void;',
        '  /** @deprecated Use `onclick` instead; both work until 4.0.0. */',
        '  onClick?: (checked: boolean) => void;',
        '  onErrorMessage?: string | null;',
        '};',
        ''
      ].join('\n')
    );
  });

  it('declares a lowercase twin for a camelCase prop that had none', () => {
    const out = lowercaseProperties(
      'Table',
      'type TProperties = {\n  /** Row click. */\n  onRowClick?: (rowIndex: number) => void;\n};\n'
    );
    expect(out).toBe(
      'type TProperties = {\n  /** Row click. */\n  onrowclick?: (rowIndex: number) => void;\n  /** @deprecated Use `onrowclick` instead; both work until 4.0.0. */\n  onRowClick?: (rowIndex: number) => void;\n};\n'
    );
  });

  it('collapses a mixed-case alias and its camelCase twin onto one lowercase name', () => {
    const out = lowercaseProperties(
      'Modal',
      'type TProperties = {\n  /** @deprecated Use `onOverlayClick` instead; both work until 4.0.0. */\n  onoverlayClick?: () => void;\n  onOverlayClick?: () => void;\n};\n'
    );
    expect(out).toBe(
      'type TProperties = {\n  onoverlayclick?: () => void;\n  /** @deprecated Use `onoverlayclick` instead; both work until 4.0.0. */\n  onoverlayClick?: () => void;\n  /** @deprecated Use `onoverlayclick` instead; both work until 4.0.0. */\n  onOverlayClick?: () => void;\n};\n'
    );
  });

  it('leaves a non-callback `on*` prop and an already-lowercase prop alone', () => {
    const source =
      'type TProperties = {\n  onErrorMessage?: string;\n  onclick?: () => void;\n};\n';
    expect(lowercaseProperties('Button', source)).toBe(source);
  });

  it('is a fixed point', () => {
    const once = lowercaseProperties('Toggle', PROPERTIES);
    expect(lowercaseProperties('Toggle', once)).toBe(once);
  });
});

describe('lowercaseComponent', () => {
  const groups = groupDeclarations('Toggle', scanDeclarations(PROPERTIES));

  it('flips an existing resolver so the lowercase binding wins and the camelCase one warns', () => {
    const source = [
      '<script lang="ts">',
      "  import type { ToggleProperties } from './properties';",
      "  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';",
      '',
      '  let { checked = false, onclick: onclickLegacy, onClick }: ToggleProperties = $props();',
      '',
      '  // Event-casing phase 1: both spellings accepted, the correct one wins.',
      '  const onclick = $derived(',
      "    resolveDeprecatedProp('Toggle', 'onclick', 'onClick', onclickLegacy, onClick)",
      '  );',
      '',
      '  // Read once at mount so a legacy spelling is reported even if the event never fires.',
      '  $effect.pre(() => {',
      '    readDeprecatedProps(onclick);',
      '  });',
      '</script>',
      ''
    ].join('\n');
    const notes: ComponentNote[] = [];
    const out = lowercaseComponent('Toggle', 'Toggle.svelte', source, groups, notes);
    expect(notes).toEqual([]);
    expect(out).toContain(
      'let { checked = false, onclick: onclickProp, onClick }: ToggleProperties = $props();'
    );
    expect(out).toContain(
      "const onclick = $derived(resolveDeprecatedProp('Toggle', 'onClick', 'onclick', onClick, onclickProp));"
    );
    expect(out).toContain('readDeprecatedProps(onclick);');
    expect(out).not.toContain('Legacy');
    expect(out).not.toContain('Event-casing phase 1');
  });

  it('aliases a camelCase prop that had no alias, keeping the identifier the code uses', () => {
    const tableGroups = groupDeclarations(
      'Table',
      scanDeclarations('type TProperties = {\n  onRowClick?: (rowIndex: number) => void;\n};\n')
    );
    const source = [
      '<script lang="ts">',
      "  import type { TableProperties } from './properties';",
      '',
      '  let { rows = [], onRowClick }: TableProperties = $props();',
      '',
      '  const handle = (i: number): void => {',
      '    onRowClick?.(i);',
      '  };',
      '</script>',
      ''
    ].join('\n');
    const notes: ComponentNote[] = [];
    const out = lowercaseComponent('Table', 'Table.svelte', source, tableGroups, notes);
    expect(out).toContain(
      "import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';"
    );
    expect(out).toContain(
      'let { rows = [], onRowClick: onRowClickProp, onrowclick }: TableProperties = $props();'
    );
    expect(out).toContain(
      "const onRowClick = $derived(resolveDeprecatedProp('Table', 'onRowClick', 'onrowclick', onRowClickProp, onrowclick));"
    );
    expect(out).toContain('readDeprecatedProps(onRowClick);');
    expect(out).toContain('onRowClick?.(i);');
  });

  it('moves a destructured default onto the resolved value', () => {
    const tableGroups = groupDeclarations(
      'Iframe',
      scanDeclarations('type TProperties = {\n  onMessage?: (m: string) => void;\n};\n')
    );
    const source = [
      '<script lang="ts">',
      "  import type { P } from './properties';",
      '  let { onMessage = () => {} }: P = $props();',
      '</script>',
      ''
    ].join('\n');
    const out = lowercaseComponent('Iframe', 'Iframe.svelte', source, tableGroups, []);
    expect(out).toContain('let { onMessage: onMessageProp, onmessage }: P = $props();');
    expect(out).toContain(
      "const onMessage = $derived(resolveDeprecatedProp('Iframe', 'onMessage', 'onmessage', onMessageProp, onmessage) ?? (() => {}));"
    );
  });

  it('chains every alias when a group has several', () => {
    const modalGroups = groupDeclarations(
      'Modal',
      scanDeclarations(
        'type TProperties = {\n  /** @deprecated x */\n  onoverlayClick?: () => void;\n  onOverlayClick?: () => void;\n};\n'
      )
    );
    const source = [
      '<script lang="ts">',
      "  import type { P } from './properties';",
      "  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';",
      '  let { onoverlayClick: onoverlayClickLegacy, onOverlayClick }: P = $props();',
      "  const onoverlayClick = $derived(resolveDeprecatedProp('Modal', 'onoverlayClick', 'onOverlayClick', onoverlayClickLegacy, onOverlayClick));",
      '  // Read once at mount so a legacy spelling is reported even if the event never fires.',
      '  $effect.pre(() => {',
      '    readDeprecatedProps(onoverlayClick);',
      '  });',
      '</script>',
      ''
    ].join('\n');
    const out = lowercaseComponent('Modal', 'Modal.svelte', source, modalGroups, []);
    expect(out).toContain(
      'let { onoverlayClick: onoverlayClickProp, onOverlayClick, onoverlayclick }: P = $props();'
    );
    expect(out).toContain(
      "const onoverlayClick = $derived(resolveDeprecatedProp('Modal', 'onoverlayClick', 'onoverlayclick', onoverlayClickProp, resolveDeprecatedProp('Modal', 'onOverlayClick', 'onoverlayclick', onOverlayClick, onoverlayclick)));"
    );
  });
});

describe('the repository', () => {
  it('has nothing left for the generator to do', () => {
    const { changes, notes } = planLowercase(process.cwd());
    expect(changes.map((change) => change.file)).toEqual([]);
    expect(notes).toEqual([]);
  });
});
