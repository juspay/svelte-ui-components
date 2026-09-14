import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildLegacyPalette,
  diffPalette,
  extractFallbackSites,
  groupSites,
  renderStylesheet,
  type FallbackSite,
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
});
