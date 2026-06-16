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
