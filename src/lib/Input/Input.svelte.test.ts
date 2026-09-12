import { render } from '@testing-library/svelte';
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
