import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Radio from './Radio.svelte';
import RadioForm from './RadioForm.test.svelte';

describe('Radio native forms', () => {
  let form: HTMLFormElement;

  beforeEach(() => {
    form = document.createElement('form');
    form.id = 'radio-form';
    document.body.append(form);
  });

  afterEach(() => form.remove());

  it('validates a bound required group and submits only the current choice', async () => {
    const { getByRole } = render(RadioForm, { target: form });
    const card = getByRole('radio', { name: 'Card' });
    const upi = getByRole('radio', { name: 'UPI' });
    expect(form.checkValidity()).toBe(false);
    expect([...new FormData(form)]).toEqual([]);
    await fireEvent.click(card);
    expect(form.checkValidity()).toBe(true);
    expect([...new FormData(form)]).toEqual([['payment', 'card']]);
    await fireEvent.click(upi);
    expect([...new FormData(form)]).toEqual([['payment', 'upi']]);
    expect(card.dataset.state).toBe('unchecked');
    expect(upi.dataset.state).toBe('checked');
  });

  it('supports external forms and preserves change callbacks', async () => {
    const onchange = vi.fn();
    const { getByRole } = render(Radio, {
      name: 'payment',
      value: 'card',
      text: 'Card',
      required: true,
      form: form.id,
      onchange
    });
    expect(form.checkValidity()).toBe(false);
    await fireEvent.click(getByRole('radio'));
    expect(onchange).toHaveBeenCalledExactlyOnceWith('card');
    expect(form.checkValidity()).toBe(true);
    expect(new FormData(form).get('payment')).toBe('card');
  });

  it('omits disabled radios and tracks parent-driven selection changes', async () => {
    const { getByRole, rerender } = render(Radio, {
      target: form,
      props: { name: 'payment', value: 'card', text: 'Card', required: true, selectedValue: 'card' }
    });
    const input = getByRole('radio');
    expect(new FormData(form).get('payment')).toBe('card');
    await rerender({ disabled: true });
    expect(input.hasAttribute('data-disabled')).toBe(true);
    expect(new FormData(form).has('payment')).toBe(false);
    await rerender({ selectedValue: '' });
    expect(form.checkValidity()).toBe(true);
    expect(input.dataset.state).toBe('unchecked');
    await rerender({ disabled: false });
    expect(input.hasAttribute('data-disabled')).toBe(false);
    expect(form.checkValidity()).toBe(false);
  });
});
