import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Toggle from './Toggle.svelte';

describe('Toggle', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fires onclick with the new checked state, and warns about nothing', async () => {
    const onclick = vi.fn();
    const { getByRole } = render(Toggle, { onclick });
    const checkbox = getByRole('checkbox');

    await fireEvent.click(checkbox);

    expect(onclick).toHaveBeenCalledTimes(1);
    expect(onclick).toHaveBeenCalledWith(true);
    expect(console.warn).not.toHaveBeenCalled();
  });

  // That the 3.x `onClick` spelling is gone is asserted for all 191 pairs at
  // once in src/legacy-spellings-removed.test.ts, by reading the declarations.
  // Passing it here would not compile, which is the type system making the
  // same point.
});
