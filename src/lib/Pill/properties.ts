import type { Snippet } from 'svelte';

export type PillProperties = MandatoryPillProperties & OptionalPillProperties & PillEventProperties;

export type MandatoryPillProperties = {
  text: string;
};

/**
 * Semantic tone for a status/category chip. Each tone maps to a
 * `--pill-tone-{tone}-background` / `--pill-tone-{tone}-color` pair (documented, with a built-in
 * default) instead of a hand-rolled `tone-*` class repeated at every call site. An explicit
 * `--pill-background` / `--pill-color` (set directly or via `classes`) always wins over the tone
 * default — the same precedence Button's `variant` already uses relative to `--button-color`.
 */
export type PillTone = 'accent' | 'ok' | 'warn' | 'danger' | 'muted';

/**
 * Root element for the pill. `'div'` is the default and renders exactly as before —
 * non-interactive, or carrying the synthetic `role="button"`/`tabindex`/keydown shim when
 * an `onclick` is supplied. `'button'` renders a real `<button type="button">` instead, so
 * a chip-shaped control gets native focus, activation and announcement rather than an
 * imitation of them.
 */
export type PillRootTag = 'div' | 'button';

export type OptionalPillProperties = {
  dismissible?: boolean;
  disabled?: boolean;
  /**
   * Semantic tone applied via themeable `--pill-tone-{tone}-background` / `-color` CSS
   * variables. Unset by default, which renders exactly as before — no tone class, no CSS
   * variable set. See `PillTone` for the mapping and override precedence.
   */
  tone?: PillTone;
  /**
   * Root element. Defaults to `'div'`, which renders exactly as before this prop existed.
   *
   * `'button'` gives a chip real control semantics — native keyboard activation, focus and
   * announcement — instead of the `role="button"`/`tabindex`/keydown shim a `<div>` needs.
   * Reach for it when the chip is a disclosure or a toggle (see `ariaExpanded` /
   * `ariaPressed`), which a shimmed div cannot express correctly.
   *
   * One combination cannot be honoured: a `<button>` may not contain another button, and a
   * `dismissible` pill is inherently two controls. `as="button"` together with
   * `dismissible` therefore falls back to the `div` root and its shim rather than emitting
   * invalid markup — the same rule `Card` applies to `as="a"` with no `href`.
   */
  as?: PillRootTag;
  /**
   * Expanded state of a disclosure chip, rendered as `aria-expanded`. Applied only when the
   * pill is interactive (a `button` root, or a `div` with `onclick`), since the attribute is
   * meaningless on a plain label. Omitted by default.
   */
  ariaExpanded?: boolean;
  /**
   * Pressed state of a toggle chip, rendered as `aria-pressed`. Applied only when the pill
   * is interactive, for the same reason as `ariaExpanded`. Omitted by default.
   */
  ariaPressed?: boolean;
  testId?: string;
  title?: string;
  dismissIcon?: Snippet;
  /**
   * Accessible name of the dismiss control. Defaults to "Dismiss"; pass a translated
   * string for localised products. Blank values fall back to the default.
   */
  dismissLabel?: string;
  /**
   * A Svelte snippet rendered immediately before the text label inside a
   * `<span class="pill-leading-icon">` wrapper. Use for icons, logos, or any
   * inline decoration. The wrapper does not receive `aria-hidden` — leave
   * accessibility attributes on the icon itself.
   */
  leadingIcon?: Snippet;
  classes?: string;
  /**
   * Arbitrary attributes spread onto the pill root — `data-*`/`aria-*` (or any
   * other) attribute names mapped to string values. For consumers that key off
   * attribute-selector CSS (`[data-state="waiting"]`, `[data-density]`) the way
   * the rest of their app does, instead of wrapping Pill in an extra element
   * just to hold the attribute, or adding a second `classes` modifier for the
   * same state. Applied before Pill's own `class`/`onclick`/`onkeydown`/
   * `role`/`tabindex`/`aria-disabled`/`data-pw`/`title`/`testID` attributes, so
   * an entry here can never override one of those — only add attributes Pill
   * does not already manage. Omitted by default, so existing consumers render
   * exactly the same attributes as before.
   */
  attrs?: Record<string, string>;
};

export type PillEventProperties = {
  onclick?: (event: MouseEvent) => void;
  ondismiss?: () => void;
};
