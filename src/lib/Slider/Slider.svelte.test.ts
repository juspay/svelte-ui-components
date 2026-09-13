import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Slider from './Slider.svelte';

describe('Slider native forms and value text', () => {
  let form: HTMLFormElement;

  beforeEach(() => {
    form = document.createElement('form');
    form.id = 'slider-form';
    document.body.append(form);
  });

  afterEach(() => form.remove());

  it('keeps submission opt-in and submits the current native range value', async () => {
    const oninput = vi.fn();
    const onchange = vi.fn();
    const { getByRole, rerender } = render(Slider, {
      target: form,
      props: { value: 25, ariaLabel: 'Volume', oninput, onchange }
    });
    const input = getByRole('slider');
    expect([...new FormData(form)]).toEqual([]);
    await rerender({ name: 'volume' });
    expect(new FormData(form).get('volume')).toBe('25');
    await fireEvent.input(input, { target: { value: '65' } });
    expect(new FormData(form).get('volume')).toBe('65');
    expect(oninput).toHaveBeenCalledExactlyOnceWith(65);
    await fireEvent.change(input, { target: { value: '70' } });
    expect(new FormData(form).get('volume')).toBe('70');
    expect(onchange).toHaveBeenCalledExactlyOnceWith(70);
    expect(form.checkValidity()).toBe(true);
  });

  it('supports external forms and omits disabled sliders', async () => {
    const { getByRole, rerender } = render(Slider, {
      value: 40,
      name: 'volume',
      form: form.id,
      ariaLabel: 'Volume'
    });
    expect(new FormData(form).get('volume')).toBe('40');
    await rerender({ disabled: true });
    expect(new FormData(form).has('volume')).toBe(false);
    expect(getByRole('slider').hasAttribute('data-disabled')).toBe(true);
    await rerender({ disabled: false, value: 60 });
    expect(new FormData(form).get('volume')).toBe('60');
    expect(getByRole('slider').hasAttribute('data-disabled')).toBe(false);
  });

  it('omits value text unless supplied or formatted, with explicit text winning', async () => {
    const { getByRole, rerender } = render(Slider, { value: 30, ariaLabel: 'Volume' });
    const input = getByRole('slider');
    expect(input.hasAttribute('aria-valuetext')).toBe(false);
    await rerender({ labelFormatter: (value: number) => `${value} percent` });
    expect(input.getAttribute('aria-valuetext')).toBe('30 percent');
    await fireEvent.input(input, { target: { value: '45' } });
    expect(input.getAttribute('aria-valuetext')).toBe('45 percent');
    await rerender({ ariaValueText: 'Quiet' });
    expect(input.getAttribute('aria-valuetext')).toBe('Quiet');
    await rerender({ ariaValueText: '' });
    expect(input.getAttribute('aria-valuetext')).toBe('');
  });

  it('supports explicit value text without a formatter', () => {
    const { getByRole } = render(Slider, { value: 30, ariaValueText: 'Quiet' });
    expect(getByRole('slider').getAttribute('aria-valuetext')).toBe('Quiet');
  });

  it.each([
    { value: 50, min: 0, max: 100, percent: '50%' },
    { value: -10, min: 0, max: 100, percent: '0%' },
    { value: 200, min: 0, max: 100, percent: '100%' },
    { value: 5, min: 5, max: 5, percent: '0%' },
    { value: 10, min: 20, max: 0, percent: '0%' },
    { value: Number.NaN, min: 0, max: 100, percent: '0%' },
    { value: Number.POSITIVE_INFINITY, min: 0, max: 100, percent: '0%' },
    { value: 50, min: Number.NEGATIVE_INFINITY, max: 100, percent: '0%' },
    { value: 50, min: 0, max: Number.POSITIVE_INFINITY, percent: '0%' },
    { value: 50, min: Number.NaN, max: 100, percent: '0%' },
    { value: Number.MAX_VALUE, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, percent: '0%' },
    { value: Number.MAX_VALUE, min: 0, max: Number.MIN_VALUE, percent: '0%' }
  ])('clamps only the fill for $value in [$min, $max]', ({ value, min, max, percent }) => {
    const oninput = vi.fn();
    const onchange = vi.fn();
    const { getByRole, getByText } = render(Slider, {
      value,
      min,
      max,
      showValue: true,
      oninput,
      onchange
    });
    const input = getByRole('slider');
    expect(input.style.getPropertyValue('--slider-fill-percent')).toBe(percent);
    expect(getByText(String(value))).toBeTruthy();
    expect(oninput).not.toHaveBeenCalled();
    expect(onchange).not.toHaveBeenCalled();
  });
});
