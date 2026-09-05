import type { Snippet } from 'svelte';

export type ToolbarProperties = ToolbarEventProperties & {
  showBackButton?: boolean;
  text?: string | null;
  backIcon?: string | null;
  backLabel?: string;
  /**
   * Renders the built-in back control as a real `<a href={backHref}>` instead of a
   * `<button>` — for back navigation that is a real link (browser back-forward, open-in-new-tab,
   * a working href with JS disabled) rather than only reachable through `onbackclick`.
   * Omit it (the default) for the existing callback-only `<button>`. `onbackclick`
   * still fires as the anchor's `click` handler when both are supplied, so navigation and any
   * side effect (e.g. analytics) coexist exactly as they do on the library's own `Button`
   * `href` + `onclick`. Ignored when `leftContent` is provided or the back control is hidden
   * (`showBackButton={false}` or `backIcon={null}`).
   */
  backHref?: string;
  leftContent?: Snippet;
  centerContent?: Snippet;
  rightContent?: Snippet;
  additionalContent?: Snippet;
  classes?: string;
  testId?: string;
  headingTestId?: string;
};

export type ToolbarEventProperties = {
  onbackclick?: () => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
