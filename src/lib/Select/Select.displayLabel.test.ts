import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Select from './Select.svelte';

const originalScroll = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView');

const countries = [
  { id: 'IN', label: 'India (+91)', displayLabel: '+91' },
  { id: 'GB', label: 'United Kingdom (+44)', displayLabel: '+44' }
];

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn()
  });
});
afterEach(() => {
  if (originalScroll) {
    Object.defineProperty(Element.prototype, 'scrollIntoView', originalScroll);
  } else {
    Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Select compact single-selection labels', () => {
  it('keeps full labels in the options and accessible text while showing a compact value', async () => {
    const { getByRole, container } = render(Select, {
      items: countries,
      value: ['IN'],
      ariaLabel: 'Country'
    });
    expect(container.querySelector('.select-value [aria-hidden="true"]')?.textContent).toBe('+91');
    expect(container.querySelector('.select-a11y-value')?.textContent).toBe('India (+91)');
    await fireEvent.click(getByRole('combobox', { name: 'Country' }));
    expect(getByRole('option', { name: 'India (+91)' })).toBeTruthy();
    expect(getByRole('option', { name: 'United Kingdom (+44)' })).toBeTruthy();
  });

  it('searches full names and submits country ids instead of display labels', async () => {
    const onchange = vi.fn();
    const { getByRole, container } = render(Select, {
      items: countries,
      value: ['IN'],
      name: 'country',
      searchable: true,
      searchPosition: 'menu',
      ariaLabel: 'Country',
      onchange
    });
    await fireEvent.click(getByRole('combobox', { name: 'Country' }));
    await fireEvent.input(getByRole('searchbox'), { target: { value: 'United' } });
    await fireEvent.click(getByRole('option', { name: 'United Kingdom (+44)' }));
    expect(onchange).toHaveBeenLastCalledWith(['GB']);
    expect(container.querySelector('input[type="hidden"]')?.getAttribute('value')).toBe('GB');
    expect(container.querySelector('.select-value [aria-hidden="true"]')?.textContent).toBe('+44');
  });

  it('preserves the original single label when no compact value is supplied', () => {
    const { container } = render(Select, {
      items: [{ id: 'IN', label: 'India (+91)', displayLabel: '' }],
      value: ['IN']
    });
    expect(container.querySelector('.select-value')?.textContent?.trim()).toBe('India (+91)');
  });

  it('retains full labels for editable trigger search and multiple selections', () => {
    const input = render(Select, {
      items: countries,
      value: ['IN'],
      searchable: true,
      ariaLabel: 'Country'
    });
    expect((input.getByRole('textbox') as HTMLInputElement).value).toBe('India (+91)');
    input.unmount();
    const multi = render(Select, { items: countries, value: ['IN'], multiple: true });
    expect(multi.container.querySelector('.pill')?.textContent).toContain('India (+91)');
  });
});

describe('Select portal theme contract', () => {
  it('retains scoped variables and refreshes them when the owner changes', async () => {
    const { container, getByRole, queryByRole } = render(Select, {
      items: countries,
      value: ['IN'],
      ariaLabel: 'Country',
      usePortal: true
    });
    const owner = container.querySelector('.select') as HTMLElement;
    owner.style.setProperty('--select-dropdown-background', '#111111');
    owner.style.setProperty('--select-option-color', '#ffffff');
    await fireEvent.click(getByRole('combobox', { name: 'Country' }));
    const panel = getByRole('listbox');
    expect(panel.parentElement).toBe(document.body);
    await waitFor(() =>
      expect(panel.style.getPropertyValue('--select-dropdown-background')).toBe('#111111')
    );
    expect(panel.style.getPropertyValue('--select-option-color')).toBe('#ffffff');
    owner.style.setProperty('--select-dropdown-background', '#222222');
    await waitFor(() =>
      expect(panel.style.getPropertyValue('--select-dropdown-background')).toBe('#222222')
    );
    await fireEvent.keyDown(getByRole('combobox', { name: 'Country' }), { key: 'Escape' });
    expect(queryByRole('listbox')).toBeNull();
  });
});
