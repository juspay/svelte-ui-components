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
   * Extra class name added to the scrollable region wrapping each table,
   * alongside the built-in `markdown-table-wrapper` rather than replacing it
   * (the wrapper's scroll/focus behaviour is scoped to that class and cannot
   * be retargeted). Lets a consumer whose own stylesheet targets a different
   * class keep that styling too. Omitting it, or passing an empty or
   * whitespace-only string, keeps only `markdown-table-wrapper`.
   */
  tableWrapperClass?: string;
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
  /**
   * Sanitizer consulted only while `rawHtml` is `'sanitize'`. It is called ONCE
   * per render, with the whole assembled document, and what it returns is what
   * gets rendered.
   *
   * Note what that means: it sees markdown-generated HTML too, not only the raw
   * HTML the author wrote. A configuration restrictive enough to drop `<p>`,
   * `<code>` or `<table>` will drop them here as well, so allow the tags this
   * component emits. It is not called per raw-HTML token, because marked splits
   * a block-level container into separate opening and closing tokens -- and a
   * sanitizer handed `<div class="x">` on its own balances it to
   * `<div class="x"></div>`, which puts the content the author wrapped outside
   * its container.
   *
   * This library deliberately does not implement HTML sanitization and does not
   * depend on a sanitizer. Escaping everything is a provably safe default, and a
   * sanitizer written here could only subtract from it: mutation XSS, namespace
   * confusion and parse-then-reparse divergence are a specialist problem, and a
   * home-grown one inside a package this many projects install would be the most
   * dangerous file in it. Injection keeps that code in your dependency tree,
   * where it can be audited and updated on its own schedule.
   *
   * It also keeps the contract honest: this signature says the returned string
   * is YOUR responsibility. Pass DOMPurify's `sanitize`, or anything you trust.
   * Note that the library's URL protocol allow-list guards markdown-syntax links
   * and images only: a `javascript:` href written as raw HTML is emitted exactly
   * as your sanitizer returns it, because re-checking that would mean parsing
   * and rewriting the output -- the sanitization this option exists to delegate.
   *
   * If it throws or returns a non-string, the document is re-rendered with
   * `'escape'` instead; the unsanitized assembly is never emitted.
   *
   * It must work on the server as well as in the browser. `MarkdownText`
   * renders this through `{@html}` from a `$derived`, so a sanitizer that only
   * works client-side (DOMPurify without a DOM, say) throws during SSR, falls
   * back to escaped output there, and succeeds on hydration -- the two renders
   * then disagree. Give it a server implementation, or leave `rawHtml` alone on
   * server-rendered pages.
   */
  htmlSanitizer?: (html: string) => string;
};

/**
 * `'escape'` renders raw HTML as visible escaped text (the default, and what
 * the component has always done); `'strip'` removes it; `'sanitize'` keeps raw
 * HTML in place and hands the assembled document to
 * `MarkdownSanitizeOptions.htmlSanitizer`, rendering what comes back. With no
 * sanitizer supplied, `'sanitize'` behaves exactly like `'escape'` -- the unsafe
 * path is unreachable by omission rather than by discipline. See
 * `MarkdownSanitizeOptions.rawHtml`.
 */
export type MarkdownRawHtmlMode = 'escape' | 'strip' | 'sanitize';

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
  /** Class name for the scroll region wrapping each table. See `MarkdownTextProperties.tableWrapperClass`. */
  tableWrapperClass?: string;
  /** Narrow the protocol allow-list. See `MarkdownSanitizeOptions`. */
  sanitize?: MarkdownSanitizeOptions;
};
