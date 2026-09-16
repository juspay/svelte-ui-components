import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { gotoHydrated } from '../support/hydrated.js';
import { beat, highlight, step } from './support/narrate.js';

/**
 * Walkthrough for the forms-a11y fold: native form participation, keyboard
 * operability and validity messaging added to Choicebox, ChipInput, SplitInput,
 * Combobox, ColorPicker, InputButton and DateRangePicker.
 *
 * Almost everything proven here is a STATE CHANGE OVER TIME, not a static
 * arrangement of pixels: a roving tab stop that jumps from one card to another
 * as arrow keys are pressed, a 2D slider whose thumb and swatch move under
 * keyboard control alone, a focus ring that travels into a panel on open and
 * back to the trigger on close, an inline error that appears the instant typed
 * text stops parsing. A single screenshot shows one frame of each of these and
 * proves nothing about the other frames -- it cannot show that focus MOVED
 * (only where it happens to be), that the message is LIVE rather than
 * permanently rendered, or that Tab from the last card in a group really does
 * leave it rather than stepping to a fourth card that does not exist. Watching
 * the recording is the only way to see the behaviour, not just its aftermath.
 *
 * Every scenario below still runs real `expect()` assertions -- the recording
 * is evidence for a human, the assertions are the regression test, and the two
 * are deliberately the same run. Nothing here asserts on caption text; captions
 * are `aria-hidden` and `pointer-events: none` by construction (see
 * `support/narrate.ts`), so a walkthrough can never accidentally pass on its
 * own narration.
 *
 * Three gaps from the forms-a11y packet -- FileInput's `aria-describedby`,
 * InputButton's `required` blocking native submission, and `validateInput`'s
 * relaxed `tel` default -- originally had no demo instance exercising the new
 * behaviour and were reported as blocked rather than covered with invented
 * selectors. Demos for all three now exist on their route pages; the tests
 * near the end of this file cover them.
 */

/**
 * The description a real accessibility client would compute for `selector`,
 * read from the resolved tree rather than the attribute: `aria-describedby`
 * pointing at an id that is not rendered satisfies any attribute assertion and
 * announces nothing. Mirrors the identically-named helper in
 * `tests/field-description-six-controls.spec.ts`, duplicated rather than
 * imported because this project has its own, separate Playwright config.
 */
const resolvedDescription = async (page: Page, selector: string): Promise<string | null> =>
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
      return resolved.some((text) => text === null) ? '__DANGLING__' : resolved.join(' ');
    });

const invalidOn = async (page: Page, selector: string): Promise<string | null> =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => el.closest('[aria-describedby]')?.getAttribute('aria-invalid') ?? null);

test('Choicebox becomes a real native form control', async ({ page }) => {
  await gotoHydrated(page, '/components/choicebox');

  const result = page.getByTestId('choicebox-form-result');
  const submit = page.getByTestId('choicebox-form-submit');
  const basic = page.getByTestId('choicebox-form-basic');
  const pro = page.getByTestId('choicebox-form-pro');
  const addon = page.getByTestId('choicebox-form-addon');

  await step(page, 'A required radio group blocks submission until a card is chosen.', async () => {
    await submit.click();
  });
  await expect(result).toHaveText('');

  await step(page, 'Choosing the Basic plan and submitting records it.', async () => {
    await basic.click();
    await submit.click();
  });
  await expect(result).toHaveText('plan=basic');

  await step(
    page,
    'Choosing Pro REPLACES the entry -- true radio exclusivity, not a second one added.',
    async () => {
      await pro.click();
      await submit.click();
    }
  );
  await expect(result).toHaveText('plan=pro');

  await step(
    page,
    'A checkbox-mode card submits alongside the radio group, under its own name.',
    async () => {
      await addon.click();
      await submit.click();
    }
  );
  await expect(result).toHaveText('plan=pro addons=insurance');

  await step(
    page,
    'Clicking a card focuses the visible card itself, never the hidden native input behind it.',
    async () => {
      await basic.click();
    }
  );
  await highlight(basic);
  const focusedTestId = await page.evaluate(
    () => document.activeElement?.getAttribute('data-pw') ?? null
  );
  expect(focusedTestId).toBe('choicebox-form-basic');

  await beat(page, 1_500);
});

test('radio-mode Choiceboxes form a single roving-tabindex keyboard group', async ({ page }) => {
  await gotoHydrated(page, '/components/choicebox');

  const basic = page.getByTestId('choicebox-form-basic');
  const pro = page.getByTestId('choicebox-form-pro');
  const addon = page.getByTestId('choicebox-form-addon');

  // .focus() rather than .click(): arriving via Tab lands on the group's one
  // tab stop without selecting anything, which is what a real keyboard user
  // experiences. Clicking would select on arrival and hide that distinction.
  await basic.focus();
  await beat(page);
  await highlight(basic);
  await expect(basic).toBeFocused();
  await expect(basic).toHaveAttribute('tabindex', '0');
  await expect(pro).toHaveAttribute('tabindex', '-1');

  await step(
    page,
    'ArrowDown moves focus AND selection to the next card -- one key does both.',
    async () => {
      await page.keyboard.press('ArrowDown');
    }
  );
  await highlight(pro);
  await expect(pro).toBeFocused();
  await expect(pro).toHaveAttribute('aria-checked', 'true');
  await expect(basic).toHaveAttribute('aria-checked', 'false');
  await expect(pro).toHaveAttribute('tabindex', '0');
  await expect(basic).toHaveAttribute('tabindex', '-1');

  await step(page, 'ArrowUp moves back the other way.', async () => {
    await page.keyboard.press('ArrowUp');
  });
  await highlight(basic);
  await expect(basic).toBeFocused();
  await expect(basic).toHaveAttribute('aria-checked', 'true');

  await step(page, 'End jumps straight to the last card in the group.', async () => {
    await page.keyboard.press('End');
  });
  await highlight(pro);
  await expect(pro).toBeFocused();

  await step(page, 'Home jumps straight back to the first.', async () => {
    await page.keyboard.press('Home');
  });
  await highlight(basic);
  await expect(basic).toBeFocused();

  await step(
    page,
    'Tab leaves the whole group in one hop -- proof it is one tab stop, not three.',
    async () => {
      await page.keyboard.press('Tab');
    }
  );
  await highlight(addon);
  await expect(addon).toBeFocused();
});

type FieldExample = {
  readonly label: string;
  readonly route: string;
  readonly scope: string;
  readonly error: string;
  readonly info: string;
  /** Set only for the one control (SplitInput) that also gained a group `ariaLabel`. */
  readonly groupAriaLabel: string | null;
};

const FIELD_EXAMPLES: readonly FieldExample[] = [
  {
    label: 'Choicebox',
    route: '/components/choicebox',
    scope: 'choicebox',
    error: 'Pick a plan to continue.',
    info: 'You can change this later.',
    groupAriaLabel: null
  },
  {
    label: 'ChipInput',
    route: '/components/chip-input',
    scope: 'chipinput',
    error: 'At most five tags.',
    info: 'Press Enter to add.',
    groupAriaLabel: null
  },
  {
    label: 'SplitInput',
    route: '/components/split-input',
    scope: 'splitinput',
    error: 'That code is not right.',
    info: 'Check your messages.',
    groupAriaLabel: 'One-time code'
  },
  {
    label: 'Combobox',
    route: '/components/combobox',
    scope: 'combobox',
    error: 'Choose a fruit from the list.',
    info: 'Type to filter.',
    groupAriaLabel: null
  },
  {
    label: 'ColorPicker',
    route: '/components/color-picker',
    scope: 'colorpicker',
    error: 'Not enough contrast on white.',
    info: 'Used for buttons and links.',
    groupAriaLabel: null
  }
];

test('five controls gain a validity-messaging contract they never had before', async ({ page }) => {
  for (const example of FIELD_EXAMPLES) {
    await gotoHydrated(page, example.route);

    const described = `[data-pw="${example.scope}-described"]`;
    const infoOnly = `[data-pw="${example.scope}-info-only"]`;
    const undescribed = `[data-pw="${example.scope}-undescribed"]`;

    await page.getByTestId(`${example.scope}-field-contract`).scrollIntoViewIfNeeded();

    await step(
      page,
      `${example.label}: an error message now renders and is linked via aria-describedby.`,
      async () => {
        await highlight(page.getByTestId(`${example.scope}-described-error-message`));
      }
    );
    expect(await resolvedDescription(page, described)).toBe(`${example.error} ${example.info}`);
    expect(await invalidOn(page, described)).toBe('true');

    await step(
      page,
      `${example.label}: helper text alone describes the control without flagging it invalid.`,
      async () => {
        await highlight(page.getByTestId(`${example.scope}-info-only-info-message`));
      }
    );
    expect(await resolvedDescription(page, infoOnly)).toBe(example.info);
    expect(await invalidOn(page, infoOnly)).not.toBe('true');

    // The third example in the row has no message at all -- not shown, just checked,
    // so the pacing does not stall on a control with nothing new to look at.
    expect(await resolvedDescription(page, undescribed)).toBeNull();

    if (example.groupAriaLabel !== null) {
      await step(
        page,
        `${example.label} also names its whole control group for the first time.`,
        async () => {
          await highlight(page.locator(described));
        }
      );
      await expect(page.locator(described)).toHaveAttribute('aria-label', example.groupAriaLabel);
    }
  }
});

/** Saturation (aria-valuenow) and brightness (parsed from aria-valuetext) of the panel. */
const readSatVal = async (panel: Locator): Promise<{ sat: number; val: number }> => {
  const [valueNow, valueText] = await Promise.all([
    panel.getAttribute('aria-valuenow'),
    panel.getAttribute('aria-valuetext')
  ]);
  const brightnessMatch = valueText?.match(/(\d+)% brightness/) ?? null;
  return {
    sat: valueNow === null ? Number.NaN : Number(valueNow),
    val: brightnessMatch === null ? Number.NaN : Number(brightnessMatch[1])
  };
};

test("ColorPicker's saturation/brightness panel is keyboard-operable", async ({ page }) => {
  await gotoHydrated(page, '/components/color-picker');

  // Neither ColorPicker on this route carries a testId, so the "Swatch only" example
  // (the undecorated one the packet's scenario asks for) is reached by its own heading.
  const swatchOnly = page.locator('.demo-row', { hasText: 'Swatch only' });
  const trigger = swatchOnly.getByRole('button', { name: 'Pick a color' });
  const swatch = swatchOnly.locator('.color-picker-swatch');

  await step(
    page,
    'Opening the swatch-only ColorPicker reveals its 2D saturation panel.',
    async () => {
      await trigger.click();
    }
  );

  const panel = page.getByRole('slider', { name: 'Saturation and brightness' });
  await panel.focus();
  await beat(page);
  await highlight(panel);

  const before = await readSatVal(panel);
  const swatchStyleBefore = await swatch.getAttribute('style');

  await step(
    page,
    'ArrowRight and ArrowUp move saturation and brightness with no mouse involved.',
    async () => {
      for (let index = 0; index < 3; index += 1) {
        await page.keyboard.press('ArrowRight');
      }
      for (let index = 0; index < 3; index += 1) {
        await page.keyboard.press('ArrowUp');
      }
    }
  );
  await highlight(panel);

  const after = await readSatVal(panel);
  expect(after.sat).toBe(before.sat + 3);
  expect(after.val).toBe(before.val + 3);
  const swatchStyleAfter = await swatch.getAttribute('style');
  expect(swatchStyleAfter).not.toBe(swatchStyleBefore);

  await step(page, 'Home snaps saturation straight down to its minimum.', async () => {
    await page.keyboard.press('Home');
  });
  await expect(panel).toHaveAttribute('aria-valuenow', '0');

  await step(page, 'End snaps it straight up to its maximum.', async () => {
    await page.keyboard.press('End');
  });
  await expect(panel).toHaveAttribute('aria-valuenow', '100');
});

test("InputButton's field label is clickable and focuses the wrapped input", async ({ page }) => {
  await gotoHydrated(page, '/components/input-button');

  const described = page.getByTestId('inputbutton-described');
  const label = described.locator('label', { hasText: 'Email' });
  const input = described.locator('input');

  await expect(input).not.toBeFocused();

  await step(
    page,
    'Clicking the "Email" label focuses the field beside it -- previously inert, since `for` pointed at a name, not an id.',
    async () => {
      await label.click();
    }
  );
  await highlight(input);
  await expect(input).toBeFocused();
});

test("DateRangePicker's main panel traps focus and restores it to the trigger on close", async ({
  page
}) => {
  await gotoHydrated(page, '/components/date-range-picker');

  // A testId locator, not getByRole(name: 'Open date picker'): the trigger's
  // accessible name flips to 'Close date picker' once the panel is open, and a
  // role+name locator re-resolves against the live DOM on every use -- it would
  // stop matching anything the moment the panel opens, hanging every later
  // evaluate()/assertion against it until the test times out.
  const trigger = page.getByTestId('drp-range-demo-trigger');
  const panel = page.getByTestId('drp-range-demo-panel');

  await step(
    page,
    'Opening the picker moves focus straight into the panel -- never left behind on the trigger.',
    async () => {
      await trigger.click();
    }
  );
  await expect(panel).toBeVisible();
  await beat(page);

  const focusedInsidePanel = await panel.evaluate((node) => node.contains(document.activeElement));
  expect(focusedInsidePanel).toBe(true);
  const triggerStillFocused = await trigger.evaluate((node) => node === document.activeElement);
  expect(triggerStillFocused).toBe(false);

  await step(
    page,
    'Shift+Tab from the first focusable element wraps to the last -- focus never escapes the panel.',
    async () => {
      await page.keyboard.press('Shift+Tab');
    }
  );
  const wrappedInsidePanel = await panel.evaluate((node) => node.contains(document.activeElement));
  expect(wrappedInsidePanel).toBe(true);

  await step(
    page,
    'Tab from the last element wraps back to the first, closing the loop.',
    async () => {
      await page.keyboard.press('Tab');
    }
  );
  const stillInsidePanel = await panel.evaluate((node) => node.contains(document.activeElement));
  expect(stillInsidePanel).toBe(true);

  await step(
    page,
    'Escape closes the panel and returns focus to the trigger button that opened it.',
    async () => {
      await page.keyboard.press('Escape');
    }
  );
  await expect(panel).toBeHidden();
  await highlight(trigger);
  await expect(trigger).toBeFocused();
});

test("DateRangePicker's typed date fields show inline error text while the typed text is invalid", async ({
  page
}) => {
  await gotoHydrated(page, '/components/date-range-picker');

  const picker = page.getByTestId('drp-typeable-dates-demo');
  await picker.getByRole('button', { name: 'Open date picker' }).click();
  await expect(page.getByTestId('drp-typeable-dates-demo-panel')).toBeVisible();

  const startDateInput = page.getByTestId('drp-typeable-dates-demo-start-date');
  const originalValue = await startDateInput.inputValue();
  await expect(startDateInput).toHaveAttribute('aria-invalid', 'false');

  await step(
    page,
    'Typing an unparseable date flags the field invalid immediately -- no Tab, no blur.',
    async () => {
      await startDateInput.fill('13/45/9999');
    }
  );
  await expect(startDateInput).toHaveAttribute('aria-invalid', 'true');

  const errorId = await startDateInput.getAttribute('aria-describedby');
  expect(errorId).not.toBeNull();

  await step(
    page,
    'A real inline message now explains why -- previously only the red border changed, with nothing to read.',
    async () => {
      if (errorId !== null) {
        await highlight(page.locator(`[id="${errorId}"]`));
      }
    }
  );
  expect(await resolvedDescription(page, '[data-pw="drp-typeable-dates-demo-start-date"]')).toBe(
    'Enter a date this picker accepts, like 12 Mar 2025.'
  );

  await step(
    page,
    'Blurring an unparseable field discards it and reverts to the last committed value.',
    async () => {
      await startDateInput.blur();
    }
  );
  await expect(startDateInput).toHaveValue(originalValue);
  await expect(startDateInput).toHaveAttribute('aria-invalid', 'false');
});

// The previous title for the test below ("...describes itself through
// aria-describedby and role="alert", never aria-invalid") named three
// accessibility-tree facts as the thing the RECORDING proves. role="alert"
// and aria-invalid are attributes with no rendered-pixel signature -- there
// is no frame of video where "this element does not carry aria-invalid" is
// visible, so a title built from that fact is structurally unable to prove
// its own name no matter how the footage turns out. The title now states
// only what the camera actually shows (which message renders where); the
// ARIA-tree facts are still fully verified, just by direct `expect()`
// assertions instead of by the title.
test('FileInput renders its error and info text as visible copy beneath the drop zone, and neither when no message is set', async ({
  page
}) => {
  await gotoHydrated(page, '/components/file-input');

  const described = '[data-pw="fileinput-described"]';
  const infoOnly = '[data-pw="fileinput-info-only"]';
  const undescribed = '[data-pw="fileinput-undescribed"]';

  await page.getByTestId('fileinput-field-contract').scrollIntoViewIfNeeded();

  await step(
    page,
    'A rejected file used to have nowhere to be announced -- errorMessage now links to the drop zone via aria-describedby, read here through role="alert".',
    async () => {
      await highlight(page.getByTestId('fileinput-described-error-message'));
    }
  );
  expect(await resolvedDescription(page, described)).toBe('Only images under 1 MB are accepted.');
  await expect(page.getByTestId('fileinput-described-error-message')).toHaveAttribute(
    'role',
    'alert'
  );
  // FileInput deliberately never sets aria-invalid: ARIA does not define that
  // attribute on role="button", so the error text's own role="alert" IS the
  // announcement. Asserting the attribute is genuinely absent from the DOM
  // (not just resolving to a falsy string through the closest()-based
  // invalidOn() helper) is the real regression test for that contract --
  // asserting 'true' would be testing for a behaviour this control correctly
  // refuses to have.
  await expect(page.locator(described)).not.toHaveAttribute('aria-invalid');

  await step(
    page,
    'Helper text alone describes the control without flagging it invalid.',
    async () => {
      await highlight(page.getByTestId('fileinput-info-only-info-message'));
    }
  );
  expect(await resolvedDescription(page, infoOnly)).toBe('PNG or JPG, up to 5 MB.');
  await expect(page.locator(infoOnly)).not.toHaveAttribute('aria-invalid');
  // Info-only has nothing to announce as an alert either -- confirm no
  // role="alert" node exists here, not merely that the error case's node is
  // out of frame.
  await expect(page.getByTestId('fileinput-info-only-error-message')).toHaveCount(0);

  // The third control has neither message -- checked, not shown, so pacing
  // doesn't stall on a control with nothing new on screen.
  expect(await resolvedDescription(page, undescribed)).toBeNull();
  await expect(page.locator(undescribed)).not.toHaveAttribute('aria-invalid');
  await expect(page.getByTestId('fileinput-undescribed-error-message')).toHaveCount(0);
});

test("InputButton's required now reaches the real input and blocks native submission", async ({
  page
}) => {
  await gotoHydrated(page, '/components/input-button');

  const form = page.getByTestId('input-button-required-form');
  // InputButton's own testId lands on its wrapper group, not the native
  // <input> the browser actually validates and focuses -- reach that one the
  // same way FormData will see it, through its name.
  const input = form.locator('input[name="promo"]');
  const submit = page.getByTestId('input-button-required-submit');
  const result = page.getByTestId('input-button-required-result');

  await form.scrollIntoViewIfNeeded();
  await expect(input).toBeVisible();

  await step(
    page,
    'required now reaches the Input underneath, not just the decorative asterisk -- submitting empty is blocked by the browser itself.',
    async () => {
      await submit.click();
    }
  );
  await expect(result).toHaveText('');
  await expect(input).toBeFocused();
  await highlight(input, 1_200);

  await step(
    page,
    'Filling it in and submitting again goes through, like a plain required field.',
    async () => {
      await input.fill('SAVE20');
      await submit.click();
    }
  );
  await expect(result).toHaveText('promo=SAVE20');
});

test("Input's tel default accepts a UK number the legacy in-mobile preset still rejects", async ({
  page
}) => {
  await gotoHydrated(page, '/components/input');

  // The same value under two rules, side by side -- the point is that the
  // states differ, not the input, so both are checked against it explicitly
  // rather than asserted on in isolation.
  const sameValue = '+44 20 7946 0958';
  const defaultRule = page.getByTestId('input-tel-default-accepts');
  const legacyPreset = page.getByTestId('input-tel-legacy-preset');
  const genuinelyInvalid = page.getByTestId('input-tel-invalid');

  await defaultRule.scrollIntoViewIfNeeded();
  await expect(defaultRule).toHaveValue(sameValue);
  await expect(legacyPreset).toHaveValue(sameValue);

  await step(
    page,
    'validateInput now checks only characters and length for tel by default -- this UK number is Valid.',
    async () => {
      await highlight(defaultRule);
    }
  );
  expect(await defaultRule.getAttribute('aria-invalid')).toBeNull();
  expect(await resolvedDescription(page, '[data-pw="input-tel-default-accepts"]')).toBe(
    'Characters and length only — this UK number is accepted.'
  );

  await step(
    page,
    'The identical number, opted into the old TEL_PRESET_IN_MOBILE pattern, is still rejected -- it never matched a 10-digit Indian mobile number.',
    async () => {
      await highlight(legacyPreset);
    }
  );
  await expect(legacyPreset).toHaveAttribute('aria-invalid', 'true');
  expect(await resolvedDescription(page, '[data-pw="input-tel-legacy-preset"]')).toBe(
    'Not a 10-digit Indian mobile number.'
  );
  await expect(page.getByTestId('input-tel-legacy-preset-error-message')).toHaveAttribute(
    'role',
    'alert'
  );

  await step(
    page,
    'A number with letters in it fails the default character rule outright -- rejected before any preset even applies.',
    async () => {
      await highlight(genuinelyInvalid);
    }
  );
  await expect(genuinelyInvalid).toHaveAttribute('aria-invalid', 'true');
  expect(await resolvedDescription(page, '[data-pw="input-tel-invalid"]')).toBe(
    'Phone numbers can only contain digits, spaces, +, -, ., and parentheses.'
  );
});
