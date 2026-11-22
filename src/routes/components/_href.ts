import { resolve } from '$app/paths';
import type { ComponentSlug } from './_nav';

/**
 * The URL of a component's demo page.
 *
 * `resolve()` checks its argument against the generated route types, so a mistyped link is a
 * compile error. It cannot take a variable that may be any of ~100 slugs, though: its signature
 * is conditional on the argument, and TypeScript checks a union argument against each case as a
 * whole. So the prefix comes from the root route and the slug is what carries the type. Both
 * spellings produce the base path, then `/`, then the pathname -- on the client and while
 * prerendering, where the base path is relative.
 */
export function componentHref(slug: ComponentSlug): string {
  return `${resolve('/')}components/${slug}`;
}
