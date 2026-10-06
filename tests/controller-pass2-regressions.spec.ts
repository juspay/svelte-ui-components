import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated, waitForIntendedFonts } from './support/hydrated';

async function loadWc(page: Page): Promise<void> {
  await gotoHydrated(page, '/components/scroller');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => Boolean(customElements.get('sui-select')));
}

for (const shadow of [false, true]) {
  test(`referenced-label ID resolution follows rename/reassign/swap/multiple/late insertion (${shadow ? 'shadow' : 'document'})`, async ({
    page
  }) => {
    await loadWc(page);
    await page.evaluate((shadow) => {
      const mount = document.createElement('div');
      mount.id = 'id-test';
      mount.style.cssText = 'position:relative;z-index:100000;background:white;padding:12px';
      document.body.prepend(mount);
      const root = shadow ? mount.attachShadow({ mode: 'open' }) : mount;
      root.innerHTML =
        '<span id="label-a">Original country</span><span id="label-b">Replacement country</span><sui-select id="named-select" aria-labelledby="label-a"></sui-select>';
      const host = root.querySelector('sui-select');
      Object.assign(host!, {
        items: [
          { label: 'India', id: 'in' },
          { label: 'Japan', id: 'jp' }
        ]
      });
    }, shadow);
    const control = page.locator('#id-test sui-select').getByRole('combobox');
    await expect(control).toHaveAccessibleName('Original country');
    const editIds = async (action: string) =>
      page.evaluate(
        ({ shadow, action }) => {
          const mount = document.getElementById('id-test')!;
          const root = shadow ? mount.shadowRoot! : mount;
          const old = root.querySelector('#label-a');
          if (action === 'rename') {
            old!.id = 'retired';
          }
          if (action === 'reassign') {
            root.querySelector('#label-b')!.id = 'label-a';
          }
          if (action === 'swap') {
            root.querySelector('#label-a')!.id = 'label-b';
            root.querySelector('#retired')!.id = 'label-a';
          }
          if (action === 'multiple') {
            root.querySelector('sui-select')!.setAttribute('aria-labelledby', 'label-a label-b');
          }
          if (action === 'remove') {
            root.querySelector('#label-a')!.remove();
          }
          if (action === 'late') {
            const label = document.createElement('span');
            label.id = 'label-a';
            label.textContent = 'Late country';
            root.prepend(label);
          }
        },
        { shadow, action }
      );
    await editIds('rename');
    await expect(control).not.toHaveAccessibleName('Original country');
    await editIds('reassign');
    await expect(control).toHaveAccessibleName('Replacement country');
    await editIds('swap');
    await expect(control).toHaveAccessibleName('Original country');
    await editIds('multiple');
    await expect(control).toHaveAccessibleName('Original country Replacement country');
    await editIds('remove');
    await expect(control).toHaveAccessibleName('Replacement country');
    await editIds('late');
    await expect(control).toHaveAccessibleName('Late country Replacement country');
    await control.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(control).toContainText(/India|Japan/);
    await expect(control).toHaveAccessibleName('Late country Replacement country');
  });
}

for (const axis of ['horizontal', 'vertical'] as const) {
  for (const enclosing of [false, true]) {
    test(`WC no-arrow ${axis} responds to inherited fieldset disabledness (${enclosing ? 'ancestor' : 'content'})`, async ({
      page
    }) => {
      await loadWc(page);
      await page.evaluate(
        ({ axis, enclosing }) => {
          const mount = document.createElement('div');
          mount.style.cssText =
            'position:relative;z-index:100000;background:white;padding:12px;width:500px';
          mount.id = 'fieldset-test';
          const content = `<div style="flex:none;${axis === 'horizontal' ? 'width:1600px' : 'height:1600px'}">Wide content <button id="inside-control">Inside</button></div>`;
          mount.innerHTML = `<button id="before-region">Before</button>${enclosing ? '<fieldset id="inherited" disabled style="min-width:0;width:100%;box-sizing:border-box">' : ''}<sui-scroller id="inherited-scroller" aria-label="Disabled fieldset content" style="width:450px;--scroller-height:180px">${enclosing ? content : `<fieldset id="inherited" disabled>${content}</fieldset>`}</sui-scroller>${enclosing ? '</fieldset>' : ''}<button id="after-region">After</button>`;
          document.body.prepend(mount);
          Object.assign(mount.querySelector('sui-scroller')!, {
            direction: axis,
            showArrows: false,
            hideArrowsOnTouch: false
          });
        },
        { axis, enclosing }
      );
      const region = page.locator('#inherited-scroller .scroll-container');
      await expect
        .poll(() =>
          region.evaluate(
            (el, axis) =>
              axis === 'horizontal'
                ? el.scrollWidth - el.clientWidth
                : el.scrollHeight - el.clientHeight,
            axis
          )
        )
        .toBeGreaterThan(1);
      await expect(region).toHaveAttribute('tabindex', '0');
      await page.locator('#before-region').focus();
      await page.keyboard.press('Tab');
      await expect(region).toBeFocused();
      await page.keyboard.press(axis === 'horizontal' ? 'ArrowRight' : 'ArrowDown');
      await expect
        .poll(() =>
          region.evaluate(
            (el, axis) => (axis === 'horizontal' ? el.scrollLeft : el.scrollTop),
            axis
          )
        )
        .toBeGreaterThan(0);
      await page.keyboard.press('Tab');
      await expect(page.locator('#after-region')).toBeFocused();
      await page.locator('#inherited').evaluate((el) => {
        (el as HTMLFieldSetElement).disabled = false;
      });
      await expect(region).toHaveAttribute('tabindex', '-1');
      await page.locator('#before-region').focus();
      await page.keyboard.press('Tab');
      await expect(page.locator('#inside-control')).toBeFocused();
      await page.locator('#inherited').evaluate((el) => {
        (el as HTMLFieldSetElement).disabled = true;
      });
      await expect(region).toHaveAttribute('tabindex', '0');
      await page
        .locator('#inherited')
        .evaluate((el) =>
          el.insertAdjacentHTML(
            'afterbegin',
            '<legend><button id="legend-control">Legend action</button></legend>'
          )
        );
      await expect(region).toHaveAttribute('tabindex', enclosing ? '0' : '-1');
      await page.locator('#before-region').focus();
      await page.keyboard.press('Tab');
      await expect(page.locator('#legend-control')).toBeFocused();
      if (enclosing) {
        await page.evaluate(() => {
          document.querySelector('#legend-control')!.closest('legend')!.remove();
          const next = document.createElement('fieldset');
          next.id = 'moved-fieldset';
          next.style.cssText = 'min-width:0;width:100%;box-sizing:border-box';
          document.getElementById('fieldset-test')!.append(next);
          next.append(document.getElementById('inherited-scroller')!);
        });
        await expect(region).toHaveAttribute('tabindex', '-1');
        await page.locator('#after-region').focus();
        await page.keyboard.press('Tab');
        await expect(page.locator('#inside-control')).toBeFocused();
        await page.locator('#moved-fieldset').evaluate((el) => {
          (el as HTMLFieldSetElement).disabled = true;
        });
        await expect(region).toHaveAttribute('tabindex', '0');
        await page.locator('#after-region').focus();
        await page.keyboard.press('Tab');
        await expect(region).toBeFocused();
      }
    });
  }
}

for (const tag of ['sui-checkbox', 'sui-toggle']) {
  test(`${tag} public checked, native state and explicit FormData agree after user and reset`, async ({
    page
  }) => {
    await loadWc(page);
    await page.evaluate((tag) => {
      const form = document.createElement('form');
      form.id = 'checked-form';
      form.style.cssText = 'position:relative;z-index:100000;background:white;padding:12px';
      form.innerHTML = `<button type="button" id="before-check">Before</button><${tag} id="checked-host" text="Audit check" name="audit-check" value="yes"></${tag}>`;
      document.body.prepend(form);
      Object.assign(form.querySelector(tag)!, { checked: false });
    }, tag);
    const host = page.locator('#checked-host');
    const input = host.locator('input[type="checkbox"]');
    const control = tag === 'sui-checkbox' ? host.getByRole('checkbox') : input;
    const formValue = () =>
      page
        .locator('#checked-form')
        .evaluate((el) => new FormData(el as HTMLFormElement).get('audit-check'));
    await expect(input).not.toBeChecked();
    await page.locator('#before-check').focus();
    await page.keyboard.press('Tab');
    await expect(control).toBeFocused();
    await page.keyboard.press('Space');
    await expect(input).toBeChecked();
    await expect
      .poll(() => host.evaluate((el) => (el as HTMLElement & { checked: boolean }).checked))
      .toBe(true);
    await expect.poll(formValue).toBe('yes');
    await host.evaluate((el) => {
      (el as HTMLElement & { checked: boolean }).checked = false;
    });
    await expect(input).not.toBeChecked();
    await expect.poll(formValue).toBeNull();
    await host.evaluate((el) => {
      (el as HTMLElement & { checked: boolean }).checked = true;
    });
    await expect(input).toBeChecked();
    await expect.poll(formValue).toBe('yes');
    await host.evaluate((el) => {
      (el as HTMLElement & { checked: boolean }).checked = false;
    });
    await expect(input).not.toBeChecked();
    await (tag === 'sui-checkbox' ? control : host.locator('.slider')).click();
    await expect(input).toBeChecked();
    await page.locator('#checked-form').evaluate((el) => (el as HTMLFormElement).reset());
    await expect(input).not.toBeChecked();
    await expect.poll(formValue).toBeNull();
    await host.evaluate((el) => el.setAttribute('checked', ''));
    await expect(input).toBeChecked();
    await host.evaluate((el) => el.removeAttribute('checked'));
    await expect(input).not.toBeChecked();
  });
}

for (const component of ['checkbox', 'toggle']) {
  test(`Svelte ${component} parent binding follows native activation and parent reset`, async ({
    page
  }) => {
    await gotoHydrated(page, `/components/${component}`);
    const wrapper = page.getByTestId(
      component === 'checkbox' ? 'checkbox-default' : 'toggle-bound'
    );
    const control =
      component === 'checkbox' ? wrapper.getByRole('checkbox') : wrapper.locator('input');
    const state = page.getByTestId(`${component}-bound-state`);
    await control.focus();
    await page.keyboard.press('Space');
    await expect(state).toHaveText(component === 'checkbox' ? 'Bound checked: true' : 'ON');
    await page.getByTestId(`${component}-bound-reset`).click();
    await expect(state).toHaveText(component === 'checkbox' ? 'Bound checked: false' : 'OFF');
    await expect(wrapper.locator('input')).not.toBeChecked();
  });
}

for (const tag of ['sui-checkbox', 'sui-toggle']) {
  test(`${tag} disabled/required and callback/event ownership`, async ({ page }) => {
    await loadWc(page);
    await page.evaluate((tag) => {
      const form = document.createElement('form');
      form.id = 'contract-form';
      form.innerHTML = `<${tag} id="contract-check" text="Contract check" name="contract" value="yes" required></${tag}>`;
      document.body.prepend(form);
      const host = form.querySelector(tag)!;
      const events: string[] = [];
      Object.assign(window, { contractEvents: events });
      Reflect.set(host, 'onclick', (checked: boolean) => events.push(`callback:${checked}`));
      host.addEventListener('input', (event) => events.push(`input:${event.composed}`));
      host.addEventListener('change', (event) => events.push(`change:${event.composed}`));
    }, tag);
    const host = page.locator('#contract-check');
    const input = host.locator('input');
    const control = tag === 'sui-checkbox' ? host.getByRole('checkbox') : input;
    const valid = () =>
      page.locator('#contract-form').evaluate((el) => (el as HTMLFormElement).checkValidity());
    await expect.poll(valid).toBe(false);
    await control.focus();
    await page.keyboard.press('Space');
    await expect(input).toBeChecked();
    await expect.poll(valid).toBe(true);
    const events = await page.evaluate(() => Reflect.get(window, 'contractEvents'));
    // Checkbox forwards its documented composed input/change pair. Toggle keeps
    // native input composed and native change confined to the shadow root.
    expect(events).toEqual(
      tag === 'sui-checkbox'
        ? ['callback:true', 'input:true', 'change:true']
        : ['callback:true', 'input:true']
    );
    await host.evaluate((el) => {
      Reflect.set(el, 'disabled', true);
    });
    await expect(input).toBeDisabled();
    await expect
      .poll(() =>
        page
          .locator('#contract-form')
          .evaluate((el) => new FormData(el as HTMLFormElement).get('contract'))
      )
      .toBeNull();
    await host.evaluate((el) => {
      Reflect.set(el, 'checked', false);
    });
    await expect(input).not.toBeChecked();
    await expect.poll(valid).toBe(true);
    await host.evaluate((el) => {
      Reflect.set(el, 'disabled', false);
    });
    await expect.poll(valid).toBe(false);
  });
}

test('WC Checkbox controlled request preserves owner state; mixed reset restores authored defaults', async ({
  page
}) => {
  await loadWc(page);
  await page.evaluate(() => {
    const form = document.createElement('form');
    form.id = 'mixed-form';
    form.innerHTML =
      '<sui-checkbox id="owned-check" text="Owned check" name="owned" value="yes" controlled></sui-checkbox><sui-checkbox id="mixed-check" text="Mixed check" name="mixed" value="yes" checked indeterminate></sui-checkbox>';
    document.body.prepend(form);
    const requests: boolean[] = [];
    const events: string[] = [];
    Object.assign(window, { ownedRequests: requests, ownedEvents: events });
    const host = form.querySelector('#owned-check')!;
    Reflect.set(host, 'onclick', (next: boolean) => requests.push(next));
    host.addEventListener('input', () => events.push('input'));
    host.addEventListener('change', () => events.push('change'));
  });
  const owned = page.locator('#owned-check');
  await owned.getByRole('checkbox').focus();
  await page.keyboard.press('Space');
  await expect(owned.locator('input')).not.toBeChecked();
  expect(await owned.evaluate((el) => Reflect.get(el, 'checked'))).toBe(false);
  expect(await page.evaluate(() => Reflect.get(window, 'ownedRequests'))).toEqual([true]);
  expect(await page.evaluate(() => Reflect.get(window, 'ownedEvents'))).toEqual([]);
  await owned.evaluate((el) => {
    Reflect.set(el, 'checked', true);
  });
  await expect(owned.locator('input')).toBeChecked();
  const mixed = page.locator('#mixed-check');
  await expect(mixed.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed');
  await expect(mixed.locator('input')).not.toBeChecked();
  expect(
    await page
      .locator('#mixed-form')
      .evaluate((el) => new FormData(el as HTMLFormElement).get('mixed'))
  ).toBeNull();
  await mixed.getByRole('checkbox').click();
  await expect(mixed.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
  await page.locator('#mixed-form').evaluate((el) => (el as HTMLFormElement).reset());
  await expect(mixed.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed');
  expect(await mixed.evaluate((el) => Reflect.get(el, 'checked'))).toBe(true);
  expect(await mixed.evaluate((el) => Reflect.get(el, 'indeterminate'))).toBe(true);
});

test('AspectRatio reserved boxes use configured and invalid ratios before images load in padded flex', async ({
  page
}, testInfo) => {
  // Hold the real remote resource. Geometry must come from the box, not the image.
  const image = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64'
  );
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('https://images.unsplash.com/**', async (route) => {
    await held;
    await route.fulfill({ status: 200, contentType: 'image/png', body: image });
  });
  await gotoHydrated(page, '/components/aspect-ratio');
  await page.getByTestId('aspect-ratio-16-9-demo').evaluate(() => {
    for (const box of document.querySelectorAll<HTMLElement>('[data-pw^="aspect-ratio-"]')) {
      const parent = box.parentElement!;
      parent.style.flexDirection = 'column';
      const nested = document.createElement('div');
      nested.style.cssText =
        'display:flex;flex-direction:column;width:100%;padding:18px;box-sizing:border-box';
      parent.insertBefore(nested, box);
      nested.append(box);
    }
  });
  await waitForIntendedFonts(page);
  await testInfo.attach('font-readiness-before-image.json', {
    body: JSON.stringify(
      await page.evaluate(() => ({
        documentReadyState: document.readyState,
        fonts: [...document.fonts]
          .filter((font) => font.status === 'loaded')
          .map((font) => ({ family: font.family, status: font.status })),
        images: [...document.querySelectorAll('main img')].map((img) => ({
          complete: (img as HTMLImageElement).complete
        }))
      }))
    ),
    contentType: 'application/json'
  });
  for (const [id, ratio] of [
    ['16-9', 16 / 9],
    ['empty', 16 / 9],
    ['4-3', 4 / 3],
    ['square', 1],
    ['zero', 1],
    ['negative', 1],
    ['nan', 1],
    ['css-override', 1]
  ] as const) {
    const box = page.getByTestId(`aspect-ratio-${id}-demo`);
    const rect = await box.boundingBox();
    expect(rect).not.toBeNull();
    expect(Math.abs(rect!.height - rect!.width / ratio)).toBeLessThan(1);
  }
  release();
  await page
    .locator('main img')
    .evaluateAll((nodes) => Promise.all(nodes.map((el) => (el as HTMLImageElement).decode())));
  await waitForIntendedFonts(page);
  for (const width of [800, 320, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const rect = await page.getByTestId('aspect-ratio-16-9-demo').boundingBox();
    expect(Math.abs(rect!.height - rect!.width / (16 / 9))).toBeLessThan(1);
  }
});

for (const axis of ['horizontal', 'vertical'] as const) {
  test(`Svelte ${axis} inherited disabled content supplies an operative scroll route`, async ({
    page
  }) => {
    await gotoHydrated(page, '/components/scroller');
    const region = page.getByTestId(`fieldset-scroller-${axis}`).locator('.scroll-container');
    await expect(region).toHaveAttribute('tabindex', '0');
    await page.getByTestId(`fieldset-before-${axis}`).focus();
    await page.keyboard.press('Tab');
    await expect(region).toBeFocused();
    await page.keyboard.press(axis === 'horizontal' ? 'ArrowRight' : 'ArrowDown');
    await expect
      .poll(() =>
        region.evaluate((el, axis) => (axis === 'horizontal' ? el.scrollLeft : el.scrollTop), axis)
      )
      .toBeGreaterThan(0);
    await page.getByTestId('fieldset-enabled-toggle').click();
    await expect(region).toHaveAttribute('tabindex', '-1');
    await page.getByTestId(`fieldset-before-${axis}`).focus();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId(`fieldset-inside-${axis}`)).toBeFocused();
    await page.getByTestId('fieldset-enabled-toggle').click();
    await expect(region).toHaveAttribute('tabindex', '0');
    await page.getByTestId('fieldset-legend-toggle').click();
    await expect(region).toHaveAttribute('tabindex', '-1');
    await page.getByTestId(`fieldset-before-${axis}`).focus();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId(`fieldset-legend-${axis}`)).toBeFocused();
  });
}
