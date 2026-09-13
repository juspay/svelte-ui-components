import { createCopyResetTimer } from './copyResetTimer';

/**
 * The copy-and-flash affordance behind `Snippet`, without its presentation.
 *
 * `Snippet` couples two separable things: this state machine — clipboard
 * write, `copied` flag, reset timer, teardown — and a `<code>` box with a
 * `$`-style prompt. A consumer who wants "copy this value" beside arbitrary
 * content (a hostname in a settings row, a token, a URL) could take only the
 * pair, so the affordance got hand-rolled outside the library instead. That
 * is how the timer safety added in #530 failed to reach the surfaces most
 * likely to need it: a duplicate has its own bare `setTimeout` and its own
 * bugs.
 *
 * Extracted as a headless factory rather than a Svelte action because the
 * caller has to *render* from `copied` — swapping a label for an icon — and
 * an action can attach behaviour to an element but cannot hand state back to
 * the template. The split follows `Tooltip/tooltip-action.ts`, which likewise
 * keeps timing logic outside the component that uses it.
 *
 * Options are read at copy time, not captured at creation, so a caller with
 * reactive values can pass getters:
 *
 * ```ts
 * const state = createCopyState({
 *   get copyResetMs() { return copyResetMs; },
 *   get oncopy() { return oncopy; }
 * });
 * ```
 */
export type CopyStateOptions = {
  /** Milliseconds before `copied` reverts. Defaults to `2000`. */
  copyResetMs?: number;
  /** Called once per successful copy. Never called when the write fails. */
  oncopy?: () => void;
  /**
   * Called instead of `oncopy` when a write cannot complete -- a rejection
   * (denied permission, a non-secure context) or a Clipboard API that is
   * absent entirely (SSR, a sandboxed iframe). Receives the rejection
   * reason, or an `Error` when the API itself is missing.
   *
   * Without it the caller sees only `copy()` resolving `false` and cannot
   * distinguish "refused" from "no clipboard here", which is the difference
   * between a message worth showing the user and one worth suppressing.
   */
  onerror?: (reason: unknown) => void;
};

export type CopyState = {
  /** True from a successful copy until the reset delay elapses. */
  readonly copied: boolean;
  /**
   * Writes `text` to the clipboard. Resolves `true` on success, `false` if
   * the clipboard was unavailable or refused — it never rejects, so a caller
   * needs no try/catch of its own. A `false` outcome is also reported to
   * `onerror` with the reason.
   */
  copy: (text: string) => Promise<boolean>;
  /** Cancels any pending reset. Call from the owner's teardown. */
  destroy: () => void;
};

const DEFAULT_COPY_RESET_MS = 2000;

/**
 * The type says `number`, but a plain-JS or web-component caller can pass
 * anything, and a getter can throw. Either would reach `setTimeout` as `NaN`
 * — which fires immediately, so the feedback never appears — or leave the
 * flag stuck on with no timer at all. An unusable delay must degrade to the
 * default rather than break the affordance it controls.
 */
function resolveResetDelay(options: CopyStateOptions): number {
  let requested: unknown;
  try {
    requested = options.copyResetMs;
  } catch {
    return DEFAULT_COPY_RESET_MS;
  }
  if (typeof requested !== 'number' || !Number.isFinite(requested) || requested < 0) {
    return DEFAULT_COPY_RESET_MS;
  }
  return requested;
}

/**
 * `onerror` is a consumer callback like `oncopy`, so it gets the same
 * containment: a throwing reporter must not turn a handled failure into an
 * unhandled rejection out of `copy()`, which is the one thing this factory
 * promises never to do.
 */
function report(options: CopyStateOptions, reason: unknown): void {
  try {
    options.onerror?.(reason);
  } catch {
    /* A failed notification cannot make the clipboard write any less failed. */
  }
}

export function createCopyState(options: CopyStateOptions = {}): CopyState {
  let copied = $state(false);
  let destroyed = false;
  const resetTimer = createCopyResetTimer();

  return {
    get copied() {
      return copied;
    },

    async copy(text: string): Promise<boolean> {
      if (destroyed) {
        return false;
      }
      // Checked before the call rather than relying on the catch below: with
      // no `navigator.clipboard` at all, `writeText` is a property access on
      // undefined, and the resulting TypeError says nothing a caller could
      // act on. An explicit reason distinguishes "this context has no
      // clipboard" from "the user refused". `navigator` is tested for null
      // separately from `undefined`: a stubbed-out global is routinely the
      // former, and `!navigator.clipboard` would throw on it.
      if (typeof navigator === 'undefined' || navigator === null || !navigator.clipboard) {
        report(options, new Error('Clipboard API is unavailable in this context.'));
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
      } catch (reason) {
        /* Clipboard unavailable: non-secure context, sandboxed iframe, or a
           permission refusal. Reporting success here — and flashing "Copied!"
           over a clipboard that never received the text — is the one outcome
           worse than showing no feedback at all. */
        report(options, reason);
        return false;
      }

      // The clipboard promise can settle after its owner has unmounted.
      if (destroyed) {
        return false;
      }
      // Resolved before the flag is set, so a throwing getter cannot leave
      // `copied` true with nothing armed to clear it.
      const delay = resolveResetDelay(options);
      copied = true;
      resetTimer.arm(() => {
        copied = false;
      }, delay);
      try {
        options.oncopy?.();
      } catch {
        // A notification callback cannot undo the successful clipboard write.
      }
      return true;
    },

    destroy() {
      destroyed = true;
      resetTimer.cancel();
    }
  };
}
