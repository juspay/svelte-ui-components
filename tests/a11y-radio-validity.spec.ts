import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Radio no longer puts `aria-invalid` on its input: WAI-ARIA 1.2 supports that attribute on
 * `radiogroup` (and checkbox, textbox, ...) but not on `role="radio"`. These run the shipped
 * custom element in a real browser, in each engine, because three things only mean anything
 * there: the `aria-describedby` that has to resolve inside the shadow root, the group name and
 * description that have to resolve across it in the light DOM, and the keyboard behaviour that
 * has to survive the change.
 *
 * Driven through `<sui-radio>` rather than a demo route on purpose: the Svelte build renders the
 * same Radio.svelte (covered in jsdom by Radio.svelte.test.ts), and adding an error demo to
 * /components/radio would change the committed visual baseline for that route.
 */

const ERROR = 'Choose a payment method to continue.';

const loadCustomElements = async (page: Page): Promise<void> => {
  await page.goto('/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-radio') !== 'undefined', null, {
    timeout: 15_000
  });
};

const GROUP = `
  <div role="radiogroup" aria-labelledby="pay-label" aria-invalid="true" aria-describedby="pay-error">
    <span id="pay-label">Payment method</span>
    <sui-radio name="pay" value="card" text="Card"></sui-radio>
    <sui-radio name="pay" value="upi" text="UPI"></sui-radio>
    <div id="pay-error" role="alert">${ERROR}</div>
  </div>`;

const mount = async (page: Page, html: string): Promise<void> => {
  await page.evaluate((markup) => {
    document.body.innerHTML = markup;
  }, html);
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll('sui-radio')).every((el) =>
        el.shadowRoot?.querySelector('input')
      ),
    null,
    { timeout: 10_000 }
  );
};

test.describe('Radio validity semantics in a real browser', () => {
  test.beforeEach(async ({ page }) => {
    await loadCustomElements(page);
  });

  test('an invalid radio is described by its error and carries no unsupported aria-invalid', async ({
    page
  }) => {
    await mount(
      page,
      `<sui-radio name="pay" value="card" text="Card" error-message="${ERROR}"></sui-radio>`
    );

    const facts = await page.locator('sui-radio').evaluate((host) => {
      const root = host.shadowRoot;
      const input = root?.querySelector('input');
      const ids = (input?.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      return {
        ariaInvalid: input?.getAttribute('aria-invalid') ?? null,
        dataInvalid: input?.getAttribute('data-invalid') ?? null,
        described: ids.map((id) => root?.getElementById(id)?.textContent?.trim() ?? '__DANGLING__'),
        alertRole: root?.getElementById(ids[0] ?? '')?.getAttribute('role') ?? null
      };
    });

    expect(facts.ariaInvalid).toBeNull();
    expect(facts.dataInvalid).toBe('');
    expect(facts.described).toEqual([ERROR]);
    expect(facts.alertRole).toBe('alert');
    await expect(page.getByRole('radio', { name: 'Card' })).toHaveAccessibleDescription(ERROR);
  });

  test('a consumer radiogroup carries the group name, the invalid state and the description', async ({
    page
  }) => {
    await mount(page, GROUP);

    const group = page.getByRole('radiogroup', { name: 'Payment method' });
    await expect(group).toHaveAttribute('aria-invalid', 'true');
    await expect(group).toHaveAccessibleDescription(ERROR);

    // Each member keeps its own name from its label, inside its shadow root, and none of them
    // picks up the unsupported attribute.
    for (const name of ['Card', 'UPI']) {
      const radio = group.getByRole('radio', { name });
      await expect(radio).toBeAttached();
      await expect(radio).not.toHaveAttribute('aria-invalid', /.*/);
    }
  });

  test('keyboard selection across the group is unchanged', async ({ page }) => {
    await mount(page, GROUP);
    const group = page.getByRole('radiogroup', { name: 'Payment method' });
    const card = group.getByRole('radio', { name: 'Card' });
    const upi = group.getByRole('radio', { name: 'UPI' });

    await card.focus();
    await expect(card).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(upi).toBeFocused();
    await expect(upi).toBeChecked();
    await expect(card).not.toBeChecked();

    await page.keyboard.press('ArrowUp');
    await expect(card).toBeFocused();
    await expect(card).toBeChecked();
    await expect(upi).not.toBeChecked();
  });

  test('selection still reaches form data while the radio is invalid', async ({ page }) => {
    await mount(
      page,
      `<form id="probe">
         <sui-radio name="pay" value="card" text="Card" error-message="${ERROR}"></sui-radio>
         <sui-radio name="pay" value="upi" text="UPI" error-message="${ERROR}"></sui-radio>
       </form>`
    );

    // The native input is zero-size with pointer-events: none, so the click goes where a user's
    // does: on the label text. (Not the host's centre -- with an error showing, the host also
    // contains the message block, and that point can fall on the message instead of the label.)
    await page.getByText('UPI', { exact: true }).click();

    // The value reaches the form's data through ElementInternals a tick after the click.
    await expect
      .poll(() =>
        page.locator('#probe').evaluate((form) => {
          if (!(form instanceof HTMLFormElement)) {
            throw new Error('form missing');
          }
          return Array.from(new FormData(form).entries()).map(([key, value]) => [
            key,
            String(value)
          ]);
        })
      )
      .toEqual([['pay', 'upi']]);
  });

  test('the engine’s own accessibility tree reports the group, not the radios, as invalid', async ({
    page,
    browserName
  }) => {
    // CDP's Accessibility domain is Chromium-only; the other engines have no equivalent public
    // API here, so their coverage is the role/name/description assertions above.
    test.skip(browserName !== 'chromium', 'Accessibility.getFullAXTree is a Chromium DevTools API');

    // One member is flagged invalid on purpose: that is the input which used to be handed an
    // aria-invalid it has no role to carry, and so the one an engine would report as invalid.
    await mount(page, GROUP.replace('value="card"', 'value="card" invalid'));
    await expect(page.locator('sui-radio[value="card"]')).toHaveAttribute('invalid', '');
    const client = await page.context().newCDPSession(page);
    const { nodes } = await client.send('Accessibility.getFullAXTree');

    const valueOf = (node: (typeof nodes)[number], name: string): unknown =>
      node.properties?.find((property) => property.name === name)?.value.value;

    const radiogroup = nodes.find((node) => node.role?.value === 'radiogroup');
    const radios = nodes.filter((node) => node.role?.value === 'radio');

    expect(radiogroup).toBeDefined();
    expect(radiogroup?.name?.value).toBe('Payment method');
    expect(radiogroup ? valueOf(radiogroup, 'invalid') : null).toBe('true');
    expect(radios).toHaveLength(2);
    // Chromium reports an explicit invalid=false on nodes that are not invalid; the claim is that
    // no radio is ever reported invalid=true.
    for (const radio of radios) {
      expect(valueOf(radio, 'invalid')).not.toBe('true');
    }
  });
});
