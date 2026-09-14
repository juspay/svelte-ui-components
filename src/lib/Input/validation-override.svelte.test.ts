import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Input from './Input.svelte';
import type { ValidationState } from '$lib/types';

/*
 * `validationState` is a `$derived.by`, and `_onFocusOut` assigns to it. In
 * Svelte 5.25+ that is a legal override, discarded the next time any dependency
 * of the derived changes -- which reads like a latent bug: blur forces
 * 'Invalid', then an unrelated prop change silently reverts it.
 *
 * It does not, and these tests pin why. The derived carries the same rule the
 * override applies (`InProgress` + non-empty + not `document.activeElement`
 * => `Invalid`), so a recompute re-derives 'Invalid' rather than reverting.
 * The assignment exists because `document.activeElement` is not reactive: it
 * pushes the one recomputation the derived cannot observe for itself.
 */

const patterns = { validationPattern: /^\d{4}$/, inProgressPattern: /^\d{1,3}$/ };

const mountFocusedInProgress = () => {
  const states: ValidationState[] = [];
  const onstatechange = vi.fn((s: ValidationState) => void states.push(s));
  const view = render(Input, { value: '', ...patterns, onstatechange });
  const field = view.container.querySelector('input');
  if (field === null) {
    throw new Error('no input rendered');
  }
  return { ...view, field, states, onstatechange };
};

describe('Input validationState override on focus out', () => {
  it('reaches InProgress while focused, so the later assertions are not vacuous', async () => {
    const { field, states } = mountFocusedInProgress();
    field.focus();
    await fireEvent.input(field, { target: { value: '12' } });

    expect(document.activeElement).toBe(field);
    expect(states.at(-1)).toBe('InProgress');
  });

  it('forces Invalid on focus out, which the derived cannot reach on its own', async () => {
    const { field, states } = mountFocusedInProgress();
    field.focus();
    await fireEvent.input(field, { target: { value: '12' } });
    expect(states.at(-1)).toBe('InProgress');

    field.blur();
    await fireEvent.focusOut(field);

    expect(states.at(-1)).toBe('Invalid');
  });

  it('does NOT revert to InProgress when a later prop change recomputes the derived', async () => {
    const { field, states, rerender } = mountFocusedInProgress();
    field.focus();
    await fireEvent.input(field, { target: { value: '12' } });
    field.blur();
    await fireEvent.focusOut(field);
    expect(states.at(-1)).toBe('Invalid');

    const sinceBlur = states.length;
    // `value` has to be re-passed on every rerender. Testing-library replays the
    // props object, so omitting it pushes the original '' back down and resets
    // the field -- which recomputes the derived for a reason that has nothing to
    // do with the override, and makes the test measure the harness.
    await rerender({ value: '12', validators: [] });
    await rerender({ value: '12', maxLength: 999 });

    expect(field.value).toBe('12');

    expect(states.slice(sinceBlur)).not.toContain('InProgress');
    expect(states.at(-1)).toBe('Invalid');
  });

  it('returns to InProgress only when focus genuinely comes back', async () => {
    const { field, states } = mountFocusedInProgress();
    field.focus();
    await fireEvent.input(field, { target: { value: '12' } });
    field.blur();
    await fireEvent.focusOut(field);
    expect(states.at(-1)).toBe('Invalid');

    field.focus();
    await fireEvent.input(field, { target: { value: '123' } });

    expect(document.activeElement).toBe(field);
    expect(states.at(-1)).toBe('InProgress');
  });
});
