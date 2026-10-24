import { createRawSnippet } from 'svelte';
import { render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import Select from './Select.svelte';
import type { SelectItem } from './properties';
import '../../wc/components/Select.wc.svelte';

const flushCustomElement = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
const originalSetFormValue = Object.getOwnPropertyDescriptor(
  ElementInternals.prototype,
  'setFormValue'
);
const originalSetValidity = Object.getOwnPropertyDescriptor(
  ElementInternals.prototype,
  'setValidity'
);

beforeAll(() => {
  // jsdom exposes ElementInternals but omits these form-associated methods.
  Object.defineProperty(ElementInternals.prototype, 'setFormValue', {
    configurable: true,
    value: () => {}
  });
  Object.defineProperty(ElementInternals.prototype, 'setValidity', {
    configurable: true,
    value: () => {}
  });
});

afterAll(() => {
  if (originalSetFormValue) {
    Object.defineProperty(ElementInternals.prototype, 'setFormValue', originalSetFormValue);
  } else {
    Reflect.deleteProperty(ElementInternals.prototype, 'setFormValue');
  }
  if (originalSetValidity) {
    Object.defineProperty(ElementInternals.prototype, 'setValidity', originalSetValidity);
  } else {
    Reflect.deleteProperty(ElementInternals.prototype, 'setValidity');
  }
});

describe('Select accessible name', () => {
  it.each([
    { multiple: false },
    { multiple: true },
    {
      multiple: true,
      triggerSummary: createRawSnippet(() => ({ render: () => '<span>Selection</span>' }))
    }
  ])('names the tabbable trigger-search input in every rendering branch (%j)', (props) => {
    const { getByRole } = render(Select, {
      items: ['Shop'],
      searchable: true,
      ariaLabel: 'Choose a shop',
      ...props
    });
    expect(getByRole('textbox', { name: 'Choose a shop' })).toBeTruthy();
  });

  it('forwards ariaLabel to the combobox trigger and removes it when cleared', async () => {
    const { getByRole, rerender } = render(Select, { items: ['Shop'] });
    const trigger = getByRole('combobox');

    expect(trigger.hasAttribute('aria-label')).toBe(false);

    await rerender({ ariaLabel: 'Choose a shop' });
    expect(trigger.getAttribute('aria-label')).toBe('Choose a shop');

    await rerender({ ariaLabel: void 0 });
    expect(trigger.hasAttribute('aria-label')).toBe(false);
  });

  it('reflects the WC aria-label attribute through the non-conflicting property', async () => {
    const element = document.createElement('sui-select') as HTMLElement & {
      items: string[];
      selectAriaLabel?: string;
    };
    element.items = ['Shop'];
    element.selectAriaLabel = 'Choose a shop';
    document.body.append(element);
    await flushCustomElement();

    expect(element.getAttribute('aria-label')).toBe('Choose a shop');
    expect(element.shadowRoot?.querySelector('[role="combobox"]')?.getAttribute('aria-label')).toBe(
      'Choose a shop'
    );

    element.removeAttribute('aria-label');
    await flushCustomElement();
    expect(element.shadowRoot?.querySelector('[role="combobox"]')?.hasAttribute('aria-label')).toBe(
      false
    );
    element.remove();
  });
});

describe('Select WC compact labels', () => {
  it('preserves item metadata through the items property and exposes the full accessible label', async () => {
    const element = document.createElement('sui-select') as HTMLElement & {
      items: SelectItem[];
      value: string[];
    };
    element.items = [{ id: 'IN', label: 'India (+91)', displayLabel: '+91' }];
    element.value = ['IN'];
    document.body.append(element);
    try {
      await flushCustomElement();
      expect(
        element.shadowRoot?.querySelector('.select-value [aria-hidden="true"]')?.textContent
      ).toBe('+91');
      expect(element.shadowRoot?.querySelector('.select-a11y-value')?.textContent).toBe(
        'India (+91)'
      );
    } finally {
      element.remove();
    }
  });
});
