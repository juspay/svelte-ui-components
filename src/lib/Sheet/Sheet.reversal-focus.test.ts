import { render } from '@testing-library/svelte';
import { createRawSnippet, flushSync, tick } from 'svelte';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import SheetReversal from './SheetReversal.test.svelte';
import { registerDismissible } from '../_interaction/dismissal';

const content = createRawSnippet(() => ({
  render: () => '<label>Draft<input value="Keep this draft"></label>'
}));
const nodes: Element[] = [];
const releases: (() => void)[] = [];
beforeAll(() => {
  // Hold the real component's outro, matching existing Sheet unit conventions.
  // Native tests, not this stub, prove actual browser reversal/teardown timing.
  Element.prototype.animate = () =>
    ({ cancel() {}, finished: Promise.resolve() }) as unknown as Animation;
});
afterEach(() => {
  for (const release of releases.splice(0)) {
    release();
  }
  for (const node of nodes.splice(0)) {
    node.remove();
  }
});
const setup = async () => {
  const opener = document.createElement('button');
  opener.textContent = 'Add';
  document.body.append(opener);
  nodes.push(opener);
  opener.focus();
  const owner = document.createElement('section');
  owner.style.overflow = 'auto';
  document.body.append(owner);
  nodes.push(owner);
  const view = render(SheetReversal, { props: { content, scrollContainer: owner } });
  await tick();
  await tick();
  const panel = view.container.querySelector<HTMLElement>('[data-pw="reversal-sheet-panel"]');
  const input = view.container.querySelector<HTMLInputElement>('input');
  if (!panel || !input) {
    throw new Error('Sheet reversal fixture missing');
  }
  const close = () => {
    flushSync(() => view.component.setOpen(false));
  };
  const reopen = () => {
    flushSync(() => view.component.setOpen(true));
  };
  return { ...view, panel, input, owner, opener, close, reopen };
};

describe('Sheet retained-panel focus continuity', () => {
  it('reacquires the same reopened panel from the underlying Add opener', async () => {
    const f = await setup();
    expect(document.activeElement).toBe(f.panel);
    f.close();
    f.opener.focus();
    f.reopen();
    await tick();
    await tick();
    expect(f.container.querySelector('[data-pw="reversal-sheet-panel"]')).toBe(f.panel);
    expect(document.activeElement).toBe(f.panel);
    expect(f.owner.style.overflow).toBe('hidden');
  });

  it('preserves the existing input node, draft and selection during reversal', async () => {
    const f = await setup();
    f.input.value = 'Unsent draft retained';
    f.input.setSelectionRange(2, 8);
    f.close();
    f.opener.focus();
    f.reopen();
    await tick();
    await tick();
    expect(f.container.querySelector('input')).toBe(f.input);
    expect(f.input.value).toBe('Unsent draft retained');
    expect([f.input.selectionStart, f.input.selectionEnd]).toEqual([2, 8]);
  });

  it('does not replace inner focus that already reacquired ownership', async () => {
    const f = await setup();
    f.close();
    f.opener.focus();
    f.reopen();
    f.input.focus();
    f.input.setSelectionRange(1, 4);
    await tick();
    await tick();
    expect(document.activeElement).toBe(f.input);
    expect([f.input.selectionStart, f.input.selectionEnd]).toEqual([1, 4]);
  });

  it('does not steal from an already-owned shadow descendant', async () => {
    const f = await setup();
    const host = document.createElement('div');
    f.panel.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const input = document.createElement('input');
    shadow.append(input);
    f.close();
    f.opener.focus();
    f.reopen();
    input.focus();
    await tick();
    await tick();
    expect(shadow.activeElement).toBe(input);
    expect(document.activeElement).toBe(host);
  });

  it('does not steal from slotted focus owned through the panel shadow tree', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    nodes.push(opener);
    opener.focus();
    const host = document.createElement('div');
    document.body.append(host);
    nodes.push(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const mount = document.createElement('div');
    shadow.append(mount);
    const view = render(SheetReversal, { target: mount, props: { content } });
    await tick();
    await tick();
    const panel = mount.querySelector<HTMLElement>('[data-pw="reversal-sheet-panel"]');
    if (!panel) {
      throw new Error('Shadow Sheet panel missing');
    }
    const slot = document.createElement('slot');
    panel.append(slot);
    const input = document.createElement('input');
    host.append(input);
    flushSync(() => view.component.setOpen(false));
    opener.focus();
    flushSync(() => view.component.setOpen(true));
    input.focus();
    expect(panel.contains(input)).toBe(false);
    expect(input.assignedSlot).toBe(slot);
    await tick();
    await tick();
    expect(document.activeElement).toBe(input);
  });

  it('does not steal from a newer registered top layer', async () => {
    const f = await setup();
    f.close();
    f.opener.focus();
    f.reopen();
    const newer = document.createElement('button');
    document.body.append(newer);
    nodes.push(newer);
    releases.push(registerDismissible({ element: () => newer }));
    newer.focus();
    await tick();
    await tick();
    expect(document.activeElement).toBe(newer);
  });

  it('cancels a queued reopen request when another close is admitted', async () => {
    const f = await setup();
    f.close();
    f.opener.focus();
    f.reopen();
    f.close();
    const focus = vi.spyOn(f.panel, 'focus');
    await tick();
    await tick();
    expect(focus).not.toHaveBeenCalled();
  });

  it('cancels a queued reopen request when its action is destroyed', async () => {
    const f = await setup();
    f.close();
    f.opener.focus();
    f.reopen();
    const focus = vi.spyOn(f.panel, 'focus');
    f.unmount();
    f.opener.focus();
    await tick();
    await tick();
    expect(focus).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(f.opener);
  });

  it('only the newest flushed close/reopen request can focus', async () => {
    const f = await setup();
    f.close();
    f.opener.focus();
    const focus = vi.spyOn(f.panel, 'focus');
    f.reopen();
    f.close();
    f.reopen();
    await tick();
    await tick();
    expect(focus).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(f.panel);
  });
});
