import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import Label from './Label.svelte';

const text = (value: string) => createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));

describe('Label', () => {
  it('renders a real <label> element carrying its text content', () => {
    const { container } = render(Label, { children: text('Email address') });
    const el = container.querySelector('label');
    expect(el).not.toBeNull();
    expect(el?.textContent?.trim().startsWith('Email address')).toBe(true);
  });

  // jsdom has no layout, so it doesn't simulate the browser's pointer-driven
  // focus -- only `user-event` (not installed here) fakes that. What jsdom
  // *does* implement for real is the label's native click-forwarding
  // activation behavior (WHATWG HTML "activation behavior" for <label>), so a
  // checkbox toggling is a genuine assertion that the `for` attribute wired
  // up the native association, not a mocked stand-in for it.
  it('sets the native for attribute so a click activates the control it names', async () => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'accept-terms';
    document.body.append(checkbox);

    const { container } = render(Label, { for: 'accept-terms', children: text('Accept terms') });
    const el = container.querySelector('label');
    expect(el?.getAttribute('for')).toBe('accept-terms');
    expect(checkbox.checked).toBe(false);

    await fireEvent.click(el as HTMLLabelElement);
    expect(checkbox.checked).toBe(true);

    checkbox.remove();
  });

  it('omits the for attribute and any required marker by default', () => {
    const { container } = render(Label, { children: text('Name') });
    const el = container.querySelector('label');
    expect(el?.hasAttribute('for')).toBe(false);
    expect(container.querySelector('.required-marker')).toBeNull();
    expect(container.querySelector('.sr-only')).toBeNull();
  });

  it('announces required via visually-hidden text, not just a visual asterisk', () => {
    const { container } = render(Label, { children: text('Name'), required: true });
    const asterisk = container.querySelector('.required-marker');
    const hidden = container.querySelector('.sr-only');
    expect(asterisk?.textContent).toBe('*');
    // The glyph itself must not be exposed to assistive technology directly --
    // it's a visual affordance only, backed by the sr-only text below.
    expect(asterisk?.getAttribute('aria-hidden')).toBe('true');
    expect(hidden?.textContent).toBe('required');
    expect(hidden?.hasAttribute('aria-hidden')).toBe(false);
  });

  it('applies testId to both data-pw and testID, and appends custom classes', () => {
    const { container } = render(Label, {
      children: text('Name'),
      testId: 'name-label',
      classes: 'my-class'
    });
    const el = container.querySelector('label');
    expect(el?.getAttribute('data-pw')).toBe('name-label');
    expect(el?.getAttribute('testID')).toBe('name-label');
    expect(el?.classList.contains('my-class')).toBe(true);
  });
});
