import { fireEvent, render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import SankeyChart from './SankeyChart.svelte';

const nodes = [
  { id: 'a', label: 'Source A' },
  { id: 'b', label: 'Source B' },
  { id: 'c', label: 'Sink C' }
];
const links = [
  { source: 'a', target: 'c', value: 10 },
  { source: 'b', target: 'c', value: 5 }
];

// Same rationale as PieChart's keyboard tests: ChartContainer only renders its
// <svg> children once it measures a non-zero rect, which jsdom never produces
// on its own.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    left: 0,
    right: 400,
    top: 0,
    bottom: 300,
    width: 400,
    height: 300,
    x: 0,
    y: 0,
    toJSON: () => ({})
  }));
});
afterAll(() => vi.unstubAllGlobals());

describe('SankeyChart keyboard access', () => {
  it('exposes every node and link as a focusable, labelled button', () => {
    const { container } = render(SankeyChart, { nodes, links });
    const nodeEls = container.querySelectorAll('rect.sankey-node');
    const linkEls = container.querySelectorAll('path.sankey-link');
    expect(nodeEls).toHaveLength(3);
    expect(linkEls).toHaveLength(2);
    for (const el of [...nodeEls, ...linkEls]) {
      expect(el.getAttribute('tabindex')).toBe('0');
      expect(el.getAttribute('role')).toBe('button');
      expect(el.getAttribute('aria-label')).not.toBeNull();
    }
  });

  it('invokes onnodeclick on Enter/Space focused on a node, not on other keys', async () => {
    const onnodeclick = vi.fn();
    const { container } = render(SankeyChart, { nodes, links, onnodeclick });
    const nodeEl = container.querySelectorAll('rect.sankey-node')[0];

    await fireEvent.keyDown(nodeEl, { key: 'a' });
    expect(onnodeclick).not.toHaveBeenCalled();

    await fireEvent.keyDown(nodeEl, { key: 'Enter' });
    expect(onnodeclick).toHaveBeenCalledWith({ node: nodes[0] });

    await fireEvent.keyDown(nodeEl, { key: ' ' });
    expect(onnodeclick).toHaveBeenCalledTimes(2);
  });

  it('invokes onlinkclick on Enter/Space focused on a link', async () => {
    const onlinkclick = vi.fn();
    const { container } = render(SankeyChart, { nodes, links, onlinkclick });
    const linkEl = container.querySelectorAll('path.sankey-link')[0];

    await fireEvent.keyDown(linkEl, { key: 'Enter' });
    expect(onlinkclick).toHaveBeenCalledWith({ link: links[0] });
  });

  it('fires hover callbacks on focus and clears them on blur, mirroring pointer hover', async () => {
    const onnodehover = vi.fn();
    const { container } = render(SankeyChart, { nodes, links, onnodehover });
    const nodeEl = container.querySelectorAll('rect.sankey-node')[0];

    await fireEvent.focus(nodeEl);
    expect(onnodehover).toHaveBeenCalledWith({ node: nodes[0] });

    await fireEvent.blur(nodeEl);
    expect(onnodehover).toHaveBeenLastCalledWith(null);
  });
});
