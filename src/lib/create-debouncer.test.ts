import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDebouncer } from './utils';

// Only Date is faked: the debouncer measures with Date.now(), and leaving the timers real keeps
// Svelte's microtask and tick machinery out of the picture.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-03T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

const advance = (ms: number): void => {
  vi.setSystemTime(new Date(Date.now() + ms));
};

describe('createDebouncer with a fixed delay', () => {
  it('runs the first call at once and drops repeats inside the window', () => {
    const debounce = createDebouncer(700);
    const callback = vi.fn();

    debounce(callback);
    advance(100);
    debounce(callback);
    advance(599);
    debounce(callback);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('runs again once strictly more than the delay has passed', () => {
    const debounce = createDebouncer(700);
    const callback = vi.fn();

    debounce(callback);
    advance(700);
    debounce(callback);
    expect(callback).toHaveBeenCalledTimes(1);

    advance(1);
    debounce(callback);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('forwards its arguments to the callback', () => {
    const debounce = createDebouncer(10);
    const callback = vi.fn();

    debounce(callback, 'a', 2);

    expect(callback).toHaveBeenCalledWith('a', 2);
  });
});

describe('createDebouncer with a delay read on every call', () => {
  it('measures against the delay in force when the call arrives', () => {
    let delay = 700;
    const debounce = createDebouncer(() => delay);
    const callback = vi.fn();

    debounce(callback);
    advance(100);
    debounce(callback);
    expect(callback).toHaveBeenCalledTimes(1);

    delay = 20;
    debounce(callback);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('keeps when it last fired across a delay change', () => {
    let delay = 20;
    const debounce = createDebouncer(() => delay);
    const callback = vi.fn();

    debounce(callback);
    advance(100);
    debounce(callback);
    expect(callback).toHaveBeenCalledTimes(2);

    // A debouncer rebuilt for the new delay would start from no history and run this.
    delay = 5000;
    advance(100);
    debounce(callback);
    expect(callback).toHaveBeenCalledTimes(2);

    advance(5000);
    debounce(callback);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('does not read the delay until a call is made', () => {
    const delay = vi.fn(() => 700);

    createDebouncer(delay);

    expect(delay).not.toHaveBeenCalled();
  });
});
