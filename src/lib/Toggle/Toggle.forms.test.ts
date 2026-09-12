import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Toggle from './Toggle.svelte';

describe('Toggle native forms', () => {
  let form: HTMLFormElement;

  beforeEach(() => {
    form = document.createElement('form');
    form.id = 'toggle-form';
    document.body.append(form);
  });

  afterEach(() => form.remove());

  it('keeps submission opt-in and uses the native on value by default', async () => {
    const { rerender } = render(Toggle, {
      target: form,
      props: { text: 'Updates', checked: true }
    });
    expect([...new FormData(form)]).toEqual([]);
    await rerender({ name: 'updates' });
    expect([...new FormData(form)]).toEqual([['updates', 'on']]);
  });

  it('submits current visible state and preserves click callbacks', async () => {
    const onclick = vi.fn();
    const { getByRole } = render(Toggle, {
      target: form,
      props: { text: 'Updates', name: 'updates', value: 'enabled', onclick }
    });
    const input = getByRole('checkbox');
    expect(new FormData(form).has('updates')).toBe(false);
    await fireEvent.click(input);
    expect(new FormData(form).get('updates')).toBe('enabled');
    expect(input.dataset.state).toBe('checked');
    await fireEvent.click(input);
    expect(new FormData(form).has('updates')).toBe(false);
    expect(input.dataset.state).toBe('unchecked');
    expect(onclick.mock.calls).toEqual([[true], [false]]);
  });

  it('validates required state and omits disabled controls', async () => {
    const { getByRole, rerender } = render(Toggle, {
      target: form,
      props: { text: 'Updates', name: 'updates', required: true }
    });
    const input = getByRole('checkbox');
    expect(form.checkValidity()).toBe(false);
    await fireEvent.click(input);
    expect(form.checkValidity()).toBe(true);
    await rerender({ disabled: true });
    expect(input.hasAttribute('data-disabled')).toBe(true);
    expect(new FormData(form).has('updates')).toBe(false);
    await rerender({ checked: false });
    expect(form.checkValidity()).toBe(true);
    await rerender({ disabled: false });
    expect(input.hasAttribute('data-disabled')).toBe(false);
    expect(form.checkValidity()).toBe(false);
  });

  it('supports external form association and prop-driven updates', async () => {
    const { rerender } = render(Toggle, {
      text: 'External',
      name: 'external',
      value: 'yes',
      checked: true,
      form: form.id
    });
    expect(new FormData(form).get('external')).toBe('yes');
    await rerender({ value: 'updated' });
    expect(new FormData(form).get('external')).toBe('updated');
    await rerender({ checked: false });
    expect(new FormData(form).has('external')).toBe(false);
  });
});
