import { beforeAll, afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import './BarChart.wc.svelte';
import './ToolCallLog.wc.svelte';
import './Toast.wc.svelte';
import './Checkbox.wc.svelte';
import './LottiePlayer.wc.svelte';
import './StatCard.wc.svelte';
import './Status.wc.svelte';

/**
 * Mounts the real custom elements (not a stand-in) and drives them the way a
 * consumer actually would -- set/don't set a JS callback, attach
 * addEventListener, interact -- for the seven wrappers dispatchEvents
 * (../dispatch.ts) was applied to. src/wc/dispatch.test.ts already covers the helper's own
 * discovery/collision/bundling logic in isolation; this file is the integration
 * proof that applying it to a real wrapper does what the isolated tests predict.
 *
 * The 3-argument case is covered by dispatch-table-task-list-toggle.test.ts
 * (Table.wc.svelte, onrowclick); ToolCallLog.wc.svelte stands in here for the
 * 2-argument shape.
 */

// BarChart renders inside ChartContainer, which sizes itself off
// getBoundingClientRect() via a ResizeObserver -- neither exists in jsdom by
// default. Same stub shape as src/lib/_chart/consumer-adapters.test.ts.
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
  // Checkbox is form-associated (src/wc/form-associated.ts), which calls
  // internals.setFormValue()/setValidity() on every click -- jsdom's
  // ElementInternals implements neither (confirmed empirically: attachInternals()
  // returns an object exposing only the ARIA-reflection properties). Pre-existing
  // jsdom gap, unrelated to dispatchEvents; nothing before this file mounted a
  // form-associated element under jsdom.
  Object.defineProperty(ElementInternals.prototype, 'setFormValue', {
    value: () => {},
    writable: true,
    configurable: true
  });
  Object.defineProperty(ElementInternals.prototype, 'setValidity', {
    value: () => {},
    writable: true,
    configurable: true
  });
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

describe('BarChart.wc.svelte (onbarclick, 1 argument, non-colliding)', () => {
  it('dispatches barclick for a listener-only consumer, and still calls a set callback', async () => {
    const el = mount('sui-bar-chart');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.onbarclick = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.data = [
      { label: 'Jan', value: 4 },
      { label: 'Feb', value: 8 }
    ];
    await tick();

    let detail: unknown;
    let fired = 0;
    el.addEventListener('barclick', (e) => {
      fired += 1;
      detail = (e as CustomEvent).detail;
    });

    const root = el.shadowRoot;
    const bar = root ? root.querySelector('[data-pw="bar-0"]') : null;
    expect(bar).not.toBeNull();
    bar?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fired).toBe(1);
    expect(detail).toEqual({ index: 0, dataPoint: { label: 'Jan', value: 4 } });
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith({ index: 0, dataPoint: { label: 'Jan', value: 4 } });
  });

  it('dispatches barclick even when the consumer never sets onbarclick at all', async () => {
    const el = mount('sui-bar-chart');
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.data = [{ label: 'Jan', value: 4 }];
    await tick();

    let fired = 0;
    el.addEventListener('barclick', () => {
      fired += 1;
    });

    const bar = el.shadowRoot?.querySelector('[data-pw="bar-0"]');
    bar?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fired).toBe(1);
  });
});

describe('ToolCallLog.wc.svelte (onchipclick, 2 arguments)', () => {
  it('bundles detail as { index, chip } -- the parameter names ToolCallLog.svelte itself uses', async () => {
    const el = mount('sui-tool-call-log');
    const chip = { name: 'grep', args: '-n foo', detail: null };
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.chips = [chip];
    await tick();

    let detail: unknown;
    let fired = 0;
    el.addEventListener('chipclick', (e) => {
      fired += 1;
      detail = (e as CustomEvent).detail;
    });

    const button = el.shadowRoot?.querySelector('button');
    expect(button).not.toBeNull();
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fired).toBe(1);
    expect(detail).toEqual({ index: 0, chip });
  });
});

describe('Toast.wc.svelte (ontoasthide, 0 arguments)', () => {
  it('dispatches toasthide with no detail, and still calls a set callback', async () => {
    const el = mount('sui-toast');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.ontoasthide = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.message = 'saved';
    await tick();

    let seenDetail: unknown = 'not fired';
    let fired = 0;
    el.addEventListener('toasthide', (e) => {
      fired += 1;
      seenDetail = (e as CustomEvent).detail;
    });

    // Toast.svelte's handleAnimationEnd runs off the root element's own 'outroend'
    // listener (onoutroend={handleAnimationEnd}), fired for real once its out:fly
    // transition finishes. Dispatching that event directly drives the same handler
    // without depending on jsdom completing a real CSS/JS transition on a timer.
    const root = el.shadowRoot?.querySelector('[role="alert"]');
    expect(root).not.toBeNull();
    root?.dispatchEvent(new Event('outroend'));

    expect(fired).toBe(1);
    expect(seenDetail).toBeNull();
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith();
  });
});

describe('Checkbox.wc.svelte (onclick collides -- must dispatch NOTHING)', () => {
  it("calls the consumer's onclick with the new checked value, and never dispatches a synthetic click", async () => {
    const el = mount('sui-checkbox');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, typed (checked: boolean) => void,
    // not the native MouseEvent-taking onclick HTMLElement declares.
    el.onclick = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.testId = 'cb';
    await tick();

    let fired = 0;
    el.addEventListener('click', () => {
      fired += 1;
    });

    const label = el.shadowRoot?.querySelector('[data-pw="cb"]');
    expect(label).not.toBeNull();
    // bubbles + composed: a real click on shadow content crosses the shadow
    // boundary on its own, with no help from dispatch.ts.
    label?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

    // Exactly one -- the real, natively-bubbled click. If dispatchEvents had
    // (wrongly) treated onclick as non-colliding, this would be 2.
    expect(fired).toBe(1);
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith(true);
  });
});

type FakeAnimationItem = {
  setSpeed: () => void;
  addEventListener: (event: string, cb: () => void) => void;
  removeEventListener: () => void;
  destroy: () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
};

function fakeLoadAnimation(): { item: FakeAnimationItem; fire: (event: string) => void } {
  const listeners = new Map<string, () => void>();
  const item: FakeAnimationItem = {
    setSpeed: () => {},
    addEventListener: (event, cb) => {
      listeners.set(event, cb);
    },
    removeEventListener: () => {},
    destroy: () => {},
    play: () => {},
    pause: () => {},
    stop: () => {}
  };
  return {
    item,
    fire: (event: string) => {
      listeners.get(event)?.();
    }
  };
}

// LottiePlayer.svelte's onMount does `import('lottie-web')` once per mounted
// instance, and vitest's dynamic-import cache is not reliably busted by a fresh
// vi.doMock + vi.resetModules() per test (a real gap hit while writing this file:
// the first attempt had test 2 silently still calling test 1's fake). A single
// module-level mock whose loadAnimation defers to a reassignable indirection cell
// sidesteps that entirely -- each test points the cell at its own fake before
// mounting, and the dynamic import itself only needs to resolve once.
let currentFake: FakeAnimationItem | null = null;
vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => currentFake
  }
}));

describe('LottiePlayer.wc.svelte (oncomplete non-colliding, onerror grandfathered)', () => {
  it("still dispatches 'complete' (unchanged, non-colliding) and calls a set oncomplete", async () => {
    const fake = fakeLoadAnimation();
    currentFake = fake.item;

    const el = mount('sui-lottie-player');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.oncomplete = original;
    await tick();
    await tick();
    await tick();

    let fired = 0;
    let detail: unknown = 'not fired';
    el.addEventListener('complete', (e) => {
      fired += 1;
      detail = (e as CustomEvent).detail;
    });

    fake.fire('complete');

    expect(fired).toBe(1);
    expect(detail).toBeNull();
    expect(original).toHaveBeenCalledTimes(1);
  });

  it("still dispatches the grandfathered 'error' (collides, exception-listed) and calls a set onerror", async () => {
    const fake = fakeLoadAnimation();
    currentFake = fake.item;

    const el = mount('sui-lottie-player');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.onerror = original;
    await tick();
    await tick();
    await tick();

    let fired = 0;
    el.addEventListener('error', () => {
      fired += 1;
    });

    fake.fire('data_failed');

    expect(fired).toBe(1);
    expect(original).toHaveBeenCalledTimes(1);
  });
});

describe('StatCard.wc.svelte (oncheckboxchange, 1 argument, non-colliding)', () => {
  it('dispatches checkboxchange for a listener-only consumer, and still calls a set callback', async () => {
    const el = mount('sui-stat-card');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.oncheckboxchange = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.checkbox = { text: 'Include tax', checked: false };
    await tick();

    let detail: unknown;
    let fired = 0;
    el.addEventListener('checkboxchange', (e) => {
      fired += 1;
      detail = (e as CustomEvent).detail;
    });

    // The checkbox nests three components deep (StatCard -> CheckListItem ->
    // Checkbox), but only the innermost renders a real interactive element --
    // clicking it is what a user actually does, unlike calling the JS property.
    const box = el.shadowRoot?.querySelector('[role="checkbox"]');
    expect(box).not.toBeNull();
    box?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fired).toBe(1);
    expect(detail).toBe(true);
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith(true);
  });

  it('dispatches checkboxchange even when the consumer never sets oncheckboxchange at all', async () => {
    const el = mount('sui-stat-card');
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.checkbox = { text: 'Include tax', checked: false };
    await tick();

    let fired = 0;
    let detail: unknown;
    el.addEventListener('checkboxchange', (e) => {
      fired += 1;
      detail = (e as CustomEvent).detail;
    });

    const box = el.shadowRoot?.querySelector('[role="checkbox"]');
    box?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fired).toBe(1);
    expect(detail).toBe(true);
  });

  it("still calls the consumer's onclick, and never dispatches a synthetic click (onclick collides)", async () => {
    const el = mount('sui-stat-card');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.onclick = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.value = '128';
    await tick();

    let fired = 0;
    el.addEventListener('click', () => {
      fired += 1;
    });

    // isInteractive (StatCard.svelte) only wires role="button"/tabindex/click
    // handling once onclick is a function -- exactly what was just assigned.
    const card = el.shadowRoot?.querySelector('[role="button"]');
    expect(card).not.toBeNull();
    card?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

    // Exactly one -- the real, natively-bubbled click. If dispatchEvents had
    // (wrongly) treated onclick as non-colliding, this would be 2.
    expect(fired).toBe(1);
    expect(original).toHaveBeenCalledTimes(1);
  });
});

describe('Status.wc.svelte (onbuttonclick, non-colliding)', () => {
  it('dispatches buttonclick carrying the click MouseEvent as detail, and still calls a set callback', async () => {
    const el = mount('sui-status');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.onbuttonclick = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.buttonProperties = { text: 'Retry' };
    await tick();

    let detail: unknown = 'not fired';
    let fired = 0;
    el.addEventListener('buttonclick', (e) => {
      fired += 1;
      detail = (e as CustomEvent).detail;
    });

    // Status.svelte's own declared type for onbuttonclick reads `() => void`, but
    // it wires the callback straight into Button's onclick
    // (`<Button {...buttonProperties} onclick={onbuttonclick} />`), and
    // Button.svelte's handleButtonClick calls `onclick?.(event)` -- so at runtime
    // the callback receives the click's MouseEvent, one argument, not zero.
    // Verified here rather than assumed from the (misleading) declared type,
    // which is exactly why dispatchEvents reads the callback's actual call-time
    // arguments instead of trusting a signature.
    const btn = el.shadowRoot?.querySelector('button');
    expect(btn).not.toBeNull();
    btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fired).toBe(1);
    expect(detail).toBeInstanceOf(MouseEvent);
    expect(original).toHaveBeenCalledTimes(1);
    expect(original.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
  });
});
