import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCopyState } from './copyState.svelte';

/**
 * Coverage for #574: `Snippet` owned the whole copy affordance -- clipboard
 * call, `copied` flag, reset timer, unmount cleanup -- inside its own
 * component body, so a consumer who wanted "copy this value" beside arbitrary
 * content could not have it without also taking the `<code>` box and the `$`
 * prompt. The logic got hand-rolled outside the library instead, which is
 * exactly how #530's timer-safety work fails to reach the surfaces that need
 * it most.
 *
 * `createCopyResetTimer` already extracted the timer half. This covers the
 * rest, so both `Snippet` and a consumer's own button drive the same state
 * machine rather than two lookalikes that drift.
 */

const stubClipboard = (impl: () => Promise<void>) => {
  const writeText = vi.fn(impl);
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: { writeText },
    configurable: true
  });
  return writeText;
};

const resolves = () => Promise.resolve();
const rejects = () => Promise.reject(new Error('clipboard unavailable'));

describe('createCopyState (#574)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts in the not-copied state', () => {
    stubClipboard(resolves);
    expect(createCopyState().copied).toBe(false);
  });

  it('writes the requested text to the clipboard', async () => {
    const writeText = stubClipboard(resolves);
    const state = createCopyState();

    await state.copy('ssh://host');

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('ssh://host');
  });

  it('reports success and flips copied on a successful write', async () => {
    stubClipboard(resolves);
    const state = createCopyState();

    await expect(state.copy('x')).resolves.toBe(true);
    expect(state.copied).toBe(true);
  });

  it('notifies oncopy exactly once per successful copy', async () => {
    stubClipboard(resolves);
    const oncopy = vi.fn();
    const state = createCopyState({ oncopy });

    await state.copy('x');

    expect(oncopy).toHaveBeenCalledTimes(1);
  });

  it('reverts copied after the default reset delay', async () => {
    stubClipboard(resolves);
    const state = createCopyState();

    await state.copy('x');
    expect(state.copied).toBe(true);

    vi.advanceTimersByTime(1999);
    expect(state.copied).toBe(true);

    vi.advanceTimersByTime(1);
    expect(state.copied).toBe(false);
  });

  it('honours a custom reset delay', async () => {
    stubClipboard(resolves);
    const state = createCopyState({ copyResetMs: 500 });

    await state.copy('x');
    vi.advanceTimersByTime(500);

    expect(state.copied).toBe(false);
  });

  it('re-arms rather than races when copied twice in quick succession', async () => {
    stubClipboard(resolves);
    const state = createCopyState();

    await state.copy('first');
    vi.advanceTimersByTime(1000);
    await state.copy('second');

    // The first copy's original deadline passes with the flag still set: its
    // timer must have been replaced, not left running alongside the second.
    vi.advanceTimersByTime(1000);
    expect(state.copied).toBe(true);

    vi.advanceTimersByTime(1000);
    expect(state.copied).toBe(false);
  });

  it('reports failure and stays not-copied when the clipboard rejects', async () => {
    // Non-secure contexts and sandboxed iframes reject rather than resolve.
    // Showing "Copied!" when nothing reached the clipboard is the one outcome
    // worse than showing nothing.
    stubClipboard(rejects);
    const oncopy = vi.fn();
    const state = createCopyState({ oncopy });

    await expect(state.copy('x')).resolves.toBe(false);
    expect(state.copied).toBe(false);
    expect(oncopy).not.toHaveBeenCalled();
  });

  it('does not throw when the clipboard API is missing entirely', async () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: null,
      configurable: true
    });
    const state = createCopyState();

    await expect(state.copy('x')).resolves.toBe(false);
    expect(state.copied).toBe(false);
  });

  it('destroy() cancels a pending reset so it never fires -- the unmount path', async () => {
    stubClipboard(resolves);
    const state = createCopyState();

    await state.copy('x');
    state.destroy();

    // The flag staying set is the proof: had the reset timer survived
    // teardown it would have fired within this window and cleared it.
    vi.advanceTimersByTime(5000);
    expect(state.copied).toBe(true);
  });

  it('ignores a clipboard completion after destroy', async () => {
    const completion = Promise.withResolvers<void>();
    stubClipboard(() => completion.promise);
    const oncopy = vi.fn();
    const state = createCopyState({ oncopy });
    const copying = state.copy('late');
    state.destroy();
    completion.resolve();
    await expect(copying).resolves.toBe(false);
    expect(state.copied).toBe(false);
    expect(oncopy).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not write again after destroy', async () => {
    const writeText = stubClipboard(resolves);
    const state = createCopyState();
    state.destroy();
    await expect(state.copy('later')).resolves.toBe(false);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('resets successful feedback even when oncopy throws', async () => {
    stubClipboard(resolves);
    const state = createCopyState({
      oncopy: () => {
        throw new Error('consumer callback');
      }
    });
    await expect(state.copy('copied')).resolves.toBe(true);
    vi.advanceTimersByTime(2000);
    expect(state.copied).toBe(false);
  });

  it('reads changed delay and callback getters for each successful write', async () => {
    stubClipboard(resolves);
    let delay = 500;
    const first = vi.fn();
    const second = vi.fn();
    let callback = first;
    const state = createCopyState({
      get copyResetMs() {
        return delay;
      },
      get oncopy() {
        return callback;
      }
    });
    await state.copy('first');
    delay = 1000;
    callback = second;
    await state.copy('second');
    vi.advanceTimersByTime(500);
    expect(state.copied).toBe(true);
    vi.advanceTimersByTime(500);
    expect(state.copied).toBe(false);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('restarts feedback for overlapping writes in completion order', async () => {
    const first = Promise.withResolvers<void>();
    const second = Promise.withResolvers<void>();
    stubClipboard(vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise));
    const oncopy = vi.fn();
    const state = createCopyState({ copyResetMs: 1000, oncopy });
    const a = state.copy('first');
    const b = state.copy('second');
    second.resolve();
    await expect(b).resolves.toBe(true);
    vi.advanceTimersByTime(500);
    first.resolve();
    await expect(a).resolves.toBe(true);
    vi.advanceTimersByTime(500);
    expect(state.copied).toBe(true);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(500);
    expect(state.copied).toBe(false);
    expect(oncopy).toHaveBeenCalledTimes(2);
  });

  it('a failed repeat write does not erase prior successful feedback', async () => {
    stubClipboard(vi.fn().mockImplementationOnce(resolves).mockImplementationOnce(rejects));
    const state = createCopyState({ copyResetMs: 500 });
    await state.copy('first');
    await expect(state.copy('second')).resolves.toBe(false);
    expect(state.copied).toBe(true);
    vi.advanceTimersByTime(500);
    expect(state.copied).toBe(false);
  });

  it('can be created and destroyed without browser globals', async () => {
    vi.stubGlobal('navigator', null);
    try {
      const state = createCopyState();
      expect(state.copied).toBe(false);
      await expect(state.copy('server')).resolves.toBe(false);
      state.destroy();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it.each([
    ['an empty string', ''],
    ['whitespace', '   '],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['a negative delay', -1],
    ['null', null]
  ])('falls back to the default delay for %s', async (_label, value) => {
    // A plain-JS or web-component caller is not bound by the `number` type.
    // NaN reaches setTimeout as "fire immediately", so the feedback would
    // vanish before it was ever seen.
    stubClipboard(resolves);
    const options = {};
    Reflect.set(options, 'copyResetMs', value);
    const state = createCopyState(options);

    await state.copy('x');
    vi.advanceTimersByTime(1999);
    expect(state.copied).toBe(true);
    vi.advanceTimersByTime(1);
    expect(state.copied).toBe(false);
  });

  it('still clears feedback when the copyResetMs getter throws', async () => {
    stubClipboard(resolves);
    const state = createCopyState({
      get copyResetMs(): number {
        throw new Error('reactive read failed');
      }
    });

    await expect(state.copy('x')).resolves.toBe(true);
    // Without a guard the throw escapes before the timer is armed, leaving
    // `copied` stuck true for the life of the component.
    expect(state.copied).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(state.copied).toBe(false);
  });

  it('destroy() is safe when nothing is pending', () => {
    stubClipboard(resolves);
    expect(() => createCopyState().destroy()).not.toThrow();
  });
});
