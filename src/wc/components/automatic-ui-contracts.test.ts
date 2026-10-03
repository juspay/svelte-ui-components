import { fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import './CommandMenu.wc.svelte';
import './ChatComposer.wc.svelte';
import './HITL.wc.svelte';

// Real custom elements, as in dispatch-integration.test.ts. Svelte CE mounts and
// prop updates run on a microtask; a macrotask also flushes delayed disconnects.
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
const mounted: HTMLElement[] = [];
function mount(tag: string, props: Record<string, unknown> = {}, content = ''): HTMLElement {
  const element = document.createElement(tag);
  Object.assign(element, props);
  element.innerHTML = content;
  document.body.appendChild(element);
  mounted.push(element);
  return element;
}

const animationDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'animate');
beforeAll(() => {
  // jsdom lacks Web Animations, needed by CommandMenu's panel transition.
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    value: () =>
      new Proxy(
        { cancel: () => {}, finished: Promise.resolve(), onfinish: null },
        {
          set(target, key, value) {
            const result = Reflect.set(target, key, value);
            if (key === 'onfinish' && typeof value === 'function') {
              queueMicrotask(value);
            }
            return result;
          }
        }
      )
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

describe('CommandMenu custom-element query contract', () => {
  const items = [
    { label: 'New file', value: 'new' },
    { label: 'Open file', value: 'open' }
  ];

  it('preserves uncontrolled search and emits raw, bubbling/composed querychange events', async () => {
    const element = mount('sui-command-menu', { items, open: true });
    const observed = vi.fn();
    const parent = vi.fn();
    element.addEventListener('querychange', observed);
    document.body.addEventListener('querychange', parent);
    try {
      await flush();
      const input = element.shadowRoot?.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('');
      expect(element.hasAttribute('query')).toBe(false);
      await fireEvent.input(input, { target: { value: 'OPEN' } });
      expect(element.shadowRoot?.querySelectorAll('[role="option"]')).toHaveLength(1);
      expect(element.shadowRoot?.querySelector('[role="option"]')?.textContent).toContain(
        'Open file'
      );
      expect(observed).toHaveBeenCalledTimes(1);
      const event = observed.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toBe('OPEN');
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
      expect(parent).toHaveBeenCalledTimes(1);
    } finally {
      document.body.removeEventListener('querychange', parent);
    }
  });

  it('forwards external query attributes/property updates without echoing a change event', async () => {
    const element = mount('sui-command-menu', { items, open: true });
    element.setAttribute('query', 'New');
    const observed = vi.fn();
    element.addEventListener('querychange', observed);
    await flush();
    expect((element.shadowRoot?.querySelector('input') as HTMLInputElement).value).toBe('New');
    expect(element.shadowRoot?.querySelectorAll('[role="option"]')).toHaveLength(1);
    Object.assign(element, { query: 'Open' });
    await flush();
    expect((element.shadowRoot?.querySelector('input') as HTMLInputElement).value).toBe('Open');
    expect(element.shadowRoot?.querySelector('[role="option"]')?.textContent).toContain(
      'Open file'
    );
    expect(observed).not.toHaveBeenCalled();
  });

  it('accepts a late query callback that offers a dynamic Ask action and sees the close reset', async () => {
    const onselect = vi.fn();
    const element = mount('sui-command-menu', { items, open: true, onselect });
    await flush();
    const onquerychange = vi.fn((query: string) => {
      Object.assign(element, {
        query,
        items: query.trim() ? [{ label: `Ask Automatic: ${query}`, value: 'ask' }] : items
      });
    });
    Object.assign(element, { onquerychange });
    await flush();
    const observed = vi.fn();
    element.addEventListener('querychange', observed);
    const input = element.shadowRoot?.querySelector('input') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'why declines?' } });
    await flush();
    expect(element.shadowRoot?.querySelector('[role="option"]')?.textContent).toContain(
      'Ask Automatic: why declines?'
    );
    await fireEvent.keyDown(input, { key: 'Enter' });
    expect(onselect).toHaveBeenCalledExactlyOnceWith({
      label: 'Ask Automatic: why declines?',
      value: 'ask'
    });
    expect(onquerychange.mock.calls).toEqual([['why declines?'], ['']]);
    expect(observed.mock.calls.map(([event]) => (event as CustomEvent).detail)).toEqual([
      'why declines?',
      ''
    ]);
  });
});

describe('ChatComposer custom-element layout contract', () => {
  it('keeps the default row and accessible name without new markup or reflected layout', async () => {
    const element = mount('sui-chat-composer');
    await flush();
    const root = element.shadowRoot;
    expect(root?.querySelector('.control-row')).toBeNull();
    expect(root?.querySelector('textarea')?.parentElement?.classList.contains('input-row')).toBe(
      true
    );
    expect(root?.querySelector('textarea')?.getAttribute('aria-label')).toBe('Message');
    expect(element.hasAttribute('layout')).toBe(false);
  });

  it.each([false, true])(
    'forwards stacked layout with attachments-preview slot = %s',
    async (hasPreview) => {
      const onsubmit = vi.fn(() => false);
      const element = mount(
        'sui-chat-composer',
        {
          value: 'draft',
          onsubmit,
          inputAriaLabel: 'Ask Automatic',
          sendLabel: 'Send prompt'
        },
        hasPreview ? '<div slot="attachments-preview">Context</div>' : ''
      );
      element.setAttribute('layout', 'stacked');
      await flush();
      const root = element.shadowRoot;
      const textRow = root?.querySelector('.text-row');
      const controls = root?.querySelector('.control-row');
      expect(textRow?.nextElementSibling).toBe(controls);
      expect(textRow?.querySelector('textarea')?.getAttribute('aria-label')).toBe('Ask Automatic');
      const send = controls?.querySelector('button[aria-label="Send prompt"]') as HTMLButtonElement;
      expect(send).not.toBeNull();
      await fireEvent.click(send);
      expect(onsubmit).toHaveBeenCalledExactlyOnceWith('draft', []);
      expect((root?.querySelector('textarea') as HTMLTextAreaElement).value).toBe('draft');
      if (hasPreview) {
        const slot = root?.querySelector('slot[name="attachments-preview"]') as HTMLSlotElement;
        expect(slot.assignedElements()[0]?.textContent).toBe('Context');
      }
      Object.assign(element, { layout: 'row' });
      await flush();
      expect(root?.querySelector('.control-row')).toBeNull();
      expect((root?.querySelector('textarea') as HTMLTextAreaElement).value).toBe('draft');
    }
  );
});

describe('HITL custom-element details contract', () => {
  const props = { confirmationId: 'change', hITLTitle: 'Apply change', countdownSeconds: 0 };
  const content = '<pre slot="details" aria-label="Change preview">- old\n+ new</pre>';

  it('forwards confirmDisabled reactively without disabling Reject', async () => {
    const onconfirm = vi.fn();
    const element = mount('sui-hitl', { ...props, confirmDisabled: true, onconfirm });
    await flush();
    const confirm = element.shadowRoot?.querySelector(
      '.confirm-button button'
    ) as HTMLButtonElement;
    const reject = element.shadowRoot?.querySelector('.cancel-button button') as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    expect(reject.disabled).toBe(false);
    await fireEvent.click(confirm);
    expect(onconfirm).not.toHaveBeenCalled();
    Object.assign(element, { confirmDisabled: false });
    await flush();
    expect(confirm.disabled).toBe(false);
    await fireEvent.click(confirm);
    await flush();
    expect(onconfirm).toHaveBeenCalledExactlyOnceWith({
      confirmationId: 'change',
      action: 'approved',
      approved: true
    });
  });

  it('keeps fallback sections when a details slot is only nested inside another child', async () => {
    const element = mount(
      'sui-hitl',
      { ...props, sections: [{ label: 'Target', value: 'payments.ts' }] },
      '<div><pre slot="details">Not an assignable direct child</pre></div>'
    );
    await flush();
    expect(element.shadowRoot?.textContent).toContain('payments.ts');
    expect(element.shadowRoot?.querySelector('.rich-details')).toBeNull();
  });

  it('keeps sections and default buttons when no details slot is supplied', async () => {
    const element = mount('sui-hitl', {
      ...props,
      sections: [{ label: 'Target', value: 'payments.ts' }]
    });
    await flush();
    expect(element.shadowRoot?.querySelector('.parameter-value')?.textContent).toBe('payments.ts');
    expect(element.shadowRoot?.querySelectorAll('.action-buttons button')).toHaveLength(2);
    expect(element.shadowRoot?.querySelector('.rich-details')).toBeNull();
    expect(element.shadowRoot?.querySelector('slot[name="details"]')).toBeNull();
  });

  it('keeps argument formatting/no-parameters fallback without claiming an empty detail snippet', async () => {
    const element = mount('sui-hitl', { ...props, functionArguments: { enabled: true } });
    await flush();
    expect(element.shadowRoot?.querySelector('.parameter-value')?.textContent).toBe('Yes');
    Object.assign(element, { functionArguments: {} });
    await flush();
    expect(element.shadowRoot?.querySelector('.parameter-value')?.textContent).toBe(
      'No parameters'
    );
  });

  it('projects the same details slot through pending and locally approved state', async () => {
    const onconfirm = vi.fn();
    const element = mount('sui-hitl', { ...props, onconfirm }, content);
    await flush();
    const slot = element.shadowRoot?.querySelector('slot[name="details"]') as HTMLSlotElement;
    const detail = element.querySelector('[slot="details"]');
    expect(slot.assignedElements()).toEqual([detail]);
    expect(element.shadowRoot?.querySelector('.params')).toBeNull();
    const confirm = element.shadowRoot?.querySelector(
      '.confirm-button button'
    ) as HTMLButtonElement;
    await fireEvent.click(confirm);
    await flush();
    expect(onconfirm).toHaveBeenCalledExactlyOnceWith({
      confirmationId: 'change',
      action: 'approved',
      approved: true
    });
    expect(element.shadowRoot?.querySelector('slot[name="details"]')).toBe(slot);
    expect(slot.assignedElements()).toEqual([detail]);
    expect(element.shadowRoot?.querySelector('.completion-text')?.textContent?.trim()).toBe(
      'Approved'
    );
    expect(element.shadowRoot?.querySelector('.action-buttons')).toBeNull();
  });

  it.each([
    [{ approved: true }, 'Approved'],
    [{ approved: false }, 'Action halted'],
    [{ status: 'EXPIRED' }, 'Action timed out']
  ])('projects details in resolved history %j', async (initialState, label) => {
    const onconfirm = vi.fn();
    const element = mount(
      'sui-hitl',
      { ...props, isHistoryMode: true, initialState, onconfirm },
      content
    );
    await flush();
    const slot = element.shadowRoot?.querySelector('slot[name="details"]') as HTMLSlotElement;
    expect(slot.assignedElements()[0]).toBe(element.querySelector('[slot="details"]'));
    expect(element.shadowRoot?.querySelector('.completion-text')?.textContent?.trim()).toBe(label);
    expect(element.shadowRoot?.querySelector('.action-buttons')).toBeNull();
    expect(onconfirm).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'accepts JS-assigned Snippets with details slot = %s (JS wins)',
    async (hasSlot) => {
      const details = createRawSnippet(() => ({ render: () => '<pre>JS detail</pre>' }));
      const element = mount('sui-hitl', { ...props, details }, hasSlot ? content : '');
      await flush();
      expect(element.shadowRoot?.querySelector('.rich-details')?.textContent).toBe('JS detail');
      expect(element.shadowRoot?.querySelector('slot[name="details"]')).toBeNull();
      const updated = createRawSnippet(() => ({ render: () => '<pre>Updated detail</pre>' }));
      Object.assign(element, { details: updated });
      await flush();
      expect(element.shadowRoot?.querySelector('.rich-details')?.textContent).toBe(
        'Updated detail'
      );
    }
  );

  it('does not interpret a JSON details attribute as a Svelte Snippet', async () => {
    const element = mount('sui-hitl', {
      ...props,
      sections: [{ label: 'Target', value: 'payments.ts' }]
    });
    element.setAttribute('details', '{"label":"Not a snippet"}');
    await flush();
    expect(element.shadowRoot?.querySelector('.parameter-value')?.textContent).toBe('payments.ts');
    expect(element.shadowRoot?.querySelector('.rich-details')).toBeNull();
  });
});
