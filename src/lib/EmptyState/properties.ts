import type { Snippet } from 'svelte';

export type EmptyStateProperties = MandatoryEmptyStateProperties & OptionalEmptyStateProperties;

export type MandatoryEmptyStateProperties = {
  /**
   * Fallback text title rendered when `titleSnippet` is not provided.
   * This prop is required for backward-compatibility. When `titleSnippet` is supplied,
   * `title` is still required by TypeScript but its value is not rendered — the snippet
   * takes priority. Pass an empty string (`title=""`) as the minimal valid value when
   * using `titleSnippet`.
   */
  title: string;
};

export type OptionalEmptyStateProperties = {
  description?: string;
  icon?: Snippet;
  children?: Snippet;
  classes?: string;
  testId?: string;
  /**
   * Sets sane padding/gap defaults for the placeholder's context, without
   * requiring a wrapper class. Omit for today's default sizing (unchanged).
   * `'page'` is roomier, for a full route/view standing in for its content.
   * `'panel'` is tighter, for a constrained panel, popover, or rail.
   * Exposed on the root element as `data-density` so a consumer's own CSS can
   * target it too. Either default can still be overridden per-instance with
   * `--empty-state-padding` / `--empty-state-gap`, which always take priority.
   */
  density?: 'page' | 'panel';
  /**
   * Renders the title as a real heading, `<h1>`-`<h6>`, for a page outline.
   * Omitted -- or anything but an integer 1-6, e.g. from a web-component
   * attribute -- keeps the plain `<div>` title every version before this
   * rendered. The heading keeps the title's own size, weight, colour and
   * (via `--empty-state-title-line-height`, default `inherit`) line height,
   * so a global `h1..h6` rule doesn't restyle it.
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Optional snippet that replaces the `title` string at render time.
   * When provided, the mandatory `title` prop is still required for backward-compatibility
   * but its value is not rendered — the snippet takes full priority.
   * Use this when the title needs rich markup (e.g. formatted text, icons inline).
   */
  titleSnippet?: Snippet;
  /**
   * Optional snippet that replaces the `description` string at render time.
   * When provided, `description` is silently discarded — only one is rendered.
   * Use this when the description needs rich markup (e.g. links, emphasis).
   */
  descriptionSnippet?: Snippet;
};
