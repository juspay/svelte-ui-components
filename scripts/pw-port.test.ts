import { describe, expect, it } from 'vitest';
import {
  FUNCTIONAL,
  LINUX_EPHEMERAL_FLOOR,
  MAX_PORT,
  MIN_PORT,
  VISUAL,
  playwrightPort,
  reuseExistingServer,
  type Offset
} from './pw-port.js';

const A = '/Users/someone/Developer/temp/feat/4-0-0-legacy-removal';
const B = '/Users/someone/Developer/temp/fix/close-audit-gaps';

// Every derivation test pins `override` rather than letting it fall through to
// `process.env.PW_PORT`. Left implicit, these assertions depend on whether the
// developer happens to have PW_PORT exported: verified by running the suite with
// `PW_PORT=45000`, which failed 5 of 13. Nothing here mutates the environment,
// so the tests are also safe to run in parallel.
const derived = (offset: Offset, path: string) => playwrightPort(offset, { path, override: '' });

describe('a port derived from the checkout', () => {
  it('gives two checkouts different ports', () => {
    // The whole point. A fixed port plus `reuseExistingServer` means the second
    // checkout's run silently reuses the first's server and asserts against the
    // wrong build -- reporting another worktree's failures, or passes that were
    // never earned.
    expect(derived(FUNCTIONAL, A)).not.toBe(derived(FUNCTIONAL, B));
  });

  it('is stable for the same checkout across calls', () => {
    expect(derived(FUNCTIONAL, A)).toBe(derived(FUNCTIONAL, A));
  });

  it('never lets one checkout’s visual run collide with another’s functional run', () => {
    // Visual sits at +1, so ports are allocated two apart. Without that, one
    // checkout's visual port could land on another's functional port and
    // reintroduce exactly the bug this fixes, only harder to see.
    const ports = [A, B, '/tmp/x', '/tmp/y', '/a/b/c'].flatMap((path) => [
      derived(FUNCTIONAL, path),
      derived(VISUAL, path)
    ]);
    expect(new Set(ports).size).toBe(ports.length);
  });

  it('keeps the two configs of one checkout adjacent but distinct', () => {
    expect(derived(VISUAL, A)).toBe(derived(FUNCTIONAL, A) + 1);
  });

  it('stays unprivileged and below the LOWER of the two ephemeral floors', () => {
    // macOS starts its ephemeral range at 49152, Linux at 32768, and CI runs on
    // Linux. Deriving above the lower floor risks handing out a port the kernel
    // has already given to an outbound socket, which surfaces as EADDRINUSE that
    // has nothing to do with another checkout.
    for (const path of [A, B, '/tmp/x', '/tmp/y', '/a/b/c', '/']) {
      for (const offset of [FUNCTIONAL, VISUAL] as const) {
        const port = derived(offset, path);
        expect(port).toBeGreaterThanOrEqual(MIN_PORT);
        expect(port).toBeLessThan(LINUX_EPHEMERAL_FLOOR);
      }
    }
  });
});

describe('an explicit PW_PORT', () => {
  it('wins over the derived port, keeping the visual offset', () => {
    expect(playwrightPort(FUNCTIONAL, { path: A, override: '43199' })).toBe(43199);
    expect(playwrightPort(VISUAL, { path: A, override: '43199' })).toBe(43200);
  });

  it('is ignored when blank, rather than becoming port 0', () => {
    // `PW_PORT=` in a shell exports an empty string. Number('') is 0, which
    // would bind a random port and make `reuseExistingServer` meaningless.
    expect(playwrightPort(FUNCTIONAL, { path: A, override: '   ' })).toBe(derived(FUNCTIONAL, A));
  });

  it('rejects a value that is not a usable port, naming it', () => {
    // Without this, `PW_PORT=foo` becomes NaN and surfaces much later as an
    // opaque Playwright error about the server never coming up.
    for (const bad of ['foo', '1.5', '-1', '0', '80', '99999', 'Infinity', `${MAX_PORT + 1}`]) {
      expect(() => playwrightPort(FUNCTIONAL, { path: A, override: bad })).toThrowError(/PW_PORT/);
    }
  });

  it('accepts the usable range at both ends, and says so accurately', () => {
    expect(playwrightPort(FUNCTIONAL, { path: A, override: `${MIN_PORT}` })).toBe(MIN_PORT);
    expect(playwrightPort(FUNCTIONAL, { path: A, override: `${MAX_PORT}` })).toBe(MAX_PORT);
    // VISUAL sits at +1, so its highest usable override is one lower — and the
    // message has to quote the bound it actually enforces for that offset.
    expect(playwrightPort(VISUAL, { path: A, override: `${MAX_PORT - 1}` })).toBe(MAX_PORT);
    expect(() => playwrightPort(VISUAL, { path: A, override: `${MAX_PORT}` })).toThrowError(
      new RegExp(`between ${MIN_PORT} and ${MAX_PORT - 1}`)
    );
  });
});

describe('the collision surface', () => {
  // Hashing cannot promise uniqueness, so the honest claim is about scale: at
  // 950 slots the 34 worktrees on this machine collided ~45% of the time, which
  // is a coin flip on whether the fix works at all.
  it('separates every worktree at a realistic scale', () => {
    const paths = Array.from({ length: 40 }, (_, i) => `/Users/x/Developer/temp/feat/branch-${i}`);
    const ports = paths.flatMap((path) => [derived(FUNCTIONAL, path), derived(VISUAL, path)]);
    expect(new Set(ports).size).toBe(ports.length);
  });

  it('declines to reuse a server on a derived port, so a clash is loud', () => {
    // The residual risk is only dangerous while reuse is on: that is what turns
    // a clash into "asserted against the wrong build" rather than vite's
    // --strictPort refusing to start. `ci` is pinned for the same reason
    // `override` is — left implicit this passed locally and failed in CI.
    expect(reuseExistingServer({ override: '', ci: false })).toBe(false);
    expect(reuseExistingServer({ override: '44001', ci: false })).toBe(true);
  });

  it('never reuses in CI, whatever the port', () => {
    expect(reuseExistingServer({ override: '44001', ci: true })).toBe(false);
    expect(reuseExistingServer({ override: '', ci: true })).toBe(false);
  });
});
