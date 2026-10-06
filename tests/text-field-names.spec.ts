import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * ISSUE-005: SplitInput, Combobox and ColorPicker text fields announced as "edit
 * text, blank". 37 SplitInput boxes, 4 Combobox inputs and the ColorPicker's hex
 * field, hue slider and channel boxes had no accessible name.
 *
 * Names are read through the browser's own role/name computation (`getByRole`
 * and `toHaveAccessibleName`), in each engine this suite runs in, rather than as
 * the presence of an attribute. Each group also proves the field is still operable
 * under that name -- typing, deleting, pasting, searching, selecting, editing a
 * colour -- because a naming fix that breaks the control is not a fix.
 */

const PREVIEW_ROUTE = {
  splitInput: '/components/split-input',
  combobox: '/components/combobox',
  colorPicker: '/components/color-picker'
} as const;

/** Every text-entry control the demo page itself renders (not the app shell's search box). */
const pageControls = (page: Page): Locator =>
  page.locator('main input, main textarea, main [role="slider"]');

const accessibleNames = async (controls: Locator): Promise<string[]> => {
  const count = await controls.count();
  const names: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const snapshot = await controls.nth(index).ariaSnapshot();
    names.push(/^- \w+ "((?:[^"\\]|\\.)*)"/.exec(snapshot)?.[1] ?? '');
  }
  return names;
};

/**
 * A real paste: the text goes onto the system clipboard and the browser's own
 * paste shortcut delivers it, so the engine's native paste handling -- not a
 * hand-built ClipboardEvent, which Firefox ignores the data of -- is what reaches
 * SplitInput. Chromium needs the permission granted; Firefox and WebKit allow a
 * clipboard write from a page the user has just clicked.
 */
const pasteInto = async (page: Page, input: Locator, text: string): Promise<void> => {
  await input.click();
  await page.evaluate((pasted) => navigator.clipboard.writeText(pasted), text);
  await page.keyboard.press('ControlOrMeta+V');
};

test.describe('SplitInput: every box is named, and still works', () => {
  test.beforeEach(async ({ page, context, browserName }) => {
    if (browserName === 'chromium') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    }
    await gotoHydrated(page, PREVIEW_ROUTE.splitInput);
  });

  test('no box on the page is unnamed, and no two boxes share a name', async ({ page }) => {
    const names = await accessibleNames(pageControls(page));
    expect(names).toHaveLength(37);
    expect(names.filter((name) => name === '')).toEqual([]);
    expect(new Set(names).size, `duplicate names in ${JSON.stringify(names)}`).toBe(names.length);
  });

  test('boxes say which field they are and where: group name, then position', async ({ page }) => {
    const pin = page.getByRole('group', { name: 'PIN', exact: true }).getByRole('textbox');
    await expect(pin).toHaveCount(4);
    for (let index = 0; index < 4; index += 1) {
      await expect(pin.nth(index)).toHaveAccessibleName(`PIN, digit ${index + 1} of 4`);
    }

    // A wider box is a field, not a digit, and the caller can supply the noun.
    const ip = page.getByRole('group', { name: 'IP address', exact: true }).getByRole('spinbutton');
    await expect(ip.nth(2)).toHaveAccessibleName('IP address, octet 3 of 4');

    // A box the caller named by purpose keeps exactly that name.
    const rgb = page.getByRole('group', { name: 'RGB color', exact: true });
    await expect(rgb.getByRole('spinbutton', { name: 'Red', exact: true })).toBeVisible();
    await expect(rgb.getByRole('spinbutton', { name: 'Green', exact: true })).toBeVisible();
    await expect(rgb.getByRole('spinbutton', { name: 'Blue', exact: true })).toBeVisible();

    // Unrelated groups never share a name, even where they hold the same number of boxes.
    await expect(
      page.getByRole('textbox', { name: 'One-time code, digit 1 of 4', exact: true })
    ).toHaveCount(1);
    await expect(
      page.getByRole('textbox', { name: 'One-time code with a hint, digit 1 of 4', exact: true })
    ).toHaveCount(1);
  });

  test('a real Tab sequence announces each box by name, in order', async ({ page }) => {
    const first = page.getByRole('textbox', { name: 'PIN, digit 1 of 4', exact: true });
    await first.focus();
    await expect(page.locator(':focus')).toHaveAccessibleName('PIN, digit 1 of 4');
    for (const position of [2, 3, 4]) {
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toHaveAccessibleName(`PIN, digit ${position} of 4`);
    }
    for (const position of [3, 2, 1]) {
      await page.keyboard.press('Shift+Tab');
      await expect(page.locator(':focus')).toHaveAccessibleName(`PIN, digit ${position} of 4`);
    }
  });

  test('typing, backspace and completion still work under the new names', async ({ page }) => {
    const box = (position: number): Locator =>
      page.getByRole('textbox', { name: `PIN, digit ${position} of 4`, exact: true });

    await box(1).click();
    await page.keyboard.type('1234');
    for (const [position, digit] of [
      [1, '1'],
      [2, '2'],
      [3, '3'],
      [4, '4']
    ] as const) {
      await expect(box(position)).toHaveValue(digit);
    }
    // Completion: bind:values reached the page, which renders the joined code.
    await expect(page.getByText('Value: 1234')).toBeVisible();

    // Deletion: Backspace on a filled box clears it; on an empty one it steps back and clears.
    await page.keyboard.press('Backspace');
    await expect(box(4)).toHaveValue('');
    await page.keyboard.press('Backspace');
    await expect(box(3)).toHaveValue('');
    await expect(box(3)).toBeFocused();
    await expect(page.getByText('Value: 12')).toBeVisible();
  });

  // Paste is into a fresh box each time: where the caret lands in a box that already
  // holds a digit is engine-specific and is not what these assert.
  for (const [description, code, expected] of [
    ['a code that fits the boxes is distributed from the one pasted into', '5678', '5678'],
    ['a code longer than the boxes is distributed by the paste handler', '9876543', '9876']
  ] as const) {
    test(`a real clipboard paste of ${description}`, async ({ page }) => {
      const box = (position: number): Locator =>
        page.getByRole('textbox', { name: `PIN, digit ${position} of 4`, exact: true });

      await pasteInto(page, box(1), code);
      for (const [index, digit] of [...expected].entries()) {
        await expect(box(index + 1)).toHaveValue(digit);
      }
      await expect(page.getByText(`Value: ${expected}`)).toBeVisible();
    });
  }

  test('the RGB boxes still edit by channel name', async ({ page }) => {
    const rgb = page.getByRole('group', { name: 'RGB color', exact: true });
    const green = rgb.getByRole('spinbutton', { name: 'Green', exact: true });
    await expect(green).toHaveValue('0');
    await green.fill('64');
    await expect(green).toHaveValue('64');
  });

  test('a group name still describes and validates the whole code', async ({ page }) => {
    const group = page.getByRole('group', { name: 'One-time code', exact: true });
    await expect(group).toHaveAttribute('aria-invalid', 'true');
    await expect(group).toHaveAccessibleDescription('That code is not right. Check your messages.');
    await expect(group.getByRole('textbox')).toHaveCount(4);
  });
});

test.describe('Combobox: the input is named, and search and selection still work', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHydrated(page, PREVIEW_ROUTE.combobox);
  });

  test('every combobox input on the page has its own name', async ({ page }) => {
    const names = await accessibleNames(pageControls(page));
    expect(names).toHaveLength(9);
    expect(names.filter((name) => name === '')).toEqual([]);
    expect(new Set(names).size, `duplicate names in ${JSON.stringify(names)}`).toBe(names.length);
  });

  test('ariaLabel names the input as well as the popup', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Fruit', exact: true });
    await expect(input).toHaveCount(1);
    await input.click();
    await expect(page.getByRole('listbox', { name: 'Fruit', exact: true })).toBeVisible();
  });

  test('searching for "ban" and choosing Banana by keyboard selects it', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Fruit', exact: true });
    await input.click();
    await page.keyboard.type('ban');
    const options = page.getByRole('option');
    await expect(options).toHaveCount(1);
    await expect(options.first()).toHaveText('Banana');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('Banana');
    await expect(page.getByText('Selected: banana')).toBeVisible();
  });

  test('a multi-select keeps its name after a pill is picked and the placeholder empties', async ({
    page
  }) => {
    const input = page.getByRole('combobox', { name: 'Fruits', exact: true });
    await input.click();
    await page.getByRole('option', { name: 'Apple' }).click();
    await expect(page.getByText('Selected: apple')).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', '');
    await expect(input).toHaveAccessibleName('Fruits');
  });

  test('a real Tab sequence reaches each combobox by name', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Fruit', exact: true }).focus();
    await expect(page.locator(':focus')).toHaveAccessibleName('Fruit');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAccessibleName('Fruit, focused from a button');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAccessibleName('Focus the combobox');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAccessibleName('Fruits');
  });

  test('validity messaging still describes the group around a named input', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Fruit with an error', exact: true });
    await expect(input).toBeVisible();
    const group = page.getByTestId('combobox-described');
    await expect(group).toHaveAccessibleName('Fruit with an error');
    await expect(group).toHaveAttribute('aria-invalid', 'true');
    await expect(group).toHaveAccessibleDescription(
      'Choose a fruit from the list. Type to filter.'
    );
  });

  test('selected options have distinct removal names and real keyboard activation removes one', async ({
    page
  }) => {
    const input = page.getByRole('combobox', { name: 'Fruits', exact: true });
    await input.click();
    await page.getByRole('option', { name: 'Apple', exact: true }).click();
    await input.click();
    await page.getByRole('option', { name: 'Banana', exact: true }).click();
    await expect(page.getByText('Selected: apple, banana', { exact: true })).toBeVisible();
    const apple = page.getByRole('button', { name: 'Remove Apple from Fruits', exact: true });
    const banana = page.getByRole('button', { name: 'Remove Banana from Fruits', exact: true });
    await expect(banana).toBeVisible();
    await apple.focus();
    await page.keyboard.press('Enter');
    await expect(apple).toHaveCount(0);
    await expect(banana).toBeVisible();
    await expect(page.getByText('Selected: banana', { exact: true })).toBeVisible();
    await expect(input).toHaveAccessibleName('Fruits');
  });
});

test.describe('ColorPicker: subfields are named by purpose, and colour editing still works', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHydrated(page, PREVIEW_ROUTE.colorPicker);
  });

  test('the hex fields and triggers on the page are named and distinct', async ({ page }) => {
    const names = await accessibleNames(pageControls(page));
    expect(names).toEqual(['Brand color hex value', 'Locked color hex value']);

    const triggers = page.getByRole('button', { name: /^Pick a color/ });
    const triggerNames = await Promise.all(
      (await triggers.all()).map(async (trigger) => (await trigger.ariaSnapshot()).split('"')[1])
    );
    expect(new Set(triggerNames).size).toBe(triggerNames.length);
    expect(triggerNames).toContain('Pick a color: Brand color');
    expect(triggerNames).toContain('Pick a color: Highlight color');
  });

  test('the popover names its dialog, saturation panel, hue slider and hex field', async ({
    page
  }) => {
    await page.getByRole('button', { name: 'Pick a color: Brand color', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Brand color picker', exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('slider', { name: 'Saturation and brightness' })).toBeVisible();
    await expect(dialog.getByRole('slider', { name: 'Hue', exact: true })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'Hex value', exact: true })).toBeVisible();
  });

  test('editing the colour by hex, by hue, by RGB and by HSL works under those names', async ({
    page
  }) => {
    const hexValue = page.getByRole('textbox', { name: 'Brand color hex value', exact: true });
    await page.getByRole('button', { name: 'Pick a color: Brand color', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Brand color picker', exact: true });

    await dialog.getByRole('textbox', { name: 'Hex value', exact: true }).fill('#ff0000');
    await expect(hexValue).toHaveValue('#ff0000');

    // The hue slider is a native range input: a real arrow key moves it.
    const hue = dialog.getByRole('slider', { name: 'Hue', exact: true });
    await hue.focus();
    await page.keyboard.press('End');
    await expect(hue).toHaveValue('360');

    await dialog.getByRole('textbox', { name: 'Hex value', exact: true }).fill('#ff0000');
    await dialog.getByRole('button', { name: 'Switch color mode' }).click();
    const rgb = dialog.getByRole('group', { name: 'RGB channels', exact: true });
    await expect(rgb.getByRole('spinbutton', { name: 'Red', exact: true })).toHaveValue('255');
    await rgb.getByRole('spinbutton', { name: 'Green', exact: true }).fill('128');
    await expect(hexValue).toHaveValue(/^#ff80(00|01)$/);

    await dialog.getByRole('button', { name: 'Switch color mode' }).click();
    const hsl = dialog.getByRole('group', { name: 'HSL channels', exact: true });
    await expect(hsl.getByRole('spinbutton', { name: 'Hue (degrees)', exact: true })).toBeVisible();
    await expect(
      hsl.getByRole('spinbutton', { name: 'Saturation (percent)', exact: true })
    ).toHaveValue('100');
    await hsl.getByRole('spinbutton', { name: 'Lightness (percent)', exact: true }).fill('25');
    await expect(hexValue).not.toHaveValue(/^#ff80/);
  });

  test('a real Tab sequence walks the popover controls by name', async ({ page }) => {
    await page.getByRole('button', { name: 'Pick a color: Brand color', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Brand color picker', exact: true });
    await dialog.getByRole('slider', { name: 'Saturation and brightness' }).focus();
    const walked: string[] = [];
    for (let step = 0; step < 3; step += 1) {
      await page.keyboard.press('Tab');
      walked.push(((await page.locator(':focus').ariaSnapshot()).split('"')[1] ?? '').trim());
    }
    expect(walked).toEqual(['Hue', 'Hex value', 'Switch color mode']);
  });

  test('validity messaging still describes the group', async ({ page }) => {
    const group = page.getByRole('group', { name: 'Brand colour', exact: true });
    await expect(group).toHaveAttribute('aria-invalid', 'true');
    await expect(group).toHaveAccessibleDescription(
      'Not enough contrast on white. Used for buttons and links.'
    );
  });
});

/**
 * The same three components as custom elements. The shadow root changes two
 * things the Svelte routes cannot show: the host's own `aria-label` is a different
 * property from the component's (it is renamed on the way in), and an IDREF could
 * not cross the boundary -- so the names have to arrive as strings, and arrive.
 */
const loadWc = async (page: Page, markup: string): Promise<void> => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(
    () =>
      ['sui-split-input', 'sui-combobox', 'sui-color-picker'].every(
        (tag) => typeof customElements.get(tag) === 'function'
      ),
    null,
    { timeout: 20_000 }
  );
  await page.evaluate((html) => {
    document.body.innerHTML = html;
  }, markup);
};

test.describe('web components: the same fields are named through the host', () => {
  test('sui-split-input: aria-label leads each box name, fields[].ariaLabel and positionLabel apply', async ({
    page
  }) => {
    await loadWc(
      page,
      `<sui-split-input id="otp" aria-label="One-time code" length="4" auto-advance></sui-split-input>
       <sui-split-input id="rgb" aria-label="RGB color"></sui-split-input>
       <sui-split-input id="ip" aria-label="IP address" separator="."></sui-split-input>`
    );
    await page.evaluate(() => {
      const rgb = document.querySelector<HTMLElement & Record<string, unknown>>('#rgb');
      const ip = document.querySelector<HTMLElement & Record<string, unknown>>('#ip');
      if (rgb === null || ip === null) {
        throw new Error('fixtures missing');
      }
      rgb.values = ['255', '0', '128'];
      rgb.fields = [
        { label: 'R', ariaLabel: 'Red', dataType: 'number' },
        { label: 'G', ariaLabel: 'Green', dataType: 'number' },
        { label: 'B', ariaLabel: 'Blue', dataType: 'number' }
      ];
      const wide = { dataType: 'number', maxLength: 3 };
      ip.values = ['', '', '', ''];
      ip.fields = [wide, wide, wide, wide];
      ip.positionLabel = (position: number, total: number) => `octet ${position} of ${total}`;
    });

    const otp = page.locator('#otp').getByRole('textbox');
    await expect(otp).toHaveCount(4);
    for (let index = 0; index < 4; index += 1) {
      await expect(otp.nth(index)).toHaveAccessibleName(`One-time code, digit ${index + 1} of 4`);
    }
    await expect(
      page.locator('#rgb').getByRole('spinbutton', { name: 'Red', exact: true })
    ).toBeVisible();
    await expect(
      page.locator('#rgb').getByRole('spinbutton', { name: 'Blue', exact: true })
    ).toBeVisible();
    await expect(page.locator('#ip').getByRole('spinbutton').nth(1)).toHaveAccessibleName(
      'IP address, octet 2 of 4'
    );
  });

  test('sui-split-input: typing and the complete event still work', async ({ page }) => {
    await loadWc(
      page,
      `<sui-split-input id="otp" aria-label="One-time code" length="4" auto-advance></sui-split-input>`
    );
    await page.evaluate(() => {
      const el = document.querySelector('#otp');
      el?.addEventListener('complete', (event) => {
        document.body.dataset.completed = JSON.stringify((event as CustomEvent<string[]>).detail);
      });
    });
    await page.getByRole('textbox', { name: 'One-time code, digit 1 of 4', exact: true }).click();
    await page.keyboard.type('4821');
    await expect(
      page.getByRole('textbox', { name: 'One-time code, digit 4 of 4', exact: true })
    ).toHaveValue('1');
    await expect
      .poll(() => page.evaluate(() => document.body.dataset.completed))
      .toBe('["4","8","2","1"]');
  });

  test('sui-combobox: aria-label names the input and the popup; search and selection work', async ({
    page
  }) => {
    await loadWc(page, `<sui-combobox id="fruit" aria-label="Fruit"></sui-combobox>`);
    await page.evaluate(() => {
      const el = document.querySelector<HTMLElement & Record<string, unknown>>('#fruit');
      if (el === null) {
        throw new Error('fixture missing');
      }
      el.items = [
        { id: 'apple', label: 'Apple' },
        { id: 'banana', label: 'Banana' },
        { id: 'cherry', label: 'Cherry' }
      ];
    });
    const input = page.getByRole('combobox', { name: 'Fruit', exact: true });
    await input.click();
    await expect(page.getByRole('listbox', { name: 'Fruit', exact: true })).toBeVisible();
    await page.keyboard.type('ban');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('Banana');
    expect(
      await page.evaluate(
        () => (document.querySelector('#fruit') as HTMLElement & { value: string }).value
      )
    ).toBe('banana');
  });

  test('sui-combobox: inputProperties.label, the documented route, now names the input', async ({
    page
  }) => {
    await loadWc(page, `<sui-combobox id="country"></sui-combobox>`);
    await page.evaluate(() => {
      const el = document.querySelector<HTMLElement & Record<string, unknown>>('#country');
      if (el === null) {
        throw new Error('fixture missing');
      }
      el.items = [{ id: 'in', label: 'India' }];
      el.inputProperties = { label: 'Country' };
    });
    await expect(page.getByRole('combobox', { name: 'Country', exact: true })).toBeVisible();
  });

  test('sui-combobox: described groups and pill removal retain the field context', async ({
    page
  }) => {
    await loadWc(page, `<sui-combobox id="fruit" aria-label="Fruits" multiple></sui-combobox>`);
    await page.evaluate(() => {
      const el = document.querySelector<HTMLElement & Record<string, unknown>>('#fruit');
      if (el === null) {
        throw new Error('fixture missing');
      }
      el.items = [
        { id: 'apple', label: 'Apple' },
        { id: 'banana', label: 'Banana' }
      ];
      el.selected = ['apple', 'banana'];
      el.infoMessage = 'Choose fruit for the snack';
      el.addEventListener('remove', (event) => {
        document.body.dataset.removed = String((event as CustomEvent<string>).detail);
      });
    });
    const group = page.locator('#fruit').getByRole('group', { name: 'Fruits', exact: true });
    await expect(group).toHaveAccessibleDescription('Choose fruit for the snack');
    const apple = group.getByRole('button', { name: 'Remove Apple from Fruits', exact: true });
    const banana = group.getByRole('button', { name: 'Remove Banana from Fruits', exact: true });
    await expect(apple).toBeVisible();
    await banana.focus();
    await page.keyboard.press('Enter');
    await expect(banana).toHaveCount(0);
    await expect(apple).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.body.dataset.removed)).toBe('banana');
    await expect
      .poll(() =>
        page
          .locator('#fruit')
          .evaluate((el) => (el as HTMLElement & { selected: string[] }).selected)
      )
      .toEqual(['apple']);
  });

  test('sui-color-picker: aria-label and label name the trigger, hex field and dialog', async ({
    page
  }) => {
    await loadWc(
      page,
      `<sui-color-picker id="swatch" aria-label="Highlight color" value="#2196f3"></sui-color-picker>
       <sui-color-picker id="brand" label="Brand color" show-value value="#2196f3"></sui-color-picker>`
    );
    await expect(
      page
        .locator('#swatch')
        .getByRole('button', { name: 'Pick a color: Highlight color', exact: true })
    ).toBeVisible();
    const hex = page.locator('#brand').getByRole('textbox', {
      name: 'Brand color hex value',
      exact: true
    });
    await expect(hex).toBeVisible();

    await page
      .locator('#brand')
      .getByRole('button', { name: 'Pick a color: Brand color', exact: true })
      .click();
    const dialog = page
      .locator('#brand')
      .getByRole('dialog', { name: 'Brand color picker', exact: true });
    await expect(dialog.getByRole('slider', { name: 'Hue', exact: true })).toBeVisible();
    await dialog.getByRole('textbox', { name: 'Hex value', exact: true }).fill('#00ff00');
    await expect(hex).toHaveValue('#00ff00');
    expect(
      await page.evaluate(
        () => (document.querySelector('#brand') as HTMLElement & { value: string }).value
      )
    ).toBe('#00ff00');

    await dialog.getByRole('button', { name: 'Switch color mode' }).click();
    const rgb = dialog.getByRole('group', { name: 'RGB channels', exact: true });
    await expect(rgb.getByRole('spinbutton', { name: 'Green', exact: true })).toHaveValue('255');
    await dialog.getByRole('button', { name: 'Switch color mode' }).click();
    await expect(
      dialog
        .getByRole('group', { name: 'HSL channels', exact: true })
        .getByRole('spinbutton', { name: 'Hue (degrees)', exact: true })
    ).toHaveValue('120');
  });
});
