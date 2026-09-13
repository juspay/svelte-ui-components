import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import ChatComposer from './ChatComposer.svelte';

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
