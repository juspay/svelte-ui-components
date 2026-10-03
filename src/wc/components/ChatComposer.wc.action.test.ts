import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/svelte';
import './ChatComposer.wc.svelte';

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
const mounted: HTMLElement[] = [];
afterEach(async () => {
  for (const element of mounted.splice(0)) {
    element.remove();
  }
  await flush();
});

describe('ChatComposer custom-element visible action', () => {
  it('keeps icon-only defaults and forwards action-text attributes and property updates', async () => {
    const onaction = vi.fn();
    const element = document.createElement('sui-chat-composer');
    Object.assign(element, { onaction, actionLabel: 'Talk with Automatic' });
    document.body.append(element);
    mounted.push(element);
    await flush();
    const button = element.shadowRoot?.querySelector('button[aria-label="Talk with Automatic"]');
    expect(button?.textContent?.trim()).toBe('');
    expect(element.hasAttribute('action-text')).toBe(false);
    element.setAttribute('action-text', 'Talk');
    await flush();
    expect(button?.textContent?.trim()).toBe('Talk');
    await fireEvent.click(button as HTMLButtonElement);
    expect(onaction).toHaveBeenCalledExactlyOnceWith();
    Object.assign(element, { actionText: 'Discuss' });
    await flush();
    expect(button?.textContent?.trim()).toBe('Discuss');
    Object.assign(element, { actionText: '' });
    await flush();
    expect(button?.textContent?.trim()).toBe('');
  });
});
