// Playwright's dev-server port, derived per checkout rather than fixed.
//
// Both configs used a constant (43199 functional, 43200 visual) together with
// `reuseExistingServer`. That is safe with one checkout and wrong with several:
// the second run finds a server already listening, reuses it, and asserts
// against the *other* checkout's build. It fails silently in both directions —
// reporting another worktree's failures as yours, or passing on a fix that is
// not in the build that answered.
//
// That is not hypothetical. Two sessions hit it on the same day: one had a
// committed fix reported as absent, and a full-suite run here changed from 539
// to 538 passing once the port was made private.
//
// The checkout path is the thing that distinguishes the runs, so the port comes
// from a hash of it. `PW_PORT` still wins, for pinning a port deliberately.

import { createHash } from 'node:crypto';

/** Offsets, so one checkout's two configs never share a port. */
export const FUNCTIONAL = 0;
export const VISUAL = 1;

/** Only the two offsets are meaningful; anything else is a mistake. */
export type Offset = typeof FUNCTIONAL | typeof VISUAL;

// 10000-32000, stepped by two so a checkout's VISUAL port (+1) can never land on
// another checkout's FUNCTIONAL port — which would reintroduce this same bug in
// a form that is harder to see.
//
// The ceiling is set by the ephemeral range, and the two platforms disagree:
// macOS starts at 49152, but Linux's `net.ipv4.ip_local_port_range` defaults to
// **32768**, and CI runs on Linux. A range reaching into it would hand out ports
// the kernel may already have assigned to an outbound socket, and the preview
// server would fail with EADDRINUSE for reasons unrelated to any other checkout.
// So the ceiling follows the lower of the two.
//
// That costs width, and width is what keeps collisions rare — 11000 slots puts
// 34 worktrees near 5% rather than the 4% a wider range gave. Worth it, because
// the consequence of a clash is now loud: reuse is off on a derived port (see
// `reuseExistingServer`), so `--strictPort` refuses to start rather than serving
// another checkout's build. A rare loud failure beats a rarer silent one.
const BASE = 10000;
const SLOTS = 11000;

/** Exported so tests assert against these rather than restating the numbers. */
export const MIN_PORT = 1024;
export const MAX_PORT = 65535;
export const LINUX_EPHEMERAL_FLOOR = 32768;

export type PortOptions = {
  readonly path?: string;
  readonly override?: string;
  /** Defaults to whether `CI` is set. Explicit so a test can pin it. */
  readonly ci?: boolean;
};

function parseOverride(raw: string, offset: Offset): number {
  const value = Number(raw);
  const port = value + offset;
  // The bound quoted is the one actually enforced. `VISUAL` sits at +1, so the
  // highest usable override is one below MAX_PORT — stating MAX_PORT - 1
  // unconditionally would be wrong for FUNCTIONAL, and stating MAX_PORT would be
  // wrong for VISUAL.
  const highest = MAX_PORT - offset;
  if (!Number.isInteger(value) || port < MIN_PORT || port > MAX_PORT) {
    throw new Error(
      `PW_PORT must be a whole number between ${MIN_PORT} and ${highest}; got "${raw.trim()}". ` +
        `Left unset, a port is derived from this checkout's path.`
    );
  }
  return port;
}

/**
 * Whether the port was chosen deliberately rather than derived.
 *
 * This decides whether reusing an already-listening server is safe. On a
 * derived port a collision is rare but not impossible, and reusing whatever
 * happens to be listening is precisely the silent wrong-build failure this
 * module exists to remove. Declining to reuse turns that case into vite's loud
 * `--strictPort` failure instead. When someone names a port themselves they
 * know what is on it, and keep the faster loop.
 */
export function reuseExistingServer(options: PortOptions = {}): boolean {
  const ci = options.ci ?? (typeof process.env.CI === 'string' && process.env.CI !== '');
  if (ci) {
    return false;
  }
  const override = options.override ?? process.env.PW_PORT;
  return typeof override === 'string' && override.trim() !== '';
}

/**
 * @param offset `FUNCTIONAL` or `VISUAL`
 */
export function playwrightPort(offset: Offset, options: PortOptions = {}): number {
  const override = options.override ?? process.env.PW_PORT;
  // An empty `PW_PORT=` exports as '', and Number('') is 0 — which would bind an
  // arbitrary free port and make `reuseExistingServer` meaningless. Treat blank
  // as unset; treat a non-blank but unusable value as an error, because the
  // alternative is NaN surfacing much later as "the server never came up".
  if (typeof override === 'string' && override.trim() !== '') {
    return parseOverride(override, offset);
  }
  const path = options.path ?? import.meta.dirname;
  const digest = createHash('sha256').update(path).digest();
  return BASE + (digest.readUInt32BE(0) % SLOTS) * 2 + offset;
}
