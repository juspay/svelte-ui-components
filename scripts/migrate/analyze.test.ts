import { describe, expect, it } from 'vitest';
import { analyzeManifest, analyzeSvelte } from './analyze.ts';

const LIB = '@juspay/svelte-ui-components';

describe('analyzeManifest', () => {
  it('reports the installed range and flags nothing when svelte satisfies the 3.x peer', () => {
    const report = analyzeManifest({
      dependencies: { [LIB]: '2.136.0' },
      devDependencies: { svelte: '^5.55.9' }
    });

    expect(report.currentRange).toBe('2.136.0');
    expect(report.svelteRange).toBe('^5.55.9');
    expect(report.blockers).toEqual([]);
  });

  it('blocks when svelte is a major below the 3.x peer requirement', () => {
    const report = analyzeManifest({
      dependencies: { [LIB]: '1.34.0', svelte: '^4.2.8' }
    });

    expect(report.blockers).toHaveLength(1);
    expect(report.blockers[0]).toContain('svelte');
  });

  it('blocks when the library is not a dependency at all', () => {
    const report = analyzeManifest({ dependencies: { svelte: '^5.55.9' } });

    expect(report.currentRange).toBeNull();
    expect(report.blockers[0]).toContain('not a dependency');
  });
});

describe('analyzeSvelte — Toolbar back control', () => {
  it('flags a Toolbar that renders the default back control', () => {
    const source = `<script>import { Toolbar } from '${LIB}';</script><Toolbar text="Orders" />`;

    const findings = analyzeSvelte(source, 'a.svelte');

    expect(findings).toHaveLength(1);
    expect(findings[0]?.reason).toBe('default-back-control');
  });

  it('does not flag a Toolbar with showBackButton={false} — the control never renders', () => {
    const source = `<script>import { Toolbar } from '${LIB}';</script><Toolbar showBackButton={false} />`;

    expect(analyzeSvelte(source, 'a.svelte')).toEqual([]);
  });

  it('does not flag a Toolbar given its own backIcon — that path still renders an img', () => {
    const source = `<script>import { Toolbar } from '${LIB}';</script><Toolbar backIcon="/x.svg" />`;

    expect(analyzeSvelte(source, 'a.svelte')).toEqual([]);
  });

  it('resolves an aliased import so the finding is not missed', () => {
    const source = `<script>import { Toolbar as Bar } from '${LIB}';</script><Bar />`;

    expect(analyzeSvelte(source, 'a.svelte')).toHaveLength(1);
  });

  it('ignores a Toolbar that is not the library component', () => {
    const source = `<script>import Toolbar from './my/Toolbar.svelte';</script><Toolbar />`;

    expect(analyzeSvelte(source, 'a.svelte')).toEqual([]);
  });

  it('warns rather than guesses when a spread could carry showBackButton', () => {
    const source = `<script>import { Toolbar } from '${LIB}';</script><Toolbar {...props} />`;

    const findings = analyzeSvelte(source, 'a.svelte');

    expect(findings).toHaveLength(1);
    expect(findings[0]?.reason).toBe('indeterminate-spread');
  });

  it('flags styles that select the old img markup inside the back control', () => {
    const source = `<script>import { Toolbar } from '${LIB}';</script><Toolbar showBackButton={false} /><style>.back img { width: 12px; }</style>`;

    const findings = analyzeSvelte(source, 'a.svelte');

    expect(findings).toHaveLength(1);
    expect(findings[0]?.reason).toBe('legacy-back-selector');
  });

  it('reports the line so a human can go straight to it', () => {
    const source = `<script>import { Toolbar } from '${LIB}';</script>\n\n<Toolbar />`;

    expect(analyzeSvelte(source, 'a.svelte')[0]?.line).toBe(3);
  });

  it('returns nothing for a file that never imports the library', () => {
    expect(analyzeSvelte('<div>hello</div>', 'a.svelte')).toEqual([]);
  });
});

// Regression coverage for the review findings on PR #499.
describe('review findings', () => {
  it('rejects a range that shares the major but cannot satisfy the peer', () => {
    // 5.0.0 is a Svelte 5, but it is below ^5.41.2.
    const report = analyzeManifest({
      dependencies: { [LIB]: '2.136.0', svelte: '5.0.0' }
    });
    expect(report.blockers).toHaveLength(1);
  });

  it('accepts a disjunction that intersects the peer even though it starts at 4', () => {
    const report = analyzeManifest({
      dependencies: { [LIB]: '2.136.0', svelte: '^4 || ^5' }
    });
    expect(report.blockers).toEqual([]);
  });

  it('treats an unparseable range as not satisfying the peer', () => {
    const report = analyzeManifest({
      dependencies: { [LIB]: '2.136.0', svelte: 'workspace:*' }
    });
    expect(report.blockers).toHaveLength(1);
  });

  it('does not read dependencies smuggled in through __proto__', () => {
    // JSON.parse makes `__proto__` an ordinary own key, but assigning it while
    // copying re-points the copy's prototype instead of adding a field. The
    // dependencies would then be found through the prototype chain and the
    // manifest would look like it declares svelte and the library when it
    // declares neither.
    const manifest: unknown = JSON.parse(
      '{"__proto__":{"dependencies":{"svelte":"^5.55.9","@juspay/svelte-ui-components":"2.136.0"}}}'
    );

    const report = analyzeManifest(manifest);

    expect(report.svelteRange).toBeNull();
    expect(report.blockers.length).toBeGreaterThan(0);
  });

  it('resolves prerelease ranges the same way loose parsing does', () => {
    // Pins the one property `loose` is suspected of changing. It does not: both
    // of these intersect the peer under strict parsing too. The mode is kept
    // for leading-zero versions, which strict parsing rejects outright.
    for (const svelte of ['^5.41.2-alpha', '>=5.0.0-0', '^05.41.2']) {
      const report = analyzeManifest({ dependencies: { [LIB]: '2.136.0', svelte } });
      expect(report.blockers, svelte).toEqual([]);
    }
  });

  it('only the Boolean literal false disables the control', () => {
    const cases: readonly [string, number][] = [
      ['showBackButton={false}', 0],
      // A member expression carries "computed":false in its AST, which a
      // substring match on the serialised node wrongly read as disabled.
      ['showBackButton={cfg.showBack}', 1],
      ['showBackButton="false"', 1],
      ['showBackButton={true}', 1],
      ['showBackButton={isVisible}', 1],
      // Quoting a single expression parses to a one-element array rather than a
      // bare ExpressionTag, so reading only the bare shape reports a Toolbar
      // that is genuinely disabled.
      ['showBackButton="{false}"', 0],
      ['showBackButton="{cfg.showBack}"', 1]
    ];
    for (const [attrs, expected] of cases) {
      const source = `<script>import { Toolbar } from '${LIB}';</script><Toolbar ${attrs} />`;
      expect(analyzeSvelte(source, 'a.svelte'), attrs).toHaveLength(expected);
    }
  });

  it('reports the line of the offending selector, not the <style> tag', () => {
    const source = [
      `<script>import { Toolbar } from '${LIB}';</script>`,
      '<Toolbar showBackButton={false} />',
      '<style>',
      '  .unrelated { color: red; }',
      '',
      '  .back img { width: 12px; }',
      '</style>'
    ].join('\n');

    const findings = analyzeSvelte(source, 'a.svelte');
    expect(findings).toHaveLength(1);
    expect(findings[0]?.line).toBe(6);
  });
});
