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
};

export type TooltipProperties = MandatoryTooltipProperties & OptionalTooltipProperties;
