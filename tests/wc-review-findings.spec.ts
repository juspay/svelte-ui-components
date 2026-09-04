import { expect, test, type Page } from '@playwright/test';

/**
 * MEASUREMENT HARNESS for the review findings on PR #506.
 *
 * Two reviewers contradict each other about `children`: Yama on #503 required
 * declaring it, CodeRabbit on #506 says declaring it shadows the read-only
 * `Element.children` HTMLCollection. Both cannot be right, and neither measured
 * it. Every assertion below states the behaviour a consumer is entitled to, so
 * a failure names a real defect rather than a disagreement between bots.
 */
const loadBundle = async (page: Page): Promise<void> => {
  await page.goto('/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-status') === 'function', null, {
    timeout: 15_000
  });
};

test.describe('review findings — measured, not adjudicated', () => {
  test('F2: declaring children leaves the native Element.children collection intact', async ({
    page
  }) => {
    await loadBundle(page);

    const result = await page.evaluate(() => {
      const element = document.createElement('sui-accordion');
      const first = document.createElement('span');
      const second = document.createElement('b');
      element.append(first, second);
      document.body.append(element);
      const children: unknown = element.children;
      return {
        isCollection: children instanceof HTMLCollection,
        length: children instanceof HTMLCollection ? children.length : -1,
        type: Object.prototype.toString.call(children)
      };
    });

    expect(result.isCollection, `element.children became ${result.type}`).toBe(true);
    expect(result.length).toBe(2);
  });

  // Scoped to sui-status on purpose. sui-chat-bubble, sui-draggable and
  // sui-resizable shipped `children` as a declared prop, so removing it is a
  // breaking change and is deferred to 4.0.0 — they keep the declaration, and
  // `element.children` stays undefined on them until then. sui-status never
  // declared it, so giving it default-slot forwarding is purely additive and
  // closes the #503 review finding without costing a major.
  test('F2b: light-DOM children reach sui-status through the default slot', async ({ page }) => {
    await loadBundle(page);

    const results = await page.evaluate(async () => {
      const out: Record<string, { projected: boolean; nativeOk: boolean }> = {};
      for (const tag of ['sui-status']) {
        const element = document.createElement(tag);
        const slotted = document.createElement('span');
        slotted.textContent = `content for ${tag}`;
        element.append(slotted);
        document.body.append(element);
        await new Promise((resolve) => setTimeout(resolve, 300));
        out[tag] = {
          projected: slotted.assignedSlot !== null,
          nativeOk: element.children instanceof HTMLCollection && element.children.length === 1
        };
      }
      return out;
    });

    for (const [tag, result] of Object.entries(results)) {
      expect(result.nativeOk, `${tag}: element.children is not a live HTMLCollection`).toBe(true);
      expect(result.projected, `${tag}: light-DOM child was never assigned to a slot`).toBe(true);
    }
  });

  test('F4: a property-assigned snippet is used, not replaced by the slot-backed one', async ({
    page
  }) => {
    await loadBundle(page);

    // Banner declares `icon` as a property AND defines {#snippet icon()} after
    // {...props}. If the wrapper's snippet wins, a JS consumer assigning
    // element.icon gets nothing — the prop is declared but unreachable, which is
    // the exact defect this PR set out to fix.
    const rendered = await page.evaluate(async () => {
      const element = document.createElement('sui-banner');
      element.id = 'snippet-precedence';
      element.setAttribute('text', 'Banner body');
      document.body.append(element);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const target = document.querySelector('#snippet-precedence');
      if (target === null) {
        return 'element missing';
      }
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), 'icon');
      return typeof descriptor?.set === 'function' ? 'settable' : 'no setter';
    });

    expect(rendered).toBe('settable');

    // The real question: does the assigned value reach the child component?
    const reachedChild = await page.evaluate(async () => {
      const target = document.querySelector('#snippet-precedence');
      if (target === null) {
        return { error: 'missing' };
      }
      let invoked = false;
      // A Svelte snippet is a function of (anchor, ...args). Assigning a plain
      // function is enough to observe whether the child ever calls it.
      Object.assign(target, {
        icon: () => {
          invoked = true;
        }
      });
      await new Promise((resolve) => setTimeout(resolve, 250));
      return { invoked };
    });

    expect(
      reachedChild,
      'property-assigned snippet never ran: the wrapper slot-backed snippet overrode it'
    ).toEqual({ invoked: true });
  });

  test('F5: aria-haspopup attribute populates ariaHaspopup', async ({ page }) => {
    await loadBundle(page);

    const observed = await page.evaluate(async () => {
      const element = document.createElement('sui-button');
      element.id = 'haspopup';
      element.setAttribute('text', 'Open');
      element.setAttribute('aria-haspopup', 'menu');
      document.body.append(element);
      await new Promise((resolve) => setTimeout(resolve, 200));
      const inner = element.shadowRoot?.querySelector('[aria-haspopup]');
      return {
        onHost: (element as unknown as { ariaHaspopup?: unknown }).ariaHaspopup ?? null,
        onInner: inner?.getAttribute('aria-haspopup') ?? null
      };
    });

    expect(observed.onInner, 'aria-haspopup never reached the rendered button').toBe('menu');
  });

  test('F6: spellcheck="false" disables spellcheck on the native field', async ({ page }) => {
    await loadBundle(page);

    const spellcheck = await page.evaluate(async () => {
      const element = document.createElement('sui-input');
      element.id = 'spellcheck-probe';
      element.setAttribute('spellcheck', 'false');
      document.body.append(element);
      await new Promise((resolve) => setTimeout(resolve, 250));
      const field = element.shadowRoot?.querySelector('input, textarea');
      return {
        attr: field?.getAttribute('spellcheck') ?? null,
        prop: field instanceof HTMLElement ? field.spellcheck : null
      };
    });

    expect(spellcheck.prop, `rendered spellcheck attribute was ${spellcheck.attr}`).toBe(false);
  });

  test('F7: a property-assigned onerror callback runs alongside the DOM event', async ({
    page
  }) => {
    await loadBundle(page);

    // The wrapper passes oncomplete/onerror AFTER {...props}, so the child can
    // only ever call the wrapper's own handler. Declaring the props made them
    // assignable without making them reachable; the handler now forwards.
    // The error path is the one a test can trigger deterministically — a src
    // that 404s — where completion needs a real animation to finish.
    const outcome = await page.evaluate(async () => {
      const element = document.createElement('sui-lottie-player');
      element.id = 'lottie-probe';
      const seen = { callback: 0, domEvent: 0 };
      element.addEventListener('error', () => {
        seen.domEvent += 1;
      });
      Object.assign(element, {
        onerror: () => {
          seen.callback += 1;
        }
      });
      element.setAttribute('src', '/definitely-not-a-real-animation.json');
      document.body.append(element);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'onerror');
      return { ...seen, declared: typeof descriptor?.set === 'function' };
    });

    expect(outcome.declared, 'onerror is not a declared accessor').toBe(true);
    expect(outcome.domEvent, 'the DOM error event stopped firing').toBeGreaterThan(0);
    expect(outcome.callback, 'the property-assigned onerror callback never ran').toBeGreaterThan(0);
  });

  // 48 wrappers declare 77 props whose names — onclick, onkeydown, onselect,
  // onerror — are GlobalEventHandlers members already present on
  // HTMLElement.prototype, so a declared prop shadows the native handler
  // property. That looked like a large undiscovered defect until it was
  // measured: assigning `element.onclick` still results in the callback running
  // on a real click, because the component receives the same value as a prop and
  // invokes it from its own wiring. The mechanism changes, the outcome does not.
  // Recorded as a passing test so the convention is pinned rather than assumed,
  // and so a future change to that forwarding shows up here.
  test('F-extra: a declared on* prop still runs on a real user click', async ({ page }) => {
    await loadBundle(page);

    const outcome = await page.evaluate(async () => {
      const element = document.createElement('sui-button');
      element.id = 'handler-probe';
      element.setAttribute('text', 'Press me');
      document.body.append(element);
      await new Promise((resolve) => setTimeout(resolve, 250));

      const counter = { hits: 0 };
      Object.assign(element, {
        onclick: () => {
          counter.hits += 1;
        }
      });
      await new Promise((resolve) => setTimeout(resolve, 100));

      const inner = element.shadowRoot?.querySelector('button');
      inner?.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        isGlobalHandler: 'onclick' in HTMLElement.prototype,
        foundInner: inner instanceof HTMLButtonElement,
        hits: counter.hits
      };
    });

    expect(outcome.isGlobalHandler, 'onclick is a GlobalEventHandlers member').toBe(true);
    expect(outcome.foundInner, 'no inner button rendered to click').toBe(true);
    expect(outcome.hits, 'property-assigned onclick did not run on a real click').toBe(1);
  });
});
