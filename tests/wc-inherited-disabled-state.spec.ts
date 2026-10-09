import { expect, test } from '@playwright/test';
const tags = [
  'sui-input',
  'sui-checkbox',
  'sui-toggle',
  'sui-radio',
  'sui-slider',
  'sui-choicebox',
  'sui-rating-group',
  'sui-select',
  'sui-combobox'
];
for (const tag of tags) {
  test(`${tag} inherited disabling preserves requested host state across author changes and reconnect`, async ({
    page
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    await page.addScriptTag({
      path: process.env.RADIO_WC_BUNDLE ?? 'dist-wc/index.js',
      type: 'module'
    });
    await page.waitForFunction((tag) => Boolean(customElements.get(tag)), tag);
    await page.evaluate((tag) => {
      const form = document.createElement('form');
      form.id = 'inherited-state';
      form.innerHTML = '<fieldset disabled></fieldset>';
      const host = document.createElement(tag);
      host.id = 'state-host';
      host.setAttribute('name', 'field');
      host.setAttribute('aria-label', 'Field');
      host.textContent = 'Field';
      const prop = tag === 'sui-input' ? 'disable' : 'disabled';
      Object.assign(host, { [prop]: false, text: 'Field' });
      if (tag === 'sui-radio') {
        Object.assign(host, { value: 'one', selectedValue: 'ghost' });
      }
      if (tag === 'sui-slider' || tag === 'sui-rating-group') {
        Reflect.set(host, 'value', 2);
      }
      if (tag === 'sui-choicebox') {
        Reflect.set(host, 'mode', 'checkbox');
      }
      if (tag === 'sui-select' || tag === 'sui-combobox') {
        Reflect.set(host, 'items', [
          { id: 'a', label: 'Alpha' },
          { id: 'b', label: 'Beta' }
        ]);
        Reflect.set(
          host,
          tag === 'sui-select' ? 'value' : 'value',
          tag === 'sui-select' ? ['a'] : 'a'
        );
      }
      form.querySelector('fieldset')!.append(host);
      document.querySelector('main')!.prepend(form);
    }, tag);
    const host = page.locator(`${tag}#state-host`);
    await expect
      .poll(() => host.evaluate((host) => Boolean(host.shadowRoot?.children.length)))
      .toBe(true);
    const measure = () =>
      host.evaluate(
        (host, tag) => ({
          requested: Reflect.get(host, tag === 'sui-input' ? 'disable' : 'disabled'),
          disabledAttr: host.getAttribute('disabled'),
          disableAttr: host.getAttribute('disable'),
          nativeDisabled: host.matches(':disabled')
        }),
        tag
      );
    await expect
      .poll(measure)
      .toEqual({ requested: false, disabledAttr: null, disableAttr: null, nativeDisabled: true });
    await host.evaluate(
      (host, tag) => Reflect.set(host, tag === 'sui-input' ? 'disable' : 'disabled', true),
      tag
    );
    await expect
      .poll(measure)
      .toEqual({ requested: true, disabledAttr: null, disableAttr: null, nativeDisabled: true });
    await page
      .locator('fieldset')
      .evaluate((fieldset) => ((fieldset as HTMLFieldSetElement).disabled = false));
    await expect
      .poll(measure)
      .toEqual({ requested: true, disabledAttr: null, disableAttr: null, nativeDisabled: false });
    await host.evaluate(
      (host, tag) => Reflect.set(host, tag === 'sui-input' ? 'disable' : 'disabled', false),
      tag
    );
    await expect
      .poll(measure)
      .toEqual({ requested: false, disabledAttr: null, disableAttr: null, nativeDisabled: false });
    await page
      .locator('fieldset')
      .evaluate((fieldset) => ((fieldset as HTMLFieldSetElement).disabled = true));
    await host.evaluate((host) => {
      host.remove();
      document.querySelector('fieldset')!.append(host);
    });
    await expect
      .poll(measure)
      .toEqual({ requested: false, disabledAttr: null, disableAttr: null, nativeDisabled: true });
    await host.evaluate((host, tag) => {
      Reflect.set(host, 'classes', 'rerendered');
      if (tag === 'sui-rating-group') {
        Reflect.set(host, 'max', 7);
      }
      if (tag === 'sui-select' || tag === 'sui-combobox') {
        Reflect.set(host, 'items', [
          { id: 'a', label: 'Alpha' },
          { id: 'b', label: 'Beta' },
          { id: 'c', label: 'Gamma' }
        ]);
      }
    }, tag);
    await expect
      .poll(measure)
      .toEqual({ requested: false, disabledAttr: null, disableAttr: null, nativeDisabled: true });
    await page
      .locator('fieldset')
      .evaluate((fieldset) => ((fieldset as HTMLFieldSetElement).disabled = false));
    await expect
      .poll(measure)
      .toEqual({ requested: false, disabledAttr: null, disableAttr: null, nativeDisabled: false });
  });
}

for (const tag of tags) {
  test(`${tag} target-document registration and connected adoption retain inherited disabling`, async ({
    page
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    await page.evaluate(async () => {
      const frame = document.createElement('iframe');
      frame.id = 'disabled-frame';
      document.querySelector('main')!.prepend(frame);
      await new Promise<void>((resolve) => {
        frame.onload = () => resolve();
        frame.srcdoc =
          '<!doctype html><button id="target-before">Before</button><form><fieldset></fieldset></form><button id="target-after">After</button>';
      });
    });
    const handle = await page.locator('#disabled-frame').elementHandle();
    const frame = await handle?.contentFrame();
    if (!frame) {
      throw new Error('Target iframe unavailable');
    }
    await frame.addScriptTag({
      path: process.env.RADIO_WC_BUNDLE ?? 'dist-wc/index.js',
      type: 'module'
    });
    await frame.waitForFunction((tag) => Boolean(customElements.get(tag)), tag);
    await frame.evaluate((tag) => {
      class AdoptionControl extends HTMLElement {
        static formAssociated = true;
        constructor() {
          super();
          this.attachInternals();
        }
        get adoptionMarker(): boolean {
          return true;
        }
      }
      customElements.define('disabled-adoption-control', AdoptionControl);
      const control = document.createElement('disabled-adoption-control');
      control.id = 'adoption-control';
      document.querySelector('fieldset')!.append(control);
      const host = document.createElement(tag);
      host.id = 'adopted-disabled';
      host.textContent = 'Field';
      host.setAttribute('name', 'field');
      Object.assign(host, { ariaLabel: 'Field', text: 'Field' });
      if (tag === 'sui-radio') {
        Object.assign(host, { value: 'one', selectedValue: 'one' });
      }
      if (tag === 'sui-choicebox') {
        Reflect.set(host, 'mode', 'checkbox');
      }
      if (tag === 'sui-select' || tag === 'sui-combobox') {
        Object.assign(host, {
          items: [{ id: 'a', label: 'Alpha' }],
          value: tag === 'sui-select' ? ['a'] : 'a'
        });
      }
      document.querySelector('fieldset')!.append(host);
    }, tag);
    await expect
      .poll(() =>
        frame
          .locator(`${tag}#adopted-disabled`)
          .evaluate((host) => Boolean(host.shadowRoot?.children.length))
      )
      .toBe(true);
    await frame.locator('fieldset').evaluate((node) => {
      (node as HTMLFieldSetElement).disabled = true;
    });
    await frame.locator('#target-before').click();
    await page.keyboard.press('Tab');
    await expect(frame.locator('#target-after')).toBeFocused();
    await page.evaluate(() => {
      const target = (document.querySelector('#disabled-frame') as HTMLIFrameElement)
        .contentDocument!;
      const section = document.createElement('section');
      section.id = 'adopted-section';
      section.innerHTML =
        '<button id="adopted-before">Before</button><form><fieldset disabled></fieldset></form><button id="adopted-after">After</button>';
      section
        .querySelector('fieldset')!
        .append(document.adoptNode(target.querySelector('#adopted-disabled')!));
      section
        .querySelector('fieldset')!
        .append(document.adoptNode(target.querySelector('#adoption-control')!));
      document.querySelector('main')!.prepend(section);
    });
    const nativePrototypeSurvives = await page
      .locator('#adoption-control')
      .evaluate((control) => Reflect.get(control, 'adoptionMarker') === true);
    test.skip(
      !nativePrototypeSurvives,
      'OBS029: the native form-associated custom-element comparator loses its target-document prototype on adoption'
    );
    const host = page.locator(`${tag}#adopted-disabled`);
    await expect.poll(() => host.evaluate((host) => host.matches(':disabled'))).toBe(true);
    await page.locator('#adopted-before').click();
    await page.keyboard.press('Tab');
    await expect(page.locator('#adopted-after')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#adopted-before')).toBeFocused();
    await page.locator('#adopted-section fieldset').evaluate((node) => {
      (node as HTMLFieldSetElement).disabled = false;
    });
    await page.keyboard.press('Tab');
    await expect
      .poll(() => host.evaluate((host) => host.shadowRoot?.activeElement !== null))
      .toBe(true);
    expect(
      await host.evaluate(
        (host, tag) => ({
          requested: Reflect.get(host, tag === 'sui-input' ? 'disable' : 'disabled') ?? false,
          disabled: host.getAttribute('disabled'),
          disable: host.getAttribute('disable')
        }),
        tag
      )
    ).toEqual({ requested: false, disabled: null, disable: null });
  });
}

for (const tag of ['sui-select', 'sui-combobox']) {
  test(`${tag} an open control can escape and tab out after inherited disabling`, async ({
    page
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    await page.addScriptTag({
      path: process.env.RADIO_WC_BUNDLE ?? 'dist-wc/index.js',
      type: 'module'
    });
    await page.waitForFunction((tag) => Boolean(customElements.get(tag)), tag);
    await page.evaluate((tag) => {
      const section = document.createElement('section');
      section.id = 'escape-section';
      section.innerHTML =
        '<button id="escape-before">Before</button><form><fieldset></fieldset></form><button id="escape-after">After</button>';
      const host = document.createElement(tag);
      host.id = 'escape-host';
      Object.assign(host, {
        ariaLabel: 'Field',
        items: [
          { id: 'a', label: 'Alpha' },
          { id: 'b', label: 'Beta' }
        ],
        value: tag === 'sui-select' ? ['a'] : 'a'
      });
      section.querySelector('fieldset')!.append(host);
      document.querySelector('main')!.prepend(section);
    }, tag);
    const actor = page.locator('#escape-host').getByRole('combobox');
    await page.locator('#escape-before').click();
    await page.keyboard.press('Tab');
    await expect(actor).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#escape-host').getByRole('listbox')).toBeVisible();
    await page.locator('#escape-section fieldset').evaluate((node) => {
      (node as HTMLFieldSetElement).disabled = true;
    });
    await page.keyboard.press('Escape');
    await expect(page.locator('#escape-host').getByRole('listbox')).toHaveCount(0);
    await page.keyboard.press('Tab');
    await expect(page.locator('#escape-after')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#escape-before')).toBeFocused();
  });
}

for (const tag of tags) {
  test(`${tag} synchronous fieldset reenable restores contribution and required validity`, async ({
    page
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    await page.addScriptTag({
      path: process.env.RADIO_WC_BUNDLE ?? 'dist-wc/index.js',
      type: 'module'
    });
    await page.waitForFunction((tag) => Boolean(customElements.get(tag)), tag);
    await page.evaluate((tag) => {
      const form = document.createElement('form');
      form.id = 'timing-form';
      form.innerHTML = '<fieldset><input name="raw" value="seed" required></fieldset>';
      const host = document.createElement(tag);
      host.id = 'timing-host';
      host.setAttribute('name', 'wc');
      host.setAttribute('required', '');
      host.textContent = 'Field';
      Object.assign(host, { value: 'seed', text: 'Field' });
      if (tag === 'sui-checkbox' || tag === 'sui-toggle') {
        Object.assign(host, { checked: true });
      }
      if (tag === 'sui-choicebox') {
        Object.assign(host, { mode: 'checkbox', selected: true });
      }
      if (tag === 'sui-radio') {
        Object.assign(host, { selectedValue: 'seed' });
      }
      if (tag === 'sui-slider' || tag === 'sui-rating-group') {
        Reflect.set(host, 'value', 2);
      }
      if (tag === 'sui-select' || tag === 'sui-combobox') {
        Object.assign(host, {
          items: [{ id: 'seed', label: 'Seed' }],
          value: tag === 'sui-select' ? ['seed'] : 'seed'
        });
      }
      form.querySelector('fieldset')!.append(host);
      document.querySelector('main')!.prepend(form);
    }, tag);
    const expected = tag === 'sui-slider' || tag === 'sui-rating-group' ? '2' : 'seed';
    const read = () =>
      page.locator('#timing-form').evaluate((node) => {
        const form = node as HTMLFormElement;
        return { entries: [...new FormData(form)], valid: form.checkValidity() };
      });
    await expect.poll(read).toEqual({
      entries: [
        ['raw', 'seed'],
        ['wc', expected]
      ],
      valid: true
    });
    const disabled = await page.locator('#timing-form').evaluate((node) => {
      const form = node as HTMLFormElement;
      form.querySelector('fieldset')!.disabled = true;
      return { entries: [...new FormData(form)], valid: form.checkValidity() };
    });
    expect(disabled).toEqual({ entries: [], valid: true });
    await expect
      .poll(() =>
        page
          .locator(`${tag}#timing-host`)
          .evaluate((host) => host.shadowRoot?.querySelector('input')?.disabled ?? true)
      )
      .toBe(true);
    const reenabled = await page.locator('#timing-form').evaluate((node) => {
      const form = node as HTMLFormElement;
      form.querySelector('fieldset')!.disabled = false;
      return { entries: [...new FormData(form)], valid: form.checkValidity() };
    });
    expect(reenabled).toEqual({
      entries: [
        ['raw', 'seed'],
        ['wc', expected]
      ],
      valid: true
    });
  });
}
