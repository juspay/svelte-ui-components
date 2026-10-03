import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { dismissibleLayerCount, registerDismissible } from '../_interaction/dismissal';
import DockPanel from './DockPanel.svelte';

describe('DockPanel state and layout contract', () => {
  it('keeps its root and body nodes across every state', async () => {
    const mounted = vi.fn();
    const body = createRawSnippet(() => ({
      render: () => '<p>Streaming reply</p>',
      setup: mounted
    }));
    const { container, rerender } = render(DockPanel, { props: { body } });
    const node = container.querySelector<HTMLElement>('.dock-panel');
    const reply = container.querySelector('p');
    expect(node?.getAttribute('data-state')).toBe('closed');
    expect(node?.inert).toBe(true);
    for (const state of ['docked', 'expanded', 'closed'] as const) {
      await rerender({ state, body });
      expect(container.querySelector('.dock-panel')).toBe(node);
      expect(container.querySelector('p')).toBe(reply);
      expect(node?.inert).toBe(state === 'closed');
    }
    expect(mounted).toHaveBeenCalledTimes(1);
  });

  it('is complementary and never claims modality or changes body scroll', async () => {
    const before = document.body.getAttribute('style');
    const { getByRole, rerender } = render(DockPanel, {
      props: { state: 'docked', label: 'Assistant' }
    });
    expect(getByRole('complementary', { name: 'Assistant' }).hasAttribute('aria-modal')).toBe(
      false
    );
    await rerender({ state: 'expanded' });
    expect(document.body.getAttribute('style')).toBe(before);
  });

  it.each([
    [200, 300],
    [700, 600],
    [Number.NaN, 380],
    [Number.POSITIVE_INFINITY, 380]
  ])('clamps width %s to %s', async (width, expected) => {
    const { container } = render(DockPanel, { props: { state: 'docked', width } });
    await tick();
    expect(container.querySelector('.dock-panel')?.getAttribute('style')).toContain(
      `width: ${expected}px`
    );
  });

  it('registers Escape only while expanded and collapses through its callback', async () => {
    const before = dismissibleLayerCount();
    const onstatechange = vi.fn();
    const { rerender, container } = render(DockPanel, {
      props: { state: 'closed', onstatechange }
    });
    expect(dismissibleLayerCount()).toBe(before);
    await rerender({ state: 'docked', onstatechange });
    expect(dismissibleLayerCount()).toBe(before);
    await fireEvent.keyDown(document, { key: 'Escape' });
    expect(onstatechange).not.toHaveBeenCalled();
    await rerender({ state: 'expanded', onstatechange });
    expect(dismissibleLayerCount()).toBe(before + 1);
    await fireEvent.keyDown(document, { key: 'Escape' });
    expect(onstatechange).toHaveBeenCalledWith('docked');
    expect(container.querySelector('.dock-panel')?.getAttribute('data-state')).toBe('docked');
    expect(dismissibleLayerCount()).toBe(before);
  });

  it('resizes on the left edge, reports the width, and never writes a height', async () => {
    const onwidthchange = vi.fn();
    const { getByRole, container } = render(DockPanel, {
      props: { state: 'docked', onwidthchange }
    });
    const handle = getByRole('separator');
    expect(handle.getAttribute('data-edge')).toBe('left');
    await fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(onwidthchange).toHaveBeenCalledWith(364);
    expect(container.querySelector('.dock-panel-frame')?.getAttribute('style')).not.toContain(
      'height:'
    );
  });

  it('lets a later-opened layer consume Escape before the expanded panel', async () => {
    const onstatechange = vi.fn();
    const onMenuEscape = vi.fn();
    const { container } = render(DockPanel, { props: { state: 'expanded', onstatechange } });
    const releaseMenu = registerDismissible({
      element: () => null,
      onEscape: () => {
        onMenuEscape();
        releaseMenu();
      }
    });
    await fireEvent.keyDown(document, { key: 'Escape' });
    expect(onMenuEscape).toHaveBeenCalledTimes(1);
    expect(onstatechange).not.toHaveBeenCalled();
    expect(container.querySelector('.dock-panel')?.getAttribute('data-state')).toBe('expanded');
    await fireEvent.keyDown(document, { key: 'Escape' });
    expect(onstatechange).toHaveBeenCalledWith('docked');
  });
});
