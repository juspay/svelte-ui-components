import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import GridItem from './GridItem.svelte';

// The tile is exposed as role="button" with tabindex="0", so a keyboard user can
// reach it. Without a keydown handler of its own it could be focused and never
// activated, which is the gap these cover.
describe('GridItem keyboard activation', () => {
  it.each(['Enter', ' '])('activates on %s like a button', async (key) => {
    const onclick = vi.fn();
    const { getByRole } = render(GridItem, { icon: '', text: 'Reports', onclick });
    const tile = getByRole('button');

    await fireEvent.keyDown(tile, { key });

    expect(onclick).toHaveBeenCalledTimes(1);
  });

  it('toggles the loader by keyboard exactly as a click does', async () => {
    const { getByRole, container } = render(GridItem, { icon: '', text: 'Reports' });
    const tile = getByRole('button');
    expect(container.querySelector('.grid-body-loader')).toBeNull();

    await fireEvent.keyDown(tile, { key: 'Enter' });
    expect(container.querySelector('.grid-body-loader')).not.toBeNull();

    await fireEvent.keyDown(tile, { key: ' ' });
    expect(container.querySelector('.grid-body-loader')).toBeNull();
  });

  it('leaves other keys and the consumer handler alone', async () => {
    const onclick = vi.fn();
    const onkeydown = vi.fn();
    const { getByRole } = render(GridItem, { icon: '', text: 'Reports', onclick, onkeydown });
    const tile = getByRole('button');

    await fireEvent.keyDown(tile, { key: 'a' });
    expect(onclick).not.toHaveBeenCalled();

    await fireEvent.keyDown(tile, { key: 'Enter' });
    expect(onclick).toHaveBeenCalledTimes(1);
    expect(onkeydown).toHaveBeenCalledTimes(2);
  });
});
