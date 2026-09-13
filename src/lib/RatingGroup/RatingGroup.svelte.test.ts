import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RatingGroup from './RatingGroup.svelte';

/** Stubs every element's rect to a fixed 20px-wide box so a `clientX` in a click event
 *  deterministically lands in the left or right half -- jsdom never computes real
 *  layout, so without this every rect is {0,0,0,0} and left/right cannot be told apart. */
function stubStarRects(): void {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    left: 0,
    right: 20,
    top: 0,
    bottom: 20,
    width: 20,
    height: 20,
    x: 0,
    y: 0,
    toJSON: () => ({})
  }));
}

function star(container: HTMLElement, testId: string, index: number): HTMLElement {
  const el = container.querySelector(`[data-pw="${testId}-star-${index}"]`);
  if (!(el instanceof HTMLElement)) {
    throw new Error(`star ${index} not found`);
  }
  return el;
}

describe('RatingGroup rendering and ARIA', () => {
  it('renders `max` stars and reports the ARIA slider contract for the default value', () => {
    const { getByRole } = render(RatingGroup, { testId: 'rating' });
    const group = getByRole('slider');
    expect(group.getAttribute('aria-valuemin')).toBe('0');
    expect(group.getAttribute('aria-valuemax')).toBe('5');
    expect(group.getAttribute('aria-valuenow')).toBe('0');
    expect(group.getAttribute('aria-valuetext')).toBe('0 out of 5 stars');
    expect(group.getAttribute('aria-label')).toBe('Rating');
    expect(group.tabIndex).toBe(0);
  });

  it('honours a custom `max` and reflects a mid-range `value` in the ARIA contract', () => {
    const { getByRole } = render(RatingGroup, { value: 3, max: 10 });
    const group = getByRole('slider');
    expect(group.getAttribute('aria-valuemax')).toBe('10');
    expect(group.getAttribute('aria-valuenow')).toBe('3');
    expect(group.getAttribute('aria-valuetext')).toBe('3 out of 10 stars');
  });

  it('renders exactly `max` star elements', () => {
    const { container } = render(RatingGroup, { testId: 'rating', max: 3 });
    expect(container.querySelectorAll('[data-pw^="rating-star-"]').length).toBe(3);
  });

  it.each([
    { value: Number.NaN, valuenow: '0', text: '0 out of 5 stars' },
    { value: -3, valuenow: '0', text: '0 out of 5 stars' },
    { value: 999, valuenow: '5', text: '5 out of 5 stars' },
    { value: Number.POSITIVE_INFINITY, valuenow: '5', text: '5 out of 5 stars' },
    { value: Number.NEGATIVE_INFINITY, valuenow: '0', text: '0 out of 5 stars' }
  ])(
    'clamps a non-finite or out-of-range value ($value) instead of letting it through',
    ({ value, valuenow, text }) => {
      const { getByRole } = render(RatingGroup, { value });
      const group = getByRole('slider');
      expect(group.getAttribute('aria-valuenow')).toBe(valuenow);
      expect(group.getAttribute('aria-valuetext')).toBe(text);
    }
  );

  it('renders no stars and a 0/0 ARIA contract for an invalid `max`', () => {
    const { getByRole, container } = render(RatingGroup, { testId: 'rating', max: -1 });
    const group = getByRole('slider');
    expect(group.getAttribute('aria-valuemax')).toBe('0');
    expect(group.getAttribute('aria-valuenow')).toBe('0');
    expect(container.querySelectorAll('[data-pw^="rating-star-"]').length).toBe(0);
  });

  it('rounds a fractional value to the nearest whole star unless allowHalf is set', async () => {
    const { getByRole, rerender } = render(RatingGroup, { value: 2.7 });
    const group = getByRole('slider');
    expect(group.getAttribute('aria-valuenow')).toBe('3');
    await rerender({ value: 2.7, allowHalf: true });
    expect(group.getAttribute('aria-valuenow')).toBe('2.5');
  });
});

describe('RatingGroup pointer interaction', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sets a whole-star value on click when allowHalf is off, regardless of click position', async () => {
    stubStarRects();
    const onchange = vi.fn();
    const { container } = render(RatingGroup, { testId: 'rating', onchange });
    await fireEvent.click(star(container, 'rating', 3), { clientX: 2 });
    expect(onchange).toHaveBeenCalledExactlyOnceWith(3);
    await fireEvent.click(star(container, 'rating', 2), { clientX: 18 });
    expect(onchange).toHaveBeenLastCalledWith(2);
  });

  it('sets a half-star value from the left half of a star and a whole value from the right half', async () => {
    stubStarRects();
    const onchange = vi.fn();
    const { container } = render(RatingGroup, { testId: 'rating', allowHalf: true, onchange });
    await fireEvent.click(star(container, 'rating', 3), { clientX: 4 });
    expect(onchange).toHaveBeenLastCalledWith(2.5);
    await fireEvent.click(star(container, 'rating', 3), { clientX: 16 });
    expect(onchange).toHaveBeenLastCalledWith(3);
  });

  it('focuses the group itself on click, since the stars are not their own tab stop', async () => {
    stubStarRects();
    const { container, getByRole } = render(RatingGroup, { testId: 'rating' });
    await fireEvent.click(star(container, 'rating', 1), { clientX: 10 });
    expect(document.activeElement).toBe(getByRole('slider'));
  });

  it('ignores clicks while disabled or readonly', async () => {
    stubStarRects();
    const onchange = vi.fn();
    const { container, rerender } = render(RatingGroup, {
      testId: 'rating',
      disabled: true,
      onchange
    });
    await fireEvent.click(star(container, 'rating', 4), { clientX: 10 });
    expect(onchange).not.toHaveBeenCalled();
    await rerender({ disabled: false, readonly: true });
    await fireEvent.click(star(container, 'rating', 4), { clientX: 10 });
    expect(onchange).not.toHaveBeenCalled();
  });
});

describe('RatingGroup keyboard interaction', () => {
  it('increments and decrements by one whole step and clamps rather than wraps', async () => {
    const onchange = vi.fn();
    const { getByRole } = render(RatingGroup, { value: 5, max: 5, onchange });
    const group = getByRole('slider');
    await fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(onchange).not.toHaveBeenCalled();
    expect(group.getAttribute('aria-valuenow')).toBe('5');
    await fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(onchange).toHaveBeenLastCalledWith(4);
    await fireEvent.keyDown(group, { key: 'ArrowDown' });
    expect(onchange).toHaveBeenLastCalledWith(3);
    await fireEvent.keyDown(group, { key: 'ArrowUp' });
    expect(onchange).toHaveBeenLastCalledWith(4);
    expect(group.getAttribute('aria-valuenow')).toBe('4');
  });

  it('clamps at the minimum instead of wrapping past zero', async () => {
    const onchange = vi.fn();
    const { getByRole } = render(RatingGroup, { value: 0, onchange });
    const group = getByRole('slider');
    await fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(onchange).not.toHaveBeenCalled();
    expect(group.getAttribute('aria-valuenow')).toBe('0');
  });

  it('jumps to the extremes on Home and End', async () => {
    const onchange = vi.fn();
    const { getByRole } = render(RatingGroup, { value: 2, max: 5, onchange });
    const group = getByRole('slider');
    await fireEvent.keyDown(group, { key: 'End' });
    expect(onchange).toHaveBeenLastCalledWith(5);
    expect(group.getAttribute('aria-valuenow')).toBe('5');
    await fireEvent.keyDown(group, { key: 'Home' });
    expect(onchange).toHaveBeenLastCalledWith(0);
    expect(group.getAttribute('aria-valuenow')).toBe('0');
  });

  it('moves by half a star when allowHalf is set', async () => {
    const onchange = vi.fn();
    const { getByRole } = render(RatingGroup, { value: 2, allowHalf: true, onchange });
    const group = getByRole('slider');
    await fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(onchange).toHaveBeenLastCalledWith(2.5);
    await fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(onchange).toHaveBeenLastCalledWith(2);
  });

  it('ignores arrow keys, Home and End while disabled or readonly', async () => {
    const onchange = vi.fn();
    const { getByRole, rerender } = render(RatingGroup, {
      value: 2,
      readonly: true,
      onchange
    });
    const group = getByRole('slider');
    expect(group.tabIndex).toBe(0);
    await fireEvent.keyDown(group, { key: 'ArrowRight' });
    await fireEvent.keyDown(group, { key: 'End' });
    expect(onchange).not.toHaveBeenCalled();
    expect(group.getAttribute('aria-readonly')).toBe('true');
    await rerender({ readonly: false, disabled: true });
    expect(group.tabIndex).toBe(-1);
    await fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(onchange).not.toHaveBeenCalled();
    expect(group.getAttribute('aria-disabled')).toBe('true');
  });

  it('ignores modified arrow keys so browser/OS shortcuts on top of them keep working', async () => {
    const onchange = vi.fn();
    const { getByRole } = render(RatingGroup, { value: 2, onchange });
    const group = getByRole('slider');
    await fireEvent.keyDown(group, { key: 'ArrowRight', ctrlKey: true });
    await fireEvent.keyDown(group, { key: 'ArrowRight', metaKey: true });
    await fireEvent.keyDown(group, { key: 'ArrowRight', shiftKey: true });
    await fireEvent.keyDown(group, { key: 'ArrowRight', altKey: true });
    expect(onchange).not.toHaveBeenCalled();
  });
});

describe('RatingGroup native form participation', () => {
  let form: HTMLFormElement;

  beforeEach(() => {
    form = document.createElement('form');
    form.id = 'rating-form';
    document.body.append(form);
  });

  afterEach(() => form.remove());

  it('keeps submission opt-in and omits the unrated (0) state even when named', async () => {
    const { rerender } = render(RatingGroup, { target: form, props: { value: 0 } });
    expect([...new FormData(form)]).toEqual([]);
    await rerender({ name: 'stars' });
    expect(new FormData(form).has('stars')).toBe(false);
  });

  it('submits the current rating once set and follows further changes', async () => {
    const { getByRole } = render(RatingGroup, {
      target: form,
      props: { value: 3, name: 'stars' }
    });
    expect(new FormData(form).get('stars')).toBe('3');
    await fireEvent.keyDown(getByRole('slider'), { key: 'ArrowRight' });
    expect(new FormData(form).get('stars')).toBe('4');
  });

  it('omits disabled groups from submission', async () => {
    const { rerender } = render(RatingGroup, {
      target: form,
      props: { value: 3, name: 'stars', disabled: true }
    });
    expect(new FormData(form).has('stars')).toBe(false);
    await rerender({ disabled: false });
    expect(new FormData(form).get('stars')).toBe('3');
  });

  it('validates required against the unrated state and focuses the slider on invalid submit', async () => {
    const { getByRole } = render(RatingGroup, {
      target: form,
      props: { value: 0, name: 'stars', required: true }
    });
    const group = getByRole('slider');
    expect(form.checkValidity()).toBe(false);
    expect(document.activeElement).toBe(group);
    await fireEvent.keyDown(group, { key: 'End' });
    expect(form.checkValidity()).toBe(true);
  });

  it('associates with an external form via `form` and stays readonly-submittable', async () => {
    const { rerender } = render(RatingGroup, {
      value: 4,
      name: 'stars',
      form: form.id,
      readonly: true
    });
    expect(new FormData(form).get('stars')).toBe('4');
    await rerender({ value: 1 });
    expect(new FormData(form).get('stars')).toBe('1');
  });
});

describe('RatingGroup custom star snippet', () => {
  it('falls back to the themeable default star icon when no snippet is given', () => {
    const { container } = render(RatingGroup, { testId: 'rating', value: 1, max: 2 });
    const first = star(container, 'rating', 1);
    const second = star(container, 'rating', 2);
    expect(first.querySelector('svg')).toBeTruthy();
    expect(second.querySelector('svg')).toBeTruthy();
    expect(first.getAttribute('data-state')).toBe('full');
    expect(second.getAttribute('data-state')).toBe('empty');
  });
});

describe('RatingGroup classes and testId escape hatches', () => {
  it('applies `classes` to the root and `testId` to both data-pw and testID', () => {
    const { getByRole } = render(RatingGroup, { testId: 'rating', classes: 'my-rating' });
    const group = getByRole('slider');
    expect(group.className).toContain('my-rating');
    expect(group.getAttribute('data-pw')).toBe('rating');
    expect(group.getAttribute('testID')).toBe('rating');
  });
});
