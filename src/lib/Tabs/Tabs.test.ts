// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Tabs from './Tabs.svelte';

const labels = ['Alpha', 'Beta', 'Gamma'];
const objects = [
  { key: 'alpha', label: 'Alpha' },
  { key: 'beta', label: 'Beta', disabled: true },
  { key: 'gamma', label: 'Gamma' }
];

async function settle() {
  await tick();
  await Promise.resolve();
  await tick();
}

function tabs() {
  return screen.queryAllByRole('tab');
}

function tab(label: string) {
  return screen.getByRole('tab', { name: label });
}

function tabStops() {
  return tabs().filter((item) => item.tabIndex === 0);
}

async function focus(label: string) {
  tab(label).focus();
  await settle();
}

async function key(label: string, value: string, modifiers: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', {
    key: value,
    bubbles: true,
    cancelable: true,
    ...modifiers
  });
  tab(label).dispatchEvent(event);
  await settle();
  return event;
}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});

afterEach(() => vi.unstubAllGlobals());

describe('Tabs selection contracts', () => {
  it('keeps automatic string selection, callbacks, wrapping and external updates', async () => {
    const onchange = vi.fn();
    const view = render(Tabs, { items: labels, onchange });
    expect(tab('Alpha').getAttribute('aria-selected')).toBe('true');
    await focus('Alpha');
    await key('Alpha', 'ArrowRight');
    expect(document.activeElement).toBe(tab('Beta'));
    expect(tab('Beta').getAttribute('aria-selected')).toBe('true');
    expect(onchange).toHaveBeenLastCalledWith(1, 'Beta');
    await key('Beta', 'End');
    await key('Gamma', 'ArrowRight');
    expect(document.activeElement).toBe(tab('Alpha'));
    expect(onchange).toHaveBeenLastCalledWith(0, 'Alpha');
    await view.rerender({ activeIndex: 2 });
    await settle();
    expect(document.activeElement).toBe(tab('Gamma'));
    expect(tabStops()).toEqual([tab('Gamma')]);
  });

  it('requests only a key change in object mode and waits for controlled selection', async () => {
    const onkeychange = vi.fn();
    const onchange = vi.fn();
    const view = render(Tabs, { items: objects, activeKey: 'alpha', onkeychange, onchange });
    await focus('Alpha');
    await key('Alpha', 'ArrowRight');
    expect(document.activeElement).toBe(tab('Gamma'));
    expect(onkeychange).toHaveBeenCalledExactlyOnceWith('gamma');
    expect(onchange).not.toHaveBeenCalled();
    expect(tab('Alpha').getAttribute('aria-selected')).toBe('true');
    await view.rerender({ activeKey: 'gamma' });
    expect(tab('Gamma').getAttribute('aria-selected')).toBe('true');
    await fireEvent.click(tab('Gamma'));
    expect(onkeychange).toHaveBeenCalledTimes(1);
  });

  it.each([-1, 9, Number.NaN])(
    'offers entry without selection for invalid index %s',
    (activeIndex) => {
      const onchange = vi.fn();
      render(Tabs, { items: labels, activeIndex, onchange });
      expect(tabStops()).toEqual([tab('Alpha')]);
      expect(tabs().every((item) => item.getAttribute('aria-selected') === 'false')).toBe(true);
      expect(onchange).not.toHaveBeenCalled();
    }
  );

  it('offers the first enabled object as entry with no matching selected key', async () => {
    const onkeychange = vi.fn();
    render(Tabs, {
      items: [{ key: 'locked', label: 'Locked', disabled: true }, ...objects],
      activeKey: 'missing',
      onkeychange
    });
    expect(tabStops()).toEqual([tab('Alpha')]);
    await focus('Alpha');
    expect(tabs().every((item) => item.getAttribute('aria-selected') === 'false')).toBe(true);
    expect(onkeychange).not.toHaveBeenCalled();
    await key('Alpha', 'Enter');
    expect(onkeychange).toHaveBeenCalledExactlyOnceWith('alpha');
  });

  it('does not invent object selection when activeKey is omitted', () => {
    render(Tabs, { items: objects });
    expect(tabStops()).toEqual([tab('Alpha')]);
    expect(tabs().every((item) => item.getAttribute('aria-selected') === 'false')).toBe(true);
  });
});

describe('disabled and empty Tabs', () => {
  it('skips disabled items for arrows and Home/End and rejects direct activation', async () => {
    const onkeychange = vi.fn();
    render(Tabs, {
      items: [
        { key: 'first', label: 'First', disabled: true },
        ...objects,
        { key: 'last', label: 'Last', disabled: true }
      ],
      activeKey: 'alpha',
      activationMode: 'manual',
      onkeychange
    });
    expect(tab('Beta').getAttribute('aria-disabled')).toBe('true');
    await fireEvent.click(tab('Beta'));
    await key('Beta', 'Enter');
    expect(onkeychange).not.toHaveBeenCalled();
    await focus('Alpha');
    await key('Alpha', 'ArrowRight');
    expect(document.activeElement).toBe(tab('Gamma'));
    await key('Gamma', 'Home');
    expect(document.activeElement).toBe(tab('Alpha'));
    await key('Alpha', 'End');
    expect(document.activeElement).toBe(tab('Gamma'));
    await key('Gamma', 'ArrowRight');
    expect(document.activeElement).toBe(tab('Alpha'));
    await key('Alpha', 'ArrowLeft');
    expect(document.activeElement).toBe(tab('Gamma'));
    expect(onkeychange).not.toHaveBeenCalled();
  });

  it('keeps an externally selected disabled item selected but not focusable', () => {
    render(Tabs, { items: objects, activeKey: 'beta' });
    expect(tab('Beta').getAttribute('aria-selected')).toBe('true');
    expect(tab('Beta').tabIndex).toBe(-1);
    expect(tabStops()).toEqual([tab('Alpha')]);
  });

  it('has no tab stop or activation while globally disabled', async () => {
    const onchange = vi.fn();
    render(Tabs, { items: labels, disabled: true, onchange });
    expect(tabStops()).toEqual([]);
    await fireEvent.click(tab('Beta'));
    const event = await key('Alpha', 'ArrowRight');
    expect(event.defaultPrevented).toBe(false);
    expect(onchange).not.toHaveBeenCalled();
  });

  it('has no tab stop for all-disabled lists', async () => {
    const onkeychange = vi.fn();
    render(Tabs, {
      items: objects.map((item) => ({ ...item, disabled: true })),
      activeKey: 'alpha',
      onkeychange
    });
    expect(tabStops()).toEqual([]);
    await key('Alpha', 'Home');
    await key('Alpha', 'End');
    await key('Alpha', 'ArrowRight');
    expect(onkeychange).not.toHaveBeenCalled();
  });

  it('supports empty lists and entry after items arrive', async () => {
    const onchange = vi.fn();
    const view = render(Tabs, { items: [], activeIndex: -1, onchange });
    expect(tabs()).toEqual([]);
    await fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(onchange).not.toHaveBeenCalled();
    await view.rerender({ items: labels });
    expect(tabStops()).toEqual([tab('Alpha')]);
  });
});

describe('manual activation and focus recovery', () => {
  it('moves focus without selection until Space, Enter or click in string mode', async () => {
    const onchange = vi.fn();
    render(Tabs, { items: labels, activationMode: 'manual', onchange });
    await focus('Alpha');
    await key('Alpha', 'ArrowRight');
    expect(document.activeElement).toBe(tab('Beta'));
    expect(tabStops()).toEqual([tab('Beta')]);
    expect(tab('Alpha').getAttribute('aria-selected')).toBe('true');
    expect(onchange).not.toHaveBeenCalled();
    await key('Beta', ' ');
    expect(onchange).toHaveBeenLastCalledWith(1, 'Beta');
    await key('Beta', 'ArrowRight');
    await key('Gamma', 'Enter');
    expect(onchange).toHaveBeenLastCalledWith(2, 'Gamma');
    await fireEvent.click(tab('Alpha'));
    expect(onchange).toHaveBeenLastCalledWith(0, 'Alpha');
    expect(tabStops()).toEqual([tab('Alpha')]);
  });

  it('keeps object selection controlled during manual focus and activation', async () => {
    const onkeychange = vi.fn();
    const view = render(Tabs, {
      items: objects,
      activeKey: 'alpha',
      activationMode: 'manual',
      onkeychange
    });
    await focus('Alpha');
    await key('Alpha', 'End');
    expect(document.activeElement).toBe(tab('Gamma'));
    expect(tabStops()).toEqual([tab('Gamma')]);
    expect(onkeychange).not.toHaveBeenCalled();
    await key('Gamma', 'Enter');
    expect(onkeychange).toHaveBeenCalledExactlyOnceWith('gamma');
    expect(tab('Alpha').getAttribute('aria-selected')).toBe('true');
    await view.rerender({ activeKey: 'gamma' });
    expect(tab('Gamma').getAttribute('aria-selected')).toBe('true');
  });

  it('restores the selected tab as the single entry point after leaving', async () => {
    render(Tabs, { items: labels, activationMode: 'manual' });
    await focus('Alpha');
    await key('Alpha', 'End');
    expect(tabStops()).toEqual([tab('Gamma')]);
    tab('Gamma').blur();
    await settle();
    expect(tabStops()).toEqual([tab('Alpha')]);
    await focus('Alpha');
    await key('Alpha', 'ArrowRight');
    expect(document.activeElement).toBe(tab('Beta'));
  });

  it('restores first enabled entry after leaving an unselected list', async () => {
    render(Tabs, { items: labels, activeIndex: -1, activationMode: 'manual' });
    await focus('Alpha');
    await key('Alpha', 'End');
    tab('Gamma').blur();
    await settle();
    expect(tabStops()).toEqual([tab('Alpha')]);
    expect(tabs().every((item) => item.getAttribute('aria-selected') === 'false')).toBe(true);
  });

  it('follows external selection while focused but does not steal focus from outside', async () => {
    const view = render(Tabs, { items: labels, activationMode: 'manual' });
    await focus('Alpha');
    await key('Alpha', 'ArrowRight');
    await view.rerender({ activeIndex: 2 });
    await settle();
    expect(document.activeElement).toBe(tab('Gamma'));
    expect(tabStops()).toEqual([tab('Gamma')]);
    tab('Gamma').blur();
    await view.rerender({ activeIndex: 1 });
    await settle();
    expect(document.activeElement).not.toBe(tab('Beta'));
    expect(tabStops()).toEqual([tab('Beta')]);
  });

  it('recovers focus when the focused keyed item is removed', async () => {
    const view = render(Tabs, { items: objects, activeKey: 'alpha', activationMode: 'manual' });
    await focus('Alpha');
    await key('Alpha', 'End');
    await view.rerender({ items: objects.filter((item) => item.key !== 'gamma') });
    await settle();
    expect(document.activeElement).toBe(tab('Alpha'));
    expect(tabStops()).toEqual([tab('Alpha')]);
  });

  it('preserves focused object identity when items reorder', async () => {
    const view = render(Tabs, { items: objects, activeKey: 'alpha', activationMode: 'manual' });
    await focus('Alpha');
    await key('Alpha', 'End');
    await view.rerender({ items: [...objects].reverse() });
    await settle();
    expect(document.activeElement).toBe(tab('Gamma'));
    expect(tabStops()).toEqual([tab('Gamma')]);
    expect(tab('Alpha').getAttribute('aria-selected')).toBe('true');
  });

  it('recovers when the focused item becomes disabled', async () => {
    const view = render(Tabs, { items: objects, activeKey: 'alpha', activationMode: 'manual' });
    await focus('Alpha');
    await key('Alpha', 'End');
    await view.rerender({
      items: objects.map((item) => ({ ...item, disabled: item.key !== 'alpha' }))
    });
    await settle();
    expect(document.activeElement).toBe(tab('Alpha'));
    expect(tabStops()).toEqual([tab('Alpha')]);
  });

  it('releases focus when no enabled items remain', async () => {
    const view = render(Tabs, { items: labels });
    await focus('Alpha');
    await view.rerender({ disabled: true });
    await settle();
    expect(tabStops()).toEqual([]);
    expect(document.activeElement).not.toBe(tab('Alpha'));
    await view.rerender({ disabled: false });
    expect(tabStops()).toEqual([tab('Alpha')]);
  });
});

describe('keyboard direction and boundaries', () => {
  it('clamps arrows when loop is false while Home/End still jump', async () => {
    const onchange = vi.fn();
    render(Tabs, { items: labels, loop: false, onchange });
    await focus('Alpha');
    await key('Alpha', 'ArrowLeft');
    expect(document.activeElement).toBe(tab('Alpha'));
    expect(onchange).not.toHaveBeenCalled();
    await key('Alpha', 'End');
    await key('Gamma', 'ArrowRight');
    expect(document.activeElement).toBe(tab('Gamma'));
    expect(onchange).toHaveBeenCalledTimes(1);
    await key('Gamma', 'Home');
    expect(document.activeElement).toBe(tab('Alpha'));
  });

  it('does not activate again when only one enabled tab exists', async () => {
    const onkeychange = vi.fn();
    render(Tabs, { items: objects.slice(0, 2), activeKey: 'alpha', onkeychange });
    await focus('Alpha');
    await key('Alpha', 'ArrowRight');
    expect(document.activeElement).toBe(tab('Alpha'));
    expect(onkeychange).not.toHaveBeenCalled();
  });

  it('reverses only horizontal arrows for explicit RTL', async () => {
    render(Tabs, { items: labels, dir: 'rtl', activeIndex: 1 });
    await focus('Beta');
    await key('Beta', 'ArrowLeft');
    expect(document.activeElement).toBe(tab('Gamma'));
    await key('Gamma', 'ArrowRight');
    expect(document.activeElement).toBe(tab('Beta'));
    await key('Beta', 'Home');
    expect(document.activeElement).toBe(tab('Alpha'));
    expect(screen.getByRole('tablist').closest('[dir]')?.getAttribute('dir')).toBe('rtl');
  });

  // Only the `dir` attribute is covered here. Direction inherited purely through CSS
  // is asserted in a real browser (tests/tabs-activation-and-direction.spec.ts):
  // jsdom's cascade does not inherit `direction` into an element that matches a
  // stylesheet rule, so a jsdom test of it would fail on the environment, not the code.
  it('inherits RTL from an ancestor dir attribute', async () => {
    const view = render(Tabs, { items: labels, activeIndex: 1 });
    view.container.dir = 'rtl';
    await focus('Beta');
    await key('Beta', 'ArrowLeft');
    expect(document.activeElement).toBe(tab('Gamma'));
    view.container.dir = 'ltr';
    await key('Gamma', 'ArrowLeft');
    expect(document.activeElement).toBe(tab('Beta'));
  });

  it('lets explicit LTR override inherited RTL', async () => {
    const view = render(Tabs, { items: labels, dir: 'ltr', activeIndex: 1 });
    view.container.dir = 'rtl';
    await focus('Beta');
    await key('Beta', 'ArrowRight');
    expect(document.activeElement).toBe(tab('Gamma'));
  });

  it('uses vertical arrows without RTL reversal or consuming horizontal arrows', async () => {
    render(Tabs, { items: labels, orientation: 'vertical', dir: 'rtl', loop: false });
    await focus('Alpha');
    const ignored = await key('Alpha', 'ArrowRight');
    expect(ignored.defaultPrevented).toBe(false);
    await key('Alpha', 'ArrowDown');
    expect(document.activeElement).toBe(tab('Beta'));
    await key('Beta', 'ArrowUp');
    expect(document.activeElement).toBe(tab('Alpha'));
    expect(screen.getByRole('tablist').getAttribute('aria-orientation')).toBe('vertical');
  });

  it.each(['altKey', 'ctrlKey', 'metaKey', 'shiftKey'])(
    'does not consume %s keyboard shortcuts',
    async (modifier) => {
      const onchange = vi.fn();
      render(Tabs, { items: labels, onchange });
      await focus('Alpha');
      for (const value of ['ArrowRight', 'Home', 'End', 'Enter', ' ']) {
        const event = await key('Alpha', value, { [modifier]: true });
        expect(event.defaultPrevented).toBe(false);
      }
      expect(onchange).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(tab('Alpha'));
    }
  );
});

it('exposes stable styling hooks without replacing existing classes', () => {
  render(Tabs, { items: objects, activeKey: 'alpha', orientation: 'vertical', classes: 'custom' });
  const list = screen.getByRole('tablist');
  expect(list.getAttribute('data-orientation')).toBe('vertical');
  expect(tab('Alpha').getAttribute('data-state')).toBe('active');
  expect(tab('Gamma').getAttribute('data-state')).toBe('inactive');
  expect(tab('Beta').hasAttribute('data-disabled')).toBe(true);
  expect(tab('Alpha').hasAttribute('data-disabled')).toBe(false);
  expect(tab('Alpha').getAttribute('data-orientation')).toBe('vertical');
  expect(tab('Alpha').classList.contains('tabs-item')).toBe(true);
  expect(tab('Alpha').classList.contains('active')).toBe(true);
  expect(list.parentElement?.classList.contains('custom')).toBe(true);
});
