import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { LottiePlayer as Player } from 'lottie-web';
import { expect, it, vi } from 'vitest';
import LottiePlayerCore from './LottiePlayerCore.svelte';

it('keeps a late loader from creating an animation after teardown', async () => {
  let completeLoad: (player: Pick<Player, 'loadAnimation'>) => void = () => {};
  const loadPlayer = vi.fn(
    () =>
      new Promise<Pick<Player, 'loadAnimation'>>((resolve) => {
        completeLoad = resolve;
      })
  );
  const loadAnimation = vi.fn(() => {
    throw new Error('The player has been destroyed');
  });
  const { unmount, getByRole } = render(LottiePlayerCore, {
    props: { loadPlayer, ariaHidden: false, ariaLabel: 'Playback preview' }
  });
  expect(getByRole('img', { name: 'Playback preview' })).not.toBeNull();
  await tick();
  expect(loadPlayer).toHaveBeenCalledTimes(1);
  await unmount();
  completeLoad({ loadAnimation });
  await tick();
  expect(loadAnimation).not.toHaveBeenCalled();
});
