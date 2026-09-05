/**
 * Manages the single "revert the copied-feedback flag" timer behind Snippet's
 * copy button (#530). Extracted as a plain, Svelte-free module so the timer
 * safety this fixes -- never leaving two timers racing after a fast double
 * copy, never firing against a component that has already unmounted -- is
 * unit-testable on its own, the same way `Tooltip/tooltip-action.ts` keeps
 * its DOM-timing logic outside the component.
 */
export type CopyResetTimer = {
  /**
   * (Re)arms the timer: clears any timer already pending, then schedules
   * `onReset` to run after `delayMs`.
   */
  arm: (onReset: () => void, delayMs: number) => void;
  /**
   * Cancels a pending timer, if any. Safe to call when nothing is pending --
   * this is what Snippet calls from `onDestroy`.
   */
  cancel: () => void;
};

export function createCopyResetTimer(): CopyResetTimer {
  let handle: ReturnType<typeof setTimeout> | null = null;

  return {
    arm(onReset, delayMs) {
      if (handle !== null) {
        clearTimeout(handle);
      }
      handle = setTimeout(() => {
        handle = null;
        onReset();
      }, delayMs);
    },
    cancel() {
      if (handle !== null) {
        clearTimeout(handle);
        handle = null;
      }
    }
  };
}
