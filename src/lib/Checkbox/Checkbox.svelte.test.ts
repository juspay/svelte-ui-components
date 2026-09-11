import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Checkbox from './Checkbox.svelte';

// `text` was mandatory in CheckboxProperties even though the runtime never defaulted
// it, so `<Checkbox name="agree" />` (a form-only checkbox with no visible label) was
// both a type error and, had the type alone been loosened, a render-time crash
// (`text.length` on a missing value). Toggle already treats its own `text` as optional
// with a `''` runtime default (Toggle/properties.ts, Toggle.svelte) -- Checkbox follows
// the same, already-shipped contract rather than inventing a new one. The mandatory
// type never actually stopped an unnamed checkbox: `text=""` alone always satisfied it.
describe('Checkbox — text is optional', () => {
  it('renders without throwing when text is omitted', () => {
    expect(() => render(Checkbox, { name: 'agree' })).not.toThrow();
  });

  it('is unlabelled but still functions when neither text nor ariaLabel is given', () => {
    const { container } = render(Checkbox, { name: 'agree' });
    const box = container.querySelector('[role="checkbox"]');
    expect(box).not.toBeNull();
    expect(box?.getAttribute('aria-label')).toBeNull();
    expect(container.querySelector('.label')?.hasAttribute('hidden')).toBe(true);
  });

  it('ariaLabel still names a checkbox that has no visible text', () => {
    const { container } = render(Checkbox, { name: 'agree', ariaLabel: 'Agree to terms' });
    const box = container.querySelector('[role="checkbox"]');
    expect(box?.getAttribute('aria-label')).toBe('Agree to terms');
  });
});
