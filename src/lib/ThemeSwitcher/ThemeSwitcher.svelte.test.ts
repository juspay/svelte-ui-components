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

  it('selects an available theme and exposes its name when cycling inside a form', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const submit = vi.fn((event: Event) => event.preventDefault());
    form.addEventListener('submit', submit);
    const view = render(ThemeSwitcher, {
      target: form,
      props: { options: [{ value: 'light' }, { value: 'dark' }], storageKey: '' }
    });
    try {
      const toggle = view.getByRole('button', { name: 'Switch theme (current: light)' });
      toggle.click();
      await view.findByRole('button', { name: 'Switch theme (current: dark)' });
      expect(submit).not.toHaveBeenCalled();
    } finally {
      form.remove();
    }
  });

  it('reports mount, clicks and an options-driven fallback exactly once each', async () => {
    const onchange = vi.fn();
    const view = render(ThemeSwitcher, {
      options: [{ value: 'light' }, { value: 'dark' }],
      storageKey: '',
      onchange
    });
    view.getByRole('button').click();
    await view.findByRole('button', { name: 'Switch theme (current: dark)' });
    await view.rerender({ options: [{ value: 'light' }], storageKey: '', onchange });
    expect(view.getByRole('button', { name: 'Switch theme (current: light)' })).toBeTruthy();
    expect(onchange.mock.calls).toEqual([
      ['light', 'light'],
      ['dark', 'dark'],
      ['light', 'light']
    ]);
  });

  it('initializes an empty switcher and reports the first available theme when options arrive', async () => {
    const onchange = vi.fn();
    const view = render(ThemeSwitcher, { options: [], storageKey: '', onchange });
    expect(onchange.mock.calls).toEqual([['system', 'light']]);
    await view.rerender({ options: [{ value: 'dark' }], storageKey: '', onchange });
    expect(onchange.mock.calls).toEqual([
      ['system', 'light'],
      ['dark', 'dark']
    ]);
  });

  it('exposes which segment is selected, not just which one is highlighted', () => {
    const { getAllByRole } = render(ThemeSwitcher, { mode: 'segment', value: 'dark' });
    expect(getAllByRole('button').every((button) => button.getAttribute('type') === 'button')).toBe(
      true
    );
    const pressed = getAllByRole('button').map((button) => button.getAttribute('aria-pressed'));

    expect(pressed.filter((state) => state === 'true')).toHaveLength(1);
    expect(pressed.every((state) => state === 'true' || state === 'false')).toBe(true);
  });
});
