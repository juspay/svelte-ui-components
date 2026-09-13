import { beforeAll, afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import './DualAxisBarChart.wc.svelte';

/**
 * Mounts the real sui-dual-axis-bar-chart custom element (not a stand-in) and
 * drives it the way a consumer actually would -- set a JS callback, attach
 * addEventListener, click a real element inside the shadow root -- to prove
 * dispatchEvents (../dispatch.ts) does what the wiring comments claim for
 * DualAxisBarChart.wc.svelte's one non-colliding callback prop, onbarclick.
 * Follows the same shape as the BarChart.wc.svelte case in
 * dispatch-integration.test.ts, which this file deliberately does not touch -- six
 * other agents are editing that shared file concurrently.
 */

// DualAxisBarChart renders inside ChartContainer, which sizes itself off
// getBoundingClientRect() via a ResizeObserver -- neither exists in jsdom by
// default. Same stub shape as dispatch-integration.test.ts and
// src/lib/_chart/consumer-adapters.test.ts.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
  );
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    left: 0,
    top: 0,
    right: 800,
    bottom: 400,
    width: 800,
    height: 400,
    x: 0,
    y: 0,
    toJSON: () => ({})
  }));
});
afterAll(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const mounted: HTMLElement[] = [];
function mount(tag: string): HTMLElement {
  const el = document.createElement(tag);
  document.body.appendChild(el);
  mounted.push(el);
  return el;
}
afterEach(() => {
  for (const el of mounted.splice(0)) {
    el.remove();
  }
});

describe('DualAxisBarChart.wc.svelte (onbarclick, 1 argument, non-colliding)', () => {
  it('dispatches barclick for a listener-only consumer, and still calls a set callback', async () => {
    const el = mount('sui-dual-axis-bar-chart');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.onbarclick = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.categories = ['Jan', 'Feb'];
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.series = [{ name: 'Revenue', data: [10, 20], yAxisIndex: 0 }];
    await tick();
    await tick();

    let detail: unknown;
    let fired = 0;
    el.addEventListener('barclick', (e) => {
      fired += 1;
      detail = (e as CustomEvent).detail;
    });

    const root = el.shadowRoot;
    const hoverTarget = root ? root.querySelector('[data-pw="hover-target-0"]') : null;
    expect(hoverTarget).not.toBeNull();
    hoverTarget?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fired).toBe(1);
    expect(detail).toEqual({
      categoryIndex: 0,
      context: {
        category: 'Jan',
        categoryIndex: 0,
        points: [
          { name: 'Revenue', value: 10, color: expect.any(String), yAxisIndex: 0, type: 'column' }
        ]
      }
    });
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith(detail);
  });

  it('dispatches barclick even when the consumer never sets onbarclick at all', async () => {
    const el = mount('sui-dual-axis-bar-chart');
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.categories = ['Jan', 'Feb'];
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.series = [{ name: 'Revenue', data: [10, 20], yAxisIndex: 0 }];
    await tick();
    await tick();

    let fired = 0;
    el.addEventListener('barclick', () => {
      fired += 1;
    });

    const hoverTarget = el.shadowRoot?.querySelector('[data-pw="hover-target-1"]');
    expect(hoverTarget).not.toBeNull();
    hoverTarget?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fired).toBe(1);
  });
});
