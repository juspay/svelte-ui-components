import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { run } from './cli.ts';

const LIB = '@juspay/svelte-ui-components';

/**
 * The version this library is actually on, read here rather than imported from
 * `cli.ts`, so this asserts the contract ("--apply moves a consumer to THIS
 * library's version") instead of asserting the CLI against itself.
 *
 * The literal it replaced was `'^3.0.0'`, which stayed green through the whole
 * 4.x line while the CLI offered to move consumers of 4.27.x back to 3.x. A
 * test that hardcodes the answer cannot notice the answer going stale.
 *
 * It is the FULL version rather than `^<major>.0.0` because 4.28.0 shipped
 * breaking changes inside a minor — `^4.0.0` is satisfied by 4.27.x, which
 * does not have them.
 */
const OWN_MAJOR = ownMajor();

function ownMajor(): string {
  // Not `new URL('../../package.json', import.meta.url)`: Vite special-cases
  // that literal form as an asset-URL reference and rewrites it at transform
  // time, which under vitest resolves to an unrelated http:// URL. Same reason
  // `cli.ts`'s own `libraryRoot()` walks up with `resolve` instead.
  const here = fileURLToPath(import.meta.url);
  const manifest: unknown = JSON.parse(
    readFileSync(resolve(here, '..', '..', '..', 'package.json'), 'utf8')
  );
  const version =
    typeof manifest === 'object' && manifest !== null && 'version' in manifest
      ? manifest.version
      : null;
  if (typeof version !== 'string') {
    throw new Error('cannot read the library version');
  }
  return `^${version}`;
}

function project(manifest: object, files: Record<string, string> = {}): string {
  const root = mkdtempSync(join(tmpdir(), 'sui-migrate-'));
  writeFileSync(join(root, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  for (const [name, contents] of Object.entries(files)) {
    const path = join(root, name);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, contents);
  }
  return root;
}

const silent = (): void => {};

describe('migrate cli', () => {
  it('reports a clean project as needing only a bump, and writes nothing without --apply', () => {
    const root = project({
      dependencies: { [LIB]: '2.136.0', svelte: '^5.55.9' }
    });

    const summary = run([root], silent);

    expect(summary.exitCode).toBe(0);
    expect(summary.findings).toEqual([]);
    expect(summary.applied).toBe(false);
    expect(readFileSync(join(root, 'package.json'), 'utf8')).toContain('"2.136.0"');
  });

  it('rewrites only the version range under --apply, leaving the rest of the manifest alone', () => {
    const root = project({
      name: 'consumer',
      dependencies: { [LIB]: '2.136.0', svelte: '^5.55.9' }
    });

    const summary = run([root, '--apply'], silent);
    const manifest = readFileSync(join(root, 'package.json'), 'utf8');

    expect(summary.applied).toBe(true);
    expect(manifest).toContain(`"${LIB}": "${OWN_MAJOR}"`);
    expect(manifest).toContain('"name": "consumer"');
    expect(manifest).toContain('"svelte": "^5.55.9"');
  });

  it('refuses to apply while a blocker stands, rather than producing an uninstallable tree', () => {
    const root = project({ dependencies: { [LIB]: '1.34.0', svelte: '^4.2.8' } });

    const summary = run([root, '--apply'], silent);

    expect(summary.exitCode).toBe(1);
    expect(summary.applied).toBe(false);
    expect(readFileSync(join(root, 'package.json'), 'utf8')).toContain('"1.34.0"');
  });

  it('surfaces an affected Toolbar usage with its file and line', () => {
    const root = project(
      { dependencies: { [LIB]: '2.136.0', svelte: '^5.55.9' } },
      {
        'src/Page.svelte': `<script>import { Toolbar } from '${LIB}';</script>\n<Toolbar />`
      }
    );

    const summary = run([root], silent);

    expect(summary.findings).toHaveLength(1);
    expect(summary.findings[0]?.file).toBe('src/Page.svelte');
    expect(summary.findings[0]?.line).toBe(2);
  });

  it('exits 2 on a path that is not a project', () => {
    expect(run([join(tmpdir(), 'definitely-not-a-project')], silent).exitCode).toBe(2);
  });

  it('exits 2 when no path is given', () => {
    expect(run([], silent).exitCode).toBe(2);
  });
});

describe('review findings', () => {
  it('serializes --target so a quote cannot corrupt or extend the manifest', () => {
    const root = project({
      name: 'consumer',
      dependencies: { [LIB]: '2.136.0', svelte: '^5.55.9' }
    });

    // Splicing this in raw would close the string and inject a sibling key.
    const summary = run([root, '--apply', '--target', '^3.0.0", "evil": "yes'], silent);
    const raw = readFileSync(join(root, 'package.json'), 'utf8');

    // Asserted so an uncorrupted manifest cannot be the result of the apply
    // having been refused outright, which would pass every check below.
    expect(summary.exitCode).toBe(0);
    expect(summary.applied).toBe(true);
    expect(() => JSON.parse(raw)).not.toThrow();
    const manifest = JSON.parse(raw) as { dependencies: Record<string, string> };
    expect(manifest).not.toHaveProperty('evil');
    expect(manifest.dependencies).not.toHaveProperty('evil');
    expect(manifest.dependencies[LIB]).toBe('^3.0.0", "evil": "yes');
  });

  it('blocks a svelte range that shares the major but misses the peer', () => {
    const root = project({ dependencies: { [LIB]: '2.136.0', svelte: '5.0.0' } });

    const summary = run([root, '--apply'], silent);

    expect(summary.exitCode).toBe(1);
    expect(summary.applied).toBe(false);
  });
});

// Each of these drives run() end-to-end against this repo's own real
// src/wc/components — libraryRoot() always resolves to this checkout
// regardless of where the scanned project (the temp `root` below) lives — so
// they prove the wiring, not just the underlying analyze.ts function.
describe('review findings — new reasons wired end-to-end', () => {
  it('surfaces inputbutton-mandatory through the CLI', () => {
    const root = project(
      { dependencies: { [LIB]: '2.136.0', svelte: '^5.55.9' } },
      {
        'src/Form.svelte': `<script>import { InputButton } from '${LIB}';</script>\n<InputButton mandatory />`
      }
    );

    const summary = run([root], silent);

    expect(summary.findings).toHaveLength(1);
    expect(summary.findings[0]?.reason).toBe('inputbutton-mandatory');
    expect(summary.findings[0]?.file).toBe('src/Form.svelte');
  });

  it('scans .css files for the renamed chart tooltip slot selector and counts them separately', () => {
    const root = project(
      { dependencies: { [LIB]: '2.136.0', svelte: '^5.55.9' } },
      {
        'src/app.css': '.chart-tooltip-slot { color: red; }\n'
      }
    );

    const summary = run([root], silent);

    expect(summary.cssFilesScanned).toBe(1);
    expect(summary.findings).toHaveLength(1);
    expect(summary.findings[0]?.reason).toBe('chart-tooltip-slot-selector');
    expect(summary.findings[0]?.file).toBe('src/app.css');
  });

  it('recognises a real sui-* custom element used inline via the derived wc component list', () => {
    const root = project(
      { dependencies: { [LIB]: '2.136.0', svelte: '^5.55.9' } },
      {
        'src/Page.svelte': '<p>Status: <sui-badge></sui-badge></p>'
      }
    );

    const summary = run([root], silent);

    expect(summary.findings).toHaveLength(1);
    expect(summary.findings[0]?.reason).toBe('host-display-inline');
  });

  it('flags a real chart component rendered into a narrow inline-width parent', () => {
    const root = project(
      { dependencies: { [LIB]: '2.136.0', svelte: '^5.55.9' } },
      {
        'src/Dash.svelte': `<script>import { PieChart } from '${LIB}';</script>\n<div style="width: 100px"><PieChart /></div>`
      }
    );

    const summary = run([root], silent);

    expect(summary.findings).toHaveLength(1);
    expect(summary.findings[0]?.reason).toBe('chart-min-width');
  });

  it('flags real sui-* siblings inside a plain div — the widened rule, gap A', () => {
    const root = project(
      { dependencies: { [LIB]: '2.136.0', svelte: '^5.55.9' } },
      {
        'src/Toolbar.svelte': '<div><sui-badge></sui-badge><sui-badge></sui-badge></div>'
      }
    );

    const summary = run([root], silent);

    expect(summary.findings).toHaveLength(2);
    expect(summary.findings.every((f) => f.reason === 'host-display-inline')).toBe(true);
  });

  it('flags a real sui-chat-composer[recording] selector in a .css file — gap B', () => {
    const root = project(
      { dependencies: { [LIB]: '2.136.0', svelte: '^5.55.9' } },
      {
        'src/app.css': 'sui-chat-composer[recording] { outline: 2px solid red; }\n'
      }
    );

    const summary = run([root], silent);

    expect(summary.findings).toHaveLength(1);
    expect(summary.findings[0]?.reason).toBe('chat-composer-recording-reflect');
    expect(summary.findings[0]?.file).toBe('src/app.css');
  });

  it('flags a real getAttribute("recording") read off a sui-chat-composer — gap B', () => {
    const root = project(
      { dependencies: { [LIB]: '2.136.0', svelte: '^5.55.9' } },
      {
        'src/Voice.svelte':
          "<script>document.querySelector('sui-chat-composer').getAttribute('recording');</script>"
      }
    );

    const summary = run([root], silent);

    expect(summary.findings).toHaveLength(1);
    expect(summary.findings[0]?.reason).toBe('chat-composer-recording-reflect');
    expect(summary.findings[0]?.file).toBe('src/Voice.svelte');
  });
});
