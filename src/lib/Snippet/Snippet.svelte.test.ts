import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import Snippet from './Snippet.svelte';

// "Copied!" appears twice on a success -- once as the button's visible label
// and once in the always-present `role="status"` live region -- so a bare
// text query is ambiguous. These target the visible affordance specifically.
const copiedLabel = (container: HTMLElement): Element | null =>
  container.querySelector('.snippet-copied');
const announcement = (container: HTMLElement): string =>
  container.querySelector('.snippet-status')?.textContent ?? '';

// Before this fix, handleCopy's `catch {}` swallowed every clipboard failure
// silently: the consumer got no signal, and navigator.clipboard being absent
// entirely (SSR, non-secure context, an iframe) threw an unhandled TypeError
// instead of failing gracefully. Each case below fails against that old
// behaviour and passes once failures are reported through `onerror` and the
// success affordance stays honest.
describe('Snippet clipboard error handling', () => {
  afterEach(() => {
    // jsdom ships no navigator.clipboard by default (verified: `'clipboard'
    // in navigator` is false out of the box), so deleting whatever a test
    // installed restores that default rather than leaking into the next one.
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('a successful write fires oncopy, shows the copied affordance, and never calls onerror', async () => {
    const writeText = async (): Promise<void> => {};
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    });
    const calls: { oncopy: number; onerror: unknown[] } = { oncopy: 0, onerror: [] };
    const { getByRole, container } = render(Snippet, {
      text: 'npm install',
      oncopy: () => {
        calls.oncopy += 1;
      },
      onerror: (reason: unknown) => {
        calls.onerror.push(reason);
      }
    });

    await fireEvent.click(getByRole('button'));

    await waitFor(() => {
      expect(copiedLabel(container)).not.toBeNull();
    });
    expect(announcement(container)).toBe('Copied!');
    expect(calls.oncopy).toBe(1);
    expect(calls.onerror).toEqual([]);
  });

  it('a rejected write fires onerror with the rejection reason, never shows the copied affordance, and does not fire oncopy', async () => {
    const rejection = new Error('Document is not focused.');
    const writeText = async (): Promise<void> => {
      throw rejection;
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    });
    const calls: { oncopy: number; onerror: unknown[] } = { oncopy: 0, onerror: [] };
    const { getByRole, container } = render(Snippet, {
      text: 'npm install',
      oncopy: () => {
        calls.oncopy += 1;
      },
      onerror: (reason: unknown) => {
        calls.onerror.push(reason);
      }
    });

    await fireEvent.click(getByRole('button'));

    await waitFor(() => {
      expect(calls.onerror).toEqual([rejection]);
    });
    expect(calls.oncopy).toBe(0);
    expect(copiedLabel(container)).toBeNull();
    expect(announcement(container)).toBe('');
  });

  it('a missing Clipboard API is reported through onerror instead of throwing', async () => {
    // No navigator.clipboard installed at all -- this is jsdom's default, and
    // also what a non-secure context or a strict iframe sandbox looks like.
    expect('clipboard' in navigator).toBe(false);
    const calls: { oncopy: number; onerror: unknown[] } = { oncopy: 0, onerror: [] };
    const { getByRole, container } = render(Snippet, {
      text: 'npm install',
      oncopy: () => {
        calls.oncopy += 1;
      },
      onerror: (reason: unknown) => {
        calls.onerror.push(reason);
      }
    });

    await expect(fireEvent.click(getByRole('button'))).resolves.not.toThrow();

    await waitFor(() => {
      expect(calls.onerror).toHaveLength(1);
    });
    expect(calls.onerror[0]).toBeInstanceOf(Error);
    expect(calls.oncopy).toBe(0);
    expect(copiedLabel(container)).toBeNull();
  });

  it('reports a failure that follows a success through onerror, without retracting the earlier copy that did reach the clipboard', async () => {
    // The earlier write genuinely put text on the clipboard, and it is still
    // there. Clearing the affordance because a *later* attempt failed would
    // claim the opposite. The honest signal for the second attempt is
    // `onerror`; the first attempt's feedback stays until its own deadline.
    let shouldFail = false;
    const writeText = async (): Promise<void> => {
      if (shouldFail) {
        throw new Error('Permission denied.');
      }
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    });
    const onerror: unknown[] = [];
    const { getByRole, container } = render(Snippet, {
      text: 'npm install',
      copyResetMs: 100_000,
      onerror: (reason: unknown) => {
        onerror.push(reason);
      }
    });

    await fireEvent.click(getByRole('button'));
    await waitFor(() => {
      expect(copiedLabel(container)).not.toBeNull();
    });

    shouldFail = true;
    await fireEvent.click(getByRole('button'));

    await waitFor(() => {
      expect(onerror).toHaveLength(1);
    });
    expect(copiedLabel(container)).not.toBeNull();
  });
});
