import { expect, it, vi } from 'vitest';
import { cacheSuccessfulLoad } from './load';

it('shares an in-flight renderer import and retries after it fails', async () => {
  const failed = new Error('Temporary load failure');
  const load = vi.fn<() => Promise<string>>();
  load.mockRejectedValueOnce(failed).mockResolvedValue('renderer');
  const getRenderer = cacheSuccessfulLoad(load);
  const first = getRenderer();
  expect(getRenderer()).toBe(first);
  await expect(first).rejects.toBe(failed);
  const second = getRenderer();
  await expect(second).resolves.toBe('renderer');
  expect(getRenderer()).toBe(second);
  expect(load).toHaveBeenCalledTimes(2);
});
