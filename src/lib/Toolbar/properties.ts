import type { Snippet } from 'svelte';

export type ToolbarProperties = ToolbarEventProperties & {
  showBackButton?: boolean;
  text?: string | null;
  /**
   * A real heading, separate from `text` — which has always rendered a plain,
   * non-heading div and keeps doing so for existing consumers. Renders as a
   * heading only once `headingLevel` also resolves to a real level 1-6;
   * otherwise renders in a plain, non-heading tag instead, same as `text`.
   */
  title?: string;
  /**
   * The tag `title` renders as (`<svelte:element this={`h${headingLevel}`}>`).
   * Only 1-6 resolve to a real heading; anything else (including omitting it)
   * renders `title` in a plain, non-heading tag instead — the same reasoning
   * `Sheet`'s `headingLevel` already uses, so a stray "7"/"0"/`NaN` reaching
   * through a web component's untyped attribute degrades the same way there
   * too, rather than emitting an invalid `<h7>`/`<h0>`/`<hNaN>`.
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Rendered as `<p class="subtitle">` under `title`. Ignored without `title`. */
  subtitle?: string;
  /**
   * The root element's tag, via `<svelte:element>`. Defaults to `div`, i.e.
   * unconditionally unchanged from every version before this. Set it to give
   * the toolbar its own landmark (`header`, `nav`, `aside`, `footer`) instead
   * of a consumer wrapping it in one purely to supply that semantics.
   */
  rootTag?: 'div' | 'header' | 'nav' | 'aside' | 'footer';
  /**
   * `'chrome'` (the default) is the fixed, full-viewport-width app bar every
   * version before this rendered. `'page-header'` is the same bar in the page's
   * flow: position static, width 100%, transparent background, no shadow,
   * z-index auto, and a content row that wraps (actions drop under the title
   * when they don't fit). Those six are set directly, not through the chrome's
   * `--toolbar-position`/`-width`/`-background`/`-box-shadow`/`-z-index`/
   * `--toolbar-content-flex-wrap`, so a bar themed at :root never leaks into a
   * page header. Every other `--toolbar-*` variable applies to both.
   */
  variant?: ToolbarVariant;
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

export type ToolbarVariant = 'chrome' | 'page-header';
