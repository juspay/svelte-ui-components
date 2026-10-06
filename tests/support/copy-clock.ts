import type { Page } from '@playwright/test';

declare global {
  interface Window {
    __copyResetClock?: { advance: (milliseconds: number) => void };
  }
}

/** Control the demo's two copy-reset timeout delays; clipboard and native RAF stay real. */
export const installCopyResetClock = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const nativeSetTimeout = window.setTimeout.bind(window);
    const nativeClearTimeout = window.clearTimeout.bind(window);
    const pending = new Map<number, { due: number; callback: () => void }>();
    let time = 0;
    let handle = -1;
    Object.assign(window, {
      setTimeout: (callback: TimerHandler, delay?: number, ...args: unknown[]): number => {
        if (typeof callback === 'function' && (delay === 300 || delay === 2000)) {
          const id = handle--;
          pending.set(id, { due: time + delay, callback: () => callback(...args) });
          return id;
        }
        return nativeSetTimeout(callback, delay, ...args);
      },
      clearTimeout: (id?: number): void => {
        if (typeof id === 'number' && pending.delete(id)) {
          return;
        }
        nativeClearTimeout(id);
      }
    });
    window.__copyResetClock = {
      advance(milliseconds) {
        time += milliseconds;
        for (const [id, timer] of [...pending]) {
          if (timer.due <= time) {
            pending.delete(id);
            timer.callback();
          }
        }
      }
    };
  });
};

export const advanceCopyResetClock = async (page: Page, milliseconds: number): Promise<void> => {
  await page.evaluate((amount) => {
    if (!window.__copyResetClock) {
      throw new Error('copy reset clock was not installed');
    }
    window.__copyResetClock.advance(amount);
  }, milliseconds);
};
