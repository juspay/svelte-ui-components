import type { Snippet } from 'svelte';
import type { ButtonProperties } from '$lib/Button/properties';

export type StatusProperties = StatusEventProperties & {
  statusIcon?: string;
  /**
   * Accessible name for the `statusIcon` image. Defaults to `'status'`, which
   * is deliberately generic because the icon is the same shape on a success and
   * a failure screen. Set it to something the screen actually means, or to `''`
   * to mark the icon decorative when `statusText` already carries the meaning.
   */
  statusIconAlt?: string;
  statusText: string;
  statusDescription: string;
  /**
   * Element `statusText` renders as. Defaults to `'div'`, matching every existing
   * consumer's render output exactly. Reach for `'h1'`..`'h6'` when `statusText`
   * carries a real page/section heading: an app that wires typography to semantic
   * tags (rather than setting `font-size` in component styles) can only pick up
   * that tag's size, weight and colour, and only a heading tag joins the
   * document outline for assistive tech — a `div` does neither, no matter what
   * CSS targets it.
   */
  statusTextTag?: 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
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
  onbuttonclick?: () => void;
  /** @deprecated Use `onbuttonclick` instead; both work until 4.0.0. */
  onbuttonClick?: () => void;
  /** @deprecated Use `onbuttonclick` instead; both work until 4.0.0. */
  onButtonClick?: () => void;
};
