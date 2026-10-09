import { render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { beforeAll, describe, expect, it } from 'vitest';
import Modal from './Modal/Modal.svelte';
import Sheet from './Sheet/Sheet.svelte';
import CommandMenu from './CommandMenu/CommandMenu.svelte';
import {
  acquireScrollLock,
  lockBodyScroll,
  resolveScrollContainer,
  unlockBodyScroll
} from './utils';

const content = createRawSnippet(() => ({ render: () => '<button>Inside</button>' }));
beforeAll(() => {
  if (typeof Element.prototype.animate !== 'function') {
    Element.prototype.animate = () =>
      ({ cancel: () => {}, finished: Promise.resolve() }) as unknown as Animation;
  }
});

describe('owned scroll container utility', () => {
  it('keeps the same real owner locked across document adoption and cleans up the final hold', () => {
    const owner = document.createElement('div');
    owner.style.setProperty('overflow', 'auto', 'important');
    const releaseFirst = acquireScrollLock(owner);
    const foreign = document.implementation.createHTMLDocument('adopted owner');
    expect(foreign.adoptNode(owner)).toBe(owner);
    foreign.body.append(owner);
    const releaseSecond = acquireScrollLock(owner);
    owner.style.color = 'blue';
    releaseFirst();
    releaseFirst();
    expect(owner.style.overflow).toBe('hidden');
    expect(owner.style.getPropertyPriority('overflow')).toBe('important');
    releaseSecond();
    expect(owner.style.overflow).toBe('auto');
    expect(owner.style.getPropertyPriority('overflow')).toBe('important');
    expect(owner.style.color).toBe('blue');
    const releaseLater = acquireScrollLock(owner);
    expect(owner.style.overflow).toBe('hidden');
    releaseLater();
    expect(owner.style.overflow).toBe('auto');
    owner.remove();
  });

  it('counts independent containers and restores longhands and priorities without replacing unrelated styles', () => {
    const first = document.createElement('div');
    const second = document.createElement('div');
    first.style.cssText = 'overflow-x: clip !important; overflow-y: auto; color: red';
    first.scrollTop = 77;
    const releaseFirst = acquireScrollLock(first);
    const releaseNested = acquireScrollLock(first);
    const releaseSecond = acquireScrollLock(second);
    first.style.color = 'blue';
    releaseFirst();
    releaseFirst();
    expect(first.style.overflow).toBe('hidden');
    releaseSecond();
    expect(second.style.overflow).toBe('');
    expect(first.style.overflow).toBe('hidden');
    releaseNested();
    expect(first.style.overflowX).toBe('clip');
    expect(first.style.getPropertyPriority('overflow-x')).toBe('important');
    expect(first.style.overflowY).toBe('auto');
    expect(first.style.getPropertyPriority('overflow-y')).toBe('');
    expect(first.style.color).toBe('blue');
    expect(first.scrollTop).toBe(77);
  });

  it('shares accounting with legacy body locks and tolerates extra legacy unlocks', () => {
    document.body.style.setProperty('overflow', 'clip', 'important');
    const release = acquireScrollLock(document.body);
    lockBodyScroll();
    unlockBodyScroll();
    unlockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');
    release();
    expect(document.body.style.overflow).toBe('clip');
    expect(document.body.style.getPropertyPriority('overflow')).toBe('important');
    document.body.style.removeProperty('overflow');
  });

  it('uses the node ownerDocument body by default and never falls back for explicit null', () => {
    const foreign = document.implementation.createHTMLDocument('embedded');
    expect(resolveScrollContainer(foreign.createElement('div'))).toBe(foreign.body);
    expect(resolveScrollContainer(document.body, () => null)).toBeNull();
    expect(resolveScrollContainer(document.body, null)).toBeNull();
    acquireScrollLock(null)();
  });
});

describe('rendered owned overlays', () => {
  it('releases the container acquired at open after props change, nesting, close and forced unmount', async () => {
    const owned = document.createElement('div');
    const changed = document.createElement('div');
    document.body.append(owned, changed);
    owned.style.setProperty('overflow', 'auto', 'important');
    owned.scrollTop = 88;
    document.body.style.cssText = 'overflow: clip !important; padding-right: 11px';
    const hostStyle = document.body.style.cssText;
    let selected = owned;
    const modal = render(Modal, {
      props: { content, scrollContainer: () => selected },
      target: owned
    });
    const sheet = render(Sheet, {
      props: { content, open: true, scrollContainer: owned },
      target: owned
    });
    const menu = render(CommandMenu, {
      props: { items: [{ value: 'one', label: 'One' }], open: true, scrollContainer: owned },
      target: owned
    });
    await tick();
    expect(owned.style.overflow).toBe('hidden');
    expect(document.body.style.cssText).toBe(hostStyle);
    selected = changed;
    await modal.rerender({ scrollContainer: changed });
    modal.unmount();
    await tick();
    expect(owned.style.overflow).toBe('hidden');
    expect(changed.style.overflow).toBe('');
    menu.unmount();
    await tick();
    expect(owned.style.overflow).toBe('hidden');
    sheet.unmount();
    await tick();
    expect(owned.style.overflow).toBe('auto');
    expect(owned.style.getPropertyPriority('overflow')).toBe('important');
    expect(owned.scrollTop).toBe(88);
    expect(document.body.style.cssText).toBe(hostStyle);
    owned.remove();
    changed.remove();
    document.body.style.cssText = '';
  });

  it('explicit unresolved ownership does not mutate body for any overlay', async () => {
    document.body.style.overflow = 'clip';
    const modal = render(Modal, { content, scrollContainer: () => null });
    const sheet = render(Sheet, { content, open: true, scrollContainer: () => null });
    const menu = render(CommandMenu, { items: [], open: true, scrollContainer: () => null });
    await tick();
    expect(document.body.style.overflow).toBe('clip');
    modal.unmount();
    sheet.unmount();
    menu.unmount();
    await tick();
    expect(document.body.style.overflow).toBe('clip');
    document.body.style.overflow = '';
  });
});
