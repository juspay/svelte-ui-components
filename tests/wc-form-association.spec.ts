import { expect, test } from '@playwright/test';

/**
 * The two builds diverged at the form boundary. `<Input name="email">` in
 * Svelte renders a real `<input name>` the surrounding `<form>` collects; the
 * matching `<sui-input name="email">` renders that input inside a shadow root,
 * where the form cannot see it. It contributed nothing to `FormData`,
 * `form.reset()` left it alone, and `form.checkValidity()` never consulted it.
 *
 * The fix is `formAssociated` + `ElementInternals` (src/wc/form-associated.ts),
 * chosen over a hidden input because only it also delivers reset and constraint
 * validation.
 *
 * This has to run against the custom-element build in a real browser: jsdom
 * implements neither `ElementInternals` form association nor `formResetCallback`,
 * so there is no unit-test equivalent that would mean anything.
 */

const loadCustomElements = async (page: import('@playwright/test').Page): Promise<void> => {
  await page.goto('/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-input') !== 'undefined', null, {
    timeout: 15_000
  });
};

/** Builds a form of `<sui-*>` controls and returns what a submit would collect. */
const collect = (
  page: import('@playwright/test').Page,
  html: string,
  mutate?: string
): Promise<Record<string, string[]>> =>
  page.evaluate(
    async ({ html, mutate }) => {
      document.body.innerHTML = `<form id="probe">${html}</form>`;
      const form = document.querySelector<HTMLFormElement>('#probe');
      if (form === null) {
        throw new Error('form missing');
      }
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (typeof mutate === 'string' && mutate.length > 0) {
        new Function('form', mutate)(form);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      const data = new FormData(form);
      const out: Record<string, string[]> = {};
      for (const [key, value] of data.entries()) {
        (out[key] ??= []).push(String(value));
      }
      return out;
    },
    { html, mutate }
  );

test.describe('custom elements take part in their form', () => {
  test.beforeEach(async ({ page }) => {
    await loadCustomElements(page);
  });

  test('a text input contributes its value under its name', async ({ page }) => {
    const data = await collect(page, `<sui-input name="email" value="a@b.co"></sui-input>`);
    expect(data).toEqual({ email: ['a@b.co'] });
  });

  test('a disabled control contributes nothing', async ({ page }) => {
    const data = await collect(
      page,
      `<sui-input name="email" value="a@b.co" disable></sui-input>
       <sui-checkbox name="terms" value="accepted" checked disabled></sui-checkbox>`
    );
    expect(data).toEqual({});
  });

  test('a checkbox submits only while checked, and defaults to "on"', async ({ page }) => {
    const checked = await collect(
      page,
      `<sui-checkbox name="terms" value="accepted" checked></sui-checkbox>
       <sui-checkbox name="updates" checked></sui-checkbox>
       <sui-checkbox name="ignored"></sui-checkbox>`
    );
    // `updates` carries no value attribute: the platform submits the string
    // "on" for a checked valueless checkbox, and so does this.
    expect(checked).toEqual({ terms: ['accepted'], updates: ['on'] });
  });

  test('a switch behaves like the checkbox it is built from', async ({ page }) => {
    const data = await collect(
      page,
      `<sui-toggle name="notifications" value="on" checked></sui-toggle>
       <sui-toggle name="silent" value="on"></sui-toggle>`
    );
    expect(data).toEqual({ notifications: ['on'] });
  });

  /**
   * Regression coverage for the shadow-root fragmentation defect: each
   * `<sui-radio>` renders its native input inside its OWN shadow root, so the
   * browser's by-`name` grouping -- which only ever looks within one DOM tree
   * -- sees two independent one-member groups, not one two-member group.
   *
   * The version of this test that shipped before this fix set `selected-value`
   * on both elements directly and never clicked anything, so it passed
   * whether or not the group actually behaved like a group. It must CLICK to
   * mean anything -- on the host, not the shadow-rooted `<input>` itself: that
   * input is visually hidden with `pointer-events: none` (its enclosing
   * `<label>` is what the whole visible surface is), so a real user's click
   * lands on the host element, exactly like `page.locator(...).click()` below.
   */
  test('a radio group contributes exactly one entry, the selected one', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `<form id="probe">
        <sui-radio name="pay" value="card" test-id="r1"></sui-radio>
        <sui-radio name="pay" value="cod" test-id="r2"></sui-radio>
      </form>`;
    });
    await page.waitForTimeout(350);

    const innerChecked = (testId: string) =>
      page.evaluate((id) => {
        const host = document.querySelector(`sui-radio[test-id="${id}"]`);
        const input = host?.shadowRoot?.querySelector('input');
        return input instanceof HTMLInputElement ? input.checked : null;
      }, testId);

    const formEntries = () =>
      page.evaluate(() => {
        const form = document.querySelector<HTMLFormElement>('#probe');
        if (form === null) {
          return null;
        }
        const out: Record<string, string[]> = {};
        for (const [key, value] of new FormData(form).entries()) {
          (out[key] ??= []).push(String(value));
        }
        return out;
      });

    await page.locator('sui-radio[test-id="r1"]').click();
    await page.waitForTimeout(250);
    expect(await innerChecked('r1')).toBe(true);
    expect(await innerChecked('r2')).toBe(false);
    expect(await formEntries()).toEqual({ pay: ['card'] });

    // Clicking the second radio must deselect the first -- exactly what two
    // separate shadow roots do not do on their own, which is the bug this
    // rewrite exists to catch.
    await page.locator('sui-radio[test-id="r2"]').click();
    await page.waitForTimeout(250);
    expect(await innerChecked('r1')).toBe(false);
    expect(await innerChecked('r2')).toBe(true);
    expect(await formEntries()).toEqual({ pay: ['cod'] });
  });

  test('a slider contributes its numeric value', async ({ page }) => {
    const data = await collect(page, `<sui-slider name="volume" value="41"></sui-slider>`);
    expect(data).toEqual({ volume: ['41'] });
  });

  test('a programmatic assignment reaches the form, not just the element', async ({ page }) => {
    const data = await collect(
      page,
      `<sui-input name="email" value="old@b.co"></sui-input>`,
      `form.querySelector('sui-input').value = 'new@b.co';`
    );
    expect(data).toEqual({ email: ['new@b.co'] });
  });

  test('form.reset() restores the control default', async ({ page }) => {
    const data = await collect(
      page,
      `<sui-input name="email" value="default@b.co"></sui-input>
       <sui-checkbox name="terms" value="accepted"></sui-checkbox>`,
      `form.querySelector('sui-input').value = 'typed@b.co';
       form.querySelector('sui-checkbox').checked = true;
       form.reset();`
    );
    // Reset must undo both directions: the changed text goes back, and the
    // box that was switched on goes back to contributing nothing.
    expect(data).toEqual({ email: ['default@b.co'] });
  });

  test('constraint validation sees a required control', async ({ page }) => {
    const state = await page.evaluate(async () => {
      document.body.innerHTML = `<form id="probe">
        <sui-checkbox name="terms" value="accepted" required></sui-checkbox>
      </form>`;
      const form = document.querySelector<HTMLFormElement>('#probe');
      if (form === null) {
        throw new Error('fixture missing');
      }
      const box = form.querySelector('sui-checkbox');
      if (box === null) {
        throw new Error('control missing');
      }
      await new Promise((resolve) => setTimeout(resolve, 350));
      const blocked = form.checkValidity();
      const matchesInvalid = box.matches(':invalid');
      (box as unknown as { checked: boolean }).checked = true;
      await new Promise((resolve) => setTimeout(resolve, 250));
      return {
        blockedWhileEmpty: blocked,
        matchesInvalid,
        allowedOnceChecked: form.checkValidity(),
        matchesValid: box.matches(':valid')
      };
    });
    expect(state.blockedWhileEmpty).toBe(false);
    expect(state.matchesInvalid).toBe(true);
    expect(state.allowedOnceChecked).toBe(true);
    expect(state.matchesValid).toBe(true);
  });

  test('the element exposes the form-control surface a consumer expects', async ({ page }) => {
    const api = await page.evaluate(async () => {
      document.body.innerHTML = `<form id="probe"><sui-input name="email" value="x"></sui-input></form>`;
      await new Promise((resolve) => setTimeout(resolve, 350));
      const el = document.querySelector('sui-input') as unknown as {
        form: HTMLFormElement | null;
        name: string | null;
        willValidate: boolean;
        checkValidity: () => boolean;
      };
      return {
        hasForm: el.form?.id ?? null,
        name: el.name,
        willValidate: el.willValidate,
        checkValidity: el.checkValidity()
      };
    });
    expect(api.hasForm).toBe('probe');
    expect(api.name).toBe('email');
    expect(api.willValidate).toBe(true);
    expect(api.checkValidity).toBe(true);
  });

  /**
   * `#formValue()` prefers the inner native control and falls back to reading
   * the host's own props. The fallback is the pre-fix behaviour, and it carries
   * the pre-fix defect: a component that flips its own state leaves the host
   * prop at whatever the markup said. It exists for a registered control that
   * renders no native control at all.
   *
   * No registered control is in that position today -- each renders exactly one
   * unconditional `<input>` -- but "I read the source and it looked
   * unreachable" is the kind of claim that quietly stops being true. This
   * asserts it instead, so a future wrapper over a control with no native
   * element fails here rather than silently taking the stale-prop path.
   */
  test('every registered control renders the native control the form value is read from', async ({
    page
  }) => {
    const found = await page.evaluate(async () => {
      document.body.innerHTML = `<form id="probe">
        <sui-input name="a" value="x"></sui-input>
        <sui-checkbox name="b" checked="true"></sui-checkbox>
        <sui-toggle name="c" checked="true"></sui-toggle>
        <sui-radio name="d" value="one" selectedValue="one"></sui-radio>
        <sui-slider name="e" value="4"></sui-slider>
      </form>`;
      await new Promise((resolve) => setTimeout(resolve, 400));
      const tags = ['sui-input', 'sui-checkbox', 'sui-toggle', 'sui-radio', 'sui-slider'];
      const out: Record<string, string | null> = {};
      for (const tag of tags) {
        const host = document.querySelector(tag);
        const inner = host?.shadowRoot?.querySelector('input, textarea, select') ?? null;
        out[tag] = inner === null ? null : inner.tagName.toLowerCase();
      }
      return out;
    });

    expect(found).toEqual({
      'sui-input': 'input',
      'sui-checkbox': 'input',
      'sui-toggle': 'input',
      'sui-radio': 'input',
      'sui-slider': 'input'
    });
  });

  /**
   * The last two controls to declare a name and submit nothing.
   *
   * Both were caught by rewriting the probe, not by a person: the old one
   * closed on "at least five wrappers declare formAssociated", so the two
   * that did not were invisible behind a threshold with no denominator.
   */
  test('a rating group contributes its value, and blocks submit while required and unrated', async ({
    page
  }) => {
    const rated = await collect(
      page,
      `<sui-rating-group name="score" value="4"></sui-rating-group>`
    );
    expect(rated).toEqual({ score: ['4'] });

    // `required` has to reach constraint validation too, not just FormData --
    // that is the half a hidden input could never have delivered.
    const blocks = await page.evaluate(async () => {
      document.body.innerHTML =
        '<form id="v"><sui-rating-group name="score" required></sui-rating-group></form>';
      await new Promise((resolve) => setTimeout(resolve, 350));
      return document.querySelector<HTMLFormElement>('#v')?.checkValidity();
    });
    expect(blocks, 'an unrated required group must fail validity').toBe(false);
  });

  test('a multi-select combobox contributes one entry per selection', async ({ page }) => {
    // This is what `values` exists for. A single setFormValue(string) cannot
    // express several entries, so the mixin hands `setFormValue` a FormData --
    // the same shape a native `<select multiple>` submits.
    const data = await collect(
      page,
      `<sui-combobox name="tags" multiple></sui-combobox>`,
      // `items` as well as `selected`: a multi-select renders a Pill per
      // selection and resolves its label out of `items`, so selecting ids that
      // are not in the list is not a leaner fixture, it is an invalid one.
      `const box = form.querySelector('sui-combobox');
       box.items = [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }, { id: 'c', label: 'Gamma' }];
       box.selected = ['a', 'c'];`
    );
    expect(data).toEqual({ tags: ['a', 'c'] });
  });

  test('a select contributes one entry per selection, across the shadow boundary', async ({
    page
  }) => {
    // The Svelte build submits through one hidden input per selected id. Inside
    // <sui-select> those inputs are in a shadow root, which a form cannot see across,
    // so the element declared `name` and `value` and contributed nothing. This is the
    // ElementInternals path doing what the hidden inputs do in the light DOM.
    const data = await collect(
      page,
      `<sui-select name="colors" multiple></sui-select>`,
      `const select = form.querySelector('sui-select');
       select.items = [{ id: 'red', label: 'Red' }, { id: 'blue', label: 'Blue' }, { id: 'green', label: 'Green' }];
       select.value = ['red', 'green'];`
    );
    expect(data).toEqual({ colors: ['red', 'green'] });
  });

  test('a single-selection select contributes exactly one entry', async ({ page }) => {
    const data = await collect(
      page,
      `<sui-select name="fruit"></sui-select>`,
      `const select = form.querySelector('sui-select');
       select.items = [{ id: 'apple', label: 'Apple' }, { id: 'pear', label: 'Pear' }];
       select.value = ['apple'];`
    );
    expect(data).toEqual({ fruit: ['apple'] });
  });

  test('a searchable select with nothing chosen submits nothing, not its search text', async ({
    page
  }) => {
    // Why `innerControlIsNotTheValue` is set, and the only case that exercises it:
    // `#formValue()` returns on the `values` path whenever the selection is non-empty,
    // so the flag is consulted only when nothing is selected. Without it the mixin
    // falls through to the inner control -- a searchable Select owns a real text input
    // in its shadow root -- and the form collects whatever was typed as if it were the
    // user's choice.
    //
    // The typing is scheduled rather than awaited: `collect` runs `mutate` through
    // `new Function`, which is not async, and then waits 250ms before reading FormData,
    // so a short timeout lands inside that window.
    const data = await collect(
      page,
      `<sui-select name="fruit" searchable></sui-select>`,
      `const select = form.querySelector('sui-select');
       select.items = [{ id: 'apple', label: 'Apple' }, { id: 'pear', label: 'Pear' }];
       select.value = [];
       select.open = true;
       setTimeout(() => {
         const search = select.shadowRoot.querySelector('input.select-search');
         if (search === null) { throw new Error('search input not rendered'); }
         search.value = 'appl';
         search.dispatchEvent(new Event('input', { bubbles: true }));
       }, 60);`
    );
    expect(data).toEqual({});
  });

  test('a single-select combobox still contributes just its value', async ({ page }) => {
    // The fall-through has to stay intact: `selected` is empty here, so the
    // control must behave exactly as it did before `values` existed.
    const data = await collect(page, `<sui-combobox name="tag" value="b"></sui-combobox>`);
    expect(data).toEqual({ tag: ['b'] });
  });
});
