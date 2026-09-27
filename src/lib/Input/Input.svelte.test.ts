import { render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import Input from './Input.svelte';

// `Input` has called this concept `mandatory` since before this branch, while the
// form participation added to Checkbox, Radio, Toggle, Slider, Label and RatingGroup
// used `required`, the platform's own name. Six components carrying two spellings for
// one idea is a fork in the public API, and only `mandatory` has shipped in a release,
// so `required` becomes the name and `mandatory` keeps working as a deprecated alias.
describe('Input required/mandatory', () => {
  const field = (container: HTMLElement): HTMLInputElement => {
    const element = container.querySelector('input');
    if (!(element instanceof HTMLInputElement)) {
      throw new Error('Input field is missing');
    }
    return element;
  };

  it('marks the field required under the platform spelling', () => {
    const { container } = render(Input, { value: '', label: 'Email', required: true });
    expect(field(container).required).toBe(true);
    expect(field(container).getAttribute('aria-required')).toBe('true');
    expect(container.querySelector('.input-mandatory-asterisk')).not.toBeNull();
  });

  it('still honours the deprecated mandatory spelling', () => {
    const { container } = render(Input, { value: '', label: 'Email', mandatory: true });
    expect(field(container).required).toBe(true);
    expect(field(container).getAttribute('aria-required')).toBe('true');
    expect(container.querySelector('.input-mandatory-asterisk')).not.toBeNull();
  });

  it('leaves the field optional when neither is set', () => {
    const { container } = render(Input, { value: '', label: 'Email' });
    expect(field(container).required).toBe(false);
    expect(field(container).getAttribute('aria-required')).toBeNull();
    expect(container.querySelector('.input-mandatory-asterisk')).toBeNull();
  });

  // A caller migrating one call site at a time can end up passing both. The new name
  // is the one that decides, so the migration direction is unambiguous.
  it('lets required win over a conflicting mandatory', () => {
    const { container } = render(Input, {
      value: '',
      label: 'Email',
      required: false,
      mandatory: true
    });
    expect(field(container).required).toBe(false);
    expect(container.querySelector('.input-mandatory-asterisk')).toBeNull();
  });
});

// labelSuffix wraps the label in a row so it has somewhere to sit beside --
// but only then. Without it, the label stays a bare, direct child of
// .input-container, keeping the native <label for> element's full-row click
// target exactly as it was before labelSuffix existed.
describe('Input labelSuffix', () => {
  it('renders a bare label with no row when labelSuffix is unset, as before', () => {
    const { container } = render(Input, { value: '', label: 'Email' });
    const label = container.querySelector('label.label');
    expect(label).not.toBeNull();
    expect(label?.parentElement?.classList.contains('input-container')).toBe(true);
    expect(container.querySelector('.label-row')).toBeNull();
  });

  it('wraps the label in a row only when labelSuffix is supplied', () => {
    const suffix = createRawSnippet(() => ({ render: () => '<span class="hint">42</span>' }));
    const { container } = render(Input, { value: '', label: 'Email', labelSuffix: suffix });
    const row = container.querySelector('.label-row');
    expect(row).not.toBeNull();
    expect(row?.querySelector('label.label')).not.toBeNull();
    expect(container.querySelector('.hint')).not.toBeNull();
  });
});

// `autofocus` is opt-in, and it is a one-shot: the effect that applies it also
// re-runs whenever the field's element is replaced, which used to steal focus
// back from wherever the user had since moved to.
describe('Input autofocus', () => {
  const control = (container: HTMLElement): HTMLElement => {
    const node = container.querySelector('input, textarea');
    if (!(node instanceof HTMLElement)) {
      throw new Error('Input control is missing');
    }
    return node;
  };

  it('focuses the field on mount when set', async () => {
    const { container } = render(Input, { value: '', autofocus: true });
    await tick();
    expect(document.activeElement).toBe(control(container));
  });

  it('does not focus anything by default', async () => {
    const { container } = render(Input, { value: '' });
    await tick();
    expect(document.activeElement).not.toBe(control(container));
  });

  it('does not take focus back when the field is swapped for a textarea', async () => {
    const { container, rerender } = render(Input, { value: '', autofocus: true });
    await tick();
    const first = control(container);
    expect(document.activeElement).toBe(first);
    first.blur();

    await rerender({ value: '', autofocus: true, useTextArea: true });
    await tick();
    const swapped = control(container);
    expect(swapped).not.toBe(first);
    expect(swapped.tagName).toBe('TEXTAREA');
    expect(document.activeElement).not.toBe(swapped);
  });

  it('does not take focus back when a leading icon moves the field into a wrapper', async () => {
    const { container, rerender } = render(Input, { value: '', autofocus: true });
    await tick();
    const first = control(container);
    first.blur();

    const leftIcon = createRawSnippet(() => ({ render: () => '<svg class="icon"></svg>' }));
    await rerender({ value: '', autofocus: true, leftIcon });
    await tick();
    const moved = control(container);
    expect(container.querySelector('.input-field-wrap')).not.toBeNull();
    expect(moved).not.toBe(first);
    expect(document.activeElement).not.toBe(moved);
  });
});
