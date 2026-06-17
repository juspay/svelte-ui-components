/**
 * Unit tests for the `tooltip` Svelte action (node environment, DOM mocked via vi.stubGlobal).
 *
 * The action is pure DOM-manipulation logic with no Svelte runtime dependency.
 * We stub the global `document` and `window` objects so that each test exercises the
 * action's lifecycle in isolation without requiring a browser or a DOM environment.
 *
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Minimal DOM-compatible stub types ─────────────────────────────────────────

type StyleMap = Record<string, string>;

type StubElement = {
  tagName: string;
  id: string;
  className: string;
  style: StyleMap;
  textContent: string;
  children: StubElement[];
  _attrs: Record<string, string>;
  _listeners: Record<string, Array<EventListener>>;
  setAttribute(name: string, value: string): void;
  getAttribute(name: string): string | null;
  removeAttribute(name: string): void;
  appendChild(child: StubElement): StubElement;
  remove(): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  getBoundingClientRect(): DOMRect;
};

const makeStubElement = (tag: string): StubElement => {
  const attrs: Record<string, string> = {};
  const listeners: Record<string, Array<EventListener>> = {};
  const el: StubElement = {
    tagName: tag.toUpperCase(),
    id: '',
    className: '',
    style: {},
    textContent: '',
    children: [],
    _attrs: attrs,
    _listeners: listeners,
    setAttribute(name: string, value: string) {
      attrs[name] = value;
      if (name === 'id') {
        this.id = value;
      }
    },
    getAttribute(name: string) {
      return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
    },
    removeAttribute(name: string) {
      delete attrs[name];
    },
    appendChild(child: StubElement) {
      this.children.push(child);
      return child;
    },
    remove() {
      // Remove self from appendedToBody so removal is trackable in assertions.
      const index = appendedToBody.indexOf(this);
      if (index > -1) {
        appendedToBody.splice(index, 1);
      }
    },
    addEventListener(type: string, listener: EventListener) {
      if (!Object.prototype.hasOwnProperty.call(listeners, type)) {
        listeners[type] = [];
      }
      listeners[type].push(listener);
    },
    removeEventListener(type: string, listener: EventListener) {
      if (Object.prototype.hasOwnProperty.call(listeners, type)) {
        listeners[type] = listeners[type].filter((fn) => fn !== listener);
      }
    },
    getBoundingClientRect() {
      return { top: 10, bottom: 50, left: 20, right: 80, width: 60, height: 40 } as DOMRect;
    }
  };
  return el;
};

// ── Shared test state ──────────────────────────────────────────────────────────

let triggerNode: StubElement;
let appendedToBody: StubElement[];
const windowListeners: Record<string, Array<EventListener>> = {};

beforeEach(() => {
  appendedToBody = [];
  windowListeners['resize'] = [];
  windowListeners['scroll'] = [];
  triggerNode = makeStubElement('button');

  vi.stubGlobal('document', {
    createElement: (tag: string) => makeStubElement(tag),
    getElementById: (id: string) => appendedToBody.find((el) => el.id === id) ?? null,
    body: {
      appendChild: (child: StubElement) => {
        appendedToBody.push(child);
        return child;
      },
      removeChild: (child: StubElement) => {
        const index = appendedToBody.indexOf(child);
        if (index > -1) {
          appendedToBody.splice(index, 1);
        }
        return child;
      }
    }
  });

  vi.stubGlobal('window', {
    addEventListener: (type: string, listener: EventListener) => {
      if (!Object.prototype.hasOwnProperty.call(windowListeners, type)) {
        windowListeners[type] = [];
      }
      windowListeners[type].push(listener);
    },
    removeEventListener: (type: string, listener: EventListener) => {
      if (Object.prototype.hasOwnProperty.call(windowListeners, type)) {
        windowListeners[type] = windowListeners[type].filter((fn) => fn !== listener);
      }
    }
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

// ── Helper: trigger DOM events on a stub element ──────────────────────────────

const fire = (el: StubElement, type: string): void => {
  const handlers = Object.prototype.hasOwnProperty.call(el._listeners, type)
    ? el._listeners[type]
    : [];
  for (const handler of handlers) {
    handler(new Event(type));
  }
};

// ── Test helpers ──────────────────────────────────────────────────────────────

const loadAction = async () => {
  const mod = await import('./tooltip-action');
  return mod.tooltip;
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('tooltip action — core lifecycle', () => {
  it('appends a tooltip bubble to document.body on mouseenter', async () => {
    const tooltipFn = await loadAction();
    tooltipFn(triggerNode as unknown as HTMLElement, { text: 'Hello' });

    fire(triggerNode, 'mouseenter');

    expect(appendedToBody.length).toBe(1);
    expect(appendedToBody[0].getAttribute('role')).toBe('tooltip');
  });

  it('sets aria-describedby on the host node pointing to the bubble id', async () => {
    const tooltipFn = await loadAction();
    tooltipFn(triggerNode as unknown as HTMLElement, { text: 'ARIA' });

    fire(triggerNode, 'mouseenter');

    const bubbleId = triggerNode.getAttribute('aria-describedby');
    expect(bubbleId).not.toBeNull();
    expect(appendedToBody[0].id).toBe(bubbleId);
  });

  it('removes aria-describedby from host node when bubble is hidden', async () => {
    const tooltipFn = await loadAction();
    tooltipFn(triggerNode as unknown as HTMLElement, { text: 'ARIA' });

    fire(triggerNode, 'mouseenter');
    fire(triggerNode, 'mouseleave');

    expect(triggerNode.getAttribute('aria-describedby')).toBeNull();
  });

  it('registers resize and scroll listeners on window', async () => {
    const tooltipFn = await loadAction();
    tooltipFn(triggerNode as unknown as HTMLElement, { text: 'Reposition' });

    expect(windowListeners['resize'].length).toBeGreaterThan(0);
    expect(windowListeners['scroll'].length).toBeGreaterThan(0);
  });
});

describe('tooltip action — race condition guard', () => {
  it('firing mouseenter twice does not create a second bubble', async () => {
    const tooltipFn = await loadAction();
    tooltipFn(triggerNode as unknown as HTMLElement, { text: 'Race' });

    fire(triggerNode, 'mouseenter');
    fire(triggerNode, 'mouseenter');

    expect(appendedToBody.length).toBe(1);
  });
});

describe('tooltip action — update lifecycle', () => {
  it('update() refreshes options and re-shows bubble with new text', async () => {
    const tooltipFn = await loadAction();
    const action = tooltipFn(triggerNode as unknown as HTMLElement, { text: 'Before' });

    fire(triggerNode, 'mouseenter');
    expect(appendedToBody.length).toBe(1);

    action.update({ text: 'After' });

    // Old bubble removed, new bubble created — exactly one bubble remains.
    expect(appendedToBody.length).toBe(1);
    expect(appendedToBody[0].getAttribute('role')).toBe('tooltip');
  });
});

describe('tooltip action — destroy lifecycle', () => {
  it('destroy() removes all window event listeners', async () => {
    const tooltipFn = await loadAction();
    const action = tooltipFn(triggerNode as unknown as HTMLElement, { text: 'Cleanup' });

    action.destroy();

    expect(windowListeners['resize'].length).toBe(0);
    expect(windowListeners['scroll'].length).toBe(0);
  });

  it('destroy() removes all node event listeners', async () => {
    const tooltipFn = await loadAction();
    const action = tooltipFn(triggerNode as unknown as HTMLElement, { text: 'Cleanup' });

    action.destroy();

    for (const eventType of ['mouseenter', 'mouseleave', 'focusin', 'focusout']) {
      const count = Object.prototype.hasOwnProperty.call(triggerNode._listeners, eventType)
        ? triggerNode._listeners[eventType].length
        : 0;
      expect(count).toBe(0);
    }
  });
});

describe('tooltip action — delay', () => {
  it('bubble is not appended synchronously when delay > 0', async () => {
    vi.useFakeTimers();
    const tooltipFn = await loadAction();
    tooltipFn(triggerNode as unknown as HTMLElement, { text: 'Delayed', delay: 300 });

    fire(triggerNode, 'mouseenter');
    expect(appendedToBody.length).toBe(0);

    vi.advanceTimersByTime(300);
    expect(appendedToBody.length).toBe(1);

    vi.useRealTimers();
  });

  it('mouseleave before timer fires cancels the pending show', async () => {
    vi.useFakeTimers();
    const tooltipFn = await loadAction();
    tooltipFn(triggerNode as unknown as HTMLElement, { text: 'Cancelled', delay: 300 });

    fire(triggerNode, 'mouseenter');
    fire(triggerNode, 'mouseleave');
    vi.advanceTimersByTime(300);

    expect(appendedToBody.length).toBe(0);

    vi.useRealTimers();
  });
});

describe('tooltip action — SSR guard', () => {
  it('does not throw when document global is absent (simulates server environment)', async () => {
    // Unstub document so typeof document === 'undefined' (the actual SSR check in createBubble).
    vi.unstubAllGlobals();

    const tooltipFn = await loadAction();

    expect(() => {
      tooltipFn(triggerNode as unknown as HTMLElement, { text: 'SSR safe' });
      fire(triggerNode, 'mouseenter');
    }).not.toThrow();
  });
});
