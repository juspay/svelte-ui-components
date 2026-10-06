/**
 * Unit tests for the slot- and shadow-aware interactive-element search
 * (src/lib/_interaction/focusable.ts). jsdom provides shadow roots and
 * `HTMLSlotElement.assignedElements`, but no layout, so these cover the tree
 * walk and the attribute rules; real Tab reachability is the browser specs'
 * job (tests/scroller-keyboard-access.test.ts, tests/wc-*-.spec.ts).
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  contentElements,
  findInteractive,
  hasTabbableContent,
  interactiveElements
} from './focusable';

const mount = (html: string): HTMLElement => {
  const root = document.createElement('div');
  root.innerHTML = html;
  document.body.append(root);
  return root;
};

afterEach(() => {
  document.body.replaceChildren();
});

describe('findInteractive', () => {
  it('returns the first native control in tree order', () => {
    const root = mount(
      '<span>text</span><div><a href="/x" id="link">a</a><button id="b">b</button></div>'
    );
    expect(findInteractive(root)?.id).toBe('link');
  });

  it('skips a disabled button, a hidden input and an anchor with no href', () => {
    const root = mount(
      '<button disabled></button><input type="hidden"><a>no href</a><button id="ok"></button>'
    );
    expect(findInteractive(root)?.id).toBe('ok');
  });

  it('keeps a native control with tabindex="-1" unless only tabbable ones are wanted', () => {
    const root = mount('<button id="programmatic" tabindex="-1"></button>');
    expect(findInteractive(root)?.id).toBe('programmatic');
    expect(findInteractive(root, { tabbableOnly: true })).toBeNull();
  });

  it('counts a bare tabindex element only when it is not negative', () => {
    expect(findInteractive(mount('<div tabindex="-1"></div>'))).toBeNull();
    expect(findInteractive(mount('<div id="stop" tabindex="0"></div>'))?.id).toBe('stop');
  });

  it('ignores elements that are hidden or inside an inert subtree', () => {
    expect(findInteractive(mount('<button hidden></button>'))).toBeNull();
    expect(findInteractive(mount('<div inert><button></button></div>'))).toBeNull();
  });

  it('tests the root itself only when asked to', () => {
    const root = mount('<button id="self"></button>').firstElementChild;
    if (root === null) {
      throw new Error('fixture failed to mount');
    }
    expect(findInteractive(root)).toBeNull();
    expect(findInteractive(root, { includeRoot: true })?.id).toBe('self');
  });

  it('follows a slot to the light-DOM element assigned to it', () => {
    const host = mount(
      '<div id="host"><button slot="trigger" id="slotted">Open</button></div>'
    ).firstElementChild;
    if (host === null) {
      throw new Error('fixture failed to mount');
    }
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<div id="wrapper"><slot name="trigger"></slot></div>';

    const wrapper = shadow.getElementById('wrapper');
    if (wrapper === null) {
      throw new Error('shadow fixture failed to mount');
    }
    // A plain querySelector rooted in the shadow tree cannot see the slotted button.
    expect(wrapper.querySelector('button')).toBeNull();
    expect(findInteractive(wrapper)?.id).toBe('slotted');
  });

  it("uses an unassigned slot's own fallback content", () => {
    const host = mount('<div id="host"></div>').firstElementChild;
    if (host === null) {
      throw new Error('fixture failed to mount');
    }
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<div id="wrapper"><slot><button id="fallback"></button></slot></div>';
    const wrapper = shadow.getElementById('wrapper');
    if (wrapper === null) {
      throw new Error('shadow fixture failed to mount');
    }
    expect(findInteractive(wrapper)?.id).toBe('fallback');
  });

  it('descends into an open shadow root of a nested element', () => {
    const root = mount('<div><x-nested id="nested"></x-nested></div>');
    const nested = root.querySelector('#nested');
    if (nested === null) {
      throw new Error('fixture failed to mount');
    }
    nested.attachShadow({ mode: 'open' }).innerHTML = '<button id="deep"></button>';
    expect(root.querySelector('button')).toBeNull();
    expect(findInteractive(root)?.id).toBe('deep');
  });

  it("finds the control in the root's own shadow tree when the root is a host", () => {
    // The shape of `<sui-button slot="trigger">`: the host is not a control, the native
    // button it renders is, and it lives in the host's shadow root rather than beneath it.
    const host = mount('<x-button id="host"></x-button>').firstElementChild;
    if (host === null) {
      throw new Error('fixture failed to mount');
    }
    host.attachShadow({ mode: 'open' }).innerHTML = '<button id="rendered">Open</button>';

    expect(host.querySelector('button')).toBeNull();
    expect(findInteractive(host)?.id).toBe('rendered');
    expect(findInteractive(host, { includeRoot: true })?.id).toBe('rendered');
    expect(findInteractive(host, { tabbableOnly: true })?.id).toBe('rendered');
  });

  it('prefers a host that is itself a control over the one it renders', () => {
    const host = mount('<x-button id="host" tabindex="0"></x-button>').firstElementChild;
    if (host === null) {
      throw new Error('fixture failed to mount');
    }
    host.attachShadow({ mode: 'open' }).innerHTML = '<button id="rendered"></button>';
    expect(findInteractive(host, { includeRoot: true })?.id).toBe('host');
  });

  it('excludes a shadow control while its host is inert and finds it again when enabled', () => {
    const host = mount('<x-button inert></x-button>').firstElementChild;
    if (host === null) {
      throw new Error('fixture failed to mount');
    }
    host.attachShadow({ mode: 'open' }).innerHTML = '<button>Open</button>';
    expect(hasTabbableContent(host)).toBe(false);
    host.removeAttribute('inert');
    expect(hasTabbableContent(host)).toBe(true);
  });

  it('excludes a slotted control inside an inert shadow wrapper', () => {
    const host = mount('<x-card><button slot="action">Open</button></x-card>').firstElementChild;
    if (host === null) {
      throw new Error('fixture failed to mount');
    }
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<div inert><slot name="action"></slot></div>';
    expect(hasTabbableContent(host)).toBe(false);
    shadow.querySelector('div')?.removeAttribute('inert');
    expect(hasTabbableContent(host)).toBe(true);
  });

  it('walks a host through its shadow tree, so slotted light children are found once, in render order', () => {
    // `first` is slotted after a button the shadow tree renders itself; `unslotted` has no
    // slot to appear in, so it is not rendered at all and must not be offered as a control.
    const host = mount(
      '<x-card id="host"><a href="#a" slot="body" id="first">a</a><button id="unslotted" slot="nowhere"></button></x-card>'
    ).firstElementChild;
    if (host === null) {
      throw new Error('fixture failed to mount');
    }
    host.attachShadow({ mode: 'open' }).innerHTML =
      '<button id="chrome"></button><slot name="body"></slot>';

    const seen = Array.from(interactiveElements(host), (el) => el.id);
    expect(seen).toEqual(['chrome', 'first']);
  });

  it('lists hidden controls too when asked, so a caller can watch them come back', () => {
    const root = mount(
      '<button id="shown"></button><button id="gone" hidden></button><div inert><button id="frozen"></button></div>'
    );
    expect(Array.from(interactiveElements(root), (el) => el.id)).toEqual(['shown']);
    expect(Array.from(interactiveElements(root, { includeHidden: true }), (el) => el.id)).toEqual([
      'shown',
      'gone',
      'frozen'
    ]);
  });

  it('returns null for a host whose shadow tree renders nothing interactive', () => {
    const host = mount('<x-icon id="host"></x-icon>').firstElementChild;
    if (host === null) {
      throw new Error('fixture failed to mount');
    }
    host.attachShadow({ mode: 'open' }).innerHTML = '<svg></svg><span>decor</span>';
    expect(findInteractive(host, { includeRoot: true })).toBeNull();
  });

  it('honours checkVisibility where the engine provides it', () => {
    const root = mount('<button id="hidden-by-layout"></button><button id="shown"></button>');
    Object.defineProperty(HTMLElement.prototype, 'checkVisibility', {
      configurable: true,
      value(this: HTMLElement) {
        return this.id !== 'hidden-by-layout';
      }
    });
    try {
      expect(findInteractive(root)?.id).toBe('shown');
    } finally {
      Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
    }
  });
});

describe('hasTabbableContent', () => {
  it('is false for plain content and true once a link is added', () => {
    const root = mount('<p>Nothing to focus</p>');
    expect(hasTabbableContent(root)).toBe(false);
    root.insertAdjacentHTML('beforeend', '<a href="#x">link</a>');
    expect(hasTabbableContent(root)).toBe(true);
  });

  it('does not count the root itself', () => {
    const root = mount('<button id="only"></button>').firstElementChild;
    if (root === null) {
      throw new Error('fixture failed to mount');
    }
    expect(hasTabbableContent(root)).toBe(false);
  });
});

describe('contentElements', () => {
  it('returns direct children, with a slot replaced by what is assigned to it', () => {
    const host = mount(
      '<div id="host"><p id="a" slot="s"></p><p id="b" slot="s"></p></div>'
    ).firstElementChild;
    if (host === null) {
      throw new Error('fixture failed to mount');
    }
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<div id="region"><i id="own"></i><slot name="s"></slot></div>';
    const region = shadow.getElementById('region');
    if (region === null) {
      throw new Error('shadow fixture failed to mount');
    }
    expect(contentElements(region).map((el) => el.id)).toEqual(['own', 'a', 'b']);
  });
});
