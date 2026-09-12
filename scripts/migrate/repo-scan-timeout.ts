/**
 * Timeout for the tests that scan the whole repository.
 *
 * Each of them parses every component, doc or wrapper in the tree to assert
 * the repo has nothing left for its generator to rewrite. That work scales
 * with the size of the repo and with how busy the machine is: 1.0s to 3.0s
 * per test on an idle one, which leaves the slowest under 2x headroom against
 * vitest's 5000ms default. A loaded machine closes that gap --
 * `rename-internal-usages` was observed failing at 5538ms against a 2140ms
 * idle baseline, reported as `Test timed out in 5000ms`, which reads as a
 * code failure and is not one.
 *
 * A timeout on these is a hang detector, not a performance budget: they have
 * no timing behaviour to assert, so the bound only needs to be far enough out
 * that a real hang still fails the run rather than stalling it. Raising
 * vitest's global `testTimeout` instead would buy the same headroom for these
 * five at the cost of weakening it for the ~1000 tests that genuinely should
 * finish in milliseconds.
 */
export const REPO_SCAN_TIMEOUT_MS = 60_000;
