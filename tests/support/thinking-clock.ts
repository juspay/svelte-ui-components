import type { Page } from '@playwright/test';

/**
 * A narrow, deterministic clock for the ThinkingIndicator elapsed counter.
 *
 * Why this and not `page.clock.install()`: that replaces `requestAnimationFrame`
 * along with every timer. A frozen frame loop is what stalled screenshot capture
 * in the audit, and it also stops the very CSS shimmer a visual or contrast check
 * wants to see running natively. This helper takes over ONLY the one-second
 * `setInterval` callbacks that drive the counter, so:
 *
 *   - native `requestAnimationFrame`, CSS animations and transitions keep running;
 *   - `setTimeout` is untouched (unless a caller opts into holding the long ones);
 *   - the counter text stays real DOM text that the real component rendered, so
 *     the layout under test is the production layout rather than a mock of it.
 *
 * It is a controller for the component's own contract (`setInterval(…, 1000)`),
 * so a change to that cadence is a test failure here rather than a silent drift.
 * Every 1000 ms interval on the page is controlled, not just the component's.
 */
export type ThinkingClock = {
  /** Runs every controlled one-second callback once per step, as if `count` seconds passed. */
  tick: (count?: number) => void;
  /** How many one-second intervals are currently registered (0 when nothing is ticking). */
  pending: () => number;
  /** Fires, in due order, every long timeout held by `holdTimeoutsMs`, then returns how many ran. */
  release: () => number;
};

declare global {
  interface Window {
    __thinkingClock?: ThinkingClock;
  }
}

export type TimerGateOptions = {
  /**
   * Also hold every `setTimeout` whose delay is at least this many milliseconds until
   * `release()` is called. Lets a page that settles on its own timers (a demo turn that
   * flips `busy` after 1.9 s) stay in its busy phase for as long as a measurement needs.
   * Shorter timeouts, animation frames and CSS animation are never held.
   */
  readonly holdTimeoutsMs?: number;
};

/** Must run before navigation: it replaces the timer functions the page captures at load. */
export const installThinkingClock = async (
  page: Page,
  options: TimerGateOptions = {}
): Promise<void> => {
  await page.addInitScript((holdTimeoutsMs: number | null) => {
    type Held = { callback: () => void; delay: number; kind: 'interval' | 'timeout' };
    const nativeSetTimeout = window.setTimeout.bind(window);
    const nativeClearTimeout = window.clearTimeout.bind(window);
    const nativeSetInterval = window.setInterval.bind(window);
    const nativeClearInterval = window.clearInterval.bind(window);
    const held = new Map<number, Held>();
    let nextHandle = -1;

    // Object.assign rather than direct assignment: `window.setInterval` is typed as an
    // overload set (DOM + Node), which no single arrow function is assignable to without
    // an assertion, and this repo bans assertions outside *.spec.ts / *.test.ts.
    Object.assign(window, {
      setInterval: (handler: TimerHandler, delay?: number, ...args: unknown[]): number => {
        if (delay === 1000 && typeof handler === 'function') {
          const handle = nextHandle--;
          held.set(handle, { callback: () => handler(...args), delay: 1000, kind: 'interval' });
          return handle;
        }
        return nativeSetInterval(handler, delay, ...args);
      },
      clearInterval: (handle?: number): void => {
        if (typeof handle === 'number' && held.has(handle)) {
          held.delete(handle);
          return;
        }
        nativeClearInterval(handle);
      }
    });

    if (holdTimeoutsMs !== null) {
      Object.assign(window, {
        setTimeout: (handler: TimerHandler, delay?: number, ...args: unknown[]): number => {
          if (
            typeof handler === 'function' &&
            typeof delay === 'number' &&
            delay >= holdTimeoutsMs
          ) {
            const handle = nextHandle--;
            held.set(handle, { callback: () => handler(...args), delay, kind: 'timeout' });
            return handle;
          }
          return nativeSetTimeout(handler, delay, ...args);
        },
        clearTimeout: (handle?: number): void => {
          if (typeof handle === 'number' && held.has(handle)) {
            held.delete(handle);
            return;
          }
          nativeClearTimeout(handle);
        }
      });
    }

    const clock: ThinkingClock = {
      tick(count = 1) {
        for (let step = 0; step < count; step += 1) {
          for (const entry of [...held.values()]) {
            if (entry.kind === 'interval') {
              entry.callback();
            }
          }
        }
      },
      pending() {
        return [...held.values()].filter((entry) => entry.kind === 'interval').length;
      },
      release() {
        const due = [...held.entries()]
          .filter(([, entry]) => entry.kind === 'timeout')
          .sort((a, b) => a[1].delay - b[1].delay);
        for (const [handle, entry] of due) {
          held.delete(handle);
          entry.callback();
        }
        return due.length;
      }
    };
    window.__thinkingClock = clock;
  }, options.holdTimeoutsMs ?? null);
};

/** Advances the controlled clock by `seconds` whole seconds. */
export const tickThinkingClock = async (page: Page, seconds = 1): Promise<void> => {
  await page.evaluate((count) => window.__thinkingClock?.tick(count), seconds);
};

/** Fires every held long timeout (see `holdTimeoutsMs`); resolves to how many ran. */
export const releaseHeldTimeouts = async (page: Page): Promise<number> => {
  return page.evaluate(() => window.__thinkingClock?.release() ?? 0);
};
