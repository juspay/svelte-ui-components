// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import Choicebox from './Choicebox.svelte';

/**
 * Choicebox looked like a control and could not be one. It rendered a
 * `<div role="radio">` with its own click and keydown handling, no native
 * control, no `name` and no `value` -- so it could never appear in `FormData`,
 * and a "radio group" of them was neither exclusive nor arrow-navigable.
 *
 * The ARIA was already correct, so this is a capability gap rather than an
 * accessibility defect: the fix is the same opt-in form participation Checkbox,
 * Radio, Toggle and Slider already have, plus the grouping a native radio gets
 * from the browser for free.
 */

const card = (container: HTMLElement): HTMLElement => {
  const el = container.querySelector('.choicebox');
  if (!(el instanceof HTMLElement)) {
    throw new Error('no choicebox rendered');
  }
  return el;
};

const nativeControl = (container: HTMLElement): HTMLInputElement => {
  const el = container.querySelector('input.native-control');
  if (!(el instanceof HTMLInputElement)) {
    throw new Error('no native control rendered');
  }
  return el;
};

/** What a real `<form>` submit would collect. */
function submittedEntries(form: HTMLFormElement): string[] {
  return [...new FormData(form).entries()].map(([key, value]) => `${key}=${String(value)}`);
}

/**
 * `render` mounts into its own container under `document.body`, so a form is
 * created separately and the cards are associated with it by id -- which is the
 * `form` prop's own job, and exercises it at the same time.
 */
function formWithId(id: string): HTMLFormElement {
  const form = document.createElement('form');
  form.id = id;
  document.body.appendChild(form);
  return form;
}

/** `count` cards sharing one name, in DOM order. */
function renderGroup(count: number, props: Record<string, unknown> = {}): HTMLElement[] {
  const cards: HTMLElement[] = [];
  for (let index = 0; index < count; index += 1) {
    const { container } = render(Choicebox, {
      mode: 'radio',
      name: 'plan',
      value: `plan-${index}`,
      ...props
    });
    cards.push(card(container));
  }
  return cards;
}

const press = (el: HTMLElement, key: string): boolean =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

describe('Choicebox takes part in a form', () => {
  it('submits its value under its name only while selected', async () => {
    const form = formWithId('signup');
    const { rerender } = render(Choicebox, {
      mode: 'checkbox',
      name: 'addons',
      value: 'insurance',
      selected: false,
      form: 'signup'
    });

    // This is the crux of it: before the native control existed, the entries
    // below were empty in BOTH states.
    expect(submittedEntries(form)).toEqual([]);

    await rerender({ selected: true });
    expect(submittedEntries(form)).toEqual(['addons=insurance']);
  });

  it('submits when it simply sits inside the form, with no form prop', () => {
    const form = document.createElement('form');
    document.body.appendChild(form);
    const { container } = render(Choicebox, {
      mode: 'checkbox',
      name: 'addons',
      value: 'insurance',
      selected: true
    });
    form.appendChild(card(container));

    expect(submittedEntries(form)).toEqual(['addons=insurance']);
  });

  it('submits nothing while disabled, as a native control does', () => {
    const form = formWithId('signup');
    render(Choicebox, {
      mode: 'checkbox',
      name: 'addons',
      value: 'insurance',
      selected: true,
      disabled: true,
      form: 'signup'
    });
    expect(submittedEntries(form)).toEqual([]);
  });

  it('defaults its value to the platform default', () => {
    const { container } = render(Choicebox, { mode: 'checkbox', name: 'terms', selected: true });
    expect(nativeControl(container).value).toBe('on');
  });

  it('renders the native type its mode implies', () => {
    const asRadio = render(Choicebox, { mode: 'radio', name: 'plan' });
    expect(nativeControl(asRadio.container).type).toBe('radio');

    const asCheckbox = render(Choicebox, { mode: 'checkbox', name: 'addons' });
    expect(nativeControl(asCheckbox.container).type).toBe('checkbox');
  });

  it('carries required through to the control and to the card', () => {
    const { container } = render(Choicebox, { mode: 'checkbox', name: 'terms', required: true });
    expect(nativeControl(container).required).toBe(true);
    expect(card(container).getAttribute('aria-required')).toBe('true');
  });

  it('adds no name, and so submits nothing, when none was asked for', () => {
    const form = document.createElement('form');
    document.body.appendChild(form);
    const { container } = render(Choicebox, { mode: 'checkbox', selected: true });
    form.appendChild(card(container));
    expect(submittedEntries(form)).toEqual([]);
  });
});

describe('a radio group of Choiceboxes', () => {
  it('selects exclusively: choosing one deselects the rest', async () => {
    const cards = renderGroup(3);

    cards[1].click();
    await tick();
    expect(cards.map((el) => el.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);

    cards[2].click();
    await tick();
    expect(cards.map((el) => el.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true']);
  });

  it('keeps one tab stop, and moves it to the selection', async () => {
    const cards = renderGroup(3);
    // Untouched group: the first card is reachable so Tab can enter at all.
    expect(cards.map((el) => el.tabIndex)).toEqual([0, -1, -1]);

    cards[2].click();
    await tick();
    expect(cards.map((el) => el.tabIndex)).toEqual([-1, -1, 0]);
  });

  it('moves the selection with the arrow keys, on both axes, and wraps', async () => {
    const cards = renderGroup(3);
    cards[0].click();
    await tick();

    expect(press(cards[0], 'ArrowDown')).toBe(false);
    await tick();
    expect(cards[1].getAttribute('aria-checked')).toBe('true');

    press(cards[1], 'ArrowRight');
    await tick();
    expect(cards[2].getAttribute('aria-checked')).toBe('true');

    // Past the end returns to the start, like a native radio group.
    press(cards[2], 'ArrowDown');
    await tick();
    expect(cards[0].getAttribute('aria-checked')).toBe('true');

    press(cards[0], 'ArrowLeft');
    await tick();
    expect(cards[2].getAttribute('aria-checked')).toBe('true');
  });

  it('jumps to the ends with Home and End', async () => {
    const cards = renderGroup(3);
    cards[1].click();
    await tick();

    press(cards[1], 'End');
    await tick();
    expect(cards[2].getAttribute('aria-checked')).toBe('true');

    press(cards[2], 'Home');
    await tick();
    expect(cards[0].getAttribute('aria-checked')).toBe('true');
  });

  it('skips a disabled card when arrowing', async () => {
    const cards: HTMLElement[] = [];
    for (const [index, disabled] of [false, true, false].entries()) {
      const { container } = render(Choicebox, {
        mode: 'radio',
        name: 'plan',
        value: `plan-${index}`,
        disabled
      });
      cards.push(card(container));
    }

    cards[0].click();
    await tick();
    press(cards[0], 'ArrowDown');
    await tick();

    expect(cards[1].getAttribute('aria-checked')).toBe('false');
    expect(cards[2].getAttribute('aria-checked')).toBe('true');
  });

  it('leaves the arrow keys alone when the cards are not grouped', async () => {
    // No `name`, so these are independent toggles and arrowing must not move a
    // selection the consumer never asked to group.
    const first = render(Choicebox, { mode: 'radio', selected: true });
    const second = render(Choicebox, { mode: 'radio' });

    expect(press(card(first.container), 'ArrowDown')).toBe(true);
    await tick();
    expect(card(second.container).getAttribute('aria-checked')).toBe('false');
    expect(card(first.container).getAttribute('aria-checked')).toBe('true');
  });

  it('does not group checkbox-mode cards that share a name', async () => {
    const cards = renderGroup(2, { mode: 'checkbox' });

    cards[0].click();
    cards[1].click();
    await tick();

    // Both stay selected: a checkbox group is not exclusive.
    expect(cards.map((el) => el.getAttribute('aria-checked'))).toEqual(['true', 'true']);
  });

  it('reports every card the move changed, not only the one chosen', async () => {
    const seen: Array<[number, boolean]> = [];
    const cards: HTMLElement[] = [];
    for (let index = 0; index < 2; index += 1) {
      const { container } = render(Choicebox, {
        mode: 'radio',
        name: 'plan',
        value: `plan-${index}`,
        onclick: (selected: boolean) => seen.push([index, selected])
      });
      cards.push(card(container));
    }

    cards[0].click();
    await tick();
    cards[1].click();
    await tick();

    // A consumer tracking `onclick` alone would otherwise still believe card 0
    // is selected after card 1 takes over.
    expect(seen).toEqual([
      [0, true],
      [0, false],
      [1, true]
    ]);
  });
});
