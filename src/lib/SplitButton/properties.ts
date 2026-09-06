import type { Snippet } from 'svelte';
import type { MenuItem } from '../Menu/properties';

export type SplitButtonProperties = MandatorySplitButtonProperties &
  OptionalSplitButtonProperties &
  SplitButtonEventProperties;

export type MandatorySplitButtonProperties = {
  text: string;
  items: MenuItem[];
};

export type OptionalSplitButtonProperties = {
  disabled?: boolean;
  testId?: string;
  dropdownIcon?: Snippet;
  classes?: string;
  /**
   * Accessible name for the dropdown trigger — the second control, which shows only a
   * chevron and so has no text to be named by. Defaults to `More <text> options`, which
   * distinguishes it from the primary button beside it. Named after Menu's own
   * `triggerAriaLabel`, which is what it forwards to.
   */
  triggerAriaLabel?: string;
};

export type SplitButtonEventProperties = {
  onclick?: (event: MouseEvent) => void;
  onselect?: (item: MenuItem) => void;
};
