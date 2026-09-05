import { describe, it, expect } from 'vitest';
import { shouldApplyClear, shouldClearAfterSubmit } from './submitResult';
import type { ChatComposerDraft } from './submitResult';

// A `void` value without ever writing the literal `undefined` — this repo's
// eslint config bans the token entirely (`no-restricted-syntax`), and this is
// exactly the value a `() => void` handler like today's `onsubmit` produces.
const voidResult = (() => {})();

describe('shouldClearAfterSubmit', () => {
  it('clears on void — the default void-returning handler (backward compat)', () => {
    expect(shouldClearAfterSubmit(voidResult)).toBe(true);
  });

  it('clears on an explicit true', () => {
    expect(shouldClearAfterSubmit(true)).toBe(true);
  });

  it('does NOT clear on an explicit false — the #526 opt-out', () => {
    expect(shouldClearAfterSubmit(false)).toBe(false);
  });
});

describe('shouldApplyClear', () => {
  const files: File[] = [];
  const submitted: ChatComposerDraft = { value: 'hello', attachments: files };

  it('clears when the result allows it and nothing changed while it settled', () => {
    const current: ChatComposerDraft = { value: 'hello', attachments: files };
    expect(shouldApplyClear(voidResult, submitted, current)).toBe(true);
    expect(shouldApplyClear(true, submitted, current)).toBe(true);
  });

  it('never clears on an explicit false, even with nothing changed', () => {
    const current: ChatComposerDraft = { value: 'hello', attachments: files };
    expect(shouldApplyClear(false, submitted, current)).toBe(false);
  });

  it('does not clear if the user kept typing while an async onsubmit was pending', () => {
    const current: ChatComposerDraft = { value: 'hello, world', attachments: files };
    expect(shouldApplyClear(true, submitted, current)).toBe(false);
  });

  it('does not clear if attachments changed while an async onsubmit was pending', () => {
    const current: ChatComposerDraft = { value: 'hello', attachments: [new File([], 'x.png')] };
    expect(shouldApplyClear(true, submitted, current)).toBe(false);
  });
});
