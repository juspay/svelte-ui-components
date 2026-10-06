import { createRawSnippet } from 'svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CheckListItem from './CheckListItem.svelte';

/**
 * The row's visible label is a sibling of <Checkbox>, not inside it, and the box was given
 * `text=""`, so the `role="checkbox"` node assistive technology reads had no name. These pin the
 * contract that replaced it: the box is named by the label the row actually shows.
 *
 * Names are asserted through `getByRole(..., { name })`, which computes them, rather than by reading
 * attributes: an `aria-labelledby` pointing at an id that is absent is a non-null attribute and an
 * unnamed control.
 */

const labelSnippet = (html: string) => createRawSnippet(() => ({ render: () => html }));

describe('CheckListItem accessible name', () => {
  it('names the box from the item text', () => {
    const { getByRole } = render(CheckListItem, { text: 'Set up project' });
    expect(getByRole('checkbox', { name: 'Set up project' })).toBeTruthy();
  });

  it('names the box from everything a checkboxLabel snippet renders, not just `text`', () => {
    const { getByRole } = render(CheckListItem, {
      text: 'Required business details',
      checkboxLabel: labelSnippet(
        '<span>Required business details <strong>Required</strong></span>'
      )
    });
    expect(getByRole('checkbox', { name: 'Required business details Required' })).toBeTruthy();
  });

  it('points aria-labelledby at an element that exists and holds the visible label', () => {
    const { getByRole, container } = render(CheckListItem, { text: 'Write tests' });
    const box = getByRole('checkbox');
    const labelledby = box.getAttribute('aria-labelledby');
    expect(labelledby).toBeTruthy();
    const target = container.ownerDocument.getElementById(labelledby ?? '');
    expect(target).not.toBeNull();
    expect(target?.textContent?.trim()).toBe('Write tests');
    // The label wrapper is inside this item, so it also resolves inside a shadow root.
    expect(container.contains(target)).toBe(true);
  });

  it('keeps the item text as the fallback name for a label that renders nothing', () => {
    const { getByRole } = render(CheckListItem, {
      text: 'Install dependencies',
      checkboxLabel: labelSnippet('<span></span>')
    });
    // aria-labelledby wins whenever it yields text; aria-label only covers the empty case.
    expect(getByRole('checkbox', { hidden: false }).getAttribute('aria-label')).toBe(
      'Install dependencies'
    );
  });

  it('gives every item its own label id so two rows never name each other', () => {
    const first = render(CheckListItem, { text: 'First item' });
    const second = render(CheckListItem, { text: 'Second item' });
    const firstBox = first.getByRole('checkbox', { name: 'First item' });
    const secondBox = second.getByRole('checkbox', { name: 'Second item' });
    expect(firstBox.getAttribute('aria-labelledby')).not.toBe(
      secondBox.getAttribute('aria-labelledby')
    );
  });

  it('exposes exactly one usable selection control per item', () => {
    const { getAllByRole, container } = render(CheckListItem, { text: 'Only one' });
    expect(getAllByRole('checkbox')).toHaveLength(1);
    const mirror = container.querySelector('input[type="checkbox"]');
    expect(mirror).not.toBeNull();
    expect(mirror?.getAttribute('aria-hidden')).toBe('true');
    expect(mirror?.getAttribute('tabindex')).toBe('-1');
  });

  it('keeps the data-pw hooks on the container and the checkbox', () => {
    const { container } = render(CheckListItem, { text: 'Hooked', testId: 'item' });
    expect(container.querySelector('[data-pw="item"]')).not.toBeNull();
    expect(container.querySelector('[data-pw="item-checkbox"]')).not.toBeNull();
    expect(container.querySelector('[data-pw="item-checkbox-box"]')).not.toBeNull();
  });
});

describe('CheckListItem behaviour is unchanged by naming', () => {
  it('toggles on click and on Space/Enter and reports each new value', async () => {
    const onclick = vi.fn();
    const { getByRole } = render(CheckListItem, { text: 'Toggle me', onclick });
    const box = getByRole('checkbox', { name: 'Toggle me' });
    expect(box.getAttribute('aria-checked')).toBe('false');

    await fireEvent.click(box);
    expect(box.getAttribute('aria-checked')).toBe('true');
    await fireEvent.keyDown(box, { key: ' ' });
    expect(box.getAttribute('aria-checked')).toBe('false');
    await fireEvent.keyDown(box, { key: 'Enter' });
    expect(box.getAttribute('aria-checked')).toBe('true');

    expect(onclick.mock.calls).toEqual([[true], [false], [true]]);
    expect(box.getAttribute('aria-labelledby')).toBeTruthy();
  });

  it('renders an initially checked item as checked', () => {
    const { getByRole } = render(CheckListItem, { text: 'Done', checked: true });
    const box = getByRole('checkbox', { name: 'Done' });
    expect(box.getAttribute('aria-checked')).toBe('true');
  });

  it('stays named, unfocusable and inert while disabled', async () => {
    const onclick = vi.fn();
    const { getByRole } = render(CheckListItem, { text: 'Locked', disabled: true, onclick });
    const box = getByRole('checkbox', { name: 'Locked' });
    expect(box.getAttribute('aria-disabled')).toBe('true');
    expect(box.getAttribute('tabindex')).toBe('-1');

    await fireEvent.click(box);
    await fireEvent.keyDown(box, { key: ' ' });
    expect(box.getAttribute('aria-checked')).toBe('false');
    expect(onclick).not.toHaveBeenCalled();
  });
});

describe('CheckListItem inside a form', () => {
  let form: HTMLFormElement;
  const onsubmit = vi.fn((event: Event) => event.preventDefault());

  beforeEach(() => {
    form = document.createElement('form');
    form.addEventListener('submit', onsubmit);
    document.body.append(form);
  });

  afterEach(() => {
    form.remove();
    onsubmit.mockClear();
  });

  it('neither submits the form nor contributes a field, as before', async () => {
    const { getByRole } = render(CheckListItem, {
      target: form,
      props: { text: 'In a form', checked: true }
    });
    const box = getByRole('checkbox', { name: 'In a form' });
    await fireEvent.click(box);
    await fireEvent.keyDown(box, { key: 'Enter' });
    await fireEvent.keyDown(box, { key: ' ' });
    expect(onsubmit).not.toHaveBeenCalled();
    expect([...new FormData(form)]).toEqual([]);
  });
});
