import { Marked } from 'marked';
import type { RendererObject, Tokens } from 'marked';
import type { MarkdownSanitizeOptions, RenderMarkdownOptions } from './properties';

/**
 * Chat content comes from models and users, not from the app's own templates,
 * so the output must be safe without asking consumers to run a sanitizer:
 * raw HTML never passes through (it renders as escaped text), and only these
 * URL protocols survive on links. Everything else in the output is built by
 * marked from markdown syntax alone.
 */
const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const SAFE_IMAGE_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Character references that decode to an ASCII control character, plus the two
 * named forms HTML defines for tab and newline. These are the smuggling vector:
 * `jav&#x09;ascript:` is not a scheme to `new URL()`, so it reads as a harmless
 * relative path -- but the browser decodes the reference back to a tab when it
 * parses the attribute, and the WHATWG URL parser strips tabs and newlines from
 * INSIDE a scheme, leaving `javascript:`. The validator and the browser
 * therefore disagree about the same string, which is the whole bug.
 */
const NUMERIC_REFERENCE = /&#(x[0-9a-f]+|[0-9]+);?/gi;
const NAMED_WHITESPACE_REFERENCE = /&(tab|newline);/gi;
// Matching control characters is the entire point: these are exactly what the
// URL parser silently removes, and what an attacker smuggles in as a character
// reference to hide a scheme.
// eslint-disable-next-line no-control-regex
const STRIPPED_BY_URL_PARSER = /[\u0000-\u0020\u007f]/g;

/**
 * Normalise an href the way the BROWSER will see it, then check the protocol.
 * Decoding first and stripping second is what closes the gap: whatever survives
 * this is what the URL parser is actually handed at click time.
 */
function normaliseForProtocolCheck(href: string): string {
  return href
    .replace(NUMERIC_REFERENCE, (_match, code: string) =>
      String.fromCodePoint(
        code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : parseInt(code, 10)
      )
    )
    .replace(NAMED_WHITESPACE_REFERENCE, ' ')
    .replace(STRIPPED_BY_URL_PARSER, '');
}

/**
 * Relative URLs resolve against the placeholder base and come out `https:`, so
 * they are allowed without a special case.
 */
function hasSafeProtocol(href: string, allowList: Set<string>): boolean {
  try {
    return allowList.has(
      new URL(normaliseForProtocolCheck(href), 'https://relative.invalid').protocol
    );
  } catch {
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * `allowedProtocols` can only NARROW a surface's default allow-list, never
 * widen it -- intersecting with the library default (rather than substituting
 * it) is what makes listing an unsafe scheme like `javascript:` a no-op
 * instead of a hole. Casing is normalised so `'HTTPS:'` narrows the same as
 * `'https:'`, matching how `hasSafeProtocol` reads `URL.protocol` (always
 * lower-case).
 */
function narrow(defaults: Set<string>, allowedProtocols?: string[]): Set<string> {
  if (!allowedProtocols) {
    return defaults;
  }
  const requested = new Set(allowedProtocols.map((protocol) => protocol.toLowerCase()));
  return new Set([...defaults].filter((protocol) => requested.has(protocol)));
}

function resolveProtocolSets(sanitize?: MarkdownSanitizeOptions): {
  links: Set<string>;
  images: Set<string>;
} {
  return {
    links: narrow(SAFE_LINK_PROTOCOLS, sanitize?.allowedProtocols),
    images: narrow(SAFE_IMAGE_PROTOCOLS, sanitize?.allowedProtocols)
  };
}

/**
 * `null` means "no restriction" (today's default: every tag marked's GFM
 * output can produce renders normally) -- unlike the protocol allow-lists,
 * there is no built-in default set to fall back to once this exists, so its
 * absence is what keeps old behaviour byte-for-byte.
 */
function resolveTagAllowList(allowedTags?: string[]): Set<string> | null {
  return allowedTags ? new Set(allowedTags) : null;
}

function tagAllowed(allowed: Set<string> | null, tag: string): boolean {
  return allowed === null || allowed.has(tag);
}

function createSanitizingRenderer(
  protocols: { links: Set<string>; images: Set<string> },
  allowedTags: Set<string> | null,
  disableTaskLists: boolean
): RendererObject {
  return {
    html(token: Tokens.HTML | Tokens.Tag): string {
      return escapeHtml(token.text);
    },
    link(token: Tokens.Link): string | false {
      if (hasSafeProtocol(token.href, protocols.links) && tagAllowed(allowedTags, 'a')) {
        return false;
      }
      return escapeHtml(token.text);
    },
    image(token: Tokens.Image): string | false {
      if (hasSafeProtocol(token.href, protocols.images) && tagAllowed(allowedTags, 'img')) {
        return false;
      }
      return escapeHtml(token.text);
    },
    strong(token: Tokens.Strong): string | false {
      if (tagAllowed(allowedTags, 'strong')) {
        return false;
      }
      return this.parser.parseInline(token.tokens);
    },
    em(token: Tokens.Em): string | false {
      if (tagAllowed(allowedTags, 'em')) {
        return false;
      }
      return this.parser.parseInline(token.tokens);
    },
    del(token: Tokens.Del): string | false {
      if (tagAllowed(allowedTags, 'del')) {
        return false;
      }
      return this.parser.parseInline(token.tokens);
    },
    codespan(token: Tokens.Codespan): string | false {
      if (tagAllowed(allowedTags, 'code')) {
        return false;
      }
      return escapeHtml(token.text);
    },
    code(token: Tokens.Code): string | false {
      if (tagAllowed(allowedTags, 'pre')) {
        return false;
      }
      return `${escapeHtml(token.text)}\n`;
    },
    blockquote(token: Tokens.Blockquote): string | false {
      if (tagAllowed(allowedTags, 'blockquote')) {
        return false;
      }
      return this.parser.parse(token.tokens);
    },
    heading(token: Tokens.Heading): string | false {
      if (tagAllowed(allowedTags, `h${token.depth}`)) {
        return false;
      }
      return `${this.parser.parseInline(token.tokens)}\n`;
    },
    list(token: Tokens.List): string | false {
      if (tagAllowed(allowedTags, token.ordered ? 'ol' : 'ul')) {
        return false;
      }
      return token.items.map((item) => this.parser.parse(item.tokens)).join('');
    },
    table(token: Tokens.Table): string | false {
      if (tagAllowed(allowedTags, 'table')) {
        return false;
      }
      const rowText = (cells: Tokens.TableCell[]): string =>
        cells.map((cell) => this.parser.parseInline(cell.tokens)).join(' | ');
      const lines = [rowText(token.header), ...token.rows.map(rowText)];
      return `<p>${lines.join('<br>')}</p>`;
    },
    hr(): string | false {
      return tagAllowed(allowedTags, 'hr') ? false : '';
    },
    checkbox(): string | false {
      return disableTaskLists ? '' : false;
    }
  };
}

/* Safe to share across SSR requests: each instance's configuration (renderer,
   gfm, breaks) is fixed at construction and parse() takes no per-request state,
   so the cache only ever holds config-immutable parsers keyed by option shape.
   The key folds in the resolved protocol sets, tag allow-list and task-list
   toggle (sorted for a stable string) so differently-configured `sanitize`
   options get their own cached instance and never share a renderer with a
   different allow-list. */
const instances = new Map<string, Marked>();

/* External links open in a new tab with `rel="noopener noreferrer"` — the same
   default the library's Button/Card apply to `target="_blank"` anchors. The
   default renderer never emits `target`, so the regex can only annotate, never
   duplicate; relative, mailto: and tel: links keep same-tab navigation. */
const EXTERNAL_ANCHOR_PATTERN = /<a href="(https?:\/\/[^"]*)"/g;

function annotateExternalLinks(html: string): string {
  return html.replace(
    EXTERNAL_ANCHOR_PATTERN,
    '<a href="$1" target="_blank" rel="noopener noreferrer"'
  );
}

/* A wide table has to scroll, and the scroll container has to be reachable.
   Both constraints land on a wrapper rather than on the `<table>` itself:
   `display: block` on a table is what makes `overflow-x` work, but it also
   drops the element's table semantics, so assistive technology loses row and
   column navigation on exactly the content that most needs it. Wrapping keeps
   the table a table. `tabindex="0"` is the other half — an element with
   `overflow-x: auto` cannot be scrolled with arrow keys unless it can hold
   focus, so without it the new scrolling is mouse-only. Table.svelte reaches
   the same shape with `.table-scroll`, and BarChart and Book both pair a
   scrollable region with a tabindex. */
const TABLE_OPEN = /<table>/g;
const TABLE_CLOSE = /<\/table>/g;

function wrapTables(html: string, label?: string): string {
  /* `role="region"` without an accessible name announces a landmark the user
     cannot identify, which is worse than no landmark, so the role appears only
     when the caller supplies a name. The tabindex does not depend on it:
     keyboard scrolling should work either way. */
  const open =
    typeof label === 'string' && label.length > 0
      ? `<div class="markdown-table-wrapper" tabindex="0" role="region" aria-label="${escapeHtml(label)}">`
      : '<div class="markdown-table-wrapper" tabindex="0">';
  return html.replace(TABLE_OPEN, `${open}<table>`).replace(TABLE_CLOSE, '</table></div>');
}

function instanceFor(options: RenderMarkdownOptions): Marked {
  const breaks = options.breaks === true;
  const protocols = resolveProtocolSets(options.sanitize);
  const allowedTags = resolveTagAllowList(options.sanitize?.allowedTags);
  const disableTaskLists = options.sanitize?.disableTaskLists === true;
  const key = [
    breaks ? 'breaks' : 'default',
    [...protocols.links].sort().join(','),
    [...protocols.images].sort().join(','),
    allowedTags ? [...allowedTags].sort().join(',') : '*',
    disableTaskLists ? 'no-tasks' : 'tasks'
  ].join('|');
  let instance = instances.get(key);
  if (!instance) {
    instance = new Marked({
      gfm: true,
      breaks,
      renderer: createSanitizingRenderer(protocols, allowedTags, disableTaskLists)
    });
    instances.set(key, instance);
  }
  return instance;
}

/**
 * Markdown → HTML with the sanitizing pipeline above. Pure string transform —
 * no DOM involved — so it renders identically on server and client.
 */
export function renderMarkdown(markdown: string, options: RenderMarkdownOptions = {}): string {
  const instance = instanceFor(options);
  const output =
    options.inline === true ? instance.parseInline(markdown) : instance.parse(markdown);
  if (typeof output !== 'string') {
    return '';
  }
  /* Inline parsing produces no block elements, so there is no table to wrap. */
  const linked = annotateExternalLinks(output);
  return options.inline === true ? linked : wrapTables(linked, options.tableLabel);
}
