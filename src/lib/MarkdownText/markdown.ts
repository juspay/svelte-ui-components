import { Marked } from 'marked';
import type { RendererObject, Tokens } from 'marked';
import type { RenderMarkdownOptions } from './properties';

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

const sanitizingRenderer: RendererObject = {
  html(token: Tokens.HTML | Tokens.Tag): string {
    return escapeHtml(token.text);
  },
  link(token: Tokens.Link): string | false {
    if (hasSafeProtocol(token.href, SAFE_LINK_PROTOCOLS)) {
      return false;
    }
    return escapeHtml(token.text);
  },
  image(token: Tokens.Image): string | false {
    if (hasSafeProtocol(token.href, SAFE_IMAGE_PROTOCOLS)) {
      return false;
    }
    return escapeHtml(token.text);
  }
};

/* Safe to share across SSR requests: each instance's configuration (renderer,
   gfm, breaks) is fixed at construction and parse() takes no per-request state,
   so the cache only ever holds config-immutable parsers keyed by option shape. */
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

function instanceFor(options: RenderMarkdownOptions): Marked {
  const breaks = options.breaks === true;
  const key = breaks ? 'breaks' : 'default';
  let instance = instances.get(key);
  if (!instance) {
    instance = new Marked({ gfm: true, breaks, renderer: sanitizingRenderer });
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
  return typeof output === 'string' ? annotateExternalLinks(output) : '';
}
