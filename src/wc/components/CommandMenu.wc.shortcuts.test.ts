import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import './CommandMenu.wc.svelte';

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
const mounted: HTMLElement[] = [];
const animationDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'animate');

beforeAll(() => {
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    value: () => ({ cancel: () => {}, finished: Promise.resolve() })
  });
});
afterAll(() => {
  if (animationDescriptor) {
    Object.defineProperty(Element.prototype, 'animate', animationDescriptor);
  } else {
    Reflect.deleteProperty(Element.prototype, 'animate');
  }
});
afterEach(async () => {
  for (const element of mounted.splice(0)) {
    element.remove();
  }
  await flush();
});

const mount = (props: Record<string, unknown>): HTMLElement => {
  const element = document.createElement('sui-command-menu');
  Object.assign(element, { items: [{ label: 'Help', value: 'help' }], ...props });
  document.body.append(element);
  mounted.push(element);
  return element;
};
const shortcut = (): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', {
    key: 'k',
    ctrlKey: true,
    bubbles: true,
    cancelable: true
  });
  window.dispatchEvent(event);
  return event;
};

describe('CommandMenu custom-element shortcut opt-out', () => {
  it('preserves the default shortcut when the attribute is omitted', async () => {
    const element = mount({});
    await flush();
    expect(element.hasAttribute('shortcut-enabled')).toBe(false);
    expect(shortcut().defaultPrevented).toBe(true);
    await flush();
    expect(element.shadowRoot?.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('forwards a false property before mount and later property updates', async () => {
    const element = mount({ shortcutEnabled: false });
    await flush();
    expect(shortcut().defaultPrevented).toBe(false);
    await flush();
    expect(element.shadowRoot?.querySelector('[role="dialog"]')).toBeNull();
    Object.assign(element, { shortcutEnabled: true });
    await flush();
    expect(shortcut().defaultPrevented).toBe(true);
    await flush();
    expect(element.shadowRoot?.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('supports the boolean attribute and disabling an open menu without consuming the shortcut', async () => {
    const onclose = vi.fn();
    const element = mount({ shortcutEnabled: false, onclose });
    element.setAttribute('shortcut-enabled', '');
    await flush();
    shortcut();
    await flush();
    expect(element.shadowRoot?.querySelector('[role="dialog"]')).not.toBeNull();
    Object.assign(element, { shortcutEnabled: false });
    await flush();
    expect(shortcut().defaultPrevented).toBe(false);
    expect(onclose).not.toHaveBeenCalled();
    expect((element.shadowRoot?.querySelector('.command-menu-dialog') as HTMLElement).inert).toBe(
      false
    );
  });
});
