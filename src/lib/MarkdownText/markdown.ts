import { parseFragment } from 'parse5';
import type { DefaultTreeAdapterTypes } from 'parse5';
import { escapeHtml, renderMarkdownWithStripper } from './render';
import type { RenderMarkdownOptions } from './properties';

export { unwrapMarkdownFence } from './render';

// An inert, server-compatible HTML parser handles quoted delimiters, entities
// and raw-text elements. Escaping its text nodes prevents decoded entities from
// becoming markup when the resulting string is rendered by Svelte.
function rawHtmlText(node: DefaultTreeAdapterTypes.Node): string {
  if ('value' in node) {
    return escapeHtml(node.value);
  }
  // A <template>'s children live in a separate `content` fragment rather than
  // in childNodes, so recursing only through childNodes loses its text.
  if ('content' in node) {
    return rawHtmlText(node.content);
  }
  if ('childNodes' in node) {
    return node.childNodes.map(rawHtmlText).join('');
  }
  return '';
}

export function renderMarkdown(markdown: string, options: RenderMarkdownOptions = {}): string {
  return renderMarkdownWithStripper(markdown, options, (html) => rawHtmlText(parseFragment(html)));
}
