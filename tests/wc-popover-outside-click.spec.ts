import { expect, test } from '@playwright/test';

/**
 * A suspected bug where the panel closes again in the same click that opened
 * it, not yet confirmed directly.
 *
 * Two earlier versions of this probe were wrong in ways worth recording:
 * polling after the click cannot distinguish "never opened" from "opened and
 * closed in the same tick", and `element.click()` dispatches only a click event
 * -- a handler bound to pointerdown or mousedown never runs, so the control
 * looks dead when the probe simply never spoke to it.
 *
 * This drives a REAL mouse through Playwright, which sends the full pointer
 * sequence and pierces open shadow roots, and watches the whole interaction
 * with a MutationObserver so a transient open is visible.
 */
const PANEL =
  '[role="listbox"], [role="dialog"], [role="grid"], .select-dropdown, .combobox-dropdown, .color-picker-panel, .drp-panel, .drp-popover';

const CASES = [
  {
    tag: 'sui-select',
    trigger: '.select-trigger',
    props: {
      items: [
        { id: 'a', label: 'Apple' },
        { id: 'b', label: 'Banana' }
      ]
    }
  },
  {
    tag: 'sui-combobox',
    trigger: 'input',
    props: {
      items: [
        { id: 'a', label: 'Apple' },
        { id: 'b', label: 'Banana' }
      ]
    }
  },
  { tag: 'sui-color-picker', trigger: 'button', props: {} },
  { tag: 'sui-date-range-picker', trigger: 'button', props: {} }
];

for (const { tag, trigger, props } of CASES) {
  test(`${tag}: a real click opens the panel and leaves it open`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction((t) => typeof customElements.get(t) !== 'undefined', tag, {
      timeout: 20_000
    });

    await page.evaluate(
      ({ tag, props }) => {
        document.body.innerHTML = `<div style="padding:60px"></div>`;
        const host = document.createElement(tag);
        for (const [k, v] of Object.entries(props)) {
          (host as unknown as Record<string, unknown>)[k] = v;
        }
        document.body.firstElementChild!.append(host);
      },
      { tag, props }
    );
    await page.waitForTimeout(600);

    // Arm the observer before the click so a same-tick open/close is caught.
    await page.evaluate(
      ({ tag, PANEL }) => {
        const root = document.querySelector(tag)!.shadowRoot!;
        (window as unknown as Record<string, unknown>).__sawPanel = false;
        const obs = new MutationObserver(() => {
          if (root.querySelectorAll(PANEL).length > 0) {
            (window as unknown as Record<string, unknown>).__sawPanel = true;
          }
        });
        obs.observe(root, { childList: true, subtree: true, attributes: true });
      },
      { tag, PANEL }
    );

    // A real mouse click, piercing the open shadow root.
    await page.locator(`${tag} ${trigger}`).first().click({ timeout: 5000 });
    await page.waitForTimeout(500);

    const res = await page.evaluate(
      ({ tag, PANEL }) => {
        const root = document.querySelector(tag)!.shadowRoot!;
        return {
          sawPanel: (window as unknown as Record<string, boolean>).__sawPanel === true,
          openNow: root.querySelectorAll(PANEL).length
        };
      },
      { tag, PANEL }
    );

    const verdict =
      res.sawPanel && res.openNow === 0
        ? 'OPENED THEN CLOSED — closed itself right after opening'
        : res.openNow > 0
          ? 'opens and stays open'
          : 'never opened';
    console.log(`SD1 ${tag} :: ${verdict} :: ${JSON.stringify(res)}`);
    expect(errors, 'no page errors').toEqual([]);
    expect(res.openNow, `${tag} panel should be open after a real click`).toBeGreaterThan(0);
  });
}
