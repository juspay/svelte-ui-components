import type { Snippet } from 'svelte';

export type ListItemProperties = ListItemEventProperties & {
  leftImageUrl?: string | null;
  leftImageFallbackUrl?: string | null;
  rightImageUrl?: string | null;
  /** Rewrites SVG markup before either image is inlined. Providing it enables SVG inlining. */
  transformSvg?: (svg: string) => string;
  /**
   * Center text content. Used for the main list item label.
   *
   * Rendered as **escaped plain text by default**: `<b>Bold</b>` shows those
   * characters literally instead of rendering as bold. Pass
   * `sanitize={{ rawHtml: 'sanitize', htmlSanitizer }}` to render `label` as
   * markup instead — see `ListItemSanitizeOptions.htmlSanitizer`. A consumer
   * relying on the library's previous unconditional `{@html label}` behaviour
   * needs that opt-in now; without it, a label that used to render as markup
   * renders as visible tag text.
   */
  label?: string | null;
  /**
   * Governs how `label` is rendered when it contains markup. Omitting this
   * keeps `label` as escaped plain text. See `ListItemSanitizeOptions`.
   */
  sanitize?: ListItemSanitizeOptions;
  useAccordion?: boolean;
  rightContentText?: string | null;
  testId?: string;
  topSectionTestId?: string;
  rightImageTestId?: string;
  leftImageTestId?: string;
  centerTextTestId?: string;
  showLoader?: boolean;
  showRightContentLoader?: boolean;
  expand?: boolean;
  preventFocus?: boolean;
  /**
   * Removes ListItem's synthetic roles and tab stops while retaining its mouse handlers.
   * Opt in when an ancestor or consumer supplies the semantic interactive control.
   */
  suppressRoleAndTabindex?: boolean;
  leftContent?: Snippet;
  centerContent?: Snippet;
  rightContent?: Snippet;
  bottomContent?: Snippet;
  classes?: string;
  role?: string;
  ariaSelected?: boolean;
  id?: string;
};

/**
 * `label` does not implement HTML sanitization and does not depend on a
 * sanitizer — the same position `MarkdownText.htmlSanitizer` takes, and for
 * the same reason: escaping everything is a provably safe default, and a
 * sanitizer written into this package could only subtract from that safety
 * while adding a specialist problem (mutation XSS, namespace confusion,
 * parse-then-reparse divergence) to a dependency this many projects install.
 */
export type ListItemSanitizeOptions = {
  /**
   * `'escape'` (the default) renders `label` as plain text, with `&`, `<`,
   * `>`, `"` and `'` escaped. `'sanitize'` renders `label` as markup after
   * passing it once through `htmlSanitizer`. `'sanitize'` with no
   * `htmlSanitizer` supplied behaves exactly like `'escape'` — the unsafe
   * path is unreachable by omission, not by discipline.
   */
  rawHtml?: 'escape' | 'sanitize';
  /**
   * Sanitizer consulted only while `rawHtml` is `'sanitize'`. Called once,
   * with the raw `label` string, and whatever it returns is rendered as
   * markup via `{@html}` — unmodified, since re-checking it would mean
   * parsing and rewriting the very output this option exists to delegate.
   *
   * Pass DOMPurify's `sanitize`, or anything you trust. If it throws or
   * returns a non-string, `label` is escaped instead; the unsanitized string
   * is never emitted.
   *
   * It must work on the server as well as in the browser: ListItem renders
   * this through `{@html}` from a `$derived`, so a sanitizer that only works
   * client-side (DOMPurify without a DOM, say) throws during SSR, falls back
   * to escaped output there, and succeeds on hydration — the two renders
   * then disagree. Give it a server implementation, or leave `rawHtml` at
   * its default on server-rendered pages.
   */
  htmlSanitizer?: (html: string) => string;
};

export type ListItemEventProperties = {
  onleftimageclick?: (event: MouseEvent) => void;
  onrightimageclick?: (event: MouseEvent) => void;
  oncentertextclick?: (event: MouseEvent) => void;
  onitemclick?: (event: MouseEvent) => void;
  ontopsectionclick?: (event: MouseEvent) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
