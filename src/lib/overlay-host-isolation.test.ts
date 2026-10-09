import { render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import Modal from './Modal/Modal.svelte';
import Sheet from './Sheet/Sheet.svelte';
import CommandMenu from './CommandMenu/CommandMenu.svelte';
import type { ScrollContainer } from './types';

const content = createRawSnippet(() => ({ render: () => '<button>App action</button>' }));
const kinds = ['Modal', 'Sheet', 'CommandMenu'] as const;
const removals: (() => void)[] = [];
const bodyStyle = document.body.style.cssText;
const htmlStyle = document.documentElement.style.cssText;

beforeAll(() => {
  if (typeof Element.prototype.animate !== 'function') {
    Element.prototype.animate = () =>
      ({ cancel: () => {}, finished: Promise.resolve() }) as unknown as Animation;
  }
});

afterEach(async () => {
  for (const remove of removals.splice(0).reverse()) {
    remove();
  }
  await tick();
  document.body.style.cssText = bodyStyle;
  document.documentElement.style.cssText = htmlStyle;
});

const mountOverlay = (
  kind: (typeof kinds)[number],
  target: HTMLElement,
  scrollContainer?: ScrollContainer
) => {
  if (kind === 'Modal') {
    return render(Modal, {
      props: { content, usePortal: true, enableTransition: false, scrollContainer },
      target
    });
  }
  if (kind === 'Sheet') {
    return render(Sheet, { props: { content, open: true, scrollContainer }, target });
  }
  return render(CommandMenu, {
    props: {
      items: [{ value: 'one', label: 'One' }],
      open: true,
      enableHotkey: false,
      scrollContainer
    },
    target
  });
};

const embeddedRoot = () => {
  const host = document.createElement('section');
  host.setAttribute('data-host-theme', 'unchanged');
  const shadow = host.attachShadow({ mode: 'open' });
  const scroll = document.createElement('div');
  scroll.style.setProperty('overflow-x', 'clip', 'important');
  scroll.style.setProperty('overflow-y', 'scroll');
  scroll.scrollTop = 127;
  const opener = document.createElement('button');
  opener.textContent = 'Open app overlay';
  scroll.append(opener);
  shadow.append(scroll);
  document.body.append(host);
  removals.push(() => host.remove());
  return { host, shadow, scroll, opener };
};

describe('actual library overlays preserve the surrounding host', () => {
  it.each(kinds)(
    '%s locks its shadow app root and releases only its acquired owner',
    async (kind) => {
      document.body.style.cssText = 'overflow: auto !important; padding-right: 19px';
      document.documentElement.style.cssText = 'overflow-y: scroll; color-scheme: dark';
      const { host, shadow, scroll, opener } = embeddedRoot();
      const hostBodyStyle = document.body.style.cssText;
      const hostHtmlStyle = document.documentElement.style.cssText;
      const hostUrl = location.href;
      opener.focus();
      const overlay = mountOverlay(kind, scroll, scroll);
      removals.push(() => overlay.unmount());
      await tick();
      expect(scroll.style.overflow).toBe('hidden');
      expect(document.body.style.cssText).toBe(hostBodyStyle);
      expect(document.documentElement.style.cssText).toBe(hostHtmlStyle);
      expect(host.getAttribute('data-host-theme')).toBe('unchanged');
      expect(location.href).toBe(hostUrl);
      if (kind === 'Modal') {
        expect(shadow.querySelector('.modal')?.parentNode).toBe(shadow);
        expect(document.body.querySelector('.modal')).toBeNull();
      }
      const changedOwner = document.createElement('div');
      changedOwner.style.overflow = 'scroll';
      scroll.append(changedOwner);
      await overlay.rerender({ scrollContainer: changedOwner });
      expect(scroll.style.overflow).toBe('hidden');
      expect(changedOwner.style.overflow).toBe('scroll');
      // An independent host style update during the hold must survive cleanup.
      scroll.style.color = 'blue';
      overlay.unmount();
      removals.pop();
      await tick();
      expect(scroll.style.overflowX).toBe('clip');
      expect(scroll.style.getPropertyPriority('overflow-x')).toBe('important');
      expect(scroll.style.overflowY).toBe('scroll');
      expect(scroll.style.getPropertyPriority('overflow-y')).toBe('');
      expect(scroll.style.color).toBe('blue');
      expect(changedOwner.style.overflow).toBe('scroll');
      expect(scroll.scrollTop).toBe(127);
      expect(document.body.style.cssText).toBe(hostBodyStyle);
      expect(document.documentElement.style.cssText).toBe(hostHtmlStyle);
      expect(shadow.activeElement).toBe(opener);
    }
  );

  it('keeps each instance locked across out-of-order closes and leaves the host untouched', async () => {
    const first = embeddedRoot();
    const second = embeddedRoot();
    document.body.style.setProperty('overflow', 'auto', 'important');
    const hostBodyStyle = document.body.style.cssText;
    const modal = mountOverlay('Modal', first.scroll, first.scroll);
    const sheet = mountOverlay('Sheet', first.scroll, first.scroll);
    const menu = mountOverlay('CommandMenu', second.scroll, second.scroll);
    await tick();
    expect(first.scroll.style.overflow).toBe('hidden');
    expect(second.scroll.style.overflow).toBe('hidden');
    modal.unmount();
    await tick();
    expect(first.scroll.style.overflow).toBe('hidden');
    menu.unmount();
    await tick();
    expect(second.scroll.style.overflowY).toBe('scroll');
    expect(first.scroll.style.overflow).toBe('hidden');
    sheet.unmount();
    await tick();
    expect(first.scroll.style.overflowY).toBe('scroll');
    expect(document.body.style.cssText).toBe(hostBodyStyle);
  });

  it.each(kinds)(
    '%s keeps the standalone body default and restores its authored priority',
    async (kind) => {
      const { scroll } = embeddedRoot();
      document.body.style.setProperty('overflow', 'auto', 'important');
      const overlay = mountOverlay(kind, scroll);
      removals.push(() => overlay.unmount());
      await tick();
      expect(document.body.style.overflow).toBe('hidden');
      expect(scroll.style.overflowY).toBe('scroll');
      overlay.unmount();
      removals.pop();
      await tick();
      expect(document.body.style.overflow).toBe('auto');
      expect(document.body.style.getPropertyPriority('overflow')).toBe('important');
    }
  );

  it.each(kinds)(
    '%s refuses fallback body mutation when the explicit root is unresolved',
    async (kind) => {
      const { scroll } = embeddedRoot();
      document.body.style.setProperty('overflow', 'auto', 'important');
      const hostBodyStyle = document.body.style.cssText;
      const overlay = mountOverlay(kind, scroll, () => null);
      removals.push(() => overlay.unmount());
      await tick();
      expect(document.body.style.cssText).toBe(hostBodyStyle);
      expect(scroll.style.overflowY).toBe('scroll');
      overlay.unmount();
      removals.pop();
      await tick();
      expect(document.body.style.cssText).toBe(hostBodyStyle);
    }
  );

  it('detects a wrong body owner as a negative control for the host-state assertions', async () => {
    const { scroll } = embeddedRoot();
    document.body.style.setProperty('overflow', 'auto', 'important');
    const hostBodyStyle = document.body.style.cssText;
    const overlay = mountOverlay('Modal', scroll, document.body);
    removals.push(() => overlay.unmount());
    await tick();
    expect(document.body.style.cssText === hostBodyStyle).toBe(false);
    expect(scroll.style.overflowY).toBe('scroll');
    overlay.unmount();
    removals.pop();
    await tick();
    expect(document.body.style.cssText).toBe(hostBodyStyle);
  });
});
