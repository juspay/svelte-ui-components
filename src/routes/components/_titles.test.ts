import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { componentNav } from './_nav';
import { routeTitle, SITE_TITLE } from './_titles';

const componentsDir = import.meta.dirname;

const routeSlugsOnDisk = readdirSync(componentsDir, { withFileTypes: true })
  .filter(
    (entry) => entry.isDirectory() && existsSync(join(componentsDir, entry.name, '+page.svelte'))
  )
  .map((entry) => entry.name)
  .sort();

const navItems = componentNav.flatMap((group) => group.items);

describe('routeTitle', () => {
  it('formats a demo route as "<Name> — Svelte UI"', () => {
    expect(routeTitle('/components/select')).toBe('Select — Svelte UI');
  });

  it('uses the nav display name, not the slug', () => {
    expect(routeTitle('/components/color-picker')).toBe('Color Picker — Svelte UI');
    expect(routeTitle('/components/chat-compositions')).toBe('Chat compositions — Svelte UI');
    expect(routeTitle('/components/hitl')).toBe('HITL — Svelte UI');
  });

  it('falls back to the site title outside the component routes', () => {
    expect(routeTitle(null)).toBe(SITE_TITLE);
    expect(routeTitle('/')).toBe(SITE_TITLE);
    expect(routeTitle('/components')).toBe(SITE_TITLE);
    expect(routeTitle('/components/select/nested')).toBe(SITE_TITLE);
  });

  it('humanizes a route that is missing from the nav rather than leaving the title empty', () => {
    expect(routeTitle('/components/not-in-the-nav')).toBe('Not In The Nav — Svelte UI');
  });

  it('gives every nav entry a distinct, non-empty title', () => {
    const titles = navItems.map((item) => routeTitle(`/components/${item.slug}`));
    expect(titles.every((title) => title.endsWith(` — ${SITE_TITLE}`))).toBe(true);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe('route inventory', () => {
  it('lists every demo route on disk in _nav.ts, so it is reachable and titled', () => {
    const inNav = new Set(navItems.map((item) => item.slug));
    expect(routeSlugsOnDisk.filter((slug) => !inNav.has(slug))).toEqual([]);
  });

  it('has no nav entry without a demo route', () => {
    const onDisk = new Set(routeSlugsOnDisk);
    expect(navItems.map((item) => item.slug).filter((slug) => !onDisk.has(slug))).toEqual([]);
  });

  it('has no duplicate slug', () => {
    const slugs = navItems.map((item) => item.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
