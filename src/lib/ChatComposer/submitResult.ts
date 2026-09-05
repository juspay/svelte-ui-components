/**
 * #526: `onsubmit` may now return `boolean | Promise<boolean>` instead of only
 * `void`, so a caller can keep the composer's text (and attachments) around
 * when a send fails rather than losing the draft to the unconditional clear.
 *
 * The rule is deliberately narrow: only an explicit `false` — synchronous or
 * resolved — skips the clear. Every other synchronous or resolved outcome,
 * `void` (today's `void`-returning handlers) included, clears exactly as
 * before, keeping the default byte-for-byte: a handler written against the
 * pre-#526 `(value, attachments) => void` shape returns nothing and never
 * opts in to anything, so it keeps clearing on every submit, same as always.
 * A rejected promise is the one outcome this module never sees — the caller
 * (`ChatComposer.svelte`) catches it before either function here runs, and
 * treats it the same as a resolved `false`: the draft is kept, not cleared.
 */
export type ChatComposerSubmitResult = boolean | void;

export function shouldClearAfterSubmit(result: ChatComposerSubmitResult): boolean {
  return result !== false;
}

export type ChatComposerDraft = {
  value: string;
  attachments: readonly File[];
};

/**
 * Whether the composer should actually apply the clear once an (async)
 * `onsubmit` settles. Two things have to hold, not just `shouldClearAfterSubmit`:
 * the value and the attachments the user is looking at right now must still be
 * the exact ones that were sent. Between `submit()` firing and a `Promise`
 * resolving, the user is free to keep typing — the composer never disables
 * itself just because a submit is in flight — so a clear that only checked the
 * resolved boolean would wipe out whatever they typed in that window. Compared
 * by reference for attachments: every mutation (`handleFiles`, `removeAttachment`)
 * reassigns the array, so an unchanged reference means nothing happened while the
 * promise was pending.
 */
export function shouldApplyClear(
  result: ChatComposerSubmitResult,
  submitted: ChatComposerDraft,
  current: ChatComposerDraft
): boolean {
  return (
    shouldClearAfterSubmit(result) &&
    current.value === submitted.value &&
    current.attachments === submitted.attachments
  );
}
