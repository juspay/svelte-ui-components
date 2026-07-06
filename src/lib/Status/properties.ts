import type { Snippet } from 'svelte';
import type { ButtonProperties } from '$lib/Button/properties';

export type StatusProperties = StatusEventProperties & {
  statusIcon?: string;
  statusText: string;
  statusDescription: string;
  buttonProperties?: ButtonProperties;
  classes?: string;
  /**
   * Custom media rendered instead of the default `statusIcon` image — e.g. a
   * `LottiePlayer` for animated success/failure/in-progress states. Takes
   * priority over `statusIcon` when provided.
   */
  icon?: Snippet;
};

export type StatusEventProperties = {
  onbuttonClick?: () => void;
};
