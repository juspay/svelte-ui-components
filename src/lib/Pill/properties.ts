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

export type OptionalPillProperties = {
  dismissible?: boolean;
  disabled?: boolean;
  /**
   * Semantic tone applied via themeable `--pill-tone-{tone}-background` / `-color` CSS
   * variables. Unset by default, which renders exactly as before — no tone class, no CSS
   * variable set. See `PillTone` for the mapping and override precedence.
   */
  tone?: PillTone;
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
