import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Select from './Select.svelte';

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

const light = 'rgb(248,249,250)';
const dark = 'rgb(20,22,30)';
let stylesheet: HTMLStyleElement;
let originalTheme: string | null;
let originalDataTheme: string | null;
let originalScrollIntoView: typeof Element.prototype.scrollIntoView;

beforeEach(() => {
  originalTheme = document.documentElement.getAttribute('theme');
  originalDataTheme = document.documentElement.getAttribute('data-theme');
  document.documentElement.removeAttribute('theme');
  document.documentElement.removeAttribute('data-theme');
  originalScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = () => {};
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  stylesheet = document.createElement('style');
  stylesheet.textContent = `
    [theme="light"] .portal-theme-owner, [data-theme="light"] .portal-theme-owner {
      --select-dropdown-background: ${light};
      --select-dropdown-text-color: rgb(30, 32, 40);
    }
    [theme="dark"] .portal-theme-owner, [data-theme="dark"] .portal-theme-owner {
      --select-dropdown-background: ${dark};
      --select-dropdown-text-color: rgb(240, 242, 245);
    }
  `;
  document.head.append(stylesheet);
});

afterEach(() => {
  cleanup();
  stylesheet.remove();
  for (const [attribute, value] of [
    ['theme', originalTheme],
    ['data-theme', originalDataTheme]
  ] as const) {
    if (value === null) {
      document.documentElement.removeAttribute(attribute);
    } else {
      document.documentElement.setAttribute(attribute, value);
    }
  }
  Element.prototype.scrollIntoView = originalScrollIntoView;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mountSelect(onchange = vi.fn()) {
  return render(Select, {
    classes: 'portal-theme-owner',
    ariaLabel: 'Portal choice',
    usePortal: true,
    items: [
      { id: 'alpha', label: 'Alpha' },
      { id: 'beta', label: 'Beta' }
    ],
    value: ['alpha'],
    onchange
  });
}

async function settleThemeMutation(): Promise<void> {
  // Drain real MutationObserver delivery and the resulting Svelte render. A
  // missing observation must fail the color assertion, not a polling timeout.
  await tick();
  await Promise.resolve();
  await tick();
}

// Real DOM mutations and the actual portal action are used here. jsdom does not
// qualify browser geometry; the paired app JSONForm probe covers that separately.
describe('Select portalled owner theme lifecycle', () => {
  for (const attribute of ['theme', 'data-theme']) {
    it(`refreshes a held-open popup in both directions for ${attribute}`, async () => {
      document.documentElement.setAttribute(attribute, 'light');
      const view = mountSelect();
      await fireEvent.click(screen.getByRole('combobox'));
      const panel = screen.getByRole('listbox');
      expect(panel.parentElement).toBe(document.body);
      await settleThemeMutation();
      expect(panel.style.getPropertyValue('--select-dropdown-background')).toBe(light);

      document.documentElement.setAttribute(attribute, 'dark');
      await settleThemeMutation();
      expect(panel.style.getPropertyValue('--select-dropdown-background')).toBe(dark);
      expect(panel.style.getPropertyValue('--select-dropdown-text-color')).toBe('rgb(240,242,245)');
      expect(screen.getByRole('listbox')).toBe(panel);
      expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('true');

      document.documentElement.setAttribute(attribute, 'light');
      await settleThemeMutation();
      expect(panel.style.getPropertyValue('--select-dropdown-background')).toBe(light);
      expect(screen.getByRole('listbox')).toBe(panel);
      view.unmount();
    });
  }

  it('preserves selection, snapshots the current theme on reopen and stops work after teardown', async () => {
    document.documentElement.setAttribute('theme', 'light');
    const onchange = vi.fn();
    const view = mountSelect(onchange);
    await fireEvent.click(screen.getByRole('combobox'));
    const first = screen.getByRole('listbox');
    document.documentElement.setAttribute('theme', 'dark');
    await settleThemeMutation();
    expect(first.style.getPropertyValue('--select-dropdown-background')).toBe(dark);
    await fireEvent.click(screen.getByRole('option', { name: /^Beta$/ }));
    expect(onchange).toHaveBeenCalledExactlyOnceWith(['beta']);
    expect(screen.queryByRole('listbox')).toBeNull();

    document.documentElement.setAttribute('theme', 'light');
    await fireEvent.click(screen.getByRole('combobox'));
    const reopened = screen.getByRole('listbox');
    expect(reopened).not.toBe(first);
    await settleThemeMutation();
    expect(reopened.style.getPropertyValue('--select-dropdown-background')).toBe(light);
    expect(screen.getByRole('combobox').textContent).toContain('Beta');
    view.unmount();
    await tick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const styles = vi.spyOn(window, 'getComputedStyle');
    document.documentElement.setAttribute('theme', 'dark');
    window.dispatchEvent(new Event('resize'));
    await tick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(styles).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
