import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Resizable from './Resizable.svelte';

describe('Resizable axis ownership', () => {
  it.each(['left', 'right'] as const)(
    '%s keyboard resize leaves CSS-owned height unset',
    async (edge) => {
      const onresize = vi.fn();
      const { container, getByRole } = render(Resizable, {
        props: { width: 380, height: null, handles: [edge], minWidth: 300, maxWidth: 600, onresize }
      });
      await fireEvent.keyDown(getByRole('separator'), { key: 'ArrowRight' });
      const panel = container.querySelector('.resizable');
      expect(panel?.getAttribute('style')).toContain('width: 396px');
      expect(panel?.getAttribute('style')).not.toContain('height:');
      expect(onresize).toHaveBeenCalledWith({ width: 396, height: 0 });
    }
  );

  it('vertical keyboard resize leaves CSS-owned width unset', async () => {
    const { container, getByRole } = render(Resizable, {
      props: { width: null, height: 180, handles: ['bottom'] }
    });
    await fireEvent.keyDown(getByRole('separator'), { key: 'ArrowDown' });
    expect(container.querySelector('.resizable')?.getAttribute('style')).toContain('height: 196px');
    expect(container.querySelector('.resizable')?.getAttribute('style')).not.toContain('width:');
  });

  it('corner keyboard resize writes only the arrow axis and clamps it', async () => {
    const { container, getByRole } = render(Resizable, {
      props: { width: null, height: 180, handles: ['bottom-right'], maxHeight: 190 }
    });
    await fireEvent.keyDown(getByRole('separator'), { key: 'ArrowDown' });
    expect(container.querySelector('.resizable')?.getAttribute('style')).toContain('height: 190px');
    expect(container.querySelector('.resizable')?.getAttribute('style')).not.toContain('width:');
  });

  it('pointer start and drag on a left handle never freeze height', async () => {
    const { container, getByRole } = render(Resizable, {
      props: { width: 380, height: null, handles: ['left'], minWidth: 300, maxWidth: 600 }
    });
    const handle = getByRole('separator');
    Object.defineProperty(handle, 'setPointerCapture', { value: vi.fn() });
    Object.defineProperty(handle, 'hasPointerCapture', { value: () => false });
    await fireEvent.pointerDown(handle, { pointerId: 1, clientX: 400, clientY: 100 });
    expect(container.querySelector('.resizable')?.getAttribute('style')).not.toContain('height:');
    await fireEvent.pointerMove(handle, { pointerId: 1, clientX: 200, clientY: 300 });
    expect(container.querySelector('.resizable')?.getAttribute('style')).toContain('width: 580px');
    expect(container.querySelector('.resizable')?.getAttribute('style')).not.toContain('height:');
    await fireEvent.pointerUp(handle, { pointerId: 1 });
  });
});
