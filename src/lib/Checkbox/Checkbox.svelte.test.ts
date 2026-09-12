import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Checkbox from './Checkbox.svelte';
import CheckboxForm from './CheckboxForm.test.svelte';

describe('Checkbox native forms', () => {
  let form: HTMLFormElement;

  beforeEach(() => {
    form = document.createElement('form');
    form.id = 'checkbox-form';
    document.body.append(form);
  });

  afterEach(() => form.remove());

  it('keeps submission opt-in and defaults named checked values to on', async () => {
    const { rerender } = render(Checkbox, {
      target: form,
      props: { text: 'Terms', checked: true }
    });
    expect([...new FormData(form)]).toEqual([]);
    await rerender({ name: 'terms' });
    expect([...new FormData(form)]).toEqual([['terms', 'on']]);
  });

  it('submits only the visible checked state after pointer and keyboard activation', async () => {
    const onclick = vi.fn();
    const { getByRole } = render(Checkbox, {
      target: form,
      props: { text: 'Terms', name: 'terms', value: 'accepted', onclick }
    });
    const box = getByRole('checkbox');
    expect(new FormData(form).has('terms')).toBe(false);
    await fireEvent.click(box);
    expect(new FormData(form).get('terms')).toBe('accepted');
    expect(box.dataset.state).toBe('checked');
    await fireEvent.keyDown(box, { key: ' ' });
    expect(new FormData(form).has('terms')).toBe(false);
    expect(box.dataset.state).toBe('unchecked');
    expect(onclick.mock.calls).toEqual([[true], [false]]);
  });

  it('validates required state and directs invalid focus to the only visible tab stop', async () => {
    const { getByRole, container } = render(Checkbox, {
      target: form,
      props: { text: 'Terms', name: 'terms', required: true }
    });
    const box = getByRole('checkbox');
    const input = container.querySelector('input');
    expect(input?.tabIndex).toBe(-1);
    expect(box.tabIndex).toBe(0);
    expect(box.getAttribute('aria-required')).toBe('true');
    expect(form.checkValidity()).toBe(false);
    expect(document.activeElement).toBe(box);
    await fireEvent.keyDown(box, { key: 'Enter' });
    expect(form.checkValidity()).toBe(true);
  });

  it('omits indeterminate values even when checked and clears mixed state on activation', async () => {
    const { getByRole, container } = render(CheckboxForm, { target: form });
    const box = getByRole('checkbox');
    const input = container.querySelector('input');
    expect(new FormData(form).has('all')).toBe(false);
    expect(form.checkValidity()).toBe(false);
    expect(input?.indeterminate).toBe(true);
    expect(input?.checked).toBe(false);
    expect(box.dataset.state).toBe('indeterminate');
    expect(box.getAttribute('aria-checked')).toBe('mixed');
    await fireEvent.click(box);
    expect(input?.indeterminate).toBe(false);
    expect(box.getAttribute('aria-checked')).toBe('false');
    await fireEvent.click(box);
    expect(box.getAttribute('aria-checked')).toBe('true');
    expect(new FormData(form).get('all')).toBe('on');
    expect(form.checkValidity()).toBe(true);
  });

  // `indeterminate` is bindable, so a parent that passes it WITHOUT `bind:` keeps
  // ownership: the box clears the mixed state locally, and the parent's next update
  // re-asserts it. Pinned because the alternative — a local clear that outlives what
  // the parent says — is the bug this ownership rule prevents.
  it('lets an unbound parent re-assert the mixed state it still owns', async () => {
    const { getByRole, container, rerender } = render(Checkbox, {
      target: form,
      props: { text: 'All', name: 'all', checked: true, indeterminate: true }
    });
    const box = getByRole('checkbox');
    const input = container.querySelector('input');
    await fireEvent.click(box);
    expect(input?.indeterminate).toBe(false);
    await rerender({ checked: true });
    expect(box.getAttribute('aria-checked')).toBe('mixed');
    expect(new FormData(form).has('all')).toBe(false);
  });

  it('preserves controlled rejection and only submits parent-accepted state', async () => {
    const onclick = vi.fn();
    const { getByRole, rerender } = render(Checkbox, {
      target: form,
      props: { text: 'Terms', name: 'terms', controlled: true, onclick }
    });
    const box = getByRole('checkbox');
    await fireEvent.click(box);
    expect(onclick).toHaveBeenCalledWith(true);
    expect(box.getAttribute('aria-checked')).toBe('false');
    expect(new FormData(form).has('terms')).toBe(false);
    await rerender({ checked: true });
    await fireEvent.keyDown(box, { key: ' ' });
    expect(onclick).toHaveBeenLastCalledWith(false);
    expect(box.getAttribute('aria-checked')).toBe('true');
    expect(new FormData(form).get('terms')).toBe('on');
    await rerender({ indeterminate: true });
    await fireEvent.click(box);
    expect(box.getAttribute('aria-checked')).toBe('mixed');
    expect(new FormData(form).has('terms')).toBe(false);
  });

  it('omits disabled controls and required validation without enabling clicks', async () => {
    const onclick = vi.fn();
    const { getByRole, rerender } = render(Checkbox, {
      target: form,
      props: {
        text: 'Terms',
        name: 'terms',
        checked: true,
        required: true,
        disabled: true,
        onclick
      }
    });
    const box = getByRole('checkbox');
    expect(new FormData(form).has('terms')).toBe(false);
    expect(box.hasAttribute('data-disabled')).toBe(true);
    expect(box.tabIndex).toBe(-1);
    await fireEvent.click(box);
    expect(onclick).not.toHaveBeenCalled();
    await rerender({ checked: false });
    expect(form.checkValidity()).toBe(true);
    await rerender({ disabled: false });
    expect(box.hasAttribute('data-disabled')).toBe(false);
    expect(form.checkValidity()).toBe(false);
  });

  it('associates with an external form and follows changes to its value', async () => {
    const { getByRole, rerender } = render(Checkbox, {
      text: 'External',
      name: 'external',
      value: 'yes',
      checked: true,
      form: form.id,
      required: true
    });
    expect(new FormData(form).get('external')).toBe('yes');
    await rerender({ value: 'updated' });
    expect(new FormData(form).get('external')).toBe('updated');
    await fireEvent.click(getByRole('checkbox'));
    expect(new FormData(form).has('external')).toBe(false);
    expect(form.checkValidity()).toBe(false);
  });
});
