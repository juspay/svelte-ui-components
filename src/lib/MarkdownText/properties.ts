export type MarkdownTextProperties = OptionalMarkdownTextProperties &
  MandatoryMarkdownTextProperties;

export type MandatoryMarkdownTextProperties = {
  /**
   * Markdown source. Rendered through the library's sanitized-by-construction
   * pipeline: raw HTML (block and inline) is escaped and shown as text, and
   * link/image URLs outside the safe-protocol allow-list are stripped while
   * their text is kept.
   */
  markdown: string;
};

export type OptionalMarkdownTextProperties = {
  /** Render single newlines as `<br>` (GFM "breaks" mode). */
  breaks?: boolean;
  testId?: string;
  classes?: string;
  /**
   * Accessible name for the scrollable region wrapping each table. Supplying it
   * adds `role="region"` and `aria-label`; without it the wrapper stays
   * keyboard-scrollable but announces no landmark, since an unnamed region is
   * worse than none.
   */
  tableLabel?: string;
};

export type RenderMarkdownOptions = {
  /** Render single newlines as `<br>` (GFM "breaks" mode). */
  breaks?: boolean;
  /**
   * Parse as inline markdown: no block elements (`<p>`, lists, tables) are
   * produced, so the output can sit inside an existing `<p>` or `<span>`.
   * The same sanitization applies — inline raw HTML is escaped and unsafe
   * link/image protocols are stripped.
   */
  inline?: boolean;
  /** Accessible name for the scroll region wrapping each table. See `MarkdownTextProperties.tableLabel`. */
  tableLabel?: string;
};
