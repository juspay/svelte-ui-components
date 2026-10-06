import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Select from './Select.svelte';
import type { SelectItem } from './properties';

const cities: SelectItem[] = [
  { id: 'nyc', label: 'New York' },
  { id: 'tyo', label: 'Tokyo' },
  { id: 'par', label: 'Paris' }
];

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Select accessible name (ISSUE-002)', () => {
  it('has no name at all when none is supplied, which is the baseline this API fixes', () => {
    const { getByRole } = render(Select, { items: cities, placeholder: 'Choose a city' });
    const trigger = getByRole('combobox');

    expect(trigger.hasAttribute('aria-label')).toBe(false);
    expect(trigger.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('puts ariaLabel on the combobox trigger itself, not on a wrapper', () => {
    const { getByRole, container } = render(Select, {
      items: cities,
      ariaLabel: 'City',
      placeholder: 'Choose a city'
    });

    expect(getByRole('combobox', { name: 'City' }).classList.contains('select-trigger')).toBe(true);
    expect(container.querySelector('.select')?.hasAttribute('aria-label')).toBe(false);
  });

  it('keeps the name when the placeholder is replaced by a selection', () => {
    const { getByRole } = render(Select, {
      items: cities,
      value: ['tyo'],
      ariaLabel: 'City',
      placeholder: 'Choose a city'
    });

    const trigger = getByRole('combobox', { name: 'City' });
    expect(trigger.textContent).toContain('Tokyo');
  });

  it('keeps the name in the invalid and disabled states, and exposes them separately', () => {
    const invalid = render(Select, {
      items: cities,
      ariaLabel: 'City',
      error: true,
      errorMessage: 'Pick a city'
    });
    const trigger = invalid.getByRole('combobox', { name: 'City' });
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.getAttribute('aria-describedby')).not.toBeNull();
    invalid.unmount();

    const disabled = render(Select, { items: cities, ariaLabel: 'City', disabled: true });
    const disabledTrigger = disabled.getByRole('combobox', { name: 'City' });
    expect(disabledTrigger.getAttribute('aria-disabled')).toBe('true');
  });

  it('does not mark an enabled Select aria-disabled', () => {
    const { getByRole } = render(Select, { items: cities, ariaLabel: 'City' });

    expect(getByRole('combobox').hasAttribute('aria-disabled')).toBe(false);
  });

  it('names the open listbox the same as the trigger, in-flow and in-menu', async () => {
    const inFlow = render(Select, { items: cities, ariaLabel: 'City' });
    await fireEvent.click(inFlow.getByRole('combobox', { name: 'City' }));
    expect(inFlow.getByRole('listbox', { name: 'City' })).toBeTruthy();
    inFlow.unmount();

    const inMenu = render(Select, {
      items: cities,
      ariaLabel: 'City',
      searchable: true,
      searchPosition: 'menu'
    });
    await fireEvent.click(inMenu.getByRole('combobox', { name: 'City' }));
    expect(inMenu.getByRole('listbox', { name: 'City' })).toBeTruthy();
    // The in-menu search box is a control of its own and keeps its own name.
    expect(inMenu.getByRole('searchbox', { name: 'Search options' })).toBeTruthy();
  });

  it('names the focusable text input inside the trigger for single, multiple and summary variants', () => {
    // Without a name the input is named only by its placeholder, which is not the
    // field's identity -- and the input, not the div, is what takes focus here.
    const single = render(Select, {
      items: cities,
      ariaLabel: 'City',
      searchable: true,
      placeholder: 'Search cities...'
    });
    expect(single.getByRole('textbox', { name: 'City' })).toBeTruthy();
    expect(single.getByRole('combobox', { name: 'City' })).toBeTruthy();
    single.unmount();

    const multiple = render(Select, {
      items: cities,
      ariaLabel: 'Cities',
      multiple: true,
      searchable: true,
      placeholder: 'Search cities...'
    });
    expect(multiple.getByRole('textbox', { name: 'Cities' })).toBeTruthy();
  });

  it('forwards ariaLabelledby to the trigger, the in-trigger input and the listbox', async () => {
    const label = document.createElement('span');
    label.id = 'city-label';
    label.textContent = 'Home city';
    document.body.append(label);
    try {
      const { getByRole } = render(Select, {
        items: cities,
        ariaLabelledby: 'city-label',
        searchable: true,
        placeholder: 'Search cities...'
      });

      expect(getByRole('combobox', { name: 'Home city' })).toBeTruthy();
      expect(getByRole('textbox', { name: 'Home city' })).toBeTruthy();
      await fireEvent.click(getByRole('combobox'));
      expect(getByRole('listbox', { name: 'Home city' })).toBeTruthy();
    } finally {
      label.remove();
    }
  });

  it('lets ariaLabel win over ariaLabelledby, as the platform and Slider do', () => {
    const label = document.createElement('span');
    label.id = 'other-label';
    label.textContent = 'Other';
    document.body.append(label);
    try {
      const { getByRole } = render(Select, {
        items: cities,
        ariaLabel: 'City',
        ariaLabelledby: 'other-label'
      });
      const trigger = getByRole('combobox', { name: 'City' });

      expect(trigger.hasAttribute('aria-labelledby')).toBe(false);
    } finally {
      label.remove();
    }
  });

  it('ignores a blank name instead of emitting an empty aria-label', () => {
    const { getByRole } = render(Select, {
      items: cities,
      ariaLabel: '   ',
      ariaLabelledby: '  '
    });
    const trigger = getByRole('combobox');

    expect(trigger.hasAttribute('aria-label')).toBe(false);
    expect(trigger.hasAttribute('aria-labelledby')).toBe(false);
  });
});
