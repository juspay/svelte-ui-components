import { expect, test, type Locator, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * ISSUE-002 -- Select triggers had no accessible name.
 *
 * The audit counted unnamed `combobox` entries on /components/select: the visible
 * heading and the placeholder gave a screen reader no field identity, and Select
 * had no way to supply one. `ariaLabel` / `ariaLabelledby` now name the actual
 * combobox trigger, the focusable text input inside it, and the listbox.
 *
 * Names are read with Playwright's role/name engine, which is the same in all
 * three browsers, and the Chromium spec additionally reads the browser's NATIVE
 * accessibility tree over CDP, so the claim does not rest on attribute presence.
 */

const nameOf = async (locator: Locator): Promise<string | null> => {
  const snapshot = (await locator.ariaSnapshot()).split('\n')[0] ?? '';
  const match = /^- [a-z]+ "((?:[^"\\]|\\.)*)"/.exec(snapshot);
  return match === null ? null : match[1].replace(/\\"/g, '"');
};

test.describe('Select accessible name -- the Select page (Svelte)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHydrated(page, '/components/select');
  });

  test('every Select example names its combobox, and no name is just the placeholder', async ({
    page
  }) => {
    const comboboxes = page.getByRole('combobox');
    const count = await comboboxes.count();
    expect(count).toBeGreaterThanOrEqual(32);

    const names: string[] = [];
    for (let index = 0; index < count; index += 1) {
      const combobox = comboboxes.nth(index);
      // Not the site search box in the page chrome -- only Select triggers.
      if (!(await combobox.evaluate((element) => element.classList.contains('select-trigger')))) {
        continue;
      }
      await expect(combobox).toHaveAccessibleName(/\S/);
      const name = await nameOf(combobox);
      expect(name, `combobox ${index} has no name`).not.toBeNull();
      const shown = ((await combobox.textContent()) ?? '').trim();
      expect(name, `combobox ${index} is named by its own text "${shown}"`).not.toBe(shown);
      names.push(name ?? '');
    }

    expect(names.length).toBeGreaterThanOrEqual(32);
    // Distinct names keep a list of 32 comboboxes navigable by name.
    expect(new Set(names).size).toBe(names.length);
  });

  test('the text input inside a searchable trigger is named too, not by its placeholder', async ({
    page
  }) => {
    const inputs = page.locator('input.select-search');
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(3);
    for (let index = 0; index < count; index += 1) {
      const input = inputs.nth(index);
      const placeholder = (await input.getAttribute('placeholder')) ?? '';
      await expect(input).toHaveAccessibleName(/\S/);
      expect(await nameOf(input)).not.toBe(placeholder);
      expect(await input.getAttribute('aria-label')).not.toBeNull();
    }
  });

  test('the name is the field, so it survives empty, selected, searchable, multiple, invalid and disabled', async ({
    page
  }) => {
    // Empty -> selected, single.
    const fruit = page.getByRole('combobox', { name: 'Fruit', exact: true });
    await expect(fruit).toContainText('Choose a fruit');
    await fruit.click();
    await page.getByRole('option', { name: 'Banana' }).click();
    await expect(fruit).toContainText('Banana');
    await expect(page.getByRole('combobox', { name: 'Fruit', exact: true })).toBeVisible();

    // Searchable: the input and the combobox share the name, before and after a pick.
    const citySearch = page.getByTestId('select-search-demo-search');
    await expect(citySearch).toHaveAccessibleName('City (searchable)');
    await citySearch.click();
    await page.keyboard.type('lon');
    await page.getByTestId('select-search-demo-ldn').click();
    await expect(citySearch).toHaveAccessibleName('City (searchable)');
    await expect(page.getByTestId('select-search-demo').getByRole('combobox')).toHaveAccessibleName(
      'City (searchable)'
    );

    // Multiple: two picks, still the field's name.
    const multi = page.getByTestId('select-multi-demo').getByRole('combobox');
    await multi.click();
    await page.getByTestId('select-multi-demo-apple').click();
    await page.getByTestId('select-multi-demo-cherry').click();
    await expect(multi).toHaveAccessibleName('Fruits (multiple)');
    await expect(multi).toContainText('Apple');

    // Invalid: named, flagged invalid, and described by the message.
    const invalid = page.getByTestId('select-invalid').getByRole('combobox');
    await expect(invalid).toHaveAccessibleName('Fruit (with error)');
    await expect(invalid).toHaveAttribute('aria-invalid', 'true');
    await expect(invalid).toHaveAccessibleDescription('Pick a fruit to continue');

    // Disabled: named, and says so.
    const disabled = page.getByRole('combobox', { name: 'Fruit (disabled)', exact: true });
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await expect(disabled).toHaveAttribute('tabindex', '-1');
  });

  test('an open Select names its listbox, and in-menu search keeps its own box name', async ({
    page
  }) => {
    await page.getByRole('combobox', { name: 'Fruit', exact: true }).click();
    await expect(page.getByRole('listbox', { name: 'Fruit', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');

    await page.getByRole('combobox', { name: 'City (in-menu search)', exact: true }).click();
    await expect(page.getByRole('listbox', { name: 'City (in-menu search)' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Search options' })).toBeVisible();
  });

  test('keyboard open, search and select still work on a named Select', async ({ page }) => {
    const fruit = page.getByRole('combobox', { name: 'Fruit', exact: true });
    await fruit.focus();
    await page.keyboard.press('ArrowDown');
    await expect(fruit).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(fruit).toContainText('Apple');
    await expect(fruit).toHaveAttribute('aria-expanded', 'false');

    const citySearch = page.getByTestId('select-search-demo-search');
    await citySearch.focus();
    await page.keyboard.type('syd');
    await expect(page.getByTestId('select-search-demo-syd')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Selected ID: syd')).toBeVisible();
    await expect(citySearch).toHaveAccessibleName('City (searchable)');
  });

  test('a real Tab sequence reaches only named Select stops', async ({ page }) => {
    // A click on the heading sets the sequential-focus starting point in every
    // engine, so the walk begins at the top of the examples rather than in the
    // site navigation.
    await page.getByRole('heading', { name: 'Select', level: 1 }).click();

    const stops: Array<{ name: string | null; tag: string }> = [];
    for (let press = 0; press < 400; press += 1) {
      await page.keyboard.press('Tab');
      const isSelectStop = await page.evaluate(() => {
        const active = document.activeElement;
        return (
          active instanceof HTMLElement &&
          (active.classList.contains('select-trigger') ||
            active.classList.contains('select-search'))
        );
      });
      if (isSelectStop) {
        const focused = page.locator(':focus');
        stops.push({
          name: await nameOf(focused),
          tag: await focused.evaluate((element) => element.tagName.toLowerCase())
        });
      }
      const reachedEnd = await page.evaluate(
        () => document.activeElement?.getAttribute('data-pw') === 'select-form-submit'
      );
      if (reachedEnd) {
        break;
      }
    }

    // 32 examples, minus the disabled one, minus the in-trigger-search triggers
    // whose INPUT takes the stop instead of the div.
    expect(stops.length).toBeGreaterThanOrEqual(28);
    expect(stops.filter((stop) => stop.name === null)).toEqual([]);
  });

  test('a visible label names its Select through ariaLabelledby', async ({ page }) => {
    const single = page.getByRole('combobox', { name: 'Favorite fruit', exact: true });
    await expect(single).toBeVisible();
    await expect(page.locator('#select-form-single-label')).toHaveText('Favorite fruit');
    await expect(single).toHaveAttribute('aria-labelledby', 'select-form-single-label');
    await expect(
      page.getByRole('combobox', { name: 'Favorite colors', exact: true })
    ).toBeVisible();
  });

  test('the Selects in the Modal example are named', async ({ page }) => {
    await page.getByTestId('select-modal-trigger').click();
    for (const name of [
      'City (in-flow, in a modal)',
      'City (portaled, in a modal)',
      'Cities (multiple, in a modal)'
    ]) {
      await expect(page.getByRole('combobox', { name, exact: true })).toBeVisible();
    }
  });
});

test.describe('Select accessible name -- other routes', () => {
  test('the Select in the Modal route is named', async ({ page }) => {
    await gotoHydrated(page, '/components/modal');
    await page.getByTestId('nested-select-modal-trigger').click();
    await expect(page.getByRole('combobox', { name: 'Fruit', exact: true })).toBeVisible();
  });
});

const bootBundle = async (page: Page): Promise<void> => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-select') !== 'undefined', null, {
    timeout: 15_000
  });
};

const cities = [
  { id: 'nyc', label: 'New York' },
  { id: 'tyo', label: 'Tokyo' },
  { id: 'par', label: 'Paris' }
];

test.describe('<sui-select> accessible name (shadow root)', () => {
  test.beforeEach(async ({ page }) => {
    await bootBundle(page);
    await page.evaluate((items) => {
      Reflect.set(window, '__items', items);
    }, cities);
  });

  const mount = (page: Page, html: string): Promise<void> =>
    page.evaluate((markup) => {
      document.body.innerHTML = markup;
      for (const element of document.querySelectorAll('sui-select')) {
        Reflect.set(element, 'items', Reflect.get(window, '__items'));
      }
    }, html);

  test('the aria-label attribute names the combobox INSIDE the shadow root, not just the host', async ({
    page
  }) => {
    await mount(
      page,
      '<sui-select id="s" aria-label="Shipping city" placeholder="Pick"></sui-select>'
    );

    const combobox = page.locator('#s').locator('[role="combobox"]');
    await expect(combobox).toHaveAttribute('aria-label', 'Shipping city');
    await expect(page.getByRole('combobox', { name: 'Shipping city' })).toBeVisible();
    // The name sits on the real control in the shadow tree: the host's own attribute
    // is a separate thing and would not have named it.
    expect(await combobox.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      true
    );
  });

  test('aria-labelledby resolves a light-DOM label and applies its text to the combobox', async ({
    page
  }) => {
    await mount(
      page,
      '<span id="lbl">Country of residence</span><sui-select id="s" aria-labelledby="lbl" placeholder="Pick"></sui-select>'
    );

    await expect(page.getByRole('combobox', { name: 'Country of residence' })).toBeVisible();
    // The raw id must not be what names it: an id cannot cross the shadow boundary.
    await expect(page.locator('#s').locator('[role="combobox"]')).not.toHaveAttribute(
      'aria-labelledby',
      /./
    );
  });

  test('a field name follows adoption into another document, edits and return to its original root', async ({
    page
  }) => {
    await mount(
      page,
      '<span id="frame-label">Parent country</span><sui-select id="frame-select" aria-labelledby="frame-label" placeholder="Pick"></sui-select><iframe id="label-frame"></iframe>'
    );
    const original = page.locator('#frame-select').getByRole('combobox');
    await expect(original).toHaveAccessibleName('Parent country');
    await page.evaluate(() => {
      const iframe = document.getElementById('label-frame');
      const select = document.getElementById('frame-select');
      if (
        !(iframe instanceof HTMLIFrameElement) ||
        iframe.contentDocument === null ||
        select === null
      ) {
        throw new Error('Frame fixture is missing');
      }
      const label = iframe.contentDocument.createElement('span');
      label.id = 'frame-label';
      label.textContent = 'Frame country';
      iframe.contentDocument.body.append(label, select);
    });
    const adopted = page
      .frameLocator('#label-frame')
      .locator('#frame-select')
      .getByRole('combobox');
    await expect(adopted).toHaveAccessibleName('Frame country');
    await adopted.evaluate((element) => {
      const label = element.ownerDocument.getElementById('frame-label');
      if (label !== null) {
        label.textContent = 'Edited frame country';
      }
    });
    await expect(adopted).toHaveAccessibleName('Edited frame country');
    await page.evaluate(() => {
      const iframe = document.getElementById('label-frame');
      if (!(iframe instanceof HTMLIFrameElement)) {
        throw new Error('Frame fixture is missing');
      }
      const select = iframe.contentDocument?.getElementById('frame-select');
      if (select !== null && typeof select !== 'undefined') {
        document.body.appendChild(select);
      }
    });
    await expect(original).toHaveAccessibleName('Parent country');
  });

  test('aria-labelledby resolves inside an enclosing shadow root as well', async ({ page }) => {
    await page.evaluate((items) => {
      const outer = document.createElement('div');
      document.body.replaceChildren(outer);
      const root = outer.attachShadow({ mode: 'open' });
      root.innerHTML =
        '<span id="inner-label">Nested label</span><sui-select id="s" aria-labelledby="inner-label"></sui-select>';
      const select = root.getElementById('s');
      if (select !== null) {
        Reflect.set(select, 'items', items);
      }
    }, cities);

    await expect(page.getByRole('combobox', { name: 'Nested label' })).toBeVisible();
  });

  test('a referenced field name follows a WC host moved across roots and later label edits', async ({
    page
  }) => {
    await mount(
      page,
      '<span id="moving-label">Outside country</span><sui-select id="moving-select" aria-labelledby="moving-label" placeholder="Pick"></sui-select>'
    );
    const control = page.locator('#moving-select').getByRole('combobox');
    await expect(control).toHaveAccessibleName('Outside country');
    await page.evaluate(() => {
      const holder = document.createElement('div');
      holder.id = 'moving-holder';
      const root = holder.attachShadow({ mode: 'open' });
      root.innerHTML = '<span id="moving-label">Inside country</span>';
      document.body.appendChild(holder);
      const select = document.getElementById('moving-select');
      if (select !== null) {
        root.appendChild(select);
      }
    });
    await expect(control).toHaveAccessibleName('Inside country');
    await page.evaluate(() => {
      const label = document
        .querySelector('#moving-holder')
        ?.shadowRoot?.getElementById('moving-label');
      if (label !== null && typeof label !== 'undefined') {
        label.textContent = 'Updated inside country';
      }
    });
    await expect(control).toHaveAccessibleName('Updated inside country');
    await page.evaluate(() => {
      const select = document
        .querySelector('#moving-holder')
        ?.shadowRoot?.getElementById('moving-select');
      if (select !== null && typeof select !== 'undefined') {
        document.body.appendChild(select);
      }
    });
    await expect(control).toHaveAccessibleName('Outside country');
  });

  test('the name follows a label that is edited, replaced, or rendered after the element', async ({
    page
  }) => {
    await mount(page, '<sui-select id="s" aria-labelledby="late" placeholder="Pick"></sui-select>');
    await expect(page.locator('#s').locator('[role="combobox"]')).not.toHaveAttribute(
      'aria-label',
      /./
    );

    await page.evaluate(() => {
      const label = document.createElement('span');
      label.id = 'late';
      label.textContent = 'Arrived later';
      document.body.prepend(label);
    });
    await expect(page.getByRole('combobox', { name: 'Arrived later' })).toBeVisible();

    await page.evaluate(() => {
      const label = document.getElementById('late');
      if (label !== null) {
        label.textContent = 'Edited';
      }
    });
    await expect(page.getByRole('combobox', { name: 'Edited' })).toBeVisible();

    await page.evaluate(() => {
      document.getElementById('late')?.remove();
      const replacement = document.createElement('span');
      replacement.id = 'late';
      replacement.textContent = 'Replaced';
      document.body.prepend(replacement);
    });
    await expect(page.getByRole('combobox', { name: 'Replaced' })).toBeVisible();
  });

  test('aria-label wins over aria-labelledby, and the JS properties do not touch the platform accessors', async ({
    page
  }) => {
    await mount(
      page,
      '<span id="lbl">From label</span><sui-select id="s" aria-label="Explicit" aria-labelledby="lbl"></sui-select>'
    );
    await expect(page.getByRole('combobox', { name: 'Explicit' })).toBeVisible();

    const result = await page.evaluate(() => {
      const element = document.getElementById('s');
      if (element === null) {
        throw new Error('missing');
      }
      Reflect.set(element, 'selectAriaLabel', 'Via property');
      return {
        prop: Reflect.get(element, 'selectAriaLabel'),
        platform: element.ariaLabel,
        attribute: element.getAttribute('aria-label')
      };
    });
    // The component prop is the renamed one; `ariaLabel` stays the platform's.
    expect(result.prop).toBe('Via property');
    expect(result.platform).toBe(result.attribute);
    await expect(page.getByRole('combobox', { name: 'Via property' })).toBeVisible();
  });

  test('a Select given no name is not given an invented one', async ({ page }) => {
    await mount(page, '<sui-select id="s" placeholder="Pick"></sui-select>');

    const combobox = page.locator('#s').locator('[role="combobox"]');
    await expect(combobox).not.toHaveAttribute('aria-label', /./);
    await expect(combobox).not.toHaveAttribute('aria-labelledby', /./);
  });

  test('searchable names the combobox, the in-trigger input and the opened listbox', async ({
    page
  }) => {
    await mount(
      page,
      '<sui-select id="s" aria-label="Search city" searchable placeholder="Type"></sui-select>'
    );

    const host = page.locator('#s');
    await expect(host.getByRole('textbox', { name: 'Search city' })).toBeVisible();
    await expect(host.getByRole('combobox', { name: 'Search city' })).toBeVisible();
    await host.getByRole('textbox').click();
    await expect(host.getByRole('listbox', { name: 'Search city' })).toBeVisible();
  });

  test('stays named when selected, multiple, invalid and disabled, and keyboard selection works', async ({
    page
  }) => {
    await mount(
      page,
      `<sui-select id="single" aria-label="City" placeholder="Pick"></sui-select>
       <sui-select id="multi" aria-label="Cities" multiple placeholder="Pick"></sui-select>
       <sui-select id="bad" aria-label="Billing city" error error-message="Required"></sui-select>
       <sui-select id="off" aria-label="Locked city" disabled></sui-select>`
    );

    const single = page.locator('#single').locator('[role="combobox"]');
    await single.focus();
    await page.keyboard.press('ArrowDown');
    await expect(single).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(single).toContainText('New York');
    await expect(page.getByRole('combobox', { name: 'City', exact: true })).toBeVisible();

    const multi = page.locator('#multi').locator('[role="combobox"]');
    await multi.click();
    await page.locator('#multi').getByRole('option', { name: 'Tokyo' }).click();
    await expect(page.getByRole('combobox', { name: 'Cities', exact: true })).toContainText(
      'Tokyo'
    );

    await expect(page.getByRole('combobox', { name: 'Billing city' })).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    await expect(page.getByRole('combobox', { name: 'Locked city' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  test('the browser accessibility tree names the shadow combobox (Chromium native tree)', async ({
    page,
    browserName
  }) => {
    test.skip(
      browserName !== 'chromium',
      'The native accessibility tree is read over CDP, which only Chromium exposes'
    );
    await mount(
      page,
      '<span id="lbl">Country</span><sui-select id="a" aria-labelledby="lbl"></sui-select><sui-select id="b" aria-label="Shipping city" searchable></sui-select>'
    );
    const client = await page.context().newCDPSession(page);
    await client.send('Accessibility.enable');
    await expect
      .poll(async () => {
        const { nodes } = await client.send('Accessibility.getFullAXTree');
        return nodes
          .filter((node) => !node.ignored && node.role?.value === 'combobox')
          .map((node) => node.name?.value ?? '')
          .sort();
      })
      .toEqual(['Country', 'Shipping city']);
  });
});
