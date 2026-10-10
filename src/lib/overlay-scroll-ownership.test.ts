import { render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { beforeAll, describe, expect, it, vi } from 'vitest';
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

  it('refuses serialized element lookalikes without acquiring a lock or throwing', () => {
    const lookalike: unknown = JSON.parse('{"nodeType":1,"style":{}}');
    expect(resolveScrollContainer(document.body, lookalike as HTMLElement)).toBeNull();
    expect(resolveScrollContainer(document.body, () => lookalike as HTMLElement)).toBeNull();
    expect(() =>
      acquireScrollLock(resolveScrollContainer(document.body, lookalike as HTMLElement))()
    ).not.toThrow();
  });
  it('coordinates independently evaluated modules on the physical owner and clears private state', async () => {
    const owner = document.createElement('div');
    owner.style.cssText = 'overflow-x: clip !important; overflow-y: auto; color: red';
    const originalSymbols = Object.getOwnPropertySymbols(owner);
    const first = acquireScrollLock(owner);
    vi.resetModules();
    const independent = await import('./utils');
    const second = independent.acquireScrollLock(owner);
    first();
    first();
    expect(owner.style.overflow).toBe('hidden');
    second();
    expect(owner.style.overflowX).toBe('clip');
    expect(owner.style.getPropertyPriority('overflow-x')).toBe('important');
    expect(owner.style.overflowY).toBe('auto');
    expect(owner.style.color).toBe('red');
    expect(Object.getOwnPropertySymbols(owner)).toEqual(originalSymbols);
  });

  it('restores exact declaration order while retaining independent writes', () => {
    const owner = document.createElement('div');
    owner.style.cssText = 'overflow-x: clip !important; overflow-y: auto; color: red';
    const original = owner.style.cssText;
    acquireScrollLock(owner)();
    expect(owner.style.cssText).toBe(original);
    const release = acquireScrollLock(owner);
    owner.style.color = 'blue';
    owner.style.width = '41px';
    release();
    expect(owner.style.overflowX).toBe('clip');
    expect(owner.style.getPropertyPriority('overflow-x')).toBe('important');
    expect(owner.style.color).toBe('blue');
    expect(owner.style.width).toBe('41px');
  });

  it('locks a non-extensible real owner and does not reuse stale state after sealing while held', () => {
    const owner = document.createElement('div');
    owner.style.overflow = 'auto';
    Object.preventExtensions(owner);
    const first = acquireScrollLock(owner);
    expect(owner.style.overflow).toBe('hidden');
    Object.seal(owner);
    first();
    expect(owner.style.overflow).toBe('auto');
    owner.style.setProperty('overflow', 'scroll', 'important');
    acquireScrollLock(owner)();
    expect(owner.style.overflow).toBe('scroll');
    expect(owner.style.getPropertyPriority('overflow')).toBe('important');
  });

  // jsdom has no cascade, so this proves only that the serialized text round-trips. That the lock
  // still wins over an `all` shorthand is asserted against computed style in
  // tests/overlay-scroll-ownership.test.ts.
  it('restores the inline style text verbatim when it holds an all shorthand', () => {
    const owner = document.createElement('div');
    owner.style.cssText = 'overflow: auto !important; all: initial !important; color: red';
    const original = owner.style.cssText;
    const release = acquireScrollLock(owner);
    expect(owner.style.overflow).toBe('hidden');
    release();
    expect(owner.style.cssText).toBe(original);
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
