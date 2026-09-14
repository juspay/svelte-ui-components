import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, onTestFinished } from 'vitest';
import {
  LEGACY_DISPLAY_CSS_FILENAME,
  LEGACY_PALETTE_CSS_FILENAME,
  loadWcDisplay,
  runMigrateAudit,
  wcComponentsFrom
} from './migrate-audit.ts';

const LIB = '@juspay/svelte-ui-components';
const silent = (): void => {};

function tempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  onTestFinished(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

function consumerProject(files: Record<string, string>): string {
  const root = tempDir('sui-migrate-audit-consumer-');
  for (const [name, contents] of Object.entries(files)) {
    const path = join(root, name);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, contents);
  }
  return root;
}

type FixtureEntry = {
  readonly tag: string;
  readonly property: string;
  readonly default: 'block' | 'inline-block';
};

const BADGE: FixtureEntry = { tag: 'sui-badge', property: '--sui-badge-display', default: 'block' };
const PIE_CHART: FixtureEntry = {
  tag: 'sui-pie-chart',
  property: '--sui-pie-chart-display',
  default: 'block'
};
const INPUT_BUTTON: FixtureEntry = {
  tag: 'sui-input-button',
  property: '--sui-input-button-display',
  default: 'inline-block'
};

/** A `migration-assets` directory as `generate-migration-assets.ts` would produce it, minus whatever `omit` says to leave out — so tests can exercise "missing" without a separate code path. */
function assetsDir(options: {
  readonly wcDisplay?: readonly FixtureEntry[];
  readonly wcDisplayRaw?: string;
  readonly legacyDisplayCss?: string;
  readonly legacyPaletteCss?: string;
}): string {
  const dir = tempDir('sui-migrate-audit-assets-');
  if (typeof options.wcDisplayRaw === 'string') {
    writeFileSync(join(dir, 'wc-display.json'), options.wcDisplayRaw);
  } else if (options.wcDisplay) {
    writeFileSync(join(dir, 'wc-display.json'), JSON.stringify(options.wcDisplay, null, 2));
  }
  if (typeof options.legacyDisplayCss === 'string') {
    writeFileSync(join(dir, LEGACY_DISPLAY_CSS_FILENAME), options.legacyDisplayCss);
  }
  if (typeof options.legacyPaletteCss === 'string') {
    writeFileSync(join(dir, LEGACY_PALETTE_CSS_FILENAME), options.legacyPaletteCss);
  }
  return dir;
}

describe('loadWcDisplay', () => {
  it('reports missing distinctly from empty, so a clean audit cannot be mistaken for one that could not look', () => {
    const dir = tempDir('sui-wc-display-');
    const result = loadWcDisplay(join(dir, 'wc-display.json'));
    expect(result.status).toBe('missing');
  });

  it('refuses malformed JSON rather than silently reading zero components', () => {
    const dir = assetsDir({ wcDisplayRaw: '{ not json' });
    const result = loadWcDisplay(join(dir, 'wc-display.json'));
    expect(result.status).toBe('invalid');
    expect(result.status === 'invalid' && result.reason).toContain('JSON');
  });

  it('refuses a JSON value that is not an array', () => {
    const dir = assetsDir({ wcDisplayRaw: '{"tag": "sui-badge"}' });
    const result = loadWcDisplay(join(dir, 'wc-display.json'));
    expect(result.status).toBe('invalid');
  });

  it('refuses the whole file when one entry is missing a required field — fail closed, not partial', () => {
    const dir = assetsDir({
      wcDisplayRaw: JSON.stringify([BADGE, { tag: 'sui-broken', property: '--x' }])
    });
    const result = loadWcDisplay(join(dir, 'wc-display.json'));
    expect(result.status).toBe('invalid');
    expect(result.status === 'invalid' && result.reason).toContain('entry 1');
  });

  it('refuses an entry whose default is not block/inline-block', () => {
    const dir = assetsDir({
      wcDisplayRaw: JSON.stringify([
        { tag: 'sui-badge', property: '--sui-badge-display', default: 'flex' }
      ])
    });
    const result = loadWcDisplay(join(dir, 'wc-display.json'));
    expect(result.status).toBe('invalid');
  });

  it('reads a well-formed file', () => {
    const dir = assetsDir({ wcDisplay: [BADGE, PIE_CHART, INPUT_BUTTON] });
    const result = loadWcDisplay(join(dir, 'wc-display.json'));
    expect(result.status).toBe('ok');
    expect(result.status === 'ok' && result.entries).toHaveLength(3);
  });
});

describe('wcComponentsFrom', () => {
  it('derives the PascalCase component name chart-min-width and inputbutton-mandatory key off', () => {
    const components = wcComponentsFrom([BADGE, PIE_CHART, INPUT_BUTTON]);
    expect(components).toEqual([
      { component: 'Badge', tag: 'sui-badge', display: 'block' },
      { component: 'PieChart', tag: 'sui-pie-chart', display: 'block' },
      { component: 'InputButton', tag: 'sui-input-button', display: 'inline-block' }
    ]);
  });
});

describe('runMigrateAudit — findings parity with npm run migrate', () => {
  it('surfaces inputbutton-mandatory through the named import even with no wc-display.json', () => {
    const consumer = consumerProject({
      'src/Form.svelte': `<script>import { InputButton } from '${LIB}';</script>\n<InputButton mandatory />`
    });
    const assets = assetsDir({});
    const lines: string[] = [];
    const summary = runMigrateAudit([consumer], (line) => lines.push(line), { assetsDir: assets });

    expect(summary.wcDisplay.status).toBe('missing');
    expect(summary.findings).toHaveLength(1);
    expect(summary.findings[0]?.reason).toBe('inputbutton-mandatory');
    // The absence must be readable in the transcript, not just the return value.
    expect(lines.join('\n')).toContain('NOT FOUND');
  });

  it('cannot see host-display-inline without wc-display.json, and says so rather than reporting zero', () => {
    const consumer = consumerProject({
      'src/Page.svelte': '<p>Status: <sui-badge></sui-badge></p>'
    });
    const assets = assetsDir({});
    const lines: string[] = [];
    const summary = runMigrateAudit([consumer], (line) => lines.push(line), { assetsDir: assets });

    expect(summary.findings).toHaveLength(0);
    // The absence note and the (unrelated, and here genuinely accurate)
    // "no findings across N files" summary line can coexist — what must not
    // happen is the absence going unmentioned, leaving a bare "no findings"
    // that reads as a clean bill of health.
    const output = lines.join('\n');
    expect(output).toContain('could not be audited');
  });

  it('reports INVALID distinctly from NOT FOUND when the file is present but unreadable', () => {
    const consumer = consumerProject({ 'src/Page.svelte': '<p>hi</p>' });
    const assets = assetsDir({ wcDisplayRaw: '{ not json' });
    const lines: string[] = [];
    const summary = runMigrateAudit([consumer], (line) => lines.push(line), { assetsDir: assets });

    expect(summary.wcDisplay.status).toBe('invalid');
    // Scoped to the wc-display status line itself: the shim-availability
    // section below it legitimately says "NOT FOUND" too (for the shims,
    // an unrelated fact), so asserting on the whole transcript would pass
    // even if the wc-display line itself said the wrong thing.
    const wcDisplayLine = lines.find((line) => line.startsWith('wc-display.json:'));
    expect(wcDisplayLine).toContain('INVALID');
    expect(wcDisplayLine).not.toContain('NOT FOUND');
  });

  it('recognises a raw sui-* custom element via wc-display.json — host-display-inline', () => {
    const consumer = consumerProject({
      'src/Page.svelte': '<p>Status: <sui-badge></sui-badge></p>'
    });
    const assets = assetsDir({ wcDisplay: [BADGE] });
    const summary = runMigrateAudit([consumer], silent, { assetsDir: assets });

    expect(summary.wcDisplay.status).toBe('ok');
    expect(summary.findings).toHaveLength(1);
    expect(summary.findings[0]?.reason).toBe('host-display-inline');
  });

  it('recognises a chart rendered into a narrow parent via wc-display.json — chart-min-width', () => {
    const consumer = consumerProject({
      'src/Dash.svelte': `<script>import { PieChart } from '${LIB}';</script>\n<div style="width: 100px"><PieChart /></div>`
    });
    const assets = assetsDir({ wcDisplay: [PIE_CHART] });
    const summary = runMigrateAudit([consumer], silent, { assetsDir: assets });

    expect(summary.findings).toHaveLength(1);
    expect(summary.findings[0]?.reason).toBe('chart-min-width');
  });

  it('recognises the raw <sui-input-button> spelling of inputbutton-mandatory via wc-display.json', () => {
    const consumer = consumerProject({
      'src/Form.svelte': '<sui-input-button mandatory></sui-input-button>'
    });
    const assets = assetsDir({ wcDisplay: [INPUT_BUTTON] });
    const summary = runMigrateAudit([consumer], silent, { assetsDir: assets });

    expect(summary.findings).toHaveLength(1);
    expect(summary.findings[0]?.reason).toBe('inputbutton-mandatory');
  });

  it('scans .css files for the renamed chart tooltip slot selector regardless of wc-display.json', () => {
    const consumer = consumerProject({ 'src/app.css': '.chart-tooltip-slot { color: red; }\n' });
    const assets = assetsDir({});
    // --dry-run because this asserts the SCAN happened, and a writing run now
    // drops a finding it has already fixed from the report. Without the flag
    // this would depend on fixed findings still being listed, which is the
    // behaviour that made a second run look like it changed nothing when it
    // had nothing left to change.
    const summary = runMigrateAudit(['--dry-run', consumer], silent, { assetsDir: assets });

    expect(summary.findings.some((f) => f.reason === 'chart-tooltip-slot-selector')).toBe(true);
  });

  it('drops a tooltip finding it has just fixed, so a writing run does not report work it already did', () => {
    const consumer = consumerProject({ 'src/app.css': '.chart-tooltip-slot { color: red; }\n' });
    const assets = assetsDir({});

    const summary = runMigrateAudit([consumer], silent, { assetsDir: assets });

    expect(summary.applied).toBe(true);
    expect(summary.rewrites).toHaveLength(1);
    expect(summary.findings.some((f) => f.reason === 'chart-tooltip-slot-selector')).toBe(false);
  });

  it('flags sui-chat-composer[recording] CSS regardless of wc-display.json', () => {
    const consumer = consumerProject({
      'src/app.css': 'sui-chat-composer[recording] { outline: 2px solid red; }\n'
    });
    const assets = assetsDir({});
    const summary = runMigrateAudit([consumer], silent, { assetsDir: assets });

    expect(summary.findings.some((f) => f.reason === 'chat-composer-recording-reflect')).toBe(true);
  });
});

describe('runMigrateAudit — the tooltip selector rewrite, under sui-codemod’s own --dry-run', () => {
  it('rewrites .chart-tooltip-slot to .chart-tooltip.unstyled by default (no --dry-run)', () => {
    const consumer = consumerProject({ 'src/app.css': '.chart-tooltip-slot { color: red; }\n' });
    const assets = assetsDir({});
    const summary = runMigrateAudit([consumer], silent, { assetsDir: assets });

    expect(summary.applied).toBe(true);
    expect(summary.rewrites).toHaveLength(1);
    expect(readFileSync(join(consumer, 'src/app.css'), 'utf8')).toContain(
      '.chart-tooltip.unstyled'
    );
  });

  it('--dry-run prints the rewrite as a diff and writes nothing', () => {
    const consumer = consumerProject({ 'src/app.css': '.chart-tooltip-slot { color: red; }\n' });
    const assets = assetsDir({});
    const lines: string[] = [];
    const summary = runMigrateAudit(['--dry-run', consumer], (line) => lines.push(line), {
      assetsDir: assets
    });

    expect(summary.applied).toBe(false);
    expect(readFileSync(join(consumer, 'src/app.css'), 'utf8')).toBe(
      '.chart-tooltip-slot { color: red; }\n'
    );
    const output = lines.join('\n');
    expect(output).toContain('- .chart-tooltip-slot { color: red; }');
    expect(output).toContain('+ .chart-tooltip.unstyled { color: red; }');
  });

  it('reports nothing to rewrite when no .chart-tooltip-slot selector is present', () => {
    const consumer = consumerProject({ 'src/app.css': '.other { color: red; }\n' });
    const assets = assetsDir({});
    const summary = runMigrateAudit([consumer], silent, { assetsDir: assets });

    expect(summary.applied).toBe(false);
    expect(summary.rewrites).toHaveLength(0);
  });
});

describe('runMigrateAudit — shim stylesheets referenced by name', () => {
  it('reports both shims present when this install shipped them', () => {
    const consumer = consumerProject({ 'src/Page.svelte': '<p>hi</p>' });
    const assets = assetsDir({
      legacyDisplayCss: '/* shim */',
      legacyPaletteCss: '/* palette */'
    });
    const lines: string[] = [];
    runMigrateAudit([consumer], (line) => lines.push(line), { assetsDir: assets });

    const output = lines.join('\n');
    expect(output).toContain(`${LEGACY_DISPLAY_CSS_FILENAME}: present`);
    expect(output).toContain(`${LEGACY_PALETTE_CSS_FILENAME}: present`);
  });

  it('reports NOT FOUND for a shim this install did not ship, by its own filename', () => {
    const consumer = consumerProject({ 'src/Page.svelte': '<p>hi</p>' });
    const assets = assetsDir({});
    const lines: string[] = [];
    runMigrateAudit([consumer], (line) => lines.push(line), { assetsDir: assets });

    const output = lines.join('\n');
    expect(output).toContain(`${LEGACY_DISPLAY_CSS_FILENAME}: NOT FOUND`);
    expect(output).toContain(`${LEGACY_PALETTE_CSS_FILENAME}: NOT FOUND`);
  });
});

describe('runMigrateAudit — usage and errors', () => {
  it('prints usage and exits 2 when no path is given', () => {
    const lines: string[] = [];
    const summary = runMigrateAudit([], (line) => lines.push(line));
    expect(summary.exitCode).toBe(2);
    expect(lines.join('\n')).toContain('Usage');
  });

  it('exits 0 and prints usage on --help', () => {
    const lines: string[] = [];
    const summary = runMigrateAudit(['--help'], (line) => lines.push(line));
    expect(summary.exitCode).toBe(0);
    expect(lines.join('\n')).toContain('Usage');
  });

  it('exits 2 on a path that does not exist', () => {
    const summary = runMigrateAudit([join(tmpdir(), 'definitely-not-a-project-xyz')], silent);
    expect(summary.exitCode).toBe(2);
  });

  it('exits 2 on an unknown flag', () => {
    const consumer = consumerProject({});
    const summary = runMigrateAudit(['--nope', consumer], silent);
    expect(summary.exitCode).toBe(2);
  });
});

// Proves the wiring against the REAL artifact `generate-migration-assets.ts`
// writes during `build:codemod` — not just a synthetic fixture — the same
// way scripts/migrate/cli.test.ts proves readWcComponents against this
// library's own real src/wc/components rather than only a fixture. Skips
// (loudly, not silently) rather than fails when dist-codemod has not been
// built in this checkout yet, since that directory is gitignored build
// output, not something a fresh clone has.
describe('runMigrateAudit — against the real generated dist-codemod/migration-assets', () => {
  const here = fileURLToPath(import.meta.url);
  const repoRoot = resolve(here, '..', '..', '..');
  const realAssetsDir = join(repoRoot, 'dist-codemod', 'migration-assets');
  const built = existsSync(join(realAssetsDir, 'wc-display.json'));

  if (!built) {
    it.skip(`skipped: run "npm run build:codemod" first (${realAssetsDir} not built)`, () => {});
    return;
  }

  it('audits a real <sui-badge> usage against the real generated wc-display.json', () => {
    const consumer = consumerProject({
      'src/Toolbar.svelte': '<div><sui-badge></sui-badge><sui-badge></sui-badge></div>'
    });
    const summary = runMigrateAudit([consumer], silent, { assetsDir: realAssetsDir });

    expect(summary.wcDisplay.status).toBe('ok');
    expect(summary.findings.length).toBeGreaterThan(0);
    expect(summary.findings.every((f) => f.reason === 'host-display-inline')).toBe(true);
  });

  it('audits a real <InputButton mandatory> usage against the real generated wc-display.json', () => {
    const consumer = consumerProject({
      'src/Form.svelte': `<script>import { InputButton } from '${LIB}';</script>\n<InputButton mandatory />`
    });
    const summary = runMigrateAudit([consumer], silent, { assetsDir: realAssetsDir });

    expect(summary.findings).toHaveLength(1);
    expect(summary.findings[0]?.reason).toBe('inputbutton-mandatory');
  });
});
