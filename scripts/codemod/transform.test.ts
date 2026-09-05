import { describe, expect, it } from 'vitest';
import { LEGACY_PAIRS } from './legacy-pairs.ts';
import { SUI_PACKAGE, transformSvelte } from './transform.ts';

const FILE = 'Fixture.svelte';

const migrate = (source: string) => transformSvelte(source, FILE);

const IMPORT = (names: string) => `  import { ${names} } from '${SUI_PACKAGE}';`;

describe('per-pair rewrites', () => {
  for (const pair of LEGACY_PAIRS) {
    it(`${pair.component}: ${pair.legacy} -> ${pair.corrected}`, () => {
      const source = [
        '<script>',
        IMPORT(pair.component),
        '</script>',
        '',
        `<${pair.component} ${pair.legacy}={() => {}} />`,
        ''
      ].join('\n');
      const result = migrate(source);
      expect(result.code).toContain(`<${pair.component} ${pair.corrected}={() => {}} />`);
      expect(result.propsRenamed).toBe(1);
      expect(result.warnings).toHaveLength(0);
    });
  }
});

describe('component awareness', () => {
  it('resolves an aliased import and rewrites based on the exported name', () => {
    const source = [
      '<script lang="ts">',
      `  import { Modal as Dialog } from '${SUI_PACKAGE}';`,
      '</script>',
      '',
      '<Dialog onOverlayClick={() => {}} onClose={() => {}} />',
      ''
    ].join('\n');
    const result = migrate(source);
    expect(result.code).toContain('<Dialog onoverlayclick={() => {}} onclose={() => {}} />');
    expect(result.propsRenamed).toBe(2);
    expect(result.warnings).toHaveLength(0);
  });

  it('leaves a same-named prop on a non-library component untouched', () => {
    const source = [
      '<script>',
      `  import Toggle from './Toggle.svelte';`,
      '</script>',
      '',
      '<Toggle onClick={() => {}} />',
      ''
    ].join('\n');
    const result = migrate(source);
    expect(result.code).toBe(source);
    expect(result.changed).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it('leaves a same-named prop on a non-library component untouched even when the library is imported', () => {
    const source = [
      '<script>',
      IMPORT('Input'),
      `  import Toggle from './Toggle.svelte';`,
      '</script>',
      '',
      '<Toggle onClick={() => {}} />',
      '<Input onclick={() => {}} />',
      ''
    ].join('\n');
    const result = migrate(source);
    expect(result.code).toContain('<Toggle onClick={() => {}} />');
    // Input.onclick already is the lowercase spelling: nothing to rename.
    expect(result.code).toContain('<Input onclick={() => {}} />');
    expect(result.propsRenamed).toBe(0);
  });

  it('never touches native elements', () => {
    const source = [
      '<script>',
      IMPORT('Toggle'),
      '</script>',
      '',
      '<button onClick={() => {}}>go</button>',
      '<input oninput={() => {}} />',
      '<Toggle onClick={() => {}} />',
      ''
    ].join('\n');
    const result = migrate(source);
    expect(result.code).toContain('<button onClick={() => {}}>go</button>');
    expect(result.code).toContain('<input oninput={() => {}} />');
    expect(result.code).toContain('<Toggle onclick={() => {}} />');
    expect(result.propsRenamed).toBe(1);
  });

  it('only rewrites a shared prop name on the component it belongs to', () => {
    // `onBackClick` is deprecated on Toolbar; on Button it is nobody's prop.
    const source = [
      '<script>',
      IMPORT('Button, Toolbar'),
      '</script>',
      '',
      '<Button onBackClick={() => {}} />',
      '<Toolbar onBackClick={() => {}} />',
      ''
    ].join('\n');
    const result = migrate(source);
    expect(result.code).toContain('<Button onBackClick={() => {}} />');
    expect(result.code).toContain('<Toolbar onbackclick={() => {}} />');
    expect(result.propsRenamed).toBe(1);
  });

  it('resolves namespace imports used as dotted tags', () => {
    const source = [
      '<script>',
      `  import * as Sui from '${SUI_PACKAGE}';`,
      '</script>',
      '',
      '<Sui.Modal onOverlayClick={() => {}} />',
      ''
    ].join('\n');
    const result = migrate(source);
    expect(result.code).toContain('<Sui.Modal onoverlayclick={() => {}} />');
    expect(result.propsRenamed).toBe(1);
  });

  it('resolves <svelte:component this={X}> to the imported component', () => {
    const source = [
      '<script>',
      IMPORT('Toggle'),
      '</script>',
      '',
      '<svelte:component this={Toggle} onClick={() => {}} />',
      ''
    ].join('\n');
    const result = migrate(source);
    expect(result.code).toContain('<svelte:component this={Toggle} onclick={() => {}} />');
    expect(result.propsRenamed).toBe(1);
  });

  it('rewrites components nested inside blocks and snippets', () => {
    const source = [
      '<script>',
      IMPORT('ListItem, Modal'),
      '  const rows = [];',
      '</script>',
      '',
      '{#if rows.length > 0}',
      '  {#each rows as row}',
      '    <ListItem onItemClick={() => {}} />',
      '  {/each}',
      '{:else}',
      '  <Modal onOverlayClick={() => {}} />',
      '{/if}',
      '',
      '{#snippet extra()}',
      '  <ListItem onCenterTextClick={() => {}} />',
      '{/snippet}',
      ''
    ].join('\n');
    const result = migrate(source);
    expect(result.code).toContain('<ListItem onitemclick={() => {}} />');
    expect(result.code).toContain('<Modal onoverlayclick={() => {}} />');
    expect(result.code).toContain('<ListItem oncentertextclick={() => {}} />');
    expect(result.propsRenamed).toBe(3);
  });

  it('rewrites props on multi-line component tags', () => {
    const source = [
      '<script>',
      IMPORT('Modal'),
      '</script>',
      '',
      '<Modal',
      '  title="hi"',
      '  onPrimaryButtonClick={() => {}}',
      '  onSecondaryButtonClick={() => {}}',
      '/>',
      ''
    ].join('\n');
    const result = migrate(source);
    expect(result.code).toContain('  onprimarybuttonclick={() => {}}');
    expect(result.code).toContain('  onsecondarybuttonclick={() => {}}');
    expect(result.propsRenamed).toBe(2);
  });

  it('resolves subpath and module-context imports too', () => {
    const source = [
      '<script context="module">',
      `  import { Toolbar } from "${SUI_PACKAGE}/Toolbar";`,
      '</script>',
      '<script>',
      `  import { Toggle } from '${SUI_PACKAGE}';`,
      '</script>',
      '',
      '<Toolbar onBackClick={() => {}} />',
      '<Toggle onClick={() => {}} />',
      ''
    ].join('\n');
    const result = migrate(source);
    expect(result.code).toContain('<Toolbar onbackclick={() => {}} />');
    expect(result.code).toContain('<Toggle onclick={() => {}} />');
    expect(result.propsRenamed).toBe(2);
  });
});

describe('attribute forms', () => {
  it('expands shorthand attributes, keeping the local identifier', () => {
    const source = [
      '<script>',
      IMPORT('Toggle'),
      '  const onClick = () => {};',
      '</script>',
      '',
      '<Toggle {onClick} />',
      ''
    ].join('\n');
    const result = migrate(source);
    expect(result.code).toContain('<Toggle onclick={onClick} />');
    expect(result.code).toContain('const onClick = () => {};');
    expect(result.propsRenamed).toBe(1);
  });

  it('warns on a spread over a component with renameable props and does not rewrite it', () => {
    const source = [
      '<script>',
      IMPORT('Modal'),
      '  const props = {};',
      '</script>',
      '',
      '<Modal {...props} />',
      ''
    ].join('\n');
    const result = migrate(source);
    expect(result.code).toContain('<Modal {...props} />');
    expect(result.propsRenamed).toBe(0);
    expect(result.warnings).toHaveLength(1);
    const warning = result.warnings.at(0);
    expect(warning?.file).toBe(FILE);
    expect(warning?.line).toBe(6);
    expect(warning?.message).toContain('Modal');
    expect(warning?.message).toContain('onOverlayClick');
    expect(warning?.message).toContain('onClose');
  });

  it('does not warn on a spread over a component with no deprecated spellings', () => {
    const source = [
      '<script>',
      IMPORT('Button'),
      '  const props = {};',
      '</script>',
      '',
      '<Button {...props} />',
      ''
    ].join('\n');
    const result = migrate(source);
    expect(result.warnings).toHaveLength(0);
    expect(result.changed).toBe(false);
  });

  it('warns instead of rewriting when the target name is already present', () => {
    const source = [
      '<script>',
      IMPORT('Toggle'),
      '</script>',
      '',
      '<Toggle onClick={() => {}} onclick={() => {}} />',
      ''
    ].join('\n');
    const result = migrate(source);
    expect(result.code).toContain('<Toggle onClick={() => {}} onclick={() => {}} />');
    expect(result.propsRenamed).toBe(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings.at(0)?.message).toContain('onclick');
  });

  it('warns on an unresolvable dynamic component carrying a renameable prop name', () => {
    const source = [
      '<script>',
      IMPORT('Toggle, Input'),
      '  const Picked = Toggle;',
      '</script>',
      '',
      '<Picked onClick={() => {}} />',
      ''
    ].join('\n');
    const result = migrate(source);
    expect(result.code).toContain('<Picked onClick={() => {}} />');
    expect(result.propsRenamed).toBe(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings.at(0)?.line).toBe(6);
  });

  it('stays quiet about unresolvable tags when the library is not imported at all', () => {
    const source = [
      '<script>',
      `  import { Picked } from './local';`,
      '</script>',
      '',
      '<Picked onClick={() => {}} />',
      ''
    ].join('\n');
    const result = migrate(source);
    expect(result.warnings).toHaveLength(0);
    expect(result.changed).toBe(false);
  });
});

describe('import handling', () => {
  it('never rewrites import specifiers', () => {
    const source = [
      '<script>',
      `  import { Toggle } from '${SUI_PACKAGE}/Toggle';`,
      `  import Unrelated from 'some-other-lib';`,
      '</script>',
      '',
      '<Toggle onClick={() => {}} />',
      ''
    ].join('\n');
    const result = migrate(source);
    expect(result.code).toContain(`import { Toggle } from '${SUI_PACKAGE}/Toggle';`);
    expect(result.code).toContain(`import Unrelated from 'some-other-lib';`);
    expect(result.propsRenamed).toBe(1);
  });

  it('warns on a default import from the library', () => {
    const source = [
      '<script>',
      `  import Sui from '${SUI_PACKAGE}';`,
      '</script>',
      '',
      '<Sui onClick={() => {}} />',
      ''
    ].join('\n');
    const result = migrate(source);
    expect(result.changed).toBe(false);
    expect(result.warnings.some((warning) => warning.message.includes('default import'))).toBe(
      true
    );
  });
});

describe('idempotence', () => {
  it('a second run changes nothing', () => {
    const source = [
      '<script>',
      IMPORT('Toggle, Modal, Input'),
      '</script>',
      '',
      '<Toggle onClick={() => {}} />',
      '<Modal onOverlayClick={() => {}} onPrimaryButtonClick={() => {}} />',
      '<Input onBlur={() => {}} />',
      ''
    ].join('\n');
    const first = migrate(source);
    expect(first.propsRenamed).toBe(4);
    const second = migrate(first.code);
    expect(second.changed).toBe(false);
    expect(second.code).toBe(first.code);
  });
});

describe('robustness', () => {
  it('reports a warning and returns the source unchanged when a file cannot be parsed', () => {
    const source = '<script>\nconst = ;\n</script>\n<div>';
    const result = migrate(source);
    expect(result.code).toBe(source);
    expect(result.changed).toBe(false);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings.at(0)?.message).toContain('could not parse file');
  });

  it('leaves a file without any library usage byte-identical', () => {
    const source =
      '<script>\n  let count = 0;\n</script>\n\n<button onClick={() => count++}>{count}</button>\n';
    const result = migrate(source);
    expect(result.code).toBe(source);
    expect(result.changed).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });
});
