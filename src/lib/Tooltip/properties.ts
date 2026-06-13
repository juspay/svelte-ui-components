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
  /** Snippet rendered as a leading icon in the trigger wrapper. No default glyph is provided — consumers supply their own. */
  icon?: Snippet;
  /** Snippet rendered as the bubble body. When provided, replaces the plain `text` string inside the tooltip bubble. */
  content?: Snippet;
};

export type TooltipProperties = MandatoryTooltipProperties & OptionalTooltipProperties;
