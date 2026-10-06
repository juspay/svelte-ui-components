import { componentNav } from './_nav';

export const SITE_TITLE = 'Svelte UI';

const COMPONENT_ROUTE = /^\/components\/([^/]+)$/;

const nameBySlug: ReadonlyMap<string, string> = new Map(
  componentNav.flatMap((group) => group.items.map((item) => [item.slug, item.name] as const))
);

/**
 * `kebab-case` to `Title Case`, for a route that exists on disk but was never
 * added to the nav. A readable title beats an empty tab; the unit test next to
 * this file fails the build so the omission is still fixed at its source.
 */
function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * The nav display name for a SvelteKit route id such as `/components/select`
 * ("Select"), or null outside the component routes.
 */
export function routeName(routeId: string | null): string | null {
  const match = COMPONENT_ROUTE.exec(routeId ?? '');
  if (match === null) {
    return null;
  }
  return nameBySlug.get(match[1]) ?? humanizeSlug(match[1]);
}

/**
 * The document title for a SvelteKit route id such as `/components/select`.
 *
 * Titles come from the same inventory that builds the sidebar, so a demo added
 * to `_nav.ts` is titled the moment it is reachable. The route id is used rather
 * than the URL path because it is independent of `paths.base` (empty locally,
 * `/svelte-ui-components` on Pages).
 */
export function routeTitle(routeId: string | null): string {
  const name = routeName(routeId);
  return name === null ? SITE_TITLE : `${name} — ${SITE_TITLE}`;
}
