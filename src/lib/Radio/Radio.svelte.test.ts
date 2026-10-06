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

/** What a real accessibility client resolves `aria-describedby` to: missing ids read as nothing. */
function describedText(element: Element): string | null {
  const ids = (element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
  if (ids.length === 0) {
    return null;
  }
  const resolved = ids.map((id) => document.getElementById(id)?.textContent?.trim() ?? null);
  return resolved.some((text) => text === null) ? '__DANGLING__' : resolved.join(' ');
}

describe('Radio validity semantics', () => {
  const ERROR = 'Choose a payment method.';
  const INFO = 'You can change this later.';

  it('describes an invalid radio by its error and marks it data-invalid, without the unsupported aria-invalid', () => {
    const { getByRole, getByText } = render(Radio, {
      name: 'payment',
      value: 'card',
      text: 'Card',
      errorMessage: ERROR
    });
    const radio = getByRole('radio', { name: 'Card' });

    expect(radio.hasAttribute('aria-invalid')).toBe(false);
    expect(radio.getAttribute('data-invalid')).toBe('');
    expect(describedText(radio)).toBe(ERROR);
    expect(getByText(ERROR).getAttribute('role')).toBe('alert');
  });

  it('keeps the helper text and the error together, in reading order', () => {
    const { getByRole } = render(Radio, {
      name: 'payment',
      value: 'card',
      text: 'Card',
      errorMessage: ERROR,
      infoMessage: INFO
    });

    expect(describedText(getByRole('radio'))).toBe(`${ERROR} ${INFO}`);
  });

  it('describes with helper text alone and does not mark the radio invalid', () => {
    const { getByRole } = render(Radio, {
      name: 'payment',
      value: 'card',
      text: 'Card',
      infoMessage: INFO
    });
    const radio = getByRole('radio');

    expect(describedText(radio)).toBe(INFO);
    expect(radio.hasAttribute('data-invalid')).toBe(false);
  });

  it('marks invalid without a message, and then references nothing rather than a missing id', () => {
    const { getByRole } = render(Radio, {
      name: 'payment',
      value: 'card',
      text: 'Card',
      invalid: true
    });
    const radio = getByRole('radio');

    expect(radio.getAttribute('data-invalid')).toBe('');
    expect(radio.hasAttribute('aria-describedby')).toBe(false);
    expect(radio.hasAttribute('aria-invalid')).toBe(false);
  });

  it('carries no description and no invalid state when no message is given', () => {
    const { getByRole } = render(Radio, { name: 'payment', value: 'card', text: 'Card' });
    const radio = getByRole('radio');

    expect(radio.hasAttribute('aria-describedby')).toBe(false);
    expect(radio.hasAttribute('data-invalid')).toBe(false);
  });

  it('still selects and reports the change while invalid', async () => {
    const onchange = vi.fn();
    const { getByRole } = render(Radio, {
      name: 'payment',
      value: 'card',
      text: 'Card',
      errorMessage: ERROR,
      onchange
    });
    const radio = getByRole('radio', { name: 'Card' });

    await fireEvent.click(radio);

    expect(onchange).toHaveBeenCalledExactlyOnceWith('card');
    expect(radio).toHaveProperty('checked', true);
    expect(radio.getAttribute('data-state')).toBe('checked');
  });

  it('puts the invalid state on a consumer radiogroup, which names the group and describes it once', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div role="radiogroup" aria-labelledby="pay-label" aria-invalid="true" aria-describedby="pay-error">
        <span id="pay-label">Payment method</span>
        <div id="slot"></div>
        <div id="pay-error" role="alert">${ERROR}</div>
      </div>`;
    document.body.append(host);
    const slot = host.querySelector<HTMLElement>('#slot');
    if (slot === null) {
      throw new Error('slot missing');
    }
    try {
      const upi = render(Radio, {
        target: slot,
        props: { name: 'pay', value: 'upi', text: 'UPI' }
      });
      const card = render(Radio, {
        target: slot,
        props: { name: 'pay', value: 'card', text: 'Card' }
      });

      const group = host.querySelector('[role="radiogroup"]');
      expect(group?.getAttribute('aria-invalid')).toBe('true');
      expect(describedText(group ?? host)).toBe(ERROR);
      expect(group?.querySelector('#pay-label')?.textContent).toBe('Payment method');
      // Each member keeps its own name and nothing it should not have.
      for (const radio of [
        upi.getByRole('radio', { name: 'UPI' }),
        card.getByRole('radio', { name: 'Card' })
      ]) {
        expect(radio.hasAttribute('aria-invalid')).toBe(false);
        expect(group?.contains(radio)).toBe(true);
      }

      await fireEvent.click(card.getByRole('radio', { name: 'Card' }));
      expect(card.getByRole('radio', { name: 'Card' })).toHaveProperty('checked', true);
      expect(upi.getByRole('radio', { name: 'UPI' })).toHaveProperty('checked', false);
    } finally {
      host.remove();
    }
  });
});
