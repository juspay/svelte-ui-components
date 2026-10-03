import { afterEach, describe, expect, it, vi } from 'vitest';
import './ChatComposer.wc.svelte';

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
const mounted: HTMLElement[] = [];
afterEach(async () => {
  for (const element of mounted.splice(0)) {
    element.remove();
  }
  await flush();
});

describe.each(['row', 'stacked'] as const)('ChatComposer trailing in %s layout', (layout) => {
  it.each([false, true])(
    'preserves snippets and optional native slots, preview=%s',
    async (preview) => {
      const element = document.createElement('sui-chat-composer');
      Object.assign(element, { layout });
      if (preview) {
        const attachment = document.createElement('span');
        attachment.slot = 'attachments-preview';
        element.append(attachment);
      }
      document.body.append(element);
      mounted.push(element);
      await flush();
      expect(element.shadowRoot?.querySelector('slot[name="trailing"]')).toBeNull();

      const trailing = vi.fn();
      Object.assign(element, { trailing });
      await flush();
      expect(trailing).toHaveBeenCalled();
      const button = document.createElement('button');
      button.slot = 'trailing';
      button.textContent = 'Open panel';
      element.append(button);
      await flush();
      expect(element.shadowRoot?.querySelector('slot[name="trailing"]')).toBeNull();

      Object.assign(element, { trailing: null });
      await flush();
      const slot = element.shadowRoot?.querySelector('slot[name="trailing"]');
      expect(slot instanceof HTMLSlotElement).toBe(true);
      if (!(slot instanceof HTMLSlotElement)) {
        throw new Error('Native trailing slot is missing');
      }
      expect(slot.assignedElements()).toEqual([button]);
      button.remove();
      await flush();
      expect(element.shadowRoot?.querySelector('slot[name="trailing"]')).toBeNull();
      const nested = document.createElement('div');
      nested.innerHTML = '<span slot="trailing">Nested body content</span>';
      element.append(nested);
      await flush();
      expect(element.shadowRoot?.querySelector('slot[name="trailing"]')).toBeNull();
    }
  );
});
