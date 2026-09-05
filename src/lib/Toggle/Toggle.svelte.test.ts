import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { resetDeprecationWarnings } from '../deprecation';
import Toggle from './Toggle.svelte';

describe('Toggle', () => {
  beforeEach(() => {
    // Same reasoning as deprecation.test.ts: the suppression set is
    // module-level, so a case here could otherwise pass by inheriting an
    // earlier case's warning rather than earning its own.
    resetDeprecationWarnings();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns once for the deprecated onClick prop, and still fires it on every click', async () => {
    const legacy = vi.fn();
    const { getByRole } = render(Toggle, { onClick: legacy });
    const checkbox = getByRole('checkbox');

    // At mount, before any click: the alias is read eagerly, so a consumer
    // who never triggers the event is still told.
    flushSync();
    expect(console.warn).toHaveBeenCalledTimes(1);

    await fireEvent.click(checkbox);
    await fireEvent.click(checkbox);

    expect(legacy).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(vi.mocked(console.warn).mock.calls[0][0]).toContain('onclick');
  });

  it('stays silent with only the lowercase onclick prop, and still fires it on click', async () => {
    const onClick = vi.fn();
    const { getByRole } = render(Toggle, { onclick: onClick });
    const checkbox = getByRole('checkbox');

    await fireEvent.click(checkbox);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(true);
    expect(console.warn).not.toHaveBeenCalled();
  });
});
