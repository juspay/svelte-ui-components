import type { ListItemSanitizeOptions } from './properties';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * A consumer's sanitizer is arbitrary code. `null` here means it did not
 * return usable markup, and the caller falls back to escaping — never to
 * the unsanitized string.
 */
function runSanitizer(html: string, htmlSanitizer: (html: string) => string): string | null {
  try {
    const sanitized = htmlSanitizer(html);
    return typeof sanitized === 'string' ? sanitized : null;
  } catch {
    return null;
  }
}

/**
 * Resolves what ListItem's `label` renders as through `{@html}`.
 *
 * Defaults to escaped plain text. `sanitize.rawHtml: 'sanitize'` with a
 * `sanitize.htmlSanitizer` supplied renders `label` as markup instead, through
 * that sanitizer — see `ListItemSanitizeOptions.htmlSanitizer` for the full
 * contract (called once, falls back to escaping on throw or a non-string
 * return, `'sanitize'` with no sanitizer supplied is exactly `'escape'`).
 */
export function resolveLabelHtml(label: string, sanitize?: ListItemSanitizeOptions): string {
  if (sanitize?.rawHtml === 'sanitize' && typeof sanitize.htmlSanitizer === 'function') {
    const sanitized = runSanitizer(label, sanitize.htmlSanitizer);
    if (sanitized !== null) {
      return sanitized;
    }
  }
  return escapeHtml(label);
}
