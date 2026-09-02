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
