import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildLegacyPalette, DEFAULT_BASE } from '../migrate/legacy-palette.ts';

/**
 * `scripts/codemod/assets/legacy-palette.css` is committed rather than
 * generated during the build, because generating it needs repository history
 * and a build must not: CI checks out shallow and tagless, and a source
 * tarball has no history at all. Deriving it at build time took down `build`,
 * `checks` and `visual` together on one unresolvable ref.
 *
 * Committing a derived artifact trades that failure for a quieter one: the
 * asset can fall out of step with `src/lib` and nothing would say so. This
 * test is what closes that, by re-deriving it and comparing.
 *
 * It SKIPS when the base tag is not reachable, which is the honest answer in a
 * shallow checkout — but note what a skip does and does not mean. It means
 * "not checked here", not "checked and fine". A green run in an environment
 * that skipped this has said nothing about drift, which is why the skip is
 * loud in the test name rather than silent.
 */
function repoRoot(): string {
  // Not `new URL('../..', import.meta.url)`: Vite special-cases that literal
  // form as an asset reference and rewrites it at transform time, which under
  // vitest resolves to an unrelated http:// URL.
  return resolve(fileURLToPath(import.meta.url), '..', '..', '..');
}

function baseIsReachable(): boolean {
  try {
    execFileSync('git', ['rev-parse', '--verify', `${DEFAULT_BASE}^{commit}`], {
      cwd: repoRoot(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return true;
  } catch {
    return false;
  }
}

const reachable = baseIsReachable();

describe('the committed legacy-palette asset', () => {
  it.skipIf(!reachable)(
    `still matches what regenerating from ${DEFAULT_BASE} produces`,
    () => {
      const root = repoRoot();
      const committed = readFileSync(
        join(root, 'scripts/codemod/assets/legacy-palette.css'),
        'utf8'
      );

      expect(buildLegacyPalette(root, DEFAULT_BASE)).toBe(committed);
    },
    120_000
  );

  it('is non-empty and pins real properties, whether or not the base is reachable', () => {
    // Runs unconditionally, because the failure this guards against — an empty
    // or truncated asset shipping to every consumer — is exactly the shape a
    // skipped drift check would hide. An empty stylesheet is indistinguishable
    // from "nothing changed" unless something asserts otherwise.
    const committed = readFileSync(
      join(repoRoot(), 'scripts/codemod/assets/legacy-palette.css'),
      'utf8'
    );
    const pins = committed.match(/^:root \{/gm) ?? [];

    expect(pins.length).toBeGreaterThan(20);
    expect(committed).toContain('--loader-text-color');
  });
});
