import type { Snippet } from 'svelte';

export type PillProperties = MandatoryPillProperties & OptionalPillProperties & PillEventProperties;

export type MandatoryPillProperties = {
  text: string;
};

export type OptionalPillProperties = {
  dismissible?: boolean;
  disabled?: boolean;
  testId?: string;
  dismissIcon?: Snippet;
  classes?: string;
  /**
   * Applies the class `pill-variant-{variant}` on the root element so the
   * consumer can map design tokens to the open-ended CSS custom properties
   * `--pill-{variant}-background` and `--pill-{variant}-color`.
   *
   * Example — in the consuming app's theme:
   *   .pill-variant-success { --pill-background: var(--pill-success-background, #d4edda); --pill-color: var(--pill-success-color, #155724); }
   *
   * No fixed enum of brand colors is shipped in the library; the open-ended
   * string keeps it forward-compatible with any design-token vocabulary.
   */
  variant?: string;
  /**
   * When `true`, renders a leading dot (`<span class="pill-dot">`) whose
   * color and size are controlled by `--pill-dot-color` (defaults to
   * `currentColor`) and `--pill-dot-size` (defaults to 6px).
   */
  showDot?: boolean;
  /**
   * A Svelte snippet rendered before the text inside a
   * `<span class="pill-leading-icon">` wrapper.
   */
  leadingIcon?: Snippet;
  /**
   * Controls the pill's padding / height preset.
   * - `'md'` (default) — existing padding, no change.
   * - `'sm'` — tighter padding via `--pill-sm-padding` (default `3px 8px`)
   *   and `--pill-sm-gap` (default `3px`).
   *
   * The class `pill-size-{size}` is always applied, allowing consumers to
   * override via CSS if the built-in presets don't fit.
   */
  size?: 'sm' | 'md';
};

export type PillEventProperties = {
  onclick?: (event: MouseEvent) => void;
  ondismiss?: () => void;
};
