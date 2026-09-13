import { describe, expect, it, vi } from 'vitest';
import { dispatchEvents } from './dispatch';

/**
 * Isolated from any real .wc.svelte wrapper on purpose: these exercise
 * dispatchEvents' own discovery/collision/bundling logic directly, against a bare
 * custom element whose prototype is shaped by hand -- the same
 * `define_property`-on-the-prototype mechanism Svelte's custom-element layer uses,
 * confirmed empirically (Object.getOwnPropertyNames(Object.getPrototypeOf(hostEl))
 * lists a declared prop whether or not any instance ever set it). Real wrapper
 * integration -- mounting an actual sui-* element -- is covered separately by
 * src/wc/components/dispatch-integration.test.ts.
 */

let tagCounter = 0;

/** Registers a fresh custom element class with one declared prop per entry in `props`. */
function makeElement(tag: string, propNames: readonly string[]): HTMLElement {
  const uniqueTag = `${tag}-${(tagCounter += 1)}`;
  class TestElement extends HTMLElement {}
  for (const name of propNames) {
    let value: unknown;
    Object.defineProperty(TestElement.prototype, name, {
      get(): unknown {
        return value;
      },
      set(next: unknown): void {
        value = next;
      },
      enumerable: true,
      configurable: true
    });
  }
  customElements.define(uniqueTag, TestElement);
  const el = document.createElement(uniqueTag);
  // Real tag lookups in dispatch.ts use hostEl.tagName.toLowerCase(), which for a
  // custom element is the registered name -- suffixing it here would break the
  // CALLBACK_ARGUMENT_NAMES / DISPATCH_COLLISION_EXCEPTIONS keys some tests rely on,
  // so those tests register their fake element under the exact real tag instead (see
  // below) rather than through this counter-suffixed helper.
  return el;
}

describe('dispatchEvents', () => {
  it('0-argument callback dispatches with no detail key at all', () => {
    const el = makeElement('x-zero-arg', ['ononearg', 'onzeroarg']);
    const dispatchers = dispatchEvents(el, {});
    document.body.appendChild(el);
    let seen: CustomEvent | null = null;
    el.addEventListener('zeroarg', (e) => {
      seen = e as CustomEvent;
    });
    dispatchers.onzeroarg();
    expect(seen).not.toBeNull();
    // No `detail` in the CustomEventInit at all -- the same shape LottiePlayer's
    // existing 'complete'/'error' events already use -- so the platform default
    // (null) is what a consumer sees, not an empty object or an explicit undefined.
    expect(seen && (seen as CustomEvent).detail).toBeNull();
    document.body.removeChild(el);
  });

  it('1-argument callback: detail IS that value, dispatched even with no consumer callback set', () => {
    const el = makeElement('x-one-arg', ['ononearg']);
    // props has no 'ononearg' key at all -- the listener-only consumer case.
    const dispatchers = dispatchEvents(el, {});
    document.body.appendChild(el);
    let detail: unknown;
    let fired = 0;
    el.addEventListener('onearg', (e) => {
      fired += 1;
      detail = (e as CustomEvent).detail;
    });
    dispatchers.ononearg({ id: 7 });
    expect(fired).toBe(1);
    expect(detail).toEqual({ id: 7 });
    document.body.removeChild(el);
  });

  it("the consumer's own callback still fires, with its original arguments, exactly as before", () => {
    const el = makeElement('x-callthrough', ['ononearg']);
    const original = vi.fn();
    const props = { ononearg: original };
    const dispatchers = dispatchEvents(el, props);
    document.body.appendChild(el);
    dispatchers.ononearg({ id: 9 });
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith({ id: 9 });
    document.body.removeChild(el);
  });

  it('reads the callback live, so reassigning it after wrapping still calls the new one', () => {
    const el = makeElement('x-live-read', ['ononearg']);
    const first = vi.fn();
    const second = vi.fn();
    const props: Record<string, unknown> = { ononearg: first };
    const dispatchers = dispatchEvents(el, props);
    document.body.appendChild(el);
    props.ononearg = second; // simulates a reactive prop update after dispatchEvents ran once
    dispatchers.ononearg('x');
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('x');
    document.body.removeChild(el);
  });

  it('2-argument callback with a registered name pair bundles detail under those names', () => {
    // dispatchEvents keys CALLBACK_ARGUMENT_NAMES off hostEl.tagName, so this has to be
    // registered under the literal tag ('sui-tool-call-log') the registry names.
    if (typeof customElements.get('sui-tool-call-log') !== 'function') {
      class RealTag extends HTMLElement {}
      let value: unknown;
      Object.defineProperty(RealTag.prototype, 'onchipclick', {
        get: () => value,
        set: (next: unknown) => {
          value = next;
        },
        enumerable: true,
        configurable: true
      });
      customElements.define('sui-tool-call-log', RealTag);
    }
    const el = document.createElement('sui-tool-call-log');
    document.body.appendChild(el);
    const dispatchers = dispatchEvents(el, {});
    let detail: unknown;
    el.addEventListener('chipclick', (e) => {
      detail = (e as CustomEvent).detail;
    });
    dispatchers.onchipclick(2, { detail: 'x' });
    expect(detail).toEqual({ index: 2, chip: { detail: 'x' } });
    document.body.removeChild(el);
  });

  it('a 3-argument callback with no registered names falls back to a positional array', () => {
    const el = makeElement('x-three-arg', ['onthreearg']);
    const dispatchers = dispatchEvents(el, {});
    document.body.appendChild(el);
    let detail: unknown;
    el.addEventListener('threearg', (e) => {
      detail = (e as CustomEvent).detail;
    });
    dispatchers.onthreearg(1, 'two', { three: 3 });
    expect(detail).toEqual([1, 'two', { three: 3 }]);
    document.body.removeChild(el);
  });

  it('a colliding name with no recorded exception is left out entirely -- stays callback-only', () => {
    const el = makeElement('x-collide', ['onclick']);
    const original = vi.fn();
    const dispatchers = dispatchEvents(el, { onclick: original });
    document.body.appendChild(el);
    let fired = 0;
    el.addEventListener('click', () => {
      fired += 1;
    });
    expect(Object.prototype.hasOwnProperty.call(dispatchers, 'onclick')).toBe(false);
    // A real composed click still bubbles out of the shadow root independent of this
    // helper; what this proves is that dispatchEvents itself adds no synthetic one.
    expect(fired).toBe(0);
    document.body.removeChild(el);
  });

  it("the one grandfathered exception ('error' on sui-lottie-player) still dispatches", () => {
    if (typeof customElements.get('sui-lottie-player') !== 'function') {
      class Fake extends HTMLElement {}
      let value: unknown;
      Object.defineProperty(Fake.prototype, 'onerror', {
        get: () => value,
        set: (next: unknown) => {
          value = next;
        },
        enumerable: true,
        configurable: true
      });
      customElements.define('sui-lottie-player', Fake);
    }
    const el = document.createElement('sui-lottie-player');
    document.body.appendChild(el);
    const dispatchers = dispatchEvents(el, {});
    let fired = 0;
    el.addEventListener('error', () => {
      fired += 1;
    });
    dispatchers.onerror();
    expect(fired).toBe(1);
    document.body.removeChild(el);
  });
});
