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
  /**
   * Optional snippet that replaces the `statusDescription` string at render
   * time. When provided, `statusDescription` is not rendered — only the snippet
   * is. Mirrors `EmptyState`'s `descriptionSnippet`.
   *
   * `statusDescription` is interpolated with `{@html}`, which is what a caller
   * supplying its own trusted markup wants, but is the wrong tool for a message
   * that originates from an API, a user, or any other source the caller does not
   * control. There was previously no way to render such a message as text. Use
   * this snippet for that: `{#snippet descriptionSnippet()}{message}{/snippet}`
   * escapes it the way ordinary Svelte interpolation does.
   */
  descriptionSnippet?: Snippet;
  /**
   * Action area rendered below the description, alongside the optional
   * `buttonProperties` button. Mirrors `EmptyState`'s `children`.
   *
   * `descriptionSnippet` sits inside `.status-description`, which carries the
   * component's own horizontal padding and bottom margin. Content that is not
   * part of the description — a button, a link, a countdown — belongs here
   * instead, outside that box, where `buttonProperties` already renders.
   */
  children?: Snippet;
  testId?: string;
};

export type StatusEventProperties = {
  onbuttonClick?: () => void;
};
