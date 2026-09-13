// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import type { Component } from 'svelte';

import ChipInput from '../ChipInput/ChipInput.svelte';
import Choicebox from '../Choicebox/Choicebox.svelte';
import ColorPicker from '../ColorPicker/ColorPicker.svelte';
import Combobox from '../Combobox/Combobox.svelte';
import InputButton from '../InputButton/InputButton.svelte';
import SplitInput from '../SplitInput/SplitInput.svelte';

/**
 * `Input` linked its messages to its field and almost nothing else did.
 *
 * These assertions RESOLVE `aria-describedby` against the document rather than
 * reading the attribute. That distinction is the whole point:
 * `aria-describedby="x-error"` pointing at an element that is not rendered
 * satisfies any attribute assertion and resolves to nothing in a real screen
 * reader, so an attribute check would pass on exactly the bug this prevents.
 *
 * The six here are the ones that lacked it. `Input` and
 * `DateRangePicker` solve it their own way and are deliberately absent.
 */

const ERROR = 'That value is not allowed.';
const INFO = 'Pick something from the list.';

/** The text a real accessibility client would compute for `element`. */
function describedText(element: Element): string | null {
  const ids = (element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
  if (ids.length === 0) {
    return null;
  }
  const resolved = ids.map((id) => document.getElementById(id)?.textContent?.trim() ?? null);
  // A missing id resolves to null, which is what a reader announces: nothing.
  return resolved.some((text) => text === null) ? '__DANGLING__' : resolved.join(' ');
}

/**
 * The element the description is attached to. Choicebox carries the control
 * role itself; the five composites delegate their focusable control to `Input`
 * or `Button` and describe the group around it instead.
 */
function describedElement(container: HTMLElement): Element {
  const described = container.querySelector('[aria-describedby]');
  if (described === null) {
    throw new Error('nothing in this component carries aria-describedby');
  }
  return described;
}

type Case = {
  readonly name: string;
  // Each component has a different required-prop shape, so the props are per
  // case; the contract asserted over them is identical.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly component: Component<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly props: Record<string, any>;
};

const CASES: readonly Case[] = [
  { name: 'ChipInput', component: ChipInput, props: { values: [] } },
  { name: 'SplitInput', component: SplitInput, props: { values: [] } },
  { name: 'Combobox', component: Combobox, props: { items: [] } },
  { name: 'ColorPicker', component: ColorPicker, props: { value: '#336699' } },
  { name: 'Choicebox', component: Choicebox, props: {} },
  {
    name: 'InputButton',
    // InputButton renders its messages out of `inputProperties`, which is the
    // spelling it already had; the contract is the same one.
    component: InputButton,
    // `inputProperties` is not optional and is dereferenced during render, so
    // even the no-message case has to supply it.
    props: { value: '', inputProperties: {} }
  }
];

/** InputButton reads its messages from a nested object; the rest take them flat. */
function withMessages(
  testCase: Case,
  messages: { error?: string; info?: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  if (testCase.name === 'InputButton') {
    return {
      ...testCase.props,
      error: messages.error ?? '',
      inputProperties: { infoMessage: messages.info ?? '' }
    };
  }
  return {
    ...testCase.props,
    errorMessage: messages.error ?? null,
    infoMessage: messages.info ?? null
  };
}

describe.each(CASES)('$name describes its field', (testCase) => {
  it('reaches the accessibility tree with both messages, in reading order', () => {
    const { container } = render(
      testCase.component,
      withMessages(testCase, { error: ERROR, info: INFO })
    );
    const element = describedElement(container);
    expect(describedText(element)).toBe(`${ERROR} ${INFO}`);
    expect(element.getAttribute('aria-invalid')).toBe('true');
  });

  it('helper text alone describes the control without marking it invalid', () => {
    const { container } = render(testCase.component, withMessages(testCase, { info: INFO }));
    const element = describedElement(container);
    expect(describedText(element)).toBe(INFO);
    // The most common way to get this wrong: a control that always says invalid.
    expect(element.getAttribute('aria-invalid')).toBeNull();
  });

  it('references nothing at all when there is no message', () => {
    const { container } = render(testCase.component, testCase.props);
    // Not "references an empty string" and not "references a missing id".
    expect(container.querySelector('[aria-describedby]')).toBeNull();
    expect(container.querySelector('[aria-invalid]')).toBeNull();
  });

  it('announces the error, so it is heard when it appears', () => {
    const { container } = render(testCase.component, withMessages(testCase, { error: ERROR }));
    const alert = container.querySelector('[role="alert"]');
    expect(alert?.textContent?.trim()).toBe(ERROR);
    // The alert is the element the description points at, not a second copy.
    expect(describedText(describedElement(container))).toBe(ERROR);
  });
});

describe('two instances on one page', () => {
  it('get distinct message ids, so neither steals the other description', () => {
    const first = render(Choicebox, { errorMessage: ERROR });
    const second = render(Choicebox, { errorMessage: 'A different problem.' });

    const firstId = describedElement(first.container).getAttribute('aria-describedby');
    const secondId = describedElement(second.container).getAttribute('aria-describedby');

    expect(firstId).not.toBeNull();
    expect(firstId).not.toBe(secondId);
    expect(describedText(describedElement(first.container))).toBe(ERROR);
    expect(describedText(describedElement(second.container))).toBe('A different problem.');
  });
});
