import type { Snippet } from 'svelte';

export type PillProperties = MandatoryPillProperties & OptionalPillProperties & PillEventProperties;

export type MandatoryPillProperties = {
  text: string;
};

export type OptionalPillProperties = {
  dismissible?: boolean;
  disabled?: boolean;
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
};

export type PillEventProperties = {
  onclick?: (event: MouseEvent) => void;
  ondismiss?: () => void;
  onDismiss?: () => void;
};
