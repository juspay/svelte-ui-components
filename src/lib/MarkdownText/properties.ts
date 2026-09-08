export type MarkdownTextProperties = OptionalMarkdownTextProperties &
  MandatoryMarkdownTextProperties;

export type MandatoryMarkdownTextProperties = {
  /**
   * Markdown source. Rendered through the library's sanitized-by-construction
   * pipeline: raw HTML is escaped by default (or stripped via sanitize.rawHtml), and
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
  /**
   * Narrow which URL protocols survive on rendered links/images. See
   * `MarkdownSanitizeOptions`.
   */
  sanitize?: MarkdownSanitizeOptions;
};

/**
 * A consumer's own link policy can be stricter than the library default
 * (`http:`/`https:`/`mailto:`/`tel:` for links, `http:`/`https:` for images) —
 * for example, no live `mailto:`/`tel:` in a chat surface. `allowedProtocols`
 * lets a caller restrict which of those defaults survive; it is intersected
 * with the library's own allow-list for each surface, so it can only NARROW
 * what already renders, never widen it (listing `javascript:` here can never
 * resurrect it). Omitting `sanitize`, or `allowedProtocols`, keeps today's
 * defaults untouched. This is independent of how raw HTML is disposed of,
 * which `rawHtml` governs separately; raw HTML is never inserted as markup
 * either way, so neither option can widen what renders.
 */
export type MarkdownSanitizeOptions = {
  /**
   * Protocols (e.g. `'https:'`, `'mailto:'`) allowed to survive on rendered
   * links and images, intersected with the library's own default allow-list
   * for each surface. An empty array drops every link and image, keeping
   * their text.
   */
  allowedProtocols?: string[];
  /**
   * Narrows which markdown-GENERATED tags are allowed to render as
   * themselves. Unlike `allowedProtocols` there is no pre-set default list to
   * intersect with — every tag `marked`'s own GFM output can produce renders
   * normally until this is supplied, so passing it narrows from "everything"
   * rather than from a built-in allow-list. A disallowed tag renders its
   * parsed inner content as plain markup-free text instead of the element —
   * the same "keep the text, drop the element" contract `allowedProtocols`
   * uses for an unsafe link/image. Recognised names: `'a'`, `'img'`,
   * `'strong'`, `'em'`, `'del'`, `'code'` (inline), `'pre'` (code block),
   * `'blockquote'`, `'ul'`, `'ol'`, `'table'`, `'hr'`, and `'h1'`–`'h6'`. An
   * unrecognised name is simply ignored — it narrows nothing, it does not
   * error. Omitting `allowedTags` keeps today's defaults untouched: every tag
   * renders as it does now. This list governs markdown-GENERATED tags only and
   * never affects raw HTML from the source, whose disposal is `rawHtml`'s job.
   */
  allowedTags?: string[];
  /**
   * Render GFM task-list items (`- [ ] done`) as plain list text instead of
   * an `<input type="checkbox">`. The checkbox already renders `disabled` by
   * default (it never submits or toggles), so this is a presentation choice
   * for surfaces that would rather not show checkbox glyphs at all, not a
   * safety one. Defaults to `false`, keeping today's checkbox rendering.
   */
  disableTaskLists?: boolean;
  /**
   * What to do with raw HTML typed literally into the markdown source, as
   * opposed to the tags markdown itself generates (which `allowedTags`
   * governs). Defaults to `'escape'` — today's behaviour, where
   * `<script>alert(1)</script>` renders as visible escaped tag text.
   *
   * `'strip'` removes raw tags and comments while retaining their text:
   * `<div>hello</div>` becomes `hello`. An inert HTML parser handles quoted
   * delimiters and entities; every retained text node is escaped before output.
   * Script/style contents remain visible text, never executable elements.
   * Fenced code and ordinary angle-bracket prose are not raw HTML tokens and
   * keep their existing rendering. Neither mode inserts source HTML into the DOM.
   */
  rawHtml?: MarkdownRawHtmlMode;
};

/**
 * `'escape'` renders raw HTML as visible escaped text (the default, and what
 * the component has always done); `'strip'` removes it. See
 * `MarkdownSanitizeOptions.rawHtml`.
 */
export type MarkdownRawHtmlMode = 'escape' | 'strip';

export type RenderMarkdownOptions = {
  /** Render single newlines as `<br>` (GFM "breaks" mode). */
  breaks?: boolean;
  /**
   * Parse as inline markdown: no block elements (`<p>`, lists, tables) are
   * produced, so the output can sit inside an existing `<p>` or `<span>`.
   * The same sanitization applies — inline raw HTML is escaped (or dropped,
   * per `sanitize.rawHtml`) and unsafe link/image protocols are stripped.
   */
  inline?: boolean;
  /** Accessible name for the scroll region wrapping each table. See `MarkdownTextProperties.tableLabel`. */
  tableLabel?: string;
  /** Narrow the protocol allow-list. See `MarkdownSanitizeOptions`. */
  sanitize?: MarkdownSanitizeOptions;
};
