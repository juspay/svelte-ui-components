import { describe, expect, it } from 'vitest';
import { PROP_PAIRS, directionConfig } from './map.ts';
import { transformModuleSpecifiers, transformSvelte } from './transform.ts';

const FILE = 'Fixture.svelte';

function toSui(source: string) {
  return transformSvelte(source, FILE, 'to-sui');
}

function toPoly(source: string) {
  return transformSvelte(source, FILE, 'to-poly');
}

describe('verified pair map', () => {
  it('contains exactly the 28 source-verified casing pairs', () => {
    const byComponent = new Map<string, number>();
    for (const pair of PROP_PAIRS) {
      byComponent.set(pair.component, (byComponent.get(pair.component) ?? 0) + 1);
    }
    expect(Object.fromEntries(byComponent)).toEqual({
      Gallery: 4,
      Input: 8,
      ListItem: 5,
      MediaUpload: 1,
      Modal: 5,
      Stepper: 1,
      Table: 2,
      Toast: 1,
      Toolbar: 1
    });
    expect(PROP_PAIRS).toHaveLength(28);
  });

  it('renames every pair to a spelling that differs from the source', () => {
    // Whether a pair may differ by more than case is asserted in `map.test.ts`,
    // which knows about the deprecated aliases that license the exception.
    for (const pair of PROP_PAIRS) {
      expect(pair.sui).not.toBe(pair.poly);
    }
  });

  it('never lands two distinct events on one target prop', () => {
    for (const direction of ['to-sui', 'to-poly'] as ReadonlyArray<'to-sui' | 'to-poly'>) {
      for (const [component, table] of directionConfig(direction).renames) {
        // Aliases are excluded: several SUI spellings of the SAME event
        // collapsing onto the fork's single name is the intent, not a
        // collision. Two different events sharing a target would be.
        const aliases = new Set(
          PROP_PAIRS.filter((pair) => pair.component === component).flatMap(
            (pair) => pair.suiDeprecatedAliases ?? []
          )
        );
        const targets = [...table.entries()]
          .filter(([from]) => !aliases.has(from))
          .map(([, to]) => to);
        expect(new Set(targets).size, `${direction} ${component}`).toBe(targets.length);
      }
    }
  });
});

describe('per-pair rewrites', () => {
  for (const pair of PROP_PAIRS) {
    it(`${pair.component}: ${pair.poly} -> ${pair.sui}`, () => {
      const source = [
        '<script>',
        `  import { ${pair.component} } from 'polymorph-ui-components';`,
        '</script>',
        '',
        `<${pair.component} ${pair.poly}={() => {}} />`,
        ''
      ].join('\n');
      const result = toSui(source);
      expect(result.code).toContain(`<${pair.component} ${pair.sui}={() => {}} />`);
      expect(result.code).toContain(`from '@juspay/svelte-ui-components'`);
      expect(result.code).not.toContain('polymorph-ui-components');
      expect(result.propsRenamed).toBe(1);
      expect(result.importsRewritten).toBe(1);
      expect(result.changed).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it(`${pair.component}: --reverse ${pair.sui} -> ${pair.poly}`, () => {
      const source = [
        '<script>',
        `  import { ${pair.component} } from '@juspay/svelte-ui-components';`,
        '</script>',
        '',
        `<${pair.component} ${pair.sui}={() => {}} />`,
        ''
      ].join('\n');
      const result = toPoly(source);
      expect(result.code).toContain(`<${pair.component} ${pair.poly}={() => {}} />`);
      expect(result.code).toContain(`from 'polymorph-ui-components'`);
      expect(result.propsRenamed).toBe(1);
      expect(result.importsRewritten).toBe(1);
    });
  }
});

describe('component awareness', () => {
  it('resolves an aliased import and rewrites based on the exported name', () => {
    const source = [
      '<script lang="ts">',
      `  import { Table as DataTable } from 'polymorph-ui-components';`,
      '</script>',
      '',
      '<DataTable onsort={() => {}} onrowclick={() => {}} />',
      ''
    ].join('\n');
    const result = toSui(source);
    expect(result.code).toContain('<DataTable onSort={() => {}} onRowClick={() => {}} />');
    expect(result.propsRenamed).toBe(2);
    expect(result.warnings).toHaveLength(0);
  });

  it('leaves a same-named prop on a non-library component untouched', () => {
    const source = [
      '<script>',
      `  import Table from './Table.svelte';`,
      '</script>',
      '',
      '<Table onsort={() => {}} />',
      ''
    ].join('\n');
    const result = toSui(source);
    expect(result.code).toBe(source);
    expect(result.changed).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it('leaves a same-named prop on a non-library component untouched even when the library is imported', () => {
    const source = [
      '<script>',
      `  import { Input } from 'polymorph-ui-components';`,
      `  import Table from './Table.svelte';`,
      '</script>',
      '',
      '<Table onsort={() => {}} />',
      '<Input onclick={() => {}} />',
      ''
    ].join('\n');
    const result = toSui(source);
    expect(result.code).toContain('<Table onsort={() => {}} />');
    expect(result.code).toContain('<Input onClick={() => {}} />');
    expect(result.propsRenamed).toBe(1);
  });

  it('never touches native elements', () => {
    const source = [
      '<script>',
      `  import { Input } from 'polymorph-ui-components';`,
      '</script>',
      '',
      '<button onclick={() => {}}>go</button>',
      '<input oninput={() => {}} />',
      '<Input oninput={() => {}} />',
      ''
    ].join('\n');
    const result = toSui(source);
    expect(result.code).toContain('<button onclick={() => {}}>go</button>');
    expect(result.code).toContain('<input oninput={() => {}} />');
    expect(result.code).toContain('<Input onInput={() => {}} />');
    expect(result.propsRenamed).toBe(1);
  });

  it('only rewrites a shared prop name on the component it belongs to', () => {
    // `onkeydown` is identical on both sides for ListItem, but a pair for Input.
    const source = [
      '<script>',
      `  import { Input, ListItem } from 'polymorph-ui-components';`,
      '</script>',
      '',
      '<ListItem onkeydown={() => {}} />',
      '<Input onkeydown={() => {}} />',
      ''
    ].join('\n');
    const result = toSui(source);
    expect(result.code).toContain('<ListItem onkeydown={() => {}} />');
    expect(result.code).toContain('<Input onKeyDown={() => {}} />');
    expect(result.propsRenamed).toBe(1);
  });

  it('resolves namespace imports used as dotted tags', () => {
    const source = [
      '<script>',
      `  import * as Poly from 'polymorph-ui-components';`,
      '</script>',
      '',
      '<Poly.Modal onoverlayclick={() => {}} />',
      ''
    ].join('\n');
    const result = toSui(source);
    expect(result.code).toContain('<Poly.Modal onoverlayClick={() => {}} />');
    expect(result.propsRenamed).toBe(1);
  });

  it('resolves <svelte:component this={X}> to the imported component', () => {
    const source = [
      '<script>',
      `  import { Toast } from 'polymorph-ui-components';`,
      '</script>',
      '',
      '<svelte:component this={Toast} ontoasthide={() => {}} />',
      ''
    ].join('\n');
    const result = toSui(source);
    expect(result.code).toContain('<svelte:component this={Toast} onToastHide={() => {}} />');
    expect(result.propsRenamed).toBe(1);
  });

  it('rewrites components nested inside blocks and snippets', () => {
    const source = [
      '<script>',
      `  import { Table, Modal } from 'polymorph-ui-components';`,
      '  const rows = [];',
      '</script>',
      '',
      '{#if rows.length > 0}',
      '  {#each rows as row}',
      '    <Table onrowclick={() => {}} />',
      '  {/each}',
      '{:else}',
      '  <Modal onoverlayclick={() => {}} />',
      '{/if}',
      '',
      '{#snippet extra()}',
      '  <Table onsort={() => {}} />',
      '{/snippet}',
      ''
    ].join('\n');
    const result = toSui(source);
    expect(result.code).toContain('<Table onRowClick={() => {}} />');
    expect(result.code).toContain('<Modal onoverlayClick={() => {}} />');
    expect(result.code).toContain('<Table onSort={() => {}} />');
    expect(result.propsRenamed).toBe(3);
  });

  it('rewrites props on multi-line component tags', () => {
    const source = [
      '<script>',
      `  import { Modal } from 'polymorph-ui-components';`,
      '</script>',
      '',
      '<Modal',
      '  title="hi"',
      '  onprimarybuttonclick={() => {}}',
      '  onsecondarybuttonclick={() => {}}',
      '/>',
      ''
    ].join('\n');
    const result = toSui(source);
    expect(result.code).toContain('  onprimaryButtonClick={() => {}}');
    expect(result.code).toContain('  onsecondaryButtonClick={() => {}}');
    expect(result.propsRenamed).toBe(2);
  });
});

describe('attribute forms', () => {
  it('expands shorthand attributes, keeping the local identifier', () => {
    const source = [
      '<script>',
      `  import { Table } from 'polymorph-ui-components';`,
      '  const onsort = () => {};',
      '</script>',
      '',
      '<Table {onsort} />',
      ''
    ].join('\n');
    const result = toSui(source);
    expect(result.code).toContain('<Table onSort={onsort} />');
    expect(result.code).toContain('const onsort = () => {};');
    expect(result.propsRenamed).toBe(1);
  });

  it('warns on a spread over a component with renameable props and does not rewrite it', () => {
    const source = [
      '<script>',
      `  import { Table } from 'polymorph-ui-components';`,
      '  const props = {};',
      '</script>',
      '',
      '<Table {...props} />',
      ''
    ].join('\n');
    const result = toSui(source);
    expect(result.code).toContain('<Table {...props} />');
    expect(result.propsRenamed).toBe(0);
    expect(result.warnings).toHaveLength(1);
    const warning = result.warnings.at(0);
    expect(warning?.file).toBe(FILE);
    expect(warning?.line).toBe(6);
    expect(warning?.message).toContain('Table');
    expect(warning?.message).toContain('onrowclick');
    expect(warning?.message).toContain('onsort');
  });

  it('does not warn on a spread over a component with no casing pairs', () => {
    const source = [
      '<script>',
      `  import { Button } from 'polymorph-ui-components';`,
      '  const props = {};',
      '</script>',
      '',
      '<Button {...props} />',
      ''
    ].join('\n');
    const result = toSui(source);
    expect(result.warnings).toHaveLength(0);
    expect(result.importsRewritten).toBe(1);
  });

  it('warns instead of rewriting when the target name is already present', () => {
    const source = [
      '<script>',
      `  import { Table } from 'polymorph-ui-components';`,
      '</script>',
      '',
      '<Table onsort={() => {}} onSort={() => {}} />',
      ''
    ].join('\n');
    const result = toSui(source);
    expect(result.code).toContain('<Table onsort={() => {}} onSort={() => {}} />');
    expect(result.propsRenamed).toBe(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings.at(0)?.message).toContain('onSort');
  });

  it('warns on an unresolvable dynamic component carrying a renameable prop name', () => {
    const source = [
      '<script>',
      `  import { Table, Input } from 'polymorph-ui-components';`,
      '  const Picked = Table;',
      '</script>',
      '',
      '<Picked onsort={() => {}} />',
      ''
    ].join('\n');
    const result = toSui(source);
    expect(result.code).toContain('<Picked onsort={() => {}} />');
    expect(result.propsRenamed).toBe(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings.at(0)?.line).toBe(6);
  });
});

describe('import handling', () => {
  it('rewrites subpath imports, preserving the subpath and quote style', () => {
    const source = [
      '<script>',
      '  import "polymorph-ui-components/wc";',
      '</script>',
      '',
      '<div></div>',
      ''
    ].join('\n');
    const result = toSui(source);
    expect(result.code).toContain('import "@juspay/svelte-ui-components/wc";');
    expect(result.importsRewritten).toBe(1);
  });

  it('rewrites module-context imports too', () => {
    const source = [
      '<script module>',
      `  import { POLY_VERSION } from 'polymorph-ui-components';`,
      '</script>',
      '<script>',
      `  import { Toolbar } from 'polymorph-ui-components';`,
      '</script>',
      '',
      '<Toolbar onbackclick={() => {}} />',
      ''
    ].join('\n');
    const result = toSui(source);
    expect(result.code).not.toContain(`'polymorph-ui-components'`);
    expect(result.importsRewritten).toBe(2);
    expect(result.code).toContain('<Toolbar onbackClick={() => {}} />');
  });

  it('leaves unrelated imports alone', () => {
    const source = [
      '<script>',
      `  import { Table } from 'other-library';`,
      `  import notpoly from 'not-polymorph-ui-components';`,
      '</script>',
      '',
      '<Table onsort={() => {}} />',
      ''
    ].join('\n');
    const result = toSui(source);
    expect(result.code).toBe(source);
    expect(result.changed).toBe(false);
  });

  it('warns on a default import from the source package', () => {
    const source = [
      '<script>',
      `  import Poly from 'polymorph-ui-components';`,
      '</script>',
      '',
      '<div></div>',
      ''
    ].join('\n');
    const result = toSui(source);
    expect(result.warnings).toHaveLength(1);
    expect(result.importsRewritten).toBe(1);
  });
});

describe('round trips', () => {
  const polyForm = [
    '<script lang="ts">',
    `  import { Input, Table as DataTable } from 'polymorph-ui-components';`,
    '  let value = $state("");',
    '</script>',
    '',
    '<Input {value} onclick={() => {}} onstatechange={() => {}} />',
    '<DataTable onsort={() => {}} />',
    ''
  ].join('\n');

  it('to-sui then to-poly restores the original source', () => {
    const there = toSui(polyForm);
    expect(there.changed).toBe(true);
    const back = toPoly(there.code);
    expect(back.code).toBe(polyForm);
  });

  it('to-sui is idempotent', () => {
    const once = toSui(polyForm);
    const twice = toSui(once.code);
    expect(twice.code).toBe(once.code);
    expect(twice.changed).toBe(false);
    expect(twice.propsRenamed).toBe(0);
    expect(twice.importsRewritten).toBe(0);
  });
});

describe('robustness', () => {
  it('reports a warning and returns the source unchanged when a file cannot be parsed', () => {
    const source = '<script>\nimport { Table } from "polymorph-ui-components";\n</script>\n{#if}';
    const result = toSui(source);
    expect(result.code).toBe(source);
    expect(result.changed).toBe(false);
    expect(result.warnings).toHaveLength(1);
  });

  it('leaves a file without any library usage byte-identical', () => {
    const source = '<h1>hello</h1>\n';
    const result = toSui(source);
    expect(result.code).toBe(source);
    expect(result.changed).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });
});

describe('module specifier rewrite for .ts/.js files', () => {
  it('rewrites static, re-export, and dynamic specifiers', () => {
    const source = [
      `import { Table } from 'polymorph-ui-components';`,
      `export { Input } from 'polymorph-ui-components';`,
      `export * from 'polymorph-ui-components/wc';`,
      `const lazy = () => import('polymorph-ui-components');`,
      `export const table = Table;`,
      ''
    ].join('\n');
    const result = transformModuleSpecifiers(source, 'barrel.ts', 'to-sui');
    expect(result.code).toContain(`import { Table } from '@juspay/svelte-ui-components';`);
    expect(result.code).toContain(`export { Input } from '@juspay/svelte-ui-components';`);
    expect(result.code).toContain(`export * from '@juspay/svelte-ui-components/wc';`);
    expect(result.code).toContain(`import('@juspay/svelte-ui-components')`);
    expect(result.importsRewritten).toBe(4);
  });

  it('does not touch look-alike package names or arbitrary strings', () => {
    const source = [
      `import a from 'polymorph-ui-components-extras';`,
      `const s = 'polymorph-ui-components';`,
      ''
    ].join('\n');
    const result = transformModuleSpecifiers(source, 'barrel.ts', 'to-sui');
    expect(result.code).toBe(source);
    expect(result.changed).toBe(false);
  });

  it('leaves the package name alone inside comments and string literals', () => {
    // A context-anchored regex has no idea what a comment is: the words that
    // anchor it appear just as readily in prose and in quoted text.
    const source = [
      `// import { Table } from 'polymorph-ui-components';  <- the old way`,
      `/* migrate with: import x from 'polymorph-ui-components' */`,
      `const help = "run: import { Table } from 'polymorph-ui-components'";`,
      `import { Table } from 'polymorph-ui-components';`,
      ''
    ].join('\n');

    const result = transformModuleSpecifiers(source, 'barrel.ts', 'to-sui');

    expect(result.importsRewritten).toBe(1);
    expect(result.code).toContain(`// import { Table } from 'polymorph-ui-components';`);
    expect(result.code).toContain(`/* migrate with: import x from 'polymorph-ui-components' */`);
    expect(result.code).toContain(
      `const help = "run: import { Table } from 'polymorph-ui-components'"`
    );
    expect(result.code).toContain(`import { Table } from '@juspay/svelte-ui-components';`);
  });

  it('rewrites an import-equals require', () => {
    // TS-only syntax, and its specifier hangs off an ExternalModuleReference
    // rather than a call expression. The regex this replaced matched it by
    // accident, through the bare `require(` context.
    const source = [`import Table = require('polymorph-ui-components');`, ''].join('\n');

    const result = transformModuleSpecifiers(source, 'barrel.ts', 'to-sui');

    expect(result.code).toContain(`import Table = require('@juspay/svelte-ui-components');`);
    expect(result.importsRewritten).toBe(1);
  });

  it('rewrites a require call and an import type', () => {
    const source = [
      `const { Table } = require('polymorph-ui-components');`,
      `type T = import('polymorph-ui-components').TableProperties;`,
      ''
    ].join('\n');

    const result = transformModuleSpecifiers(source, 'barrel.ts', 'to-sui');

    expect(result.code).toContain(`require('@juspay/svelte-ui-components')`);
    expect(result.code).toContain(`import('@juspay/svelte-ui-components').TableProperties`);
    expect(result.importsRewritten).toBe(2);
  });
});
