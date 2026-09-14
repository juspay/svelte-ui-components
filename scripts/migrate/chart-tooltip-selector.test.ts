import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  planSelectorRewrites,
  rewriteCss,
  rewriteScript,
  rewriteSvelteFile,
  run
} from './chart-tooltip-selector.ts';

function consumerProject(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'chart-tooltip-selector-'));
  for (const [name, contents] of Object.entries(files)) {
    const path = join(root, name);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, contents);
  }
  return root;
}

const silent = (): void => {};

describe('rewriteCss', () => {
  it('rewrites a bare class selector to the qualified .unstyled form', () => {
    // Not bare `.chart-tooltip`: ChartTooltip.svelte gives every tooltip --
    // default charts included -- that base class, and adds `unstyled` only for
    // the custom-snippet wrapper `.chart-tooltip-slot` used to name
    // exclusively. See the proof-of-leak test below for what a bare rewrite
    // would have broken.
    expect(rewriteCss('.chart-tooltip-slot { color: red; }')).toEqual({
      code: '.chart-tooltip.unstyled { color: red; }',
      count: 1
    });
  });

  it("keeps a compound selector's combinators and structure", () => {
    const result = rewriteCss('.foo .chart-tooltip-slot > .bar { top: 0; }');
    expect(result.code).toBe('.foo .chart-tooltip.unstyled > .bar { top: 0; }');
    expect(result.count).toBe(1);
  });

  // The compound case the codemod fix exists for: the consumer already
  // qualified their selector with `.portal` (targeting the portalled instance
  // of their own custom tooltip specifically). `.unstyled` is appended right
  // after the replaced token rather than inserted before whatever follows, so
  // `.portal` survives exactly once, in place -- not duplicated, not
  // reordered. A compound class selector matches on the set of tokens present
  // regardless of their order, so `.chart-tooltip.unstyled.portal` matches
  // precisely the same element `.chart-tooltip.portal.unstyled` would.
  it('rewrites a chained class selector, keeping the existing qualifier exactly once', () => {
    const result = rewriteCss('.chart-tooltip-slot.portal { position: fixed; }');
    expect(result.code).toBe('.chart-tooltip.unstyled.portal { position: fixed; }');
  });

  it('counts and rewrites every occurrence in a stylesheet', () => {
    const result = rewriteCss(
      '.chart-tooltip-slot { color: red; }\n.chart-tooltip-slot .tooltip-title { font-weight: 600; }'
    );
    expect(result.count).toBe(2);
    expect(result.code).not.toContain('chart-tooltip-slot');
  });

  // The detector-must-fire proof this house rule asks for: realistic consumer
  // CSS overriding the tooltip's look, shaped like what a real stylesheet would
  // actually contain (matching ChartTooltip's own portal/unstyled modifiers).
  it('flags and rewrites a realistic consumer override', () => {
    const source = [
      '.chart-tooltip-slot {',
      '  background: #111;',
      '  border-radius: 4px;',
      '}',
      '.chart-tooltip-slot.portal {',
      '  position: fixed;',
      '}'
    ].join('\n');

    const result = rewriteCss(source);

    expect(result.count).toBe(2);
    expect(result.code).toContain('.chart-tooltip.unstyled {');
    expect(result.code).toContain('.chart-tooltip.unstyled.portal {');
  });

  // Proves the bug this fix closes and would FAIL under the old codemod's
  // output. `ChartTooltip.svelte` renders BOTH tooltip branches with
  // `class="chart-tooltip {unstyled ? 'unstyled' : ''} ..."` -- a default
  // (non-custom-snippet) chart's rendered class list is therefore exactly
  // `chart-tooltip` (`unstyled` false, `classes` unset), while the wrapper
  // `.chart-tooltip-slot` used to name exclusively renders with `unstyled`
  // present. The old codemod rewrote to bare `.chart-tooltip`, which is a
  // subset match of BOTH class lists: a consumer rule meant only for their own
  // custom tooltip would, after that rewrite, also style every default
  // tooltip in every chart on the page. This asserts the corrected output is
  // not that bare form, and does require `.unstyled` -- the one token present
  // on the custom-snippet tooltip and absent from the default one.
  it('rewrites to a selector that requires .unstyled, not the old bare-.chart-tooltip leak', () => {
    const result = rewriteCss('.chart-tooltip-slot { color: red; }');
    const oldBuggyOutput = '.chart-tooltip { color: red; }';
    expect(result.code).not.toBe(oldBuggyOutput);
    expect(result.code).toBe('.chart-tooltip.unstyled { color: red; }');
  });

  it('does not touch a longer class name sharing the token as a prefix', () => {
    const source = '.chart-tooltip-slot-header { display: none; }';
    expect(rewriteCss(source)).toEqual({ code: source, count: 0 });
  });

  it('does not touch a longer class name sharing the token as a suffix', () => {
    const source = '.my-chart-tooltip-slot { display: none; }';
    expect(rewriteCss(source)).toEqual({ code: source, count: 0 });
  });

  it('does not touch the plural, which is a different class entirely', () => {
    const source = '.chart-tooltip-slots { display: none; }';
    expect(rewriteCss(source)).toEqual({ code: source, count: 0 });
  });

  // Negative control (README's convention): a file already on the new class
  // name reports zero, proving zero is a real absence and not a detector that
  // never matched anything.
  it('reports zero on a file with nothing left to rewrite', () => {
    const source = '.chart-tooltip { color: red; } .chart-tooltip.unstyled { padding: 0; }';
    expect(rewriteCss(source)).toEqual({ code: source, count: 0 });
  });
});

describe('rewriteScript', () => {
  it('rewrites the selector string inside querySelector', () => {
    expect(rewriteScript("const el = root.querySelector('.chart-tooltip-slot');")).toEqual({
      code: "const el = root.querySelector('.chart-tooltip.unstyled');",
      count: 1
    });
  });

  it('rewrites querySelectorAll, closest and matches alike, preserving quote style', () => {
    expect(rewriteScript('root.querySelectorAll(".chart-tooltip-slot .tooltip-item")').code).toBe(
      'root.querySelectorAll(".chart-tooltip.unstyled .tooltip-item")'
    );
    expect(rewriteScript('node.closest(`.chart-tooltip-slot`)').code).toBe(
      'node.closest(`.chart-tooltip.unstyled`)'
    );
    expect(rewriteScript("node.matches('.chart-tooltip-slot')").code).toBe(
      "node.matches('.chart-tooltip.unstyled')"
    );
  });

  // Proves the narrow half of the design: a mention that is not a selector-API
  // argument (a comment, a plain string) is left exactly alone.
  it('leaves an unrelated mention of the old name alone', () => {
    const source =
      "// used to select .chart-tooltip-slot before 3.x\nconst label = 'chart-tooltip-slot';";
    expect(rewriteScript(source)).toEqual({ code: source, count: 0 });
  });
});

describe('rewriteSvelteFile', () => {
  it('rewrites style and script blocks, and leaves the template alone', () => {
    const source = [
      '<script>',
      "  import { onMount } from 'svelte';",
      '  onMount(() => {',
      "    document.querySelector('.chart-tooltip-slot')?.focus();",
      '  });',
      '</script>',
      '',
      '<div class="chart-tooltip-slot">a consumer\'s own class, not the library\'s markup</div>',
      '',
      '<style>',
      '  :global(.chart-tooltip-slot) {',
      '    border: 1px solid red;',
      '  }',
      '</style>'
    ].join('\n');

    const result = rewriteSvelteFile(source);

    expect(result.selectorCount).toBe(1);
    expect(result.scriptCount).toBe(1);
    expect(result.code).toContain(':global(.chart-tooltip.unstyled)');
    expect(result.code).toContain("document.querySelector('.chart-tooltip.unstyled')");
    // The consumer's own template markup is untouched -- see rewriteSvelteFile's
    // doc comment for why that class token is out of scope there.
    expect(result.code).toContain('<div class="chart-tooltip-slot">');
  });

  it('is a no-op on a file that never mentions the old class', () => {
    const source = '<script>\n  let x = 1;\n</script>\n\n<style>\n  .foo { color: red; }\n</style>';
    expect(rewriteSvelteFile(source)).toEqual({ code: source, selectorCount: 0, scriptCount: 0 });
  });
});

describe('planSelectorRewrites', () => {
  it('finds a real consumer override across both .css and .svelte files', () => {
    const root = consumerProject({
      'src/theme.css': '.chart-tooltip-slot { background: #111; }',
      'src/Page.svelte':
        '<style>\n  .chart-tooltip-slot .tooltip-value { font-weight: 700; }\n</style>'
    });

    const plan = planSelectorRewrites(root);

    expect(plan).toHaveLength(2);
    expect(plan.map((item) => item.selectorCount).sort()).toEqual([1, 1]);
  });

  // Negative control for the file walk itself: a match that exists only under
  // node_modules must not surface, proving SKIP does its job rather than the
  // walk simply never reaching that file for an unrelated reason.
  it('skips node_modules', () => {
    const root = consumerProject({
      'node_modules/some-dep/dist/style.css': '.chart-tooltip-slot { color: red; }',
      'src/clean.css': '.chart-tooltip { color: red; }'
    });

    expect(planSelectorRewrites(root)).toEqual([]);
  });

  it('ignores file types outside .css and .svelte', () => {
    const root = consumerProject({
      'src/notes.md': '`.chart-tooltip-slot` used to be the selector.',
      'src/legacy.js': "document.querySelector('.chart-tooltip-slot');"
    });

    expect(planSelectorRewrites(root)).toEqual([]);
  });
});

describe('run (CLI)', () => {
  it('reports without writing by default, and recommends the data-pw attribute', () => {
    const root = consumerProject({ 'src/theme.css': '.chart-tooltip-slot { color: red; }' });
    const lines: string[] = [];

    const summary = run([root], (line) => lines.push(line));

    expect(summary.applied).toBe(false);
    expect(summary.rewrites).toHaveLength(1);
    expect(readFileSync(join(root, 'src/theme.css'), 'utf8')).toContain('chart-tooltip-slot');
    expect(lines.some((line) => line.includes('data-pw="chart-tooltip"'))).toBe(true);
  });

  it('writes only with --apply', () => {
    const root = consumerProject({ 'src/theme.css': '.chart-tooltip-slot { color: red; }' });

    const summary = run([root, '--apply'], silent);

    expect(summary.applied).toBe(true);
    expect(readFileSync(join(root, 'src/theme.css'), 'utf8')).toBe(
      '.chart-tooltip.unstyled { color: red; }'
    );
  });

  it('reports a clean project with zero findings, and does not recommend the attribute unprompted', () => {
    const root = consumerProject({ 'src/theme.css': '.chart-tooltip { color: red; }' });
    const lines: string[] = [];

    const summary = run([root], (line) => lines.push(line));

    expect(summary.rewrites).toEqual([]);
    expect(lines.some((line) => line.includes('data-pw'))).toBe(false);
  });

  it('exits 2 when no path is given', () => {
    expect(run([], silent).exitCode).toBe(2);
  });

  it('exits 2 on a path that does not exist', () => {
    expect(run([join(tmpdir(), 'definitely-not-a-consumer')], silent).exitCode).toBe(2);
  });
});
