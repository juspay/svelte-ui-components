import { fireEvent, render } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDeprecationWarnings } from '../deprecation';
import Step from './Step.svelte';
import Stepper from './Stepper.svelte';

const steps = [{ label: 'Cart' }, { label: 'Address' }, { label: 'Pay' }];

describe('Stepper', () => {
  beforeEach(() => {
    resetDeprecationWarnings();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports a step click through onhandlestepclick', async () => {
    // Stepper hands its resolved handler to <Step> under the corrected
    // spelling, so Step has to read that spelling — a Step that only reads
    // the legacy `onclick` silently drops every click.
    const onhandlestepclick = vi.fn();
    const { getAllByRole } = render(Stepper, { steps, currentStepIndex: 0, onhandlestepclick });

    await fireEvent.click(getAllByRole('button')[1]);

    expect(onhandlestepclick).toHaveBeenCalledTimes(1);
    expect(onhandlestepclick).toHaveBeenCalledWith({ selectedIndex: 2 });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('still reports a step click through the deprecated onStepClick, with one warning', async () => {
    const onStepClick = vi.fn();
    const { getAllByRole } = render(Stepper, { steps, currentStepIndex: 0, onStepClick });

    await fireEvent.click(getAllByRole('button')[2]);

    expect(onStepClick).toHaveBeenCalledWith({ selectedIndex: 3 });
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(vi.mocked(console.warn).mock.calls[0][0]).toContain('onhandlestepclick');
  });
});

describe('Step', () => {
  beforeEach(() => {
    resetDeprecationWarnings();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fires the lowercase onclick silently', async () => {
    const onClick = vi.fn();
    const { getByRole } = render(Step, { stepIndex: 1, label: 'Cart', onclick: onClick });

    await fireEvent.click(getByRole('button'));

    expect(onClick).toHaveBeenCalledWith({ selectedIndex: 1 });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('fires the deprecated onClick and warns once, at mount', async () => {
    const onclick = vi.fn();
    const { getByRole } = render(Step, { stepIndex: 1, label: 'Cart', onClick: onclick });

    flushSync();
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(vi.mocked(console.warn).mock.calls[0][0]).toContain('onclick');

    await fireEvent.click(getByRole('button'));

    expect(onclick).toHaveBeenCalledWith({ selectedIndex: 1 });
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});
