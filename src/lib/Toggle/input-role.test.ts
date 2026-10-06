import { fireEvent, render, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Toggle from './Toggle.svelte';

describe('Toggle native input semantics', () => {
  it('retains the native checkbox role when inputRole is omitted', () => {
    const { getByRole, queryByRole } = render(Toggle, { ariaLabel: 'Newsletters' });
    expect(getByRole('checkbox', { name: 'Newsletters' }).tagName).toBe('INPUT');
    expect(queryByRole('switch')).toBeNull();
  });

  it('exposes one native switch while preserving checked state, callback and form submission', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const onclick = vi.fn();
    const { container } = render(Toggle, {
      inputRole: 'switch',
      ariaLabel: 'Email alerts',
      name: 'alerts',
      value: 'enabled',
      onclick
    });
    // Associate the actual mounted component with its native form; no cloned
    // controls or synthetic submission data are used.
    form.append(container);
    const input = within(form).getByRole('switch', { name: 'Email alerts' }) as HTMLInputElement;
    expect(within(form).queryByRole('checkbox')).toBeNull();
    expect(input.checked).toBe(false);
    expect(new FormData(form).has('alerts')).toBe(false);
    await fireEvent.click(input);
    expect(input.checked).toBe(true);
    expect(onclick).toHaveBeenCalledExactlyOnceWith(true);
    expect(new FormData(form).get('alerts')).toBe('enabled');
    await fireEvent.click(input);
    expect(input.checked).toBe(false);
    expect(new FormData(form).has('alerts')).toBe(false);
  });
});
