import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Modal from './Modal.svelte';
import type { ModalProperties } from './properties';

const content = createRawSnippet(() => ({ render: () => '<button>Inside dialog</button>' }));
const nodes: Element[] = [];
const button = (label: string, owner: Document = document): HTMLButtonElement => {
  const target = owner.createElement('button');
  target.textContent = label;
  owner.body.append(target);
  nodes.push(target);
  return target;
};
const open = async (props: Partial<ModalProperties> = {}) => {
  const opener = button('Original opener');
  opener.focus();
  const view = render(Modal, { props: { content, enableTransition: false, ...props } });
  await tick();
  const openerFocus = vi.spyOn(opener, 'focus');
  return { ...view, opener, openerFocus };
};
afterEach(() => {
  for (const node of nodes.splice(0)) {
    node.remove();
  }
  document.body.style.overflow = '';
});

describe('Modal optional focus restoration', () => {
  it('omitted option keeps connected captured-opener restoration', async () => {
    const f = await open();
    f.unmount();
    expect(f.openerFocus).toHaveBeenCalledExactlyOnceWith();
    expect(document.activeElement).toBe(f.opener);
  });

  it('restores an explicit connected element once without default fallback', async () => {
    const target = button('Explicit target');
    const focus = vi.spyOn(target, 'focus');
    const f = await open({ restoreFocusTo: target });
    expect(focus).not.toHaveBeenCalled();
    f.unmount();
    expect(focus).toHaveBeenCalledExactlyOnceWith();
    expect(f.openerFocus).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(target);
  });

  it('resolves once after focus guard, dismissal and scroll cleanup', async () => {
    const target = button('After cleanup');
    const ondismiss = vi.fn();
    const resolve = vi.fn(() => {
      expect(document.body.style.overflow).toBe('');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(ondismiss).not.toHaveBeenCalled();
      return target;
    });
    const f = await open({ restoreFocusTo: resolve, containFocus: true, ondismiss });
    expect(resolve).not.toHaveBeenCalled();
    expect(document.body.style.overflow).toBe('hidden');
    f.unmount();
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(target);
    expect(f.openerFocus).not.toHaveBeenCalled();
  });

  it('explicit null suppresses restoration without falling back', async () => {
    const f = await open({ restoreFocusTo: null });
    f.unmount();
    expect(f.openerFocus).not.toHaveBeenCalled();
  });

  it('a null getter suppresses restoration and is resolved only once', async () => {
    const resolve = vi.fn(() => null);
    const f = await open({ restoreFocusTo: resolve });
    f.unmount();
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(f.openerFocus).not.toHaveBeenCalled();
  });

  it('a throwing getter cannot interrupt cleanup or restore the old opener', async () => {
    const resolve = vi.fn(() => {
      throw new Error('Owner no longer available');
    });
    const f = await open({ restoreFocusTo: resolve, containFocus: true });
    expect(() => f.unmount()).not.toThrow();
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(document.body.style.overflow).toBe('');
    expect(f.openerFocus).not.toHaveBeenCalled();
    const next = button('Later intentional focus');
    next.focus();
    expect(document.activeElement).toBe(next);
  });

  it('a getter can find an element created after the mounted open', async () => {
    let late: HTMLElement | null = null;
    const resolve = vi.fn(() => late);
    const f = await open({ restoreFocusTo: resolve });
    late = button('Late target');
    f.unmount();
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(late);
  });

  it('snapshots the getter reference, while its target is resolved late', async () => {
    const first = button('First owner');
    const second = button('New owner');
    const original = vi.fn(() => first);
    const replacement = vi.fn(() => second);
    const f = await open({ restoreFocusTo: original });
    await f.rerender({ restoreFocusTo: replacement });
    f.unmount();
    expect(original).toHaveBeenCalledTimes(1);
    expect(replacement).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(first);
    const next = await open({ restoreFocusTo: replacement });
    next.unmount();
    expect(replacement).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(second);
  });

  it('snapshots an explicit element rather than a replacement prop', async () => {
    const first = button('First element');
    const second = button('Replacement element');
    const f = await open({ restoreFocusTo: first });
    await f.rerender({ restoreFocusTo: second });
    f.unmount();
    expect(document.activeElement).toBe(first);
  });

  it('a captured null is not replaced by a later supplied target', async () => {
    const target = button('New owner');
    const focus = vi.spyOn(target, 'focus');
    const f = await open({ restoreFocusTo: null });
    await f.rerender({ restoreFocusTo: target });
    f.unmount();
    expect(focus).not.toHaveBeenCalled();
    expect(f.openerFocus).not.toHaveBeenCalled();
  });

  it('an initially omitted option retains the default if a target is added later', async () => {
    const target = button('Later option');
    const f = await open();
    await f.rerender({ restoreFocusTo: target });
    f.unmount();
    expect(f.openerFocus).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(f.opener);
  });

  it.each(['element', 'getter'])('skips disconnected %s targets without fallback', async (kind) => {
    const target = button('Removed target');
    const focus = vi.spyOn(target, 'focus');
    const f = await open({ restoreFocusTo: kind === 'element' ? target : () => target });
    target.remove();
    f.unmount();
    expect(focus).not.toHaveBeenCalled();
    expect(f.openerFocus).not.toHaveBeenCalled();
  });

  it('rejects a connected target in a different document', async () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    nodes.push(frame);
    const owner = frame.contentDocument;
    if (!owner) {
      throw new Error('Frame document missing');
    }
    const foreign = button('Foreign target', owner);
    expect(foreign.isConnected).toBe(true);
    const focus = vi.spyOn(foreign, 'focus');
    const f = await open({ restoreFocusTo: foreign });
    f.unmount();
    expect(focus).not.toHaveBeenCalled();
    expect(f.openerFocus).not.toHaveBeenCalled();
  });

  it('rejects a same-constructor element adopted into a foreign document', async () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    nodes.push(frame);
    const owner = frame.contentDocument;
    if (!owner) {
      throw new Error('Frame document missing');
    }
    const foreign = document.createElement('button');
    owner.body.append(foreign);
    expect(foreign instanceof HTMLElement).toBe(true);
    expect(foreign.ownerDocument).not.toBe(document);
    expect(foreign.isConnected).toBe(true);
    const focus = vi.spyOn(foreign, 'focus');
    const f = await open({ restoreFocusTo: foreign });
    f.unmount();
    expect(focus).not.toHaveBeenCalled();
    expect(f.openerFocus).not.toHaveBeenCalled();
  });

  it('accepts the owning document HTMLElement realm when mounted in an iframe', async () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    nodes.push(frame);
    const owner = frame.contentDocument;
    if (!owner) {
      throw new Error('Frame document missing');
    }
    const target = button('Frame target', owner);
    expect(target instanceof HTMLElement).toBe(false);
    const focus = vi.spyOn(target, 'focus');
    const view = render(Modal, {
      target: owner.body,
      props: { content, enableTransition: false, restoreFocusTo: target }
    });
    await tick();
    view.unmount();
    expect(focus).toHaveBeenCalledExactlyOnceWith();
    expect(owner.activeElement).toBe(target);
  });

  it('accepts a genuine HTML target adopted into the Modal owning document', async () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    nodes.push(frame);
    const foreignDocument = frame.contentDocument;
    if (!foreignDocument) {
      throw new Error('Frame document missing');
    }
    const target = foreignDocument.createElement('button');
    document.body.append(target);
    nodes.push(target);
    expect(target.ownerDocument).toBe(document);
    expect(target instanceof HTMLElement).toBe(false);
    const focus = vi.spyOn(target, 'focus');
    const f = await open({ restoreFocusTo: target });
    f.unmount();
    expect(focus).toHaveBeenCalledExactlyOnceWith();
    expect(document.activeElement).toBe(target);
  });

  it('restores a connected target inside an open shadow root', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    nodes.push(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const target = document.createElement('button');
    target.textContent = 'Shadow target';
    shadow.append(target);
    const f = await open({ restoreFocusTo: () => target });
    f.unmount();
    expect(document.activeElement).toBe(host);
    expect(shadow.activeElement).toBe(target);
  });

  it('does not resolve on close-intent callbacks while the instance remains mounted', async () => {
    const target = button('Intent target');
    const resolve = vi.fn(() => target);
    const onoverlayclick = vi.fn();
    const f = await open({ restoreFocusTo: resolve, onoverlayclick, debounceTime: 0 });
    await fireEvent.keyDown(document, { key: 'Escape' });
    expect(onoverlayclick).toHaveBeenCalledTimes(1);
    expect(resolve).not.toHaveBeenCalled();
    f.unmount();
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it('does not accept a forged focus-shaped non-HTMLElement target', async () => {
    const focus = vi.fn();
    const forged = {
      focus,
      isConnected: true,
      ownerDocument: document,
      namespaceURI: 'http://www.w3.org/1999/xhtml',
      getRootNode: () => document
    } as unknown as HTMLElement;
    const f = await open({ restoreFocusTo: () => forged });
    f.unmount();
    expect(focus).not.toHaveBeenCalled();
    expect(f.openerFocus).not.toHaveBeenCalled();
  });
});
