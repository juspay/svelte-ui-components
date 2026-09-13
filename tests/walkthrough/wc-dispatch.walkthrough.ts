import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from '../support/hydrated.js';
import { beat, caption, highlight, step } from './support/narrate.js';

/**
 * Proves the two wc-dispatch gaps from the audit packet
 * (scratchpad/gaps/wc-dispatch.json): the callback-dispatch rule
 * (src/wc/dispatch.ts) and the presence-gated exception to it
 * (scripts/wc-parity/presence-gated-callbacks.ts).
 *
 * No route under src/routes/components/ renders the built custom-element
 * bundle -- every +page.svelte there uses the plain Svelte component -- and
 * the one page that does load compiled sui-* elements, static/wc-form-demo.html,
 * only exercises form participation. Rather than add a second static page
 * (this PR is already carrying too many new test-only files), this spec uses
 * the injection pattern tests/wc-motion-reachable.spec.ts and
 * tests/portal-shadow-styling.spec.ts already established: navigate to '/',
 * inject dist-wc/index.js, wait for the tags to upgrade, then build the demo
 * DOM itself. The #event-log panel it builds is real page content -- not
 * narrate.ts's aria-hidden caption overlay -- so asserting on it is legitimate.
 *
 * Every interaction is a genuine Playwright click, never a synthesised
 * dispatchEvent: portal-shadow-styling.spec.ts's header records that Svelte 5
 * delegates onclick to the root, so a synthetic MouseEvent skips the delegated
 * handler entirely and proves nothing. Where this spec does assign a callback
 * property directly (simulating a consumer's own `el.oneditclick = fn`), that
 * is the exact action a walkthrough of presence-gating must show -- it is
 * distinct from faking the click that follows it, which is always real.
 *
 * Sample chosen (two gaps, not all 97 wrappers / 31 gated props):
 *  - sui-table:onsort and sui-pill:ondismiss for the bare-dispatch gap -- two
 *    different components and two different callback arities (Table's onsort
 *    carries a named 2-key detail, Pill's ondismiss carries none), both
 *    already proven in isolation by dispatch-table-task-list-toggle.test.ts
 *    and dispatch-pagination-pill-radio.test.ts, so no event name here is
 *    invented.
 *  - sui-gallery:oneditclick for the presence-gated gap -- the packet's own
 *    illustrative example, one of Gallery's three gated callbacks, and the
 *    same control tests/wc-presence-gated-callbacks.spec.ts already proves
 *    through an invisible page.evaluate() harness that nothing ever records.
 *    This spec drives the identical behaviour with real clicks so it can
 *    actually be watched.
 *
 * Deliberately NOT sampled: sui-table:onrowclick, even though the packet's own
 * scenario text used it as a "listener-only" bare-dispatch example. It is
 * wrong for that: PRESENCE_GATED_CALLBACKS lists 'sui-table:onrowclick', and
 * dispatch-table-task-list-toggle.test.ts proves a row stays non-interactive
 * until onrowclick is assigned -- so it cannot demonstrate "addEventListener
 * alone is enough", and onsort (Table's one plain, non-gated dispatcher) is
 * used in its place. Also not sampled: the collision-exception escape hatch
 * (sui-lottie-player:onerror) -- it is not one of the two behaviours this
 * file was assigned, and stays covered by dispatch-integration.test.ts only.
 */

const loadBundle = async (page: Page): Promise<void> => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(
    () =>
      Boolean(customElements.get('sui-table')) &&
      Boolean(customElements.get('sui-pill')) &&
      Boolean(customElements.get('sui-gallery')),
    null,
    { timeout: 15_000 }
  );
};

const LOG_PANEL_STYLE = [
  'position:fixed',
  'right:16px',
  'top:16px',
  'width:320px',
  'max-height:70vh',
  'overflow:auto',
  'padding:12px 16px',
  'border-radius:10px',
  'background:#111827',
  'color:#f9fafb',
  'font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace',
  'z-index:2147483000',
  'box-shadow:0 6px 24px rgba(0,0,0,.35)'
].join(';');

test.describe('wc-dispatch: bare-named CustomEvents reach a listener-only consumer', () => {
  test('sui-table (onsort) and sui-pill (ondismiss) fire for addEventListener alone, with no JS property ever assigned', async ({
    page
  }) => {
    await loadBundle(page);

    // Builds the log panel plus both demo elements, and attaches ONLY
    // addEventListener('sort'/'dismiss') -- .onsort and .ondismiss are never
    // assigned, which is the entire gap this test proves. Everything a
    // listener needs lives inside this one callback: page.evaluate()
    // stringifies and runs it in the browser, so it cannot close over
    // anything declared outside itself.
    await page.evaluate(
      ({ panelStyle }) => {
        const panel = document.createElement('div');
        panel.id = 'event-log';
        panel.style.cssText = panelStyle;
        const title = document.createElement('div');
        title.textContent = 'addEventListener log';
        title.style.cssText = 'font:600 13px/1.4 ui-sans-serif,system-ui;margin-bottom:8px;';
        const list = document.createElement('ol');
        list.id = 'event-log-list';
        list.style.cssText = 'margin:0;padding-left:18px;';
        panel.append(title, list);
        document.body.append(panel);

        const wrap = document.createElement('div');
        wrap.style.cssText =
          'max-width:420px;padding:24px;display:flex;flex-direction:column;gap:16px;';
        document.body.append(wrap);

        const table = document.createElement('sui-table');
        Reflect.set(table, 'tableHeaders', ['Name', 'Role']);
        Reflect.set(table, 'tableData', [
          ['Ada Lovelace', 'Engineer'],
          ['Grace Hopper', 'Admiral']
        ]);
        wrap.append(table);

        const pill = document.createElement('sui-pill');
        Reflect.set(pill, 'text', 'Active');
        Reflect.set(pill, 'dismissible', true);
        wrap.append(pill);

        // detail can hold values only, never an Event -- neither onsort's nor
        // ondismiss's arguments carry one, but this stays symmetric with the
        // presence-gated test's own recorder rather than a narrower copy.
        const summarize = (detail: unknown): unknown => {
          if (detail === null || typeof detail !== 'object') {
            return detail;
          }
          if (detail instanceof Event) {
            return `[${detail.constructor.name}]`;
          }
          const out: Record<string, unknown> = {};
          for (const key of Object.keys(detail)) {
            const value = Reflect.get(detail, key);
            out[key] = value instanceof Event ? `[${value.constructor.name}]` : value;
          }
          return out;
        };
        const record = (event: Event): void => {
          if (!(event instanceof CustomEvent)) {
            return;
          }
          const item = document.createElement('li');
          item.dataset.logEvent = event.type;
          item.dataset.composed = String(event.composed);
          item.dataset.bubbles = String(event.bubbles);
          item.dataset.detail = JSON.stringify(summarize(event.detail));
          item.textContent = `${event.type} ${item.dataset.detail}`;
          document.getElementById('event-log-list')?.append(item);
        };

        table.addEventListener('sort', record);
        pill.addEventListener('dismiss', record);
      },
      { panelStyle: LOG_PANEL_STYLE }
    );

    const tableEl = page.locator('sui-table');
    const pillEl = page.locator('sui-pill');

    // Never touched: proves the events below can only have come from the
    // dispatcher inside dispatch.ts, not from some side effect of a property
    // that was actually set.
    const onsortBefore: unknown = await tableEl.evaluate((el) => Reflect.get(el, 'onsort'));
    const ondismissBefore: unknown = await pillEl.evaluate((el) => Reflect.get(el, 'ondismiss'));
    expect(onsortBefore).toBeUndefined();
    expect(ondismissBefore).toBeUndefined();

    await caption(
      page,
      'Both elements below have ONLY addEventListener attached -- .onsort and .ondismiss were never assigned.'
    );

    await step(page, 'Click "Sort by Name" on sui-table.', async () => {
      await tableEl.getByRole('button', { name: 'Sort by Name' }).click();
    });
    await highlight(page.locator('#event-log-list li').last());

    const sortEntry = page.locator('#event-log-list li').nth(0);
    await expect(sortEntry).toHaveAttribute('data-log-event', 'sort');
    await expect(sortEntry).toHaveAttribute('data-composed', 'true');
    await expect(sortEntry).toHaveAttribute('data-bubbles', 'true');
    await expect(sortEntry).toHaveAttribute('data-detail', '{"columnIndex":0,"direction":"asc"}');

    await step(page, 'Click the Dismiss control on sui-pill.', async () => {
      await pillEl.getByRole('button', { name: 'Dismiss' }).click();
    });
    await highlight(page.locator('#event-log-list li').last());

    const dismissEntry = page.locator('#event-log-list li').nth(1);
    await expect(dismissEntry).toHaveAttribute('data-log-event', 'dismiss');
    await expect(dismissEntry).toHaveAttribute('data-composed', 'true');
    await expect(dismissEntry).toHaveAttribute('data-bubbles', 'true');
    // ondismiss takes no arguments, so eventDetail() (dispatch.ts) carries no
    // detail key at all -- CustomEvent.detail then defaults to null.
    await expect(dismissEntry).toHaveAttribute('data-detail', 'null');

    const onsortAfter: unknown = await tableEl.evaluate((el) => Reflect.get(el, 'onsort'));
    const ondismissAfter: unknown = await pillEl.evaluate((el) => Reflect.get(el, 'ondismiss'));
    expect(onsortAfter).toBeUndefined();
    expect(ondismissAfter).toBeUndefined();

    await expect(page.locator('#event-log-list li')).toHaveCount(2);
    await beat(page);
  });
});

test.describe('wc-dispatch: a presence-gated callback is absent until the consumer assigns it', () => {
  test('sui-gallery renders no Edit control -- and fires nothing -- until oneditclick is actually assigned, live, with no reload', async ({
    page
  }) => {
    await loadBundle(page);

    await page.evaluate(
      ({ panelStyle }) => {
        const panel = document.createElement('div');
        panel.id = 'event-log';
        panel.style.cssText = panelStyle;
        const title = document.createElement('div');
        title.textContent = 'addEventListener log';
        title.style.cssText = 'font:600 13px/1.4 ui-sans-serif,system-ui;margin-bottom:8px;';
        const list = document.createElement('ol');
        list.id = 'event-log-list';
        list.style.cssText = 'margin:0;padding-left:18px;';
        panel.append(title, list);
        document.body.append(panel);

        const wrap = document.createElement('div');
        wrap.style.cssText =
          'max-width:360px;padding:24px;display:flex;flex-direction:column;gap:12px;';
        document.body.append(wrap);

        const gallery = document.createElement('sui-gallery');
        Reflect.set(gallery, 'images', [
          { src: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', alt: 'one' }
        ]);
        wrap.append(gallery);

        const wireButton = document.createElement('button');
        wireButton.id = 'wire-edit';
        wireButton.type = 'button';
        wireButton.textContent = 'Wire edit handler';
        wireButton.style.cssText =
          'align-self:flex-start;padding:8px 14px;border-radius:8px;border:1px solid #d1d5db;background:#fff;cursor:pointer;';
        wireButton.addEventListener('click', () => {
          // This is the behaviour under test: assigning the real JS callback,
          // after mount, with no reload -- not attaching another listener,
          // which was already done below at page load.
          Reflect.set(gallery, 'oneditclick', () => {
            document.body.dataset.editCallbackCalled = 'true';
          });
        });
        wrap.append(wireButton);

        const summarize = (detail: unknown): unknown => {
          if (detail === null || typeof detail !== 'object') {
            return detail;
          }
          if (detail instanceof Event) {
            return `[${detail.constructor.name}]`;
          }
          const out: Record<string, unknown> = {};
          for (const key of Object.keys(detail)) {
            const value = Reflect.get(detail, key);
            out[key] = value instanceof Event ? `[${value.constructor.name}]` : value;
          }
          return out;
        };
        const record = (event: Event): void => {
          if (!(event instanceof CustomEvent)) {
            return;
          }
          const item = document.createElement('li');
          item.dataset.logEvent = event.type;
          item.dataset.composed = String(event.composed);
          item.dataset.bubbles = String(event.bubbles);
          item.dataset.detail = JSON.stringify(summarize(event.detail));
          item.textContent = `${event.type} ${item.dataset.detail}`;
          document.getElementById('event-log-list')?.append(item);
        };

        // Attached from the very start -- before oneditclick is ever assigned,
        // and well before the "Wire edit handler" button exists to assign it.
        gallery.addEventListener('editclick', record);
      },
      { panelStyle: LOG_PANEL_STYLE }
    );

    const galleryEl = page.locator('sui-gallery');
    const editButton = galleryEl.getByRole('button', { name: /^Edit image/ });

    const oneditclickBefore: unknown = await galleryEl.evaluate((el) =>
      Reflect.get(el, 'oneditclick')
    );
    expect(oneditclickBefore).toBeUndefined();

    await caption(
      page,
      'addEventListener("editclick") has been attached since page load -- but no Edit button exists yet.'
    );
    // The observable difference this gap is about: a listener attached from
    // the start produced nothing to click, not merely nothing fired.
    await expect(editButton).toHaveCount(0);
    await highlight(galleryEl);

    await step(
      page,
      'Click "Wire edit handler" -- assigns el.oneditclick, no reload.',
      async () => {
        await page.locator('#wire-edit').click();
      }
    );

    await expect(editButton).toHaveCount(1);
    const oneditclickAfter: unknown = await galleryEl.evaluate(
      (el) => typeof Reflect.get(el, 'oneditclick')
    );
    expect(oneditclickAfter).toBe('function');

    await step(page, 'Click Edit -- now that a callback exists, editclick fires too.', async () => {
      await editButton.click();
    });
    await highlight(page.locator('#event-log-list li').last());

    const editEntry = page.locator('#event-log-list li').first();
    await expect(page.locator('#event-log-list li')).toHaveCount(1);
    await expect(editEntry).toHaveAttribute('data-log-event', 'editclick');
    await expect(editEntry).toHaveAttribute('data-composed', 'true');
    await expect(editEntry).toHaveAttribute('data-bubbles', 'true');
    // "[PointerEvent]", not "[MouseEvent]": Chromium delivers a genuine click
    // as a PointerEvent (which extends MouseEvent), and a synthesised
    // dispatchEvent(new MouseEvent(...)) would have serialised differently --
    // this exact string is itself evidence editButton.click() was a real click.
    await expect(editEntry).toHaveAttribute('data-detail', '{"index":0,"event":"[PointerEvent]"}');

    // dispatch.ts's own guarantee -- "calling the consumer's own callback is
    // untouched by any of this" -- checked here rather than only trusted: the
    // DOM event and the assigned JS callback both fired from the one click.
    await expect(page.locator('body')).toHaveAttribute('data-edit-callback-called', 'true');

    await beat(page);
  });
});
