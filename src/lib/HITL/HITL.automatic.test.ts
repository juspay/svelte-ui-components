import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HITL from './HITL.svelte';
import type { HITLInitialState } from './properties';

const details = createRawSnippet(() => ({
  render: () => '<pre aria-label="Change preview"><code>- old\n+ new</code></pre>'
}));
const children = createRawSnippet(() => ({
  render: () => '<label>Instructions<textarea aria-label="Instructions"></textarea></label>'
}));
const base = { confirmationId: 'change-1', title: 'Apply change', countdownSeconds: 0 };

afterEach(() => vi.useRealTimers());

const deferred = <T = void>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  return { promise, resolve, reject };
};

describe('HITL async decisions', () => {
  it('blocks disabled confirm clicks and keyboard activation but keeps Reject usable', async () => {
    const onconfirm = vi.fn();
    const { getByRole, getByText } = render(HITL, { ...base, confirmDisabled: true, onconfirm });
    const confirm = getByRole('button', { name: 'Confirm' }) as HTMLButtonElement;
    const reject = getByRole('button', { name: 'Cancel' }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    expect(reject.disabled).toBe(false);
    await fireEvent.click(confirm);
    await fireEvent.keyDown(confirm, { key: 'Enter' });
    await fireEvent.keyDown(confirm, { key: ' ' });
    confirm.click();
    expect(onconfirm).not.toHaveBeenCalled();
    await fireEvent.click(reject);
    await waitFor(() => expect(getByText('Action halted')).toBeTruthy());
    expect(onconfirm).toHaveBeenCalledExactlyOnceWith({
      confirmationId: 'change-1',
      action: 'rejected',
      approved: false
    });
  });

  it('stops a running countdown when disabled and never dispatches timed approval', async () => {
    vi.useFakeTimers();
    const onconfirm = vi.fn();
    const { container, getByRole, rerender } = render(HITL, {
      ...base,
      countdownSeconds: 1,
      onconfirm
    });
    await vi.advanceTimersByTimeAsync(400);
    await rerender({ confirmDisabled: true });
    expect((getByRole('button', { name: 'Confirm' }) as HTMLButtonElement).disabled).toBe(true);
    expect((getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(false);
    expect(container.querySelector('.progress-anchor')).toBeNull();
    await vi.advanceTimersByTimeAsync(2_000);
    expect(onconfirm).not.toHaveBeenCalled();
    await rerender({ confirmDisabled: false });
    await vi.advanceTimersByTimeAsync(2_000);
    expect(onconfirm).not.toHaveBeenCalled();
  });

  it('does not start an approval countdown when initially disabled', async () => {
    vi.useFakeTimers();
    const onconfirm = vi.fn();
    const { container } = render(HITL, {
      ...base,
      countdownSeconds: 1,
      confirmDisabled: true,
      onconfirm
    });
    expect(container.querySelector('.progress-anchor')).toBeNull();
    await vi.advanceTimersByTimeAsync(2_000);
    expect(onconfirm).not.toHaveBeenCalled();
  });

  it('does not call approval if disabled while mic restoration is pending', async () => {
    const mic = deferred();
    const onconfirm = vi.fn();
    const { getByRole, rerender } = render(HITL, {
      ...base,
      isMicMuted: true,
      onmictoggle: () => mic.promise,
      onconfirm
    });
    await rerender({ isMicMuted: false });
    await fireEvent.click(getByRole('button', { name: 'Confirm' }));
    await rerender({ confirmDisabled: true });
    mic.resolve();
    await tick();
    expect(onconfirm).not.toHaveBeenCalled();
    await waitFor(() =>
      expect((getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(false)
    );
  });

  it('does not publish approved completion if disabled during the awaited handoff', async () => {
    const pending = deferred();
    const onconfirm = vi.fn().mockImplementationOnce(() => pending.promise);
    const { container, getByRole, getByText, rerender } = render(HITL, { ...base, onconfirm });
    await fireEvent.click(getByRole('button', { name: 'Confirm' }));
    expect(onconfirm).toHaveBeenCalledTimes(1);
    await rerender({ confirmDisabled: true });
    pending.resolve();
    await tick();
    expect(container.querySelector('.completion')).toBeNull();
    await waitFor(() =>
      expect((getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(false)
    );
    await fireEvent.click(getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(getByText('Action halted')).toBeTruthy());
    expect(onconfirm.mock.calls.map(([event]) => event.action)).toEqual(['approved', 'rejected']);
  });

  it('keeps the default confirmation enabled', async () => {
    const onconfirm = vi.fn();
    const { getByRole, getByText } = render(HITL, { ...base, onconfirm });
    expect((getByRole('button', { name: 'Confirm' }) as HTMLButtonElement).disabled).toBe(false);
    await fireEvent.click(getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(getByText('Approved')).toBeTruthy());
    expect(onconfirm).toHaveBeenCalledTimes(1);
  });

  it('keeps a deferred approval pending and deduplicates fast clicks until success', async () => {
    const request = deferred();
    const onconfirm = vi.fn(() => request.promise);
    const onSelect = vi.fn();
    const { container, getByRole, getByLabelText, queryByRole, getByText } = render(HITL, {
      ...base,
      details,
      children,
      actions: [{ label: 'Explain', onSelect }],
      onconfirm
    });
    const preview = getByLabelText('Change preview');
    const confirm = getByRole('button', { name: 'Confirm' });
    // Dispatch before Svelte flushes disabled state to exercise the synchronous latch.
    confirm.click();
    confirm.click();
    getByRole('button', { name: 'Cancel' }).click();
    await waitFor(() => expect(onconfirm).toHaveBeenCalledTimes(1));
    expect(container.querySelector('.completion')).toBeNull();
    expect(getByRole('textbox', { name: 'Instructions' })).toBeTruthy();
    for (const button of container.querySelectorAll('button')) {
      expect(button.disabled).toBe(true);
    }
    await fireEvent.click(getByRole('button', { name: 'Explain' }));
    expect(onSelect).not.toHaveBeenCalled();
    request.resolve();
    await waitFor(() => expect(getByText('Approved')).toBeTruthy());
    expect(getByLabelText('Change preview')).toBe(preview);
    expect(queryByRole('button')).toBeNull();
    expect(queryByRole('textbox')).toBeNull();
    expect(onconfirm).toHaveBeenCalledExactlyOnceWith({
      confirmationId: 'change-1',
      action: 'approved',
      approved: true
    });
  });

  it('returns to pending after an HTTP 503 rejection and approves only after the second response', async () => {
    const first = deferred();
    const second = deferred();
    const onconfirm = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const { container, getByRole, getByText } = render(HITL, { ...base, onconfirm });
    await fireEvent.click(getByRole('button', { name: 'Confirm' }));
    first.reject(new Error('HTTP 503 Service Unavailable'));
    await tick();
    await waitFor(() =>
      expect((getByRole('button', { name: 'Confirm' }) as HTMLButtonElement).disabled).toBe(false)
    );
    expect(container.querySelector('.completion')).toBeNull();
    await fireEvent.click(getByRole('button', { name: 'Confirm' }));
    expect(onconfirm).toHaveBeenCalledTimes(2);
    expect(container.querySelector('.completion')).toBeNull();
    expect((getByRole('button', { name: 'Confirm' }) as HTMLButtonElement).disabled).toBe(true);
    second.resolve();
    await waitFor(() => expect(getByText('Approved')).toBeTruthy());
    expect(onconfirm.mock.calls.map(([event]) => event.action)).toEqual(['approved', 'approved']);
  });

  it('handles synchronous callback throws and still permits a synchronous cancel retry', async () => {
    const onconfirm = vi.fn().mockImplementationOnce(() => {
      throw new Error('handoff failed');
    });
    const { container, getByRole, getByText } = render(HITL, { ...base, onconfirm });
    await fireEvent.click(getByRole('button', { name: 'Confirm' }));
    expect(container.querySelector('.completion')).toBeNull();
    await fireEvent.click(getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(getByText('Action halted')).toBeTruthy());
    expect(onconfirm.mock.calls.map(([event]) => event.approved)).toEqual([true, false]);
  });

  it('awaits controlled HTTP Response objects: 503 stays pending and a retried 200 approves', async () => {
    const first = deferred<Response>();
    const second = deferred<Response>();
    const send = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const onconfirm = vi.fn(async () => {
      const response: Response = await send();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    });
    const { container, getByRole, getByText } = render(HITL, { ...base, onconfirm });
    await fireEvent.click(getByRole('button', { name: 'Confirm' }));
    first.resolve(new Response('Unavailable', { status: 503 }));
    await waitFor(() =>
      expect((getByRole('button', { name: 'Confirm' }) as HTMLButtonElement).disabled).toBe(false)
    );
    expect(container.querySelector('.completion')).toBeNull();
    await fireEvent.click(getByRole('button', { name: 'Confirm' }));
    expect(send).toHaveBeenCalledTimes(2);
    expect(container.querySelector('.completion')).toBeNull();
    second.resolve(new Response('Accepted', { status: 200 }));
    await waitFor(() => expect(getByText('Approved')).toBeTruthy());
    expect(onconfirm).toHaveBeenCalledTimes(2);
  });

  it('keeps async cancellation pending until its callback succeeds', async () => {
    const request = deferred();
    const onconfirm = vi.fn(() => request.promise);
    const { container, getByRole, getByText } = render(HITL, { ...base, onconfirm });
    await fireEvent.click(getByRole('button', { name: 'Cancel' }));
    expect(container.querySelector('.completion')).toBeNull();
    request.resolve();
    await waitFor(() => expect(getByText('Action halted')).toBeTruthy());
    expect(onconfirm).toHaveBeenCalledExactlyOnceWith({
      confirmationId: 'change-1',
      action: 'rejected',
      approved: false
    });
  });

  it('disables decisions during mic restoration and shares one restoration across fast clicks', async () => {
    const mic = deferred();
    const request = deferred();
    const onmictoggle = vi.fn(() => mic.promise);
    const onconfirm = vi.fn(() => request.promise);
    const { container, getByRole, getByText, rerender } = render(HITL, {
      ...base,
      isMicMuted: true,
      onmictoggle,
      onconfirm
    });
    await rerender({ isMicMuted: false });
    const confirm = getByRole('button', { name: 'Confirm' });
    confirm.click();
    confirm.click();
    await tick();
    expect(onmictoggle).toHaveBeenCalledTimes(1);
    expect(onconfirm).not.toHaveBeenCalled();
    for (const button of container.querySelectorAll('button')) {
      expect(button.disabled).toBe(true);
    }
    mic.resolve();
    await waitFor(() => expect(onconfirm).toHaveBeenCalledTimes(1));
    request.resolve();
    await waitFor(() => expect(getByText('Approved')).toBeTruthy());
  });

  it('does not restore the mic twice on rejection retry when the controlled mic prop is stale', async () => {
    const first = deferred();
    const second = deferred();
    const onmictoggle = vi.fn();
    const onconfirm = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const { getByRole, getByText, rerender } = render(HITL, { ...base, onmictoggle, onconfirm });
    expect(onmictoggle).toHaveBeenCalledTimes(1); // Initial auto-mute.
    await rerender({ isMicMuted: true });
    await fireEvent.click(getByRole('button', { name: 'Confirm' }));
    expect(onmictoggle).toHaveBeenCalledTimes(2); // One restoration.
    first.reject(new Error('HTTP 503'));
    await waitFor(() =>
      expect((getByRole('button', { name: 'Confirm' }) as HTMLButtonElement).disabled).toBe(false)
    );
    // Deliberately keep isMicMuted=true after restoration, as a delayed parent can.
    await fireEvent.click(getByRole('button', { name: 'Confirm' }));
    expect(onmictoggle).toHaveBeenCalledTimes(2);
    second.resolve();
    await waitFor(() => expect(getByText('Approved')).toBeTruthy());
  });

  it.each([
    [false, { status: 'EXPIRED' }, 'Action timed out'],
    [true, { approved: false }, 'Action halted'],
    [true, { approved: true }, 'Approved'],
    [true, null, 'Action timed out']
  ] satisfies [boolean, HITLInitialState | null, string][])(
    'honors controlled state during the request (history=%s, state=%j)',
    async (isHistoryMode, initialState, label) => {
      const request = deferred();
      const onconfirm = vi.fn(() => request.promise);
      const { container, getByRole, getByText, queryByRole, rerender } = render(HITL, {
        ...base,
        onconfirm
      });
      await fireEvent.click(getByRole('button', { name: 'Confirm' }));
      await rerender({ isHistoryMode, initialState });
      const completion = container.querySelector('.completion-text');
      expect(getByText(label)).toBeTruthy();
      request.resolve();
      await tick();
      expect(container.querySelector('.completion-text')).toBe(completion);
      expect(completion?.textContent?.trim()).toBe(label);
      expect(queryByRole('button')).toBeNull();
      expect(onconfirm).toHaveBeenCalledTimes(1);
    }
  );

  it('keeps controlled expiry after a failed in-flight callback', async () => {
    const request = deferred();
    const { getByRole, getByText, queryByRole, rerender } = render(HITL, {
      ...base,
      onconfirm: () => request.promise
    });
    await fireEvent.click(getByRole('button', { name: 'Confirm' }));
    await rerender({ initialState: { status: 'EXPIRED' } });
    request.reject(new Error('HTTP 503'));
    await tick();
    expect(getByText('Action timed out')).toBeTruthy();
    expect(queryByRole('button')).toBeNull();
  });

  it('does not send a decision if expiry arrives during mic restoration', async () => {
    const mic = deferred();
    const onconfirm = vi.fn();
    const { getByRole, getByText, rerender } = render(HITL, {
      ...base,
      isMicMuted: true,
      onmictoggle: () => mic.promise,
      onconfirm
    });
    await rerender({ isMicMuted: false });
    await fireEvent.click(getByRole('button', { name: 'Confirm' }));
    await rerender({ initialState: { status: 'EXPIRED' } });
    mic.resolve();
    await tick();
    expect(onconfirm).not.toHaveBeenCalled();
    expect(getByText('Action timed out')).toBeTruthy();
  });

  it.each([
    [1, 0, 'auto-approved', 'Completed'],
    [0, 1, 'rejected', 'Action halted']
  ])(
    'awaits and deduplicates timed decisions (countdown=%s, autoCancel=%s)',
    async (countdownSeconds, autoCancelSeconds, action, label) => {
      vi.useFakeTimers();
      const request = deferred();
      const onconfirm = vi.fn(() => request.promise);
      const { container, getByText } = render(HITL, {
        ...base,
        countdownSeconds: Number(countdownSeconds),
        autoCancelSeconds: Number(autoCancelSeconds),
        onconfirm
      });
      await vi.advanceTimersByTimeAsync(1_200);
      expect(onconfirm).toHaveBeenCalledExactlyOnceWith({
        confirmationId: 'change-1',
        action,
        approved: action !== 'rejected'
      });
      expect(container.querySelector('.completion')).toBeNull();
      await vi.advanceTimersByTimeAsync(3_000);
      expect(onconfirm).toHaveBeenCalledTimes(1);
      request.resolve();
      await vi.advanceTimersByTimeAsync(0);
      await tick();
      expect(getByText(String(label))).toBeTruthy();
    }
  );

  it('leaves failed auto-approval pending for a manual retry without restarting timers', async () => {
    vi.useFakeTimers();
    const request = deferred();
    const onconfirm = vi.fn().mockImplementationOnce(() => request.promise);
    const { container, getByRole, getByText } = render(HITL, {
      ...base,
      countdownSeconds: 1,
      onconfirm
    });
    await vi.advanceTimersByTimeAsync(1_200);
    request.reject(new Error('HTTP 503'));
    await tick();
    await vi.advanceTimersByTimeAsync(3_000);
    expect(onconfirm).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.completion')).toBeNull();
    await fireEvent.click(getByRole('button', { name: 'Confirm' }));
    await tick();
    expect(getByText('Approved')).toBeTruthy();
    expect(onconfirm.mock.calls.map(([event]) => event.action)).toEqual([
      'auto-approved',
      'approved'
    ]);
  });
});

describe('HITL rich details contract', () => {
  it('keeps labelled sections and the two default buttons when details is omitted', () => {
    const { container, getByText, getAllByRole } = render(HITL, {
      ...base,
      sections: [{ label: 'Target', value: 'payments.ts' }],
      functionArguments: { ignored: 'raw' }
    });
    expect(getByText('Target')).toBeTruthy();
    expect(getByText('payments.ts')).toBeTruthy();
    expect(container.querySelector('.rich-details')).toBeNull();
    expect(container.querySelector('.extra-content')).toBeNull();
    expect(getAllByRole('button').map((button) => button.textContent?.trim())).toEqual([
      'Cancel',
      'Confirm'
    ]);
    expect(container.textContent).not.toContain('raw');
  });

  it('keeps argument formatting, hidden keys and the no-parameters fallback', async () => {
    const { getByText, queryByText, rerender } = render(HITL, {
      ...base,
      functionArguments: { sessionId: 'hidden', enabled: true, amount: 42 }
    });
    expect(queryByText('hidden')).toBeNull();
    expect(getByText('Yes')).toBeTruthy();
    expect(getByText('42')).toBeTruthy();
    await rerender({ functionArguments: {} });
    expect(getByText('No parameters')).toBeTruthy();
  });

  it.each(['Confirm', 'Cancel'])(
    'keeps the same rich detail node after %s and removes pending children/actions',
    async (button) => {
      const onconfirm = vi.fn();
      const onSelect = vi.fn();
      const { container, getByRole, getByLabelText, queryByRole } = render(HITL, {
        ...base,
        details,
        children,
        sections: [{ label: 'Fallback', value: 'hidden fallback' }],
        actions: [{ label: 'Deny with instructions', onSelect }],
        onconfirm
      });
      const preview = getByLabelText('Change preview');
      expect(preview.textContent).toBe('- old\n+ new');
      expect(container.querySelector('.params')).toBeNull();
      expect(getByRole('textbox', { name: 'Instructions' })).toBeTruthy();
      await fireEvent.click(getByRole('button', { name: 'Deny with instructions' }));
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onconfirm).not.toHaveBeenCalled();
      await fireEvent.click(getByRole('button', { name: button }));
      await waitFor(() =>
        expect(onconfirm).toHaveBeenCalledExactlyOnceWith({
          confirmationId: 'change-1',
          action: button === 'Confirm' ? 'approved' : 'rejected',
          approved: button === 'Confirm'
        })
      );
      expect(getByLabelText('Change preview')).toBe(preview);
      expect(queryByRole('button')).toBeNull();
      expect(queryByRole('textbox')).toBeNull();
      expect(container.querySelector('.completion-text')?.textContent?.trim()).toBe(
        button === 'Confirm' ? 'Approved' : 'Action halted'
      );
    }
  );

  const history: [string, HITLInitialState | null, string][] = [
    ['approved', { approved: true }, 'Approved'],
    ['rejected', { approved: false }, 'Action halted'],
    ['expired', { status: 'EXPIRED' }, 'Action timed out'],
    ['missing state', null, 'Action timed out']
  ];
  it.each(history)(
    'renders rich details in %s history without controls or timers',
    async (_name, initialState, label) => {
      vi.useFakeTimers();
      const onconfirm = vi.fn();
      const onmictoggle = vi.fn();
      const { getByLabelText, getByText, queryByRole } = render(HITL, {
        ...base,
        countdownSeconds: 1,
        autoCancelSeconds: 1,
        isHistoryMode: true,
        initialState,
        details,
        children,
        onconfirm,
        onmictoggle
      });
      expect(getByLabelText('Change preview').textContent).toBe('- old\n+ new');
      expect(getByText(label)).toBeTruthy();
      expect(queryByRole('button')).toBeNull();
      expect(queryByRole('textbox')).toBeNull();
      await vi.advanceTimersByTimeAsync(2_000);
      expect(onconfirm).not.toHaveBeenCalled();
      expect(onmictoggle).not.toHaveBeenCalled();
    }
  );

  it('retains rich detail when the existing countdown auto-approves', async () => {
    vi.useFakeTimers();
    const onconfirm = vi.fn();
    const { getByLabelText, getByText, queryByRole } = render(HITL, {
      ...base,
      countdownSeconds: 1,
      details,
      onconfirm
    });
    await vi.advanceTimersByTimeAsync(1_200);
    expect(onconfirm).toHaveBeenCalledExactlyOnceWith({
      confirmationId: 'change-1',
      action: 'auto-approved',
      approved: true
    });
    expect(getByLabelText('Change preview')).toBeTruthy();
    expect(getByText('Completed')).toBeTruthy();
    expect(queryByRole('button')).toBeNull();
  });
});
