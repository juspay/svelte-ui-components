import type { Snippet } from 'svelte';

export type ChoiceboxProperties = OptionalChoiceboxProperties & ChoiceboxEventProperties;

export type ChoiceboxMode = 'radio' | 'checkbox';

export type OptionalChoiceboxProperties = {
  children?: Snippet;
  selected?: boolean;
  mode?: ChoiceboxMode;
  disabled?: boolean;
  showIndicator?: boolean;
  testId?: string;
  classes?: string;
  /**
   * Text shown, and announced, when the card is in error. Linked to the card
   * through `aria-describedby`, and sets `aria-invalid` while present.
   */
  errorMessage?: string | null;
  /**
   * Persistent helper text describing the card. Linked through
   * `aria-describedby` too, so it is read before the user trips an error rather
   * than only after.
   */
  infoMessage?: string | null;
  /**
   * Marks the card invalid without supplying a message, for a consumer driving
   * validity from a server or its own rules.
   */
  invalid?: boolean;
  /**
   * Submits the card under this name when it sits inside (or is associated with)
   * a form. Omitted entirely when absent, unselected or disabled, which is what
   * a native checkbox or radio does.
   *
   * In `radio` mode a name also GROUPS the cards that share it: selecting one
   * deselects the rest, and Arrow/Home/End move the selection between them under
   * a single tab stop, the way a native radio group behaves. Grouping is scoped
   * to cards sharing a root node, so two forms on one page can both use
   * `name="plan"` without interfering. Leave `name` off and each card stays the
   * independent toggle it was before this prop existed.
   */
  name?: string;
  /** Value submitted while selected. Defaults to `'on'`, the native default. */
  value?: string;
  /**
   * Makes an unselected card block submission. In a named `radio` group this is
   * the native "pick one" rule over the whole group. Invalid validation moves
   * focus to the visible card, since the form control behind it is deliberately
   * not a tab stop.
   */
  required?: boolean;
  /**
   * `id` of a form elsewhere in the same document, for a card rendered outside
   * it. Custom elements have no form association through this prop: inside
   * `<sui-choicebox>` the control lives in a shadow root and cannot reach a form
   * in the host document, which is what `ElementInternals` handles there
   * instead.
   */
  form?: string;
};

export type ChoiceboxEventProperties = {
  onclick?: (selected: boolean) => void;
};
