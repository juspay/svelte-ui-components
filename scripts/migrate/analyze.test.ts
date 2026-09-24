import { describe, expect, it } from 'vitest';
import { intersects } from 'semver';
import {
  analyzeManifest,
  analyzeStylesheet,
  analyzeSvelte,
  readWcComponents,
  setRangeIntersector,
  type AnalyzeContext,
  type WcComponent
} from './analyze.ts';

// analyze.ts no longer imports semver so it can be loaded from a consumer's
// node_modules; the repo-side callers supply it. cli.ts does this too.
setRangeIntersector((range, peer) => intersects(range, peer, { loose: true }));

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

describe('analyzeSvelte — InputButton mandatory', () => {
  it('flags mandatory without required — the field now also gets native required/aria-required', () => {
    const source = `<script>import { InputButton } from '${LIB}';</script><InputButton mandatory />`;

    const findings = analyzeSvelte(source, 'a.svelte');

    expect(findings).toHaveLength(1);
    expect(findings[0]?.reason).toBe('inputbutton-mandatory');
  });

  it('does not flag when required is also passed — required wins either way', () => {
    const source = `<script>import { InputButton } from '${LIB}';</script><InputButton mandatory required={false} />`;

    expect(analyzeSvelte(source, 'a.svelte')).toEqual([]);
  });

  it('does not flag mandatory={false} — behaviour is identical before and after', () => {
    const source = `<script>import { InputButton } from '${LIB}';</script><InputButton mandatory={false} />`;

    expect(analyzeSvelte(source, 'a.svelte')).toEqual([]);
  });

  it('does not flag an InputButton with neither prop', () => {
    const source = `<script>import { InputButton } from '${LIB}';</script><InputButton />`;

    expect(analyzeSvelte(source, 'a.svelte')).toEqual([]);
  });

  it('warns rather than guesses when a spread could carry mandatory/required', () => {
    const source = `<script>import { InputButton } from '${LIB}';</script><InputButton {...props} />`;

    const findings = analyzeSvelte(source, 'a.svelte');

    expect(findings).toHaveLength(1);
    expect(findings[0]?.reason).toBe('indeterminate-spread');
  });

  it('resolves an aliased import so the finding is not missed', () => {
    const source = `<script>import { InputButton as Field } from '${LIB}';</script><Field mandatory />`;

    expect(analyzeSvelte(source, 'a.svelte')).toHaveLength(1);
  });

  it('recognises the raw sui-input-button custom element when given the wc component context', () => {
    const context: AnalyzeContext = {
      wcComponents: [{ component: 'InputButton', tag: 'sui-input-button', display: 'block' }]
    };
    const source = '<sui-input-button mandatory></sui-input-button>';

    const findings = analyzeSvelte(source, 'a.svelte', context);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.reason).toBe('inputbutton-mandatory');
  });

  it('does not recognise a sui-input-button tag without the wc component context', () => {
    const source = '<sui-input-button mandatory></sui-input-button>';

    expect(analyzeSvelte(source, 'a.svelte')).toEqual([]);
  });
});

describe('analyzeSvelte / analyzeStylesheet — chart tooltip slot selector', () => {
  it('flags a .chart-tooltip-slot selector in a <style> block, independent of any chart import', () => {
    const source = '<div>hello</div>\n<style>\n  .chart-tooltip-slot { color: red; }\n</style>';

    const findings = analyzeSvelte(source, 'a.svelte');

    expect(findings).toHaveLength(1);
    expect(findings[0]?.reason).toBe('chart-tooltip-slot-selector');
    expect(findings[0]?.line).toBe(3);
  });

  it('does not flag an unrelated selector', () => {
    const source = '<style>.chart-tooltip { color: red; }</style>';

    expect(analyzeSvelte(source, 'a.svelte')).toEqual([]);
  });

  it('flags the selector in a standalone .css file via analyzeStylesheet', () => {
    const css = '.chart-tooltip-slot .tooltip-title {\n  font-weight: 600;\n}\n';

    const findings = analyzeStylesheet(css, 'styles/app.css');

    expect(findings).toHaveLength(1);
    expect(findings[0]?.reason).toBe('chart-tooltip-slot-selector');
    expect(findings[0]?.file).toBe('styles/app.css');
    expect(findings[0]?.line).toBe(1);
  });

  it('does not flag a clean .css file', () => {
    expect(analyzeStylesheet('.chart-tooltip.unstyled { padding: 0; }', 'a.css')).toEqual([]);
  });
});

describe('analyzeSvelte — host-display-inline', () => {
  const badge: WcComponent = { component: 'Badge', tag: 'sui-badge', display: 'block' };
  const avatar: WcComponent = { component: 'Avatar', tag: 'sui-avatar', display: 'inline-block' };
  const context: AnalyzeContext = { wcComponents: [badge, avatar] };

  it('flags a sui-* element used as the direct child of a text-flow element', () => {
    const source = '<p>Status: <sui-badge></sui-badge></p>';

    const findings = analyzeSvelte(source, 'a.svelte', context);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.reason).toBe('host-display-inline');
    expect(findings[0]?.detail).toContain('display: block');
  });

  it('names the actual new default, including inline-block', () => {
    const source = '<span><sui-avatar></sui-avatar></span>';

    const findings = analyzeSvelte(source, 'a.svelte', context);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.detail).toContain('display: inline-block');
  });

  it('does not flag a lone sui-* element inside a div — nothing to sit beside', () => {
    const source = '<div><sui-badge></sui-badge></div>';

    expect(analyzeSvelte(source, 'a.svelte', context)).toEqual([]);
  });

  it('does not recognise the tag without wc component context', () => {
    const source = '<p><sui-badge></sui-badge></p>';

    expect(analyzeSvelte(source, 'a.svelte')).toEqual([]);
  });

  it('checks every text-flow element in the derived list, not just <p>', () => {
    for (const tag of ['p', 'span', 'li', 'td', 'label', 'h1', 'a', 'button']) {
      const source = `<${tag}><sui-badge></sui-badge></${tag}>`;
      expect(analyzeSvelte(source, 'a.svelte', context), tag).toHaveLength(1);
    }
  });

  // Gap A: the detector used to look only at the parent's tag, and was silent
  // on the single most common real shape -- a toolbar row of siblings inside
  // a plain <div>. Verified live in Chromium: two sui-button siblings inside
  // <div style="width:400px"> sit on one line under the old implicit inline
  // and stack under the new block default.
  describe('widened rule: inline-level siblings', () => {
    const button: WcComponent = { component: 'Button', tag: 'sui-button', display: 'block' };
    const siblingContext: AnalyzeContext = { wcComponents: [button, badge] };

    it('flags two sui-* siblings inside a plain div, the toolbar-row shape', () => {
      const source =
        '<div style="width:400px">\n  <sui-button></sui-button>\n  <sui-button></sui-button>\n</div>';

      const findings = analyzeSvelte(source, 'a.svelte', siblingContext);

      expect(findings).toHaveLength(2);
      expect(findings.every((f) => f.reason === 'host-display-inline')).toBe(true);
    });

    it('flags a sui-* element immediately beside another with no whitespace at all', () => {
      const source = '<div><sui-button></sui-button><sui-button></sui-button></div>';

      expect(analyzeSvelte(source, 'a.svelte', siblingContext)).toHaveLength(2);
    });

    it('flags a sui-* element next to non-whitespace text', () => {
      const source = '<div>Status <sui-badge></sui-badge></div>';

      const findings = analyzeSvelte(source, 'a.svelte', siblingContext);

      expect(findings).toHaveLength(1);
      expect(findings[0]?.detail).toContain('beside other inline-level content');
    });

    it('flags a sui-* element next to a known inline HTML tag', () => {
      const source = '<div><sui-badge></sui-badge><span>x</span></div>';

      expect(analyzeSvelte(source, 'a.svelte', siblingContext)).toHaveLength(1);
    });

    it('does not flag a sui-* element next to a block-level HTML sibling', () => {
      const source = '<div><sui-badge></sui-badge><p>x</p></div>';

      expect(analyzeSvelte(source, 'a.svelte', siblingContext)).toEqual([]);
    });

    it('does not flag when the parent is an inline-style flex container', () => {
      const source =
        '<div style="display:flex"><sui-button></sui-button><sui-button></sui-button></div>';

      expect(analyzeSvelte(source, 'a.svelte', siblingContext)).toEqual([]);
    });

    it('does not flag when the parent is an inline-style grid container', () => {
      const source =
        '<div style="display:grid"><sui-button></sui-button><sui-button></sui-button></div>';

      expect(analyzeSvelte(source, 'a.svelte', siblingContext)).toEqual([]);
    });

    it('does not double-count when both the text-flow-parent and sibling rules match the same element', () => {
      // <p> is a text-flow parent AND "Status: " is a non-whitespace sibling --
      // this must still be exactly one finding, not two.
      const source = '<p>Status: <sui-badge></sui-badge></p>';

      expect(analyzeSvelte(source, 'a.svelte', siblingContext)).toHaveLength(1);
    });
  });
});

describe('analyzeSvelte — chart-min-width', () => {
  const pieChart: WcComponent = { component: 'PieChart', tag: 'sui-pie-chart', display: 'block' };
  const context: AnalyzeContext = { wcComponents: [pieChart] };

  it('flags a chart rendered inside a parent with an inline width under 160px', () => {
    const source = `<script>import { PieChart } from '${LIB}';</script><div style="width: 120px"><PieChart /></div>`;

    const findings = analyzeSvelte(source, 'a.svelte', context);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.reason).toBe('chart-min-width');
    expect(findings[0]?.detail).toContain('120px');
  });

  it('flags a narrow inline flex-basis the same way', () => {
    const source = `<script>import { PieChart } from '${LIB}';</script><div style="flex-basis: 80px"><PieChart /></div>`;

    expect(analyzeSvelte(source, 'a.svelte', context)).toHaveLength(1);
  });

  it('does not flag a parent width at or above the 160px floor', () => {
    const source = `<script>import { PieChart } from '${LIB}';</script><div style="width: 160px"><PieChart /></div>`;

    expect(analyzeSvelte(source, 'a.svelte', context)).toEqual([]);
  });

  it('does not flag a chart with no styled parent to inspect', () => {
    const source = `<script>import { PieChart } from '${LIB}';</script><PieChart />`;

    expect(analyzeSvelte(source, 'a.svelte', context)).toEqual([]);
  });

  it('does not guess at a percentage width — not statically comparable to 160px', () => {
    const source = `<script>import { PieChart } from '${LIB}';</script><div style="width: 10%"><PieChart /></div>`;

    expect(analyzeSvelte(source, 'a.svelte', context)).toEqual([]);
  });

  it('recognises the raw sui-pie-chart custom element the same way', () => {
    const source = '<div style="width: 100px"><sui-pie-chart></sui-pie-chart></div>';

    const findings = analyzeSvelte(source, 'a.svelte', context);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.reason).toBe('chart-min-width');
  });
});

// Gap B: sui-chat-composer's `recording` went from `{ type: 'Boolean', reflect:
// true }` to `{ type: 'String' }` with no reflect -- confirmed against
// svelte/src/internal/client/dom/elements/custom-element.js, whose reflect loop
// is gated on `this.$$p_d[key]?.reflect`. The property setter no longer touches
// the attribute, so `el.recording = true; el.getAttribute('recording')` went
// from `""` to `null`. Neither analyzeSvelte nor analyzeStylesheet needs
// wcComponents context for this one -- the tag is a hardcoded literal, the
// same design choice `.chart-tooltip-slot` already makes for its two components.
describe('analyzeSvelte / analyzeStylesheet — chat-composer recording reflect', () => {
  it('flags a CSS attribute selector on the recording attribute, in a <style> block', () => {
    const source =
      '<div>x</div>\n<style>\n  sui-chat-composer[recording] { outline: 2px solid red; }\n</style>';

    const findings = analyzeSvelte(source, 'a.svelte');

    expect(findings).toHaveLength(1);
    expect(findings[0]?.reason).toBe('chat-composer-recording-reflect');
    expect(findings[0]?.line).toBe(3);
  });

  it('flags the same selector in a standalone .css file via analyzeStylesheet', () => {
    const css = 'sui-chat-composer[recording="true"] .voice {\n  color: red;\n}\n';

    const findings = analyzeStylesheet(css, 'styles/app.css');

    expect(findings).toHaveLength(1);
    expect(findings[0]?.reason).toBe('chat-composer-recording-reflect');
    expect(findings[0]?.file).toBe('styles/app.css');
  });

  it('does not flag an unrelated attribute selector', () => {
    expect(analyzeStylesheet('sui-chat-composer[disabled] { opacity: 0.5; }', 'a.css')).toEqual([]);
  });

  it('flags getAttribute("recording") on what looks like a chat-composer', () => {
    const source = [
      `<script>`,
      `  import { onMount } from 'svelte';`,
      `  let el;`,
      `  onMount(() => {`,
      `    el = document.querySelector('sui-chat-composer');`,
      `    console.log(el.getAttribute('recording'));`,
      `  });`,
      `</script>`,
      `<div bind:this={el}></div>`
    ].join('\n');

    const findings = analyzeSvelte(source, 'a.svelte');

    expect(findings).toHaveLength(1);
    expect(findings[0]?.reason).toBe('chat-composer-recording-reflect');
    expect(findings[0]?.line).toBe(6);
  });

  it('flags hasAttribute("recording") the same way', () => {
    const source =
      "<script>const on = document.querySelector('sui-chat-composer').hasAttribute('recording');</script>";

    const findings = analyzeSvelte(source, 'a.svelte');

    expect(findings).toHaveLength(1);
    expect(findings[0]?.reason).toBe('chat-composer-recording-reflect');
  });

  it('does not flag getAttribute("recording") when the file never mentions sui-chat-composer', () => {
    // Bounds the false positives this textual, co-occurrence-based check would
    // otherwise produce: a `recording` attribute on some unrelated element.
    const source = "<script>el.getAttribute('recording');</script>";

    expect(analyzeSvelte(source, 'a.svelte')).toEqual([]);
  });

  it('does not flag reading an unrelated attribute off a chat-composer', () => {
    const source =
      "<script>document.querySelector('sui-chat-composer').getAttribute('disabled');</script>";

    expect(analyzeSvelte(source, 'a.svelte')).toEqual([]);
  });
});

// Regression coverage over this library's OWN wc wrappers: proves the derivation
// stays correct against the real source rather than a fixture that could drift
// from it unnoticed.
describe('readWcComponents', () => {
  const components = readWcComponents(process.cwd());

  it('finds all 100 wc wrappers, split 88 block / 12 inline-block', () => {
    expect(components).toHaveLength(100);
    expect(components.filter((c) => c.display === 'block')).toHaveLength(88);
    expect(components.filter((c) => c.display === 'inline-block')).toHaveLength(12);
  });

  it('reads InputButton as sui-input-button, not the guessed sui-inputbutton', () => {
    const inputButton = components.find((c) => c.component === 'InputButton');
    expect(inputButton?.tag).toBe('sui-input-button');
  });

  it('finds exactly the 7 *Chart components', () => {
    const charts = components.filter((c) => c.component.endsWith('Chart')).map((c) => c.component);
    expect(charts.sort()).toEqual(
      [
        'AreaChart',
        'BarChart',
        'DualAxisBarChart',
        'FunnelChart',
        'LineChart',
        'PieChart',
        'SankeyChart'
      ].sort()
    );
  });

  it('returns an empty list for a root with no src/wc/components directory', () => {
    expect(readWcComponents('/definitely/not/a/real/repo')).toEqual([]);
  });
});
