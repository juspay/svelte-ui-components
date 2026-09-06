import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Step from './Step.svelte';
import Stepper from './Stepper.svelte';

const steps = [{ label: 'Cart' }, { label: 'Address' }, { label: 'Pay' }];

describe('Stepper', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports a step click through onhandlestepclick', async () => {
    // Stepper hands its handler to <Step> under this spelling, so Step has to
    // read the same one — a Step reading anything else silently drops every
    // click. 3.x had four names for this event; 4.0.0 has one.
    const onhandlestepclick = vi.fn();
    const { getAllByRole } = render(Stepper, { steps, currentStepIndex: 0, onhandlestepclick });

    await fireEvent.click(getAllByRole('button')[1]);

    expect(onhandlestepclick).toHaveBeenCalledTimes(1);
    expect(onhandlestepclick).toHaveBeenCalledWith({ selectedIndex: 2 });
    expect(console.warn).not.toHaveBeenCalled();
  });

  // Stepper's three other 3.x spellings are asserted gone in
  // src/legacy-spellings-removed.test.ts, which reads the declarations for all
  // 191 pairs. Passing one here would not compile.
});

describe('Step', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fires onclick with the step index', async () => {
    const onclick = vi.fn();
    const { getByRole } = render(Step, { stepIndex: 1, label: 'Cart', onclick });

    await fireEvent.click(getByRole('button'));

    expect(onclick).toHaveBeenCalledWith({ selectedIndex: 1 });
    expect(console.warn).not.toHaveBeenCalled();
  });
});
