import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import ChatHeader from './ChatHeader.svelte';

describe('ChatHeader expand action', () => {
  it('keeps the optional action absent for existing callers', () => {
    const { queryByRole } = render(ChatHeader, { props: { title: 'Assistant' } });
    expect(queryByRole('button', { name: 'Expand' })).toBeNull();
  });

  it('toggles internally and reports both states without a parent callback writer', async () => {
    const onexpandchange = vi.fn();
    const { getByRole } = render(ChatHeader, { props: { onexpandchange } });
    await fireEvent.click(getByRole('button', { name: 'Expand' }));
    expect(onexpandchange).toHaveBeenLastCalledWith(true);
    await fireEvent.click(getByRole('button', { name: 'Collapse' }));
    expect(onexpandchange).toHaveBeenLastCalledWith(false);
  });

  it('can explicitly hide the action while a callback exists', () => {
    const { queryByRole } = render(ChatHeader, {
      props: { showExpand: false, onexpandchange: vi.fn() }
    });
    expect(queryByRole('button', { name: 'Expand' })).toBeNull();
  });
});
