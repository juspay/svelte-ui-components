import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeSwitcher from './ThemeSwitcher.svelte';

// Segment mode showed the selected theme only through a sliding indicator, so the
// selection was invisible to anything that does not read pixels.
describe('ThemeSwitcher segment selection', () => {
  beforeEach(() => {
    // The component resolves a 'system' preference through matchMedia, which jsdom
    // does not implement; the stub reports "not dark" so the query is answerable.
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {}
    }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it('exposes which segment is selected, not just which one is highlighted', () => {
    const { getAllByRole } = render(ThemeSwitcher, { mode: 'segment', value: 'dark' });
    const pressed = getAllByRole('button').map((button) => button.getAttribute('aria-pressed'));

    expect(pressed.filter((state) => state === 'true')).toHaveLength(1);
    expect(pressed.every((state) => state === 'true' || state === 'false')).toBe(true);
  });
});
