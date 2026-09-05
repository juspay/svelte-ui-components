import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCopyResetTimer } from './copyResetTimer';

// Covers the timer-safety half of #530: before this module existed, Snippet's
// copy-feedback reset was a bare `setTimeout` that nothing ever cleared. A
// fast double copy left two timers racing over `copied`, and unmounting
// mid-flash left a timer armed against a destroyed component. Every case
// here fails on the pre-#530 shape (the module, and this API, did not exist)
// and passes once `createCopyResetTimer` provides it.
describe('Snippet copy-reset timer (#530)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires onReset after the given delay, not before', () => {
    const timer = createCopyResetTimer();
    const onReset = vi.fn();

    timer.arm(onReset, 2000);

    vi.advanceTimersByTime(1999);
    expect(onReset).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('re-arming before the delay elapses replaces the pending timer instead of racing it', () => {
    const timer = createCopyResetTimer();
    const onReset = vi.fn();

    timer.arm(onReset, 2000);
    vi.advanceTimersByTime(1000);
    // A second copy, before the first flash reverted.
    timer.arm(onReset, 2000);

    // The first timer's original deadline (2000ms from the first arm) passes
    // with no call: it must have been cleared, not left running alongside
    // the second one.
    vi.advanceTimersByTime(1000);
    expect(onReset).not.toHaveBeenCalled();

    // The second timer's own full delay then fires exactly once.
    vi.advanceTimersByTime(999);
    expect(onReset).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('cancel() clears a pending timer so it never fires -- the unmount path', () => {
    const timer = createCopyResetTimer();
    const onReset = vi.fn();

    timer.arm(onReset, 2000);
    timer.cancel();

    vi.advanceTimersByTime(5000);
    expect(onReset).not.toHaveBeenCalled();
  });

  it('cancel() is a no-op when nothing is pending', () => {
    const timer = createCopyResetTimer();

    expect(() => timer.cancel()).not.toThrow();
  });
});
