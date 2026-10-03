import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ChatComposer from './ChatComposer.svelte';

afterEach(() => vi.unstubAllGlobals());

describe('ChatComposer dictation contract', () => {
  it('keeps the legacy boolean `recording` working unchanged: false is idle, true is recording', async () => {
    const { getByRole, rerender, container } = render(ChatComposer, {
      props: { onvoice: () => {}, recording: false }
    });
    const voice = getByRole('button', { name: 'Voice input' });
    expect(voice.hasAttribute('disabled')).toBe(false);
    expect(container.querySelector('.voice')?.classList.contains('recording')).toBe(false);

    await rerender({ onvoice: () => {}, recording: true });
    expect(container.querySelector('.voice')?.classList.contains('recording')).toBe(true);
    // A caller still on the boolean never sees the busy behaviour -- `true`
    // reads only as 'recording', so the button stays pressable exactly as
    // before the tri-state was added.
    expect(voice.hasAttribute('disabled')).toBe(false);
  });

  it('accepts the tri-state values directly, including the idle default a plain caller never sets', async () => {
    const { getByRole, rerender, container } = render(ChatComposer, {
      props: { onvoice: () => {}, recording: 'idle' }
    });
    const voice = getByRole('button', { name: 'Voice input' });
    expect(container.querySelector('.voice')?.className).not.toMatch(/recording|busy/);

    await rerender({ onvoice: () => {}, recording: 'recording' });
    expect(container.querySelector('.voice')?.classList.contains('recording')).toBe(true);
    expect(voice.hasAttribute('disabled')).toBe(false);
  });

  it('busy is not cosmetic: it disables the voice button even when the caller tries to force it enabled', () => {
    const { getByRole } = render(ChatComposer, {
      props: { onvoice: () => {}, recording: 'busy', voiceDisabled: false, disabled: false }
    });
    const voice = getByRole('button', { name: 'Voice input' });
    expect(voice.hasAttribute('disabled')).toBe(true);
    expect(voice.closest('.voice')?.classList.contains('busy')).toBe(true);
  });

  it('fires oncanceldictation on Escape only while recording -- not idle, not busy, not the legacy false', async () => {
    const onSomeState = async (recording: boolean | 'idle' | 'recording' | 'busy') => {
      const oncanceldictation = vi.fn();
      const { getByPlaceholderText, unmount } = render(ChatComposer, {
        props: {
          onvoice: () => {},
          recording,
          oncanceldictation,
          placeholder: `state-${String(recording)}`
        }
      });
      const input = getByPlaceholderText(`state-${String(recording)}`);
      await fireEvent.keyDown(input, { key: 'Escape' });
      expect(oncanceldictation).not.toHaveBeenCalled();
      unmount();
    };
    await onSomeState(false);
    await onSomeState('idle');
    await onSomeState('busy');

    const oncanceldictation = vi.fn();
    const { getByPlaceholderText } = render(ChatComposer, {
      props: {
        onvoice: () => {},
        recording: 'recording',
        oncanceldictation,
        placeholder: 'recording-now'
      }
    });
    const input = getByPlaceholderText('recording-now');
    await fireEvent.keyDown(input, { key: 'Escape' });
    expect(oncanceldictation).toHaveBeenCalledTimes(1);
  });

  it('also fires on Escape for the legacy `true` alias, since that alias means recording', async () => {
    const oncanceldictation = vi.fn();
    const { getByPlaceholderText } = render(ChatComposer, {
      props: { onvoice: () => {}, recording: true, oncanceldictation, placeholder: 'legacy-true' }
    });
    await fireEvent.keyDown(getByPlaceholderText('legacy-true'), { key: 'Escape' });
    expect(oncanceldictation).toHaveBeenCalledTimes(1);
  });

  it('keeps the IME composition guard: Escape handling does not disturb Enter-while-composing', async () => {
    const onsubmit = vi.fn();
    const { getByPlaceholderText } = render(ChatComposer, {
      props: { value: 'こんにちは', onsubmit, placeholder: 'ime-guard' }
    });
    const input = getByPlaceholderText('ime-guard');
    await fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(onsubmit).not.toHaveBeenCalled();
  });

  it('renders no status region when statusText is not supplied', () => {
    const { queryByRole } = render(ChatComposer, { props: {} });
    expect(queryByRole('status')).toBeNull();
  });

  it('renders the caller-supplied status text verbatim, with a generic role and polite live region', () => {
    const { getByRole } = render(ChatComposer, {
      props: { statusText: 'Recording. Press Escape to stop and transcribe.' }
    });
    const region = getByRole('status');
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.textContent?.trim()).toBe('Recording. Press Escape to stop and transcribe.');
  });

  it('renders an emptied status region for an explicit empty string, distinct from omitting it', () => {
    const { getByRole } = render(ChatComposer, { props: { statusText: '' } });
    const region = getByRole('status');
    expect(region.textContent?.trim()).toBe('');
  });

  it('shows the idle action button only in the idle dictation state (regression: tri-state must not collapse to falsy)', async () => {
    const onaction = vi.fn();
    const { getByRole, rerender, queryByRole } = render(ChatComposer, {
      props: { onaction, recording: 'idle' }
    });
    expect(getByRole('button', { name: 'Voice conversation' })).toBeTruthy();

    await rerender({ onaction, recording: 'recording' });
    expect(queryByRole('button', { name: 'Voice conversation' })).toBeNull();

    await rerender({ onaction, recording: 'busy' });
    expect(queryByRole('button', { name: 'Voice conversation' })).toBeNull();
  });
});

describe('ChatComposer layout contract', () => {
  it('keeps the default row markup and opt-in controls absent', () => {
    const { container, getByRole, getAllByRole } = render(ChatComposer);
    const input = getByRole('textbox');
    expect(input.parentElement?.className).toContain('input-row');
    expect(input.parentElement?.classList.contains('stacked')).toBe(false);
    expect(container.querySelector('.text-row')).toBeNull();
    expect(container.querySelector('.control-row')).toBeNull();
    expect(getAllByRole('button')).toHaveLength(1);
    expect(input.getAttribute('aria-label')).toBe('Message');
  });

  it('places stacked text before a separate control row with the existing labels and leading snippet', () => {
    const leading = createRawSnippet(() => ({ render: () => '<span>Automatic</span>' }));
    const { container, getByRole } = render(ChatComposer, {
      layout: 'stacked',
      leading,
      onattachclick: () => {},
      onvoice: () => {},
      inputAriaLabel: 'Ask Automatic',
      placeholder: 'Short prompt',
      attachLabel: 'Add context',
      voiceLabel: 'Dictate prompt',
      sendLabel: 'Send prompt'
    });
    const textRow = container.querySelector('.text-row');
    const controls = container.querySelector('.control-row');
    expect(textRow?.nextElementSibling).toBe(controls);
    expect(textRow?.contains(getByRole('textbox', { name: 'Ask Automatic' }))).toBe(true);
    for (const name of ['Add context', 'Dictate prompt', 'Send prompt']) {
      expect(controls?.contains(getByRole('button', { name }))).toBe(true);
    }
    expect(controls?.querySelector('.leading')?.textContent).toBe('Automatic');
  });

  it.each(['row', 'stacked'] as const)(
    '%s preserves picked attachments and drafts on rejected submits',
    async (layout) => {
      const file = new File(['context'], 'context.txt', { type: 'text/plain' });
      const onattach = vi.fn();
      const onsubmit = vi
        .fn<(value: string, attachments: File[]) => boolean | Promise<boolean>>()
        .mockReturnValueOnce(false)
        .mockRejectedValueOnce(new Error('rejected send'));
      const { container, getByRole, getByText } = render(ChatComposer, {
        layout,
        value: 'draft',
        onattach,
        onsubmit
      });
      await fireEvent.change(container.querySelector('input[type="file"]') as Element, {
        target: { files: [file] }
      });
      expect(onattach).toHaveBeenCalledExactlyOnceWith([file]);
      expect(getByText('context.txt')).toBeTruthy();
      await fireEvent.click(getByRole('button', { name: 'Send message' }));
      expect(onsubmit).toHaveBeenCalledExactlyOnceWith('draft', [file]);
      expect((getByRole('textbox') as HTMLTextAreaElement).value).toBe('draft');
      expect(getByText('context.txt')).toBeTruthy();

      await fireEvent.click(getByRole('button', { name: 'Send message' }));
      expect((getByRole('textbox') as HTMLTextAreaElement).value).toBe('draft');
      expect(getByText('context.txt')).toBeTruthy();
    }
  );

  it.each(['row', 'stacked'] as const)(
    '%s allows attachment-only submits and clears accepted drafts',
    async (layout) => {
      const file = new File([], 'report.csv');
      const onsubmit = vi.fn();
      const { getByRole, queryByText } = render(ChatComposer, {
        layout,
        attachments: [file],
        onsubmit
      });
      await fireEvent.click(getByRole('button', { name: 'Send message' }));
      expect(onsubmit).toHaveBeenCalledExactlyOnceWith('', [file]);
      expect(queryByText('report.csv')).toBeNull();
    }
  );

  it('keeps newer stacked text when an earlier async send succeeds', async () => {
    let accept: (accepted: boolean) => void = () => {};
    const onsubmit = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          accept = resolve;
        })
    );
    const { getByRole } = render(ChatComposer, { layout: 'stacked', value: 'sent', onsubmit });
    await fireEvent.click(getByRole('button', { name: 'Send message' }));
    const input = getByRole('textbox') as HTMLTextAreaElement;
    await fireEvent.input(input, { target: { value: 'new draft' } });
    accept(true);
    await tick();
    expect(input.value).toBe('new draft');
  });

  it('preserves attachment-preview precedence, rich-file sendability and removal callbacks in stacked mode', async () => {
    // Scroller observes its chip strip; jsdom has no ResizeObserver/layout.
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    const onremoverichfile = vi.fn();
    const onopenrichfile = vi.fn();
    const file = { id: 'context', filename: 'context.csv' };
    const { getByRole, container, rerender } = render(ChatComposer, {
      layout: 'stacked',
      richFiles: [file],
      onremoverichfile,
      onopenrichfile
    });
    const rich = container.querySelector('.attachments-rich');
    expect(rich?.nextElementSibling?.classList.contains('input-row')).toBe(true);
    expect(getByRole('button', { name: 'Send message' }).hasAttribute('disabled')).toBe(false);
    await fireEvent.click(getByRole('button', { name: 'Open context.csv' }));
    expect(onopenrichfile).toHaveBeenCalledExactlyOnceWith(file);
    await fireEvent.click(getByRole('button', { name: /remove/i }));
    expect(onremoverichfile).toHaveBeenCalledExactlyOnceWith('context');
    const attachmentsPreview = createRawSnippet(() => ({
      render: () => '<div>Custom preview</div>'
    }));
    await rerender({ attachmentsPreview });
    expect(container.querySelector('.attachments-rich')).toBeNull();
    expect(container.textContent).toContain('Custom preview');
  });

  it.each(['row', 'stacked'] as const)(
    '%s preserves Enter, Shift+Enter, IME and paste callbacks',
    async (layout) => {
      const onsubmit = vi.fn();
      const onpaste = vi.fn();
      const oninput = vi.fn();
      const { getByRole } = render(ChatComposer, {
        layout,
        value: 'draft',
        onsubmit,
        onpaste,
        oninput
      });
      const input = getByRole('textbox') as HTMLTextAreaElement;
      await fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
      await fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
      expect(onsubmit).not.toHaveBeenCalled();
      await fireEvent.paste(input);
      expect(onpaste).toHaveBeenCalledTimes(1);
      await fireEvent.input(input, { target: { value: 'changed' } });
      expect(oninput).toHaveBeenCalledWith('changed', expect.any(Event));
      await fireEvent.keyDown(input, { key: 'Enter' });
      expect(onsubmit).toHaveBeenCalledExactlyOnceWith('changed', []);
      expect(input.value).toBe('');
    }
  );

  it('keeps dictation cancellation, busy disabling and stop independent of disabled state in stacked mode', async () => {
    const onvoice = vi.fn();
    const onstop = vi.fn();
    const oncanceldictation = vi.fn();
    const onsubmit = vi.fn();
    const { getByRole, queryByRole, rerender } = render(ChatComposer, {
      layout: 'stacked',
      onvoice,
      onstop,
      oncanceldictation,
      onsubmit,
      recording: 'recording',
      value: 'draft'
    });
    await fireEvent.keyDown(getByRole('textbox'), { key: 'Escape' });
    expect(oncanceldictation).toHaveBeenCalledTimes(1);
    await fireEvent.click(getByRole('button', { name: 'Voice input' }));
    expect(onvoice).toHaveBeenCalledTimes(1);
    await rerender({ recording: 'busy', voiceDisabled: false });
    expect(getByRole('button', { name: 'Voice input' }).hasAttribute('disabled')).toBe(true);
    await rerender({ streaming: true, disabled: true });
    expect(queryByRole('button', { name: 'Send message' })).toBeNull();
    const stop = getByRole('button', { name: 'Stop generating' });
    expect(stop.hasAttribute('disabled')).toBe(false);
    await fireEvent.keyDown(getByRole('textbox'), { key: 'Enter' });
    expect(onsubmit).not.toHaveBeenCalled();
    await fireEvent.click(stop);
    expect(onstop).toHaveBeenCalledExactlyOnceWith();
  });

  it('keeps the existing idle action and attach interception in the stacked control row', async () => {
    const onaction = vi.fn();
    const onattachclick = vi.fn();
    const { getByRole } = render(ChatComposer, { layout: 'stacked', onaction, onattachclick });
    await fireEvent.click(getByRole('button', { name: 'Voice conversation' }));
    await fireEvent.click(getByRole('button', { name: 'Attach files' }));
    expect(onaction).toHaveBeenCalledExactlyOnceWith();
    expect(onattachclick).toHaveBeenCalledExactlyOnceWith();
  });

  it('preserves icon-only idle actions when actionText is omitted or empty', async () => {
    const onaction = vi.fn();
    const { getByRole, rerender } = render(ChatComposer, { onaction });
    const button = getByRole('button', { name: 'Voice conversation' });
    expect(button.textContent?.trim()).toBe('');
    await rerender({ actionText: '' });
    expect(button.textContent?.trim()).toBe('');
  });

  it('renders a visible idle action label and preserves action/send ownership', async () => {
    const onaction = vi.fn();
    const onsubmit = vi.fn(() => false);
    const { getByRole, queryByRole, rerender } = render(ChatComposer, {
      onaction,
      onsubmit,
      actionText: 'Talk',
      actionLabel: 'Talk with Automatic'
    });
    const button = getByRole('button', { name: 'Talk with Automatic' });
    expect(button.textContent?.trim()).toBe('Talk');
    expect(button.querySelector('svg')).not.toBeNull();
    await fireEvent.click(button);
    expect(onaction).toHaveBeenCalledExactlyOnceWith();
    expect(onsubmit).not.toHaveBeenCalled();
    await rerender({ value: 'draft' });
    expect(queryByRole('button', { name: 'Talk with Automatic' })).toBeNull();
    expect(queryByRole('button', { name: 'Send message' })).not.toBeNull();
  });
});
