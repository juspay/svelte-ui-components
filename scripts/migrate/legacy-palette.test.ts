import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildLegacyPalette,
  diffPalette,
  extractFallbackSites,
  findInheritanceRestores,
  groupSites,
  renderStylesheet,
  ruleBlocks,
  stripComments,
  type FallbackSite,
  type InheritanceRestore,
  type PaletteDiff
} from './legacy-palette.ts';

describe('extractFallbackSites', () => {
  it('reads the name, literal and line off a plain var(--x, literal) site', () => {
    const source = '.a { color: red; }\n.b { color: var(--tabs-inactive-color, #6b7280); }\n';

    expect(extractFallbackSites(source, 'Tabs.svelte')).toEqual([
      { file: 'Tabs.svelte', line: 2, name: '--tabs-inactive-color', literal: '#6b7280' }
    ]);
  });

  it('treats light-dark(...) as the property’s own literal, not a delegation', () => {
    const source = 'color: var(--chart-legend-color, light-dark(#333, #e5e7eb));';

    expect(extractFallbackSites(source, 'x.css')).toEqual([
      {
        file: 'x.css',
        line: 1,
        name: '--chart-legend-color',
        literal: 'light-dark(#333, #e5e7eb)'
      }
    ]);
  });

  it('excludes a fallback that only forwards to another custom property', () => {
    // The motion-token pass wraps duration/easing fallbacks like this. The
    // outer property (--chart-transition-duration) is not reporting its OWN
    // literal here -- it defers entirely to --motion-duration -- so it must
    // not be mistaken for a value the AA contrast pass could have touched.
    // --motion-duration's own occurrence, with its own literal 0.2s, is a
    // separate and legitimate site and is correctly still captured.
    const source =
      'transition: opacity var(--chart-transition-duration, var(--motion-duration, 0.2s));';

    const sites = extractFallbackSites(source, 'x.svelte');

    expect(sites.map((s) => s.name)).toEqual(['--motion-duration']);
    expect(sites[0]?.literal).toBe('0.2s');
  });

  it('collapses interior whitespace so reformatting alone does not read as a change', () => {
    const source = 'margin: var(--field-error-margin,\n    4px  0 0\n    0);';

    expect(extractFallbackSites(source, 'x.svelte')).toEqual([
      { file: 'x.svelte', line: 1, name: '--field-error-margin', literal: '4px 0 0 0' }
    ]);
  });

  it('finds every site, including repeats of the same property', () => {
    const source = [
      '.a { color: var(--pill-tone-muted-color, #6b7280); }',
      '.b { border-color: var(--pill-tone-muted-color, #6b7280); }'
    ].join('\n');

    expect(extractFallbackSites(source, 'Pill.svelte')).toHaveLength(2);
  });
});

function site(name: string, literal: string, file = 'C.svelte', line = 1): FallbackSite {
  return { file, line, name, literal };
}

describe('diffPalette', () => {
  it('pins a property whose single-site literal changed', () => {
    const previous = groupSites([site('--tabs-active-color', '#1a73e8')]);
    const current = groupSites([site('--tabs-active-color', '#0b57d0')]);

    expect(diffPalette(previous, current)).toEqual({
      pins: [{ name: '--tabs-active-color', previousLiteral: '#1a73e8' }],
      ambiguous: []
    });
  });

  it('reports nothing for a property whose literal never changed', () => {
    const previous = groupSites([
      site('--radius', '4px', 'a.svelte'),
      site('--radius', '6px', 'b.svelte')
    ]);
    const current = groupSites([
      site('--radius', '4px', 'a.svelte'),
      site('--radius', '6px', 'b.svelte')
    ]);

    expect(diffPalette(previous, current)).toEqual({ pins: [], ambiguous: [] });
  });

  it('ignores a property that only exists on the current side (new, not changed)', () => {
    const previous = groupSites([]);
    const current = groupSites([site('--new-token', '#111111')]);

    expect(diffPalette(previous, current)).toEqual({ pins: [], ambiguous: [] });
  });

  it('ignores a property removed entirely from the current side', () => {
    const previous = groupSites([site('--gone', '#111111')]);
    const current = groupSites([]);

    expect(diffPalette(previous, current)).toEqual({ pins: [], ambiguous: [] });
  });

  // The detector this file exists to prove: a property already inconsistent
  // before the change MUST be flagged separately, never pinned, because no
  // single old literal is "the previous default" to restore.
  it('reports a property with several PREVIOUS literals as ambiguous, and never pins it', () => {
    const previous = groupSites([
      site('--tabs-item-color', '#666666', 'Tabs.svelte', 10),
      site('--tabs-item-color', '#999999', 'Tabs.svelte', 40)
    ]);
    const current = groupSites([site('--tabs-item-color', '#666666', 'Tabs.svelte', 10)]);

    const diff = diffPalette(previous, current);

    expect(diff.pins).toEqual([]);
    expect(diff.ambiguous).toEqual([
      {
        name: '--tabs-item-color',
        sites: [
          { file: 'Tabs.svelte', line: 10, name: '--tabs-item-color', literal: '#666666' },
          { file: 'Tabs.svelte', line: 40, name: '--tabs-item-color', literal: '#999999' }
        ]
      }
    ]);
  });

  it('still pins a property whose single previous literal is unambiguous even when the CURRENT side has diverged into several', () => {
    // Real case from this repo's own history: --hitl-approved-color was a
    // single #16a34a on origin/release, and split into two different
    // literals (a plain hex and a light-dark pair) on HEAD. The old default
    // is still exactly one value, so it can and should be pinned.
    const previous = groupSites([site('--hitl-approved-color', '#16a34a')]);
    const current = groupSites([
      site('--hitl-approved-color', '#166534', 'a.svelte'),
      site('--hitl-approved-color', 'light-dark(#15803d, #4ade80)', 'b.svelte')
    ]);

    expect(diffPalette(previous, current)).toEqual({
      pins: [{ name: '--hitl-approved-color', previousLiteral: '#16a34a' }],
      ambiguous: []
    });
  });

  it('sorts pins by property name for a deterministic report', () => {
    const previous = groupSites([site('--zeta', '#000000'), site('--alpha', '#000000')]);
    const current = groupSites([site('--zeta', '#111111'), site('--alpha', '#111111')]);

    expect(diffPalette(previous, current).pins.map((p) => p.name)).toEqual(['--alpha', '--zeta']);
  });
});

describe('ruleBlocks', () => {
  it('extracts a selector and its declaration body verbatim', () => {
    const css = '.a { color: red; }\n.b {\n  color: blue;\n}\n';
    const blocks = ruleBlocks(css);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]?.selector).toBe('.a');
    expect(blocks[0]?.body).toBe(' color: red; ');
    expect(blocks[1]?.selector).toBe('.b');
    expect(blocks[1]?.body).toContain('color: blue;');
  });

  it('descends into an at-rule body without recording the at-rule’s own prelude as a selector', () => {
    const css = '@supports (display: grid) {\n  .grid { display: grid; }\n}\n';
    const blocks = ruleBlocks(css);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.selector).toBe('.grid');
  });
});

describe('stripComments', () => {
  it('blanks comment content but keeps every other character and every newline in place', () => {
    const css = '.a /* keep\nbraces { } out of the way */ { color: red; }\n';
    const stripped = stripComments(css);

    expect(stripped).not.toContain('braces');
    expect(stripped.split('\n')).toHaveLength(css.split('\n').length);
    expect(stripped.length).toBe(css.length);
  });
});

describe('findInheritanceRestores', () => {
  it('flags a selector that gained a var() default for color it never declared at all before -- the BrandLoader .sub-text case', () => {
    const previous = '.sub-text { font-size: 0.75rem; }\n';
    const current =
      '.sub-text { font-size: 0.75rem; color: var(--loader-sub-text-color, #52525b); }\n';

    // .css here, not .svelte: cssRegions only reads a .svelte file's <style>
    // block, and this fixture is raw CSS text with no such wrapper -- the
    // <style>-wrapped shape is covered separately below. .css exercises the
    // same rule-block/property logic without that wrapper being the point.
    expect(findInheritanceRestores(previous, current, 'BrandLoader.css')).toEqual([
      {
        name: '--loader-sub-text-color',
        property: 'color',
        selector: '.sub-text',
        file: 'BrandLoader.css',
        line: 1
      }
    ]);
  });

  // The non-regression this task exists to protect: a selector that already
  // had SOME value for the property at base never resolved by inheritance,
  // even when the literal moved behind a brand-new custom property -- that is
  // the already-covered changed-fallback case (--loader-text-color, white ->
  // #333333), not this one, and must stay out of this section.
  it('does not flag a selector that already declared the property at base, even under a brand-new custom-property name', () => {
    const previous = '.text { color: white; }\n';
    const current = '.text { color: var(--loader-text-color, #333333); }\n';

    expect(findInheritanceRestores(previous, current, 'BrandLoader.css')).toEqual([]);
  });

  it('does not flag a selector with no rule at all in the base version -- there is no prior render to have regressed from', () => {
    const previous = '.other { color: red; }\n';
    const current = '.new-thing { color: var(--new-thing-color, #111111); }\n';

    expect(findInheritanceRestores(previous, current, 'x.css')).toEqual([]);
  });

  it('does not flag a newly-declared inherited property written as a plain literal -- nothing to pin, no var() fallback', () => {
    const previous = '.label { font-weight: 400; }\n';
    const current = '.label { font-weight: 400; color: #111111; }\n';

    expect(findInheritanceRestores(previous, current, 'x.css')).toEqual([]);
  });

  it('does not flag a newly-declared NON-inherited property -- background-color has a fixed initial value, not an inheritance hazard', () => {
    const previous = '.panel { color: black; }\n';
    const current = '.panel { color: black; background-color: var(--panel-bg, #f5f5f5); }\n';

    expect(findInheritanceRestores(previous, current, 'x.css')).toEqual([]);
  });

  it('generalises beyond color -- a font-size gained the same way is flagged too', () => {
    const previous = '.caption { display: block; }\n';
    const current = '.caption { display: block; font-size: var(--caption-font-size, 12px); }\n';

    expect(findInheritanceRestores(previous, current, 'x.css')).toEqual([
      {
        name: '--caption-font-size',
        property: 'font-size',
        selector: '.caption',
        file: 'x.css',
        line: 1
      }
    ]);
  });

  it('returns nothing when there is no base version of the file to compare against', () => {
    const current = '.a { color: var(--x, red); }\n';

    expect(findInheritanceRestores(null, current, 'new.svelte')).toEqual([]);
  });

  it('works on a plain .css file, not only inside a .svelte <style> block', () => {
    const previous = '.phone-screen { background: black; }\n';
    const current =
      '.phone-screen { background: black; color: var(--phone-screen-color, #f5f5f5); }\n';

    const restores = findInheritanceRestores(previous, current, 'phone.css');

    expect(restores).toHaveLength(1);
    expect(restores[0]?.name).toBe('--phone-screen-color');
  });

  it('reads only the <style> block of a .svelte file -- markup braces do not desynchronise the parse', () => {
    const previous =
      '<div class="sub-text">{msg}</div>\n<style>\n.sub-text { font-size: 0.75rem; }\n</style>\n';
    const current =
      '<div class="sub-text">{msg}</div>\n<style>\n.sub-text { font-size: 0.75rem; color: var(--loader-sub-text-color, #52525b); }\n</style>\n';

    const restores = findInheritanceRestores(previous, current, 'BrandLoader.svelte');

    expect(restores).toHaveLength(1);
    expect(restores[0]?.line).toBe(3);
  });

  it('excludes a delegating fallback (var(--x, var(--y, red))) the same way extractFallbackSites does -- it is not this property’s own literal', () => {
    const previous = '.a { display: block; }\n';
    const current = '.a { display: block; color: var(--a-color, var(--brand-color, red)); }\n';

    expect(findInheritanceRestores(previous, current, 'x.css')).toEqual([]);
  });
});

describe('renderStylesheet', () => {
  const diff: PaletteDiff = {
    pins: [{ name: '--tabs-active-color', previousLiteral: '#1a73e8' }],
    ambiguous: [
      {
        name: '--tabs-item-color',
        sites: [
          { file: 'Tabs.svelte', line: 10, name: '--tabs-item-color', literal: '#666666' },
          { file: 'Tabs.svelte', line: 40, name: '--tabs-item-color', literal: '#999999' }
        ]
      }
    ]
  };

  it('emits one :root rule per pin, in the documented format', () => {
    const css = renderStylesheet({ pins: diff.pins, ambiguous: [] }, '4.27.x');

    expect(css).toContain(':root { --tabs-active-color: #1a73e8; }   /* was the 4.27.x default */');
  });

  it('states the pre-AA / WCAG-AA-failure / not-permanent framing in the header', () => {
    const css = renderStylesheet(diff, '4.27.x');

    expect(css).toMatch(/pre-AA/);
    expect(css).toMatch(/FAIL WCAG AA/);
    expect(css).toMatch(/intended end state/);
  });

  it('never emits a :root rule for an ambiguous property, only a trailing note', () => {
    const css = renderStylesheet(diff, '4.27.x');

    expect(css).not.toContain(':root { --tabs-item-color');
    expect(css).toContain('--tabs-item-color: #666666 (Tabs.svelte:10), #999999 (Tabs.svelte:40)');
  });

  it('omits the trailing note entirely when nothing is ambiguous', () => {
    const css = renderStylesheet({ pins: diff.pins, ambiguous: [] }, '4.27.x');

    expect(css).not.toMatch(/Not pinned above/);
  });

  it('falls back to a neutral label when the previous version could not be read', () => {
    const css = renderStylesheet({ pins: diff.pins, ambiguous: [] }, null);

    expect(css).toContain('/* was the pre-AA default */');
  });
});

describe('renderStylesheet — inheritance restores', () => {
  const noPins: PaletteDiff = { pins: [], ambiguous: [] };
  const restore: InheritanceRestore = {
    name: '--loader-sub-text-color',
    property: 'color',
    selector: '.sub-text',
    file: 'src/lib/BrandLoader/BrandLoader.svelte',
    line: 87
  };

  it('emits an empty-value :root rule naming the property, selector and site in a comment', () => {
    const css = renderStylesheet(noPins, '4.27.x', [restore]);

    expect(css).toContain(
      ':root { --loader-sub-text-color: ; }   /* color on .sub-text (src/lib/BrandLoader/BrandLoader.svelte:87) was inherited, never declared */'
    );
  });

  it('places the inheritance section after the literal pins, with its own header explaining the different claim', () => {
    const withPin: PaletteDiff = {
      pins: [{ name: '--tabs-active-color', previousLiteral: '#1a73e8' }],
      ambiguous: []
    };
    const css = renderStylesheet(withPin, '4.27.x', [restore]);

    const pinIndex = css.indexOf(':root { --tabs-active-color');
    const restoreIndex = css.indexOf(':root { --loader-sub-text-color');
    expect(pinIndex).toBeGreaterThan(-1);
    expect(restoreIndex).toBeGreaterThan(pinIndex);
    // The section states why an empty value is used, and explicitly rules
    // out the `inherit` keyword -- guards against silently reverting to the
    // task's originally-suggested but non-functional `--name: inherit;` rule.
    expect(css).toMatch(/was inherited/);
    expect(css).toMatch(/`--name: inherit;` would NOT do this/);
  });

  it('omits the section entirely -- no header, no trailing noise -- when nothing needs restoring', () => {
    const css = renderStylesheet(noPins, '4.27.x', []);

    expect(css).not.toMatch(/was inherited, never declared/);
    expect(css).not.toMatch(/inherit\(/);
  });

  it('produces output identical to omitting the third argument -- backward compatible with every pre-existing caller', () => {
    const withDefaultArg = renderStylesheet(noPins, '4.27.x');
    const withExplicitEmpty = renderStylesheet(noPins, '4.27.x', []);

    expect(withDefaultArg).toBe(withExplicitEmpty);
  });

  it('still renders the ambiguous-properties note after the inheritance section when both are present', () => {
    const both: PaletteDiff = {
      pins: [],
      ambiguous: [
        {
          name: '--tabs-item-color',
          sites: [{ file: 'Tabs.svelte', line: 10, name: '--tabs-item-color', literal: '#666666' }]
        }
      ]
    };
    const css = renderStylesheet(both, '4.27.x', [restore]);

    const restoreIndex = css.indexOf(':root { --loader-sub-text-color');
    const ambiguousIndex = css.indexOf('Not pinned above');
    expect(restoreIndex).toBeGreaterThan(-1);
    expect(ambiguousIndex).toBeGreaterThan(restoreIndex);
  });
});

// ------------------------------------------------------------- git-backed pipeline

/** A throwaway repo, standing in for `origin/release`, committed at `sha`. */
function releaseRepo(files: Record<string, string>): { root: string; sha: string } {
  const root = mkdtempSync(join(tmpdir(), 'sui-legacy-palette-'));
  const run = (args: readonly string[]): string =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8' });

  run(['init', '-q']);
  run(['config', 'user.email', 'test@example.com']);
  run(['config', 'user.name', 'Test']);

  for (const [relPath, contents] of Object.entries(files)) {
    const full = join(root, relPath);
    execFileSync('mkdir', ['-p', join(full, '..')]);
    writeFileSync(full, contents);
  }
  run(['add', '-A']);
  run(['commit', '-q', '-m', 'release baseline']);
  const sha = run(['rev-parse', 'HEAD']).trim();

  return { root, sha };
}

describe('buildLegacyPalette (end to end against a real git history)', () => {
  const roots: string[] = [];
  afterEach(() => {
    while (roots.length > 0) {
      const root = roots.pop();
      if (typeof root === 'string') {
        rmSync(root, { recursive: true, force: true });
      }
    }
  });

  it('pins a real contrast change, flags a real pre-existing ambiguity, and survives a NUL byte in the base ref', () => {
    // Mirrors what origin/release:src/lib/_chart/geometry.ts actually is: a
    // file `git show` must be able to read at the base ref even though a
    // plain-text tool choking on the NUL would see nothing at all.
    const nulBearing = `/* marker:${' '}end */\n.n { color: var(--nul-adjacent-color, #445566); }\n`;

    const { root, sha } = releaseRepo({
      'src/lib/Tabs/Tabs.svelte': '.item { color: var(--tabs-active-color, #1a73e8); }\n',
      'src/lib/Tabs/other.svelte':
        '.a { color: var(--tabs-item-color, #666666); }\n.b { color: var(--tabs-item-color, #999999); }\n',
      'src/lib/Weird/weird.css': nulBearing,
      'package.json': '{ "version": "4.27.6" }\n'
    });
    roots.push(root);

    // The current working tree: a real change, an ambiguity that collapsed to
    // one site (still unpinnable -- the OLD default was never single-valued),
    // and the NUL-bearing file's fallback moved too.
    writeFileSync(
      join(root, 'src/lib/Tabs/Tabs.svelte'),
      '.item { color: var(--tabs-active-color, #0b57d0); }\n'
    );
    writeFileSync(
      join(root, 'src/lib/Tabs/other.svelte'),
      '.a { color: var(--tabs-item-color, #666666); }\n'
    );
    writeFileSync(
      join(root, 'src/lib/Weird/weird.css'),
      '.n { color: var(--nul-adjacent-color, #221100); }\n'
    );

    const css = buildLegacyPalette(root, sha);

    expect(css).toContain(':root { --tabs-active-color: #1a73e8; }   /* was the 4.27.x default */');
    expect(css).toContain(
      ':root { --nul-adjacent-color: #445566; }   /* was the 4.27.x default */'
    );
    expect(css).not.toContain(':root { --tabs-item-color');
    expect(css).toMatch(/--tabs-item-color: #666666 .*#999999/);
  });

  it('reports neither a pin nor an ambiguity note for a property nothing touched', () => {
    const { root, sha } = releaseRepo({
      'src/lib/Card/Card.svelte': '.d { opacity: var(--card-description-opacity, 0.6); }\n',
      'package.json': '{ "version": "4.27.6" }\n'
    });
    roots.push(root);
    // Working tree left identical to the committed baseline.

    const css = buildLegacyPalette(root, sha);

    expect(css).not.toContain('--card-description-opacity');
    expect(css).toContain('0 properties pinned below.');
  });

  it('runs the BrandLoader shape end to end through the real git pipeline: pins the changed fallback, restores the newly-inherited one, and leaves an unrelated already-declared property alone', () => {
    const { root, sha } = releaseRepo({
      'src/lib/BrandLoader/BrandLoader.svelte': [
        '<div class="text">{title}</div>',
        '<div class="sub-text">{subtitle}</div>',
        '<style>',
        '.text { color: var(--loader-text-color, white); }',
        '.sub-text { font-size: 0.75rem; }',
        '</style>'
      ].join('\n'),
      'package.json': '{ "version": "4.27.6" }\n'
    });
    roots.push(root);

    // Mirrors the real regression exactly: .text's fallback darkened (an
    // ordinary pin), and .sub-text gained a color it never had at all
    // (an inheritance restore, not a pin).
    writeFileSync(
      join(root, 'src/lib/BrandLoader/BrandLoader.svelte'),
      [
        '<div class="text">{title}</div>',
        '<div class="sub-text">{subtitle}</div>',
        '<style>',
        '.text { color: var(--loader-text-color, #333333); }',
        '.sub-text { font-size: 0.75rem; color: var(--loader-sub-text-color, #52525b); }',
        '</style>'
      ].join('\n')
    );

    const css = buildLegacyPalette(root, sha);

    expect(css).toContain(':root { --loader-text-color: white; }   /* was the 4.27.x default */');
    expect(css).toContain(
      ':root { --loader-sub-text-color: ; }   /* color on .sub-text (src/lib/BrandLoader/BrandLoader.svelte:5) was inherited, never declared */'
    );
  });
});

// ------------------------------------------------------- against this repo's own history

/**
 * The same detector, proven against this library's own real component
 * source and its real `origin/release` history rather than a fixture --
 * matching how `cli.test.ts` proves `readWcComponents` against the real
 * `src/wc/components` instead of only a synthetic one. Skipped rather than
 * failed when `origin/release` is not fetchable in the environment this runs
 * in, since that is an environment gap, not a defect in the detector.
 */
describe('findInheritanceRestores — against this repo’s own real component history', () => {
  function repoRoot(): string {
    // Not `new URL('../../src/...', import.meta.url)`: Vite's static analysis
    // special-cases that literal asset-URL form and rewrites it at transform
    // time, resolving to an unrelated http://localhost URL under vitest --
    // the same reason cli.ts's own libraryRoot() and cli.test.ts's ownMajor()
    // walk up with `resolve` instead. See those for the fuller note.
    const here = fileURLToPath(import.meta.url);
    return resolve(here, '..', '..', '..');
  }

  function releaseHasRef(): boolean {
    try {
      execFileSync('git', ['rev-parse', '--verify', 'origin/release^{commit}'], {
        cwd: repoRoot(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      });
      return true;
    } catch {
      return false;
    }
  }

  function showAtRelease(relPath: string): string | null {
    try {
      return execFileSync('git', ['show', `origin/release:${relPath}`], {
        cwd: repoRoot(),
        encoding: 'utf8'
      });
    } catch {
      return null;
    }
  }

  const hasRelease = releaseHasRef();

  it.skipIf(!hasRelease)(
    'flags BrandLoader.svelte’s real .sub-text regression against origin/release',
    () => {
      const relPath = 'src/lib/BrandLoader/BrandLoader.svelte';
      const previous = showAtRelease(relPath);
      expect(previous).not.toBeNull();
      if (previous === null) {
        return;
      }
      const current = readFileSync(join(repoRoot(), relPath), 'utf8');

      const restores = findInheritanceRestores(previous, current, relPath);

      expect(
        restores.some((r) => r.name === '--loader-sub-text-color' && r.property === 'color')
      ).toBe(true);
    }
  );

  it.skipIf(!hasRelease)(
    'flags Phone.svelte’s real .phone-screen regression against origin/release -- proving the detector generalises past the one documented example',
    () => {
      const relPath = 'src/lib/Phone/Phone.svelte';
      const previous = showAtRelease(relPath);
      expect(previous).not.toBeNull();
      if (previous === null) {
        return;
      }
      const current = readFileSync(join(repoRoot(), relPath), 'utf8');

      const restores = findInheritanceRestores(previous, current, relPath);

      expect(
        restores.some((r) => r.name === '--phone-screen-color' && r.property === 'color')
      ).toBe(true);
    }
  );

  it.skipIf(!hasRelease)(
    'does not flag BrandLoader’s .text -- it already had a color at origin/release, so its change is the already-covered changed-fallback case',
    () => {
      const relPath = 'src/lib/BrandLoader/BrandLoader.svelte';
      const previous = showAtRelease(relPath);
      expect(previous).not.toBeNull();
      if (previous === null) {
        return;
      }
      const current = readFileSync(join(repoRoot(), relPath), 'utf8');

      const restores = findInheritanceRestores(previous, current, relPath);

      expect(restores.some((r) => r.name === '--loader-text-color')).toBe(false);
    }
  );
});
