import type { Snippet } from 'svelte';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export type MandatoryTooltipProperties = {
  text: string;
  children: Snippet;
};

export type OptionalTooltipProperties = {
  position?: TooltipPosition;
  delay?: number;
  testId?: string | null;
  classes?: string;
  /** Snippet rendered as an icon in the trigger wrapper, beside the content. No default glyph is provided — consumers supply their own. Placement is controlled by `iconPosition`. */
  icon?: Snippet;
  /** Which side of the trigger content the `icon` sits on. Defaults to `'leading'`. */
  iconPosition?: 'leading' | 'trailing';
  /** Snippet rendered as the bubble body. When provided, replaces the plain `text` string inside the tooltip bubble. */
  content?: Snippet;
  /**
   * When true, the tooltip bubble is mounted directly on `document.body` using
   * `position: fixed` coordinates derived from `getBoundingClientRect`. This prevents
   * clipping inside overflow-hidden or stacking-context ancestors (e.g. toolbar items).
   */
  usePortal?: boolean;
};

export type TooltipProperties = MandatoryTooltipProperties & OptionalTooltipProperties;

/**
 * Options accepted by the `tooltip` Svelte action.
 * All fields mirror the corresponding Tooltip component props.
 */
export type TooltipActionOptions = {
  /** Tooltip text shown in the bubble. */
  text: string;
  position?: TooltipPosition;
  delay?: number;
  /** Custom CSS classes forwarded to the bubble element. */
  classes?: string;
};
