import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Icon from './Icon.svelte';

describe('Icon interactivity', () => {
  it.each(['Enter', ' '])('activates on %s when it has a click handler', async (key) => {
    const onclick = vi.fn();
    const { getByRole } = render(Icon, { text: 'Settings', onclick });

    await fireEvent.keyDown(getByRole('button'), { key });

    expect(onclick).toHaveBeenCalledTimes(1);
  });

  // A decorative icon that does nothing should not claim to be a button, nor sit in
  // the tab order as a focusable no-op.
  it('stays a plain element when no click handler is given', () => {
    const { queryByRole, container } = render(Icon, { text: 'Settings' });
    const root = container.querySelector('.icon-container');

    expect(queryByRole('button')).toBeNull();
    expect(root?.hasAttribute('tabindex')).toBe(false);
  });

  it('still forwards the consumer keydown handler and ignores other keys', async () => {
    const onclick = vi.fn();
    const onkeydown = vi.fn();
    const { getByRole } = render(Icon, { text: 'Settings', onclick, onkeydown });

    await fireEvent.keyDown(getByRole('button'), { key: 'Escape' });
    expect(onclick).not.toHaveBeenCalled();
    expect(onkeydown).toHaveBeenCalledTimes(1);
  });
});
