import { expect, test } from '@playwright/test';

/**
 * The field-description contract, for the six controls that lacked it:
 * ChipInput, SplitInput, Combobox, ColorPicker, Choicebox and InputButton.
 *
 * `tests/field-description-contract.spec.ts` covers the same contract for
 * Checkbox, whose description sits on the control itself. These six are here
 * because five of them delegate their focusable control to `Input` or `Button`
 * and so describe a `role="group"` around it instead — a weaker placement that
 * still has to satisfy every other rule, and the one most likely to be got wrong
 * by pointing at an id that is never rendered.
 *
 * As in that file, these read the RESOLVED description rather than the
 * attribute: `aria-describedby="x-error"` pointing at an element that is not in
 * the DOM satisfies any attribute assertion and announces nothing.
 */

/** The description a real accessibility client would compute for `selector`. */
const describedText = async (
  page: import('@playwright/test').Page,
  selector: string
): Promise<string | null> =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => {
      const described = el.closest('[aria-describedby]');
      if (described === null) {
        return null;
      }
      const ids = (described.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      if (ids.length === 0) {
        return null;
      }
      const root = described.getRootNode();
      const lookup = (id: string): Element | null =>
        root instanceof Document || root instanceof ShadowRoot ? root.getElementById(id) : null;
      const resolved = ids.map((id) => lookup(id)?.textContent?.trim() ?? null);
      // A missing id resolves to null, which is what a reader announces: nothing.
      return resolved.some((text) => text === null) ? '__DANGLING__' : resolved.join(' ');
    });

const invalidOn = async (
  page: import('@playwright/test').Page,
  selector: string
): Promise<string | null> =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => el.closest('[aria-describedby]')?.getAttribute('aria-invalid') ?? null);

type Fixture = {
  readonly name: string;
  readonly route: string;
  readonly scope: string;
  readonly error: string;
  readonly info: string;
};

const FIXTURES: readonly Fixture[] = [
  {
    name: 'ChipInput',
    route: '/components/chip-input',
    scope: 'chipinput',
    error: 'At most five tags.',
    info: 'Press Enter to add.'
  },
  {
    name: 'SplitInput',
    route: '/components/split-input',
    scope: 'splitinput',
    error: 'That code is not right.',
    info: 'Check your messages.'
  },
  {
    name: 'Combobox',
    route: '/components/combobox',
    scope: 'combobox',
    error: 'Choose a fruit from the list.',
    info: 'Type to filter.'
  },
  {
    name: 'ColorPicker',
    route: '/components/color-picker',
    scope: 'colorpicker',
    error: 'Not enough contrast on white.',
    info: 'Used for buttons and links.'
  },
  {
    name: 'Choicebox',
    route: '/components/choicebox',
    scope: 'choicebox',
    error: 'Pick a plan to continue.',
    info: 'You can change this later.'
  },
  {
    name: 'InputButton',
    route: '/components/input-button',
    scope: 'inputbutton',
    error: 'That address was rejected.',
    info: 'We only email about outages.'
  }
];

for (const fixture of FIXTURES) {
  test.describe(`${fixture.name} describes its field`, () => {
    const described = `[data-pw="${fixture.scope}-described"]`;
    const infoOnly = `[data-pw="${fixture.scope}-info-only"]`;
    const undescribed = `[data-pw="${fixture.scope}-undescribed"]`;

    test.beforeEach(async ({ page }) => {
      await page.goto(fixture.route);
    });

    test('error and helper text both reach the accessibility tree, in reading order', async ({
      page
    }) => {
      expect(await describedText(page, described)).toBe(`${fixture.error} ${fixture.info}`);
      expect(await invalidOn(page, described)).toBe('true');
    });

    test('helper text alone describes the control without marking it invalid', async ({ page }) => {
      expect(await describedText(page, infoOnly)).toBe(fixture.info);
      // The most common way to get this wrong: a control that always says invalid.
      expect(await invalidOn(page, infoOnly)).toBeNull();
    });

    test('a control with no message references nothing at all', async ({ page }) => {
      // Not "references an empty string" and not "references a missing id".
      expect(await describedText(page, undescribed)).toBeNull();
    });

    test('no instance points at an id that does not exist', async ({ page }) => {
      for (const selector of [described, infoOnly, undescribed]) {
        expect(
          await describedText(page, selector),
          `${selector} has a dangling reference`
        ).not.toBe('__DANGLING__');
      }
    });

    test('the error element is an alert, so it is announced when it appears', async ({ page }) => {
      await expect(page.getByTestId(`${fixture.scope}-described-error-message`)).toHaveAttribute(
        'role',
        'alert'
      );
    });

    test('two instances on the page get distinct ids', async ({ page }) => {
      const ids = await page
        .locator(`[data-pw="${fixture.scope}-field-contract"] [aria-describedby]`)
        .evaluateAll((els) => els.map((el) => el.getAttribute('aria-describedby')));

      expect(ids.length).toBeGreaterThanOrEqual(2);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
}
