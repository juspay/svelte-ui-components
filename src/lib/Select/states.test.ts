import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Select from './Select.svelte';

const items = ['Apple', 'Banana', 'Cherry'];

describe('Select error and clear states', () => {
  it('does not announce whitespace-only errors', () => {
    const { container, queryByRole } = render(Select, { items, error: true, errorMessage: ' \n ' });
    expect(queryByRole('alert')).toBeNull();
    expect(container.querySelector('.select-trigger')?.hasAttribute('aria-describedby')).toBe(
      false
    );
  });

  it.each([false, true])('describes the actual searchable control with multiple=%s', (multiple) => {
    const { container, getByRole } = render(Select, {
      items,
      multiple,
      searchable: true,
      error: true,
      errorMessage: 'Required'
    });
    const input = container.querySelector('input');
    expect(input?.getAttribute('aria-invalid')).toBe('true');
    expect(input?.getAttribute('aria-describedby')).toBe(getByRole('alert').id);
  });

  it('removes stale error references when error is cleared', async () => {
    const { container, rerender, queryByRole } = render(Select, {
      items,
      error: true,
      errorMessage: 'Required'
    });
    await rerender({ items, error: false, errorMessage: 'Required' });
    expect(queryByRole('alert')).toBeNull();
    expect(container.querySelector('.select-trigger')?.hasAttribute('aria-invalid')).toBe(false);
    expect(container.querySelector('.select-trigger')?.hasAttribute('aria-describedby')).toBe(
      false
    );
  });

  it.each([false, true])(
    'clears every selected value exactly once with multiple=%s',
    async (multiple) => {
      const onchange = vi.fn();
      const onclear = vi.fn();
      const { getByRole, queryByRole } = render(Select, {
        items,
        multiple,
        value: ['Apple', 'Banana'],
        clearable: true,
        onchange,
        onclear
      });
      await fireEvent.click(getByRole('button', { name: 'Clear selection' }));
      expect(onchange).toHaveBeenCalledExactlyOnceWith([]);
      expect(onclear).toHaveBeenCalledTimes(1);
      expect(queryByRole('button', { name: 'Clear selection' })).toBeNull();
      expect(queryByRole('listbox')).toBeNull();
    }
  );

  it('tracks programmatic values and hides clear when disabled', async () => {
    const { queryByRole, rerender } = render(Select, { items, value: [], clearable: true });
    expect(queryByRole('button', { name: 'Clear selection' })).toBeNull();
    await rerender({ items, value: ['Apple'], clearable: true });
    expect(queryByRole('button', { name: 'Clear selection' })).not.toBeNull();
    await rerender({ items, value: ['Apple'], clearable: true, disabled: true });
    expect(queryByRole('button', { name: 'Clear selection' })).toBeNull();
  });
});
