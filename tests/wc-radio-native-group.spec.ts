import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const bundle = process.env.RADIO_WC_BUNDLE ?? 'dist-wc/index.js';
async function load(page: Page): Promise<void> {
  await page.goto('/components/choicebox', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await page.addScriptTag({ path: bundle, type: 'module' });
  await page.waitForFunction(() => Boolean(customElements.get('sui-radio')));
}
async function group(
  page: Page,
  kind: 'wc' | 'raw',
  options: {
    external?: boolean;
    oneRequired?: boolean;
    empty?: boolean;
    fieldset?: boolean;
    legend?: boolean;
  } = {}
): Promise<void> {
  await page.evaluate(
    ({ kind, options }) => {
      const section = document.createElement('section');
      section.id = 'native-group';
      section.innerHTML =
        '<input id="before-group" aria-label="Before group"><form id="radio-form"><fieldset><legend id="first-legend">Plan</legend></fieldset><button type="submit">Submit group</button><output></output></form><input id="after-group" aria-label="After group">';
      document.querySelector('main')!.prepend(section);
      const form = section.querySelector<HTMLFormElement>('form')!;
      const fieldset = form.querySelector('fieldset')!;
      for (const [index, value] of ['basic', 'pro'].entries()) {
        const host = document.createElement(kind === 'wc' ? 'sui-radio' : 'input');
        host.id = `group-${index}`;
        host.setAttribute('name', 'plan');
        host.setAttribute('value', options.empty && index === 0 ? '' : value);
        if (!options.oneRequired || index === 0) {
          host.setAttribute('required', '');
        }
        if (kind === 'wc') {
          host.setAttribute('text', value);
          host.setAttribute('selected-value', 'ghost');
        } else {
          host.setAttribute('type', 'radio');
          host.setAttribute('aria-label', value);
        }
        const node = kind === 'raw' ? document.createElement('label') : host;
        if (kind === 'raw') {
          node.textContent = value;
          node.prepend(host);
        }
        if (options.external) {
          host.setAttribute('form', 'radio-form');
          section.append(node);
        } else if (options.legend && index === 0) {
          fieldset.querySelector('legend')!.append(node);
        } else {
          fieldset.append(node);
        }
      }
      if (options.fieldset) {
        fieldset.disabled = true;
      }
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        form.querySelector('output')!.textContent = JSON.stringify([...new FormData(form)]);
      });
    },
    { kind, options }
  );
  await expect(
    page.locator('#native-group').getByRole('radio', { name: 'basic', exact: true })
  ).toBeAttached({ timeout: 15000 });
}

for (const kind of ['wc', 'raw'] as const) {
  test(`${kind} disabled required member and disabled checked choice match native validity`, async ({
    page
  }) => {
    await load(page);
    await group(page, kind, { oneRequired: true });
    await page.locator('#group-0').evaluate((host) => host.setAttribute('disabled', ''));
    expect((await state(page)).valid).toBe(false);
    await page.evaluate((kind) => {
      const host = document.querySelector('#group-0')!;
      if (kind === 'wc') {
        Reflect.set(host, 'selectedValue', 'basic');
      } else {
        (host as HTMLInputElement).checked = true;
      }
    }, kind);
    await expect.poll(() => state(page)).toEqual({ valid: true, entries: [] });
    await page.locator('#group-0').evaluate((host) => host.removeAttribute('disabled'));
    await expect.poll(() => state(page)).toEqual({ valid: true, entries: [['plan', 'basic']] });
  });
  test(`${kind} programmatic choice is exclusive without user callbacks`, async ({ page }) => {
    await load(page);
    await group(page, kind);
    await page.evaluate((kind) => {
      const form = document.querySelector<HTMLFormElement>('#radio-form')!;
      form.dataset.changes = '0';
      for (const index of [0, 1]) {
        const host = document.querySelector(`#group-${index}`)!;
        const changed = () => {
          form.dataset.changes = String(Number(form.dataset.changes) + 1);
        };
        if (kind === 'wc') {
          Reflect.set(host, 'onchange', changed);
        } else {
          host.addEventListener('change', changed);
        }
      }
    }, kind);
    for (const index of [1, 0]) {
      await page.evaluate(
        ({ kind, index }) => {
          const host = document.querySelector(`#group-${index}`)!;
          if (kind === 'wc') {
            Reflect.set(host, 'selectedValue', index === 0 ? 'basic' : 'pro');
          } else {
            (host as HTMLInputElement).checked = true;
          }
        },
        { kind, index }
      );
      await expect
        .poll(() => state(page))
        .toEqual({ valid: true, entries: [['plan', index === 0 ? 'basic' : 'pro']] });
    }
    await expect(page.locator('#radio-form')).toHaveAttribute('data-changes', '0');
    await click(page, kind, 1);
    await expect(page.locator('#radio-form')).toHaveAttribute('data-changes', '1');
    await page.locator('#before-group').click();
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => state(page)).toEqual({ valid: true, entries: [['plan', 'basic']] });
    await expect(page.locator('#radio-form')).toHaveAttribute('data-changes', '2');
  });
  test(`${kind} moving a selected member between same-name forms respects actual owners`, async ({
    page
  }) => {
    await load(page);
    await group(page, kind);
    await click(page, kind, 1);
    await page.evaluate((kind) => {
      const form = document.createElement('form');
      form.id = 'second-form';
      const host = document.createElement(kind === 'wc' ? 'sui-radio' : 'input');
      host.id = 'third-choice';
      host.setAttribute('name', 'plan');
      host.setAttribute('value', 'third');
      host.setAttribute('required', '');
      if (kind === 'wc') {
        host.setAttribute('text', 'third');
        host.setAttribute('selected-value', 'ghost');
      } else {
        host.setAttribute('type', 'radio');
        host.setAttribute('aria-label', 'third');
      }
      form.append(host);
      document.querySelector('main')!.append(form);
    }, kind);
    await expect(page.locator('#second-form').getByRole('radio', { name: 'third' })).toBeAttached();
    expect(
      await page
        .locator('#second-form')
        .evaluate((form) => (form as HTMLFormElement).checkValidity())
    ).toBe(false);
    await page
      .locator('#second-form')
      .evaluate((form) => form.append(document.querySelector('#group-1')!));
    await expect.poll(() => state(page)).toEqual({ valid: false, entries: [] });
    await expect
      .poll(() =>
        page.locator('#second-form').evaluate((form) => ({
          valid: (form as HTMLFormElement).checkValidity(),
          entries: [...new FormData(form as HTMLFormElement)]
        }))
      )
      .toEqual({ valid: true, entries: [['plan', 'pro']] });
    if (kind === 'wc') {
      await page.locator('#third-choice label').click();
    } else {
      await page.locator('#third-choice').click();
    }
    await expect
      .poll(() =>
        page.locator('#second-form').evaluate((form) => [...new FormData(form as HTMLFormElement)])
      )
      .toEqual([['plan', 'third']]);
  });
}

test('target-document registration preserves native group validity and trusted keyboard', async ({
  page
}) => {
  await load(page);
  await page.evaluate(async () => {
    const frame = document.createElement('iframe');
    frame.id = 'radio-frame';
    document.querySelector('main')!.prepend(frame);
    await new Promise<void>((resolve) => {
      frame.onload = () => resolve();
      frame.srcdoc =
        '<!doctype html><html><body><input id="frame-before"><form id="frame-form"></form><input id="frame-after"></body></html>';
    });
  });
  const handle = await page.locator('#radio-frame').elementHandle();
  const frame = await handle?.contentFrame();
  if (frame === null || typeof frame === 'undefined') {
    throw new Error('Target iframe unavailable');
  }
  await frame.addScriptTag({ path: bundle, type: 'module' });
  await frame.waitForFunction(() => Boolean(customElements.get('sui-radio')));
  await frame.evaluate(() => {
    document.querySelector('#frame-form')!.innerHTML =
      '<sui-radio id="frame-a" name="plan" value="a" text="Alpha" required selected-value="ghost"></sui-radio><sui-radio id="frame-b" name="plan" value="b" text="Beta" required selected-value="ghost"></sui-radio>';
  });
  await expect(frame.getByRole('radio', { name: 'Beta' })).toBeAttached();
  expect(
    await frame.locator('form').evaluate((form) => (form as HTMLFormElement).checkValidity())
  ).toBe(false);
  await frame.locator('#frame-before').click();
  await page.keyboard.press('Tab');
  await expect(frame.getByRole('radio', { name: 'Alpha' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(() =>
      frame.locator('form').evaluate((form) => ({
        valid: (form as HTMLFormElement).checkValidity(),
        entries: [...new FormData(form as HTMLFormElement)]
      }))
    )
    .toEqual({ valid: true, entries: [['plan', 'b']] });
  await page.keyboard.press('Tab');
  await expect(frame.locator('#frame-after')).toBeFocused();
});

test('same-name WC groups in separate outer shadow roots stay independent', async ({ page }) => {
  await load(page);
  await page.evaluate(() => {
    for (const id of ['a', 'b']) {
      const host = document.createElement('div');
      host.id = `root-${id}`;
      document.querySelector('main')!.prepend(host);
      host.attachShadow({ mode: 'open' }).innerHTML =
        `<form><sui-radio name="plan" value="${id}" text="${id}" required selected-value="ghost"></sui-radio></form>`;
    }
  });
  for (const id of ['a', 'b']) {
    await page.locator(`#root-${id}`).locator('sui-radio label').click();
    await expect
      .poll(() =>
        page.locator(`#root-${id}`).evaluate((host) => ({
          valid: (host.shadowRoot!.querySelector('form') as HTMLFormElement).checkValidity(),
          entries: [...new FormData(host.shadowRoot!.querySelector('form') as HTMLFormElement)]
        }))
      )
      .toEqual({ valid: true, entries: [['plan', id]] });
  }
});
async function click(page: Page, kind: 'wc' | 'raw', index: number): Promise<void> {
  if (kind === 'wc') {
    await page.locator(`#group-${index} label`).click();
  } else {
    await page.locator(`#group-${index}`).click();
  }
}
const state = (page: Page) =>
  page.locator('#radio-form').evaluate((form) => ({
    valid: (form as HTMLFormElement).checkValidity(),
    entries: [...new FormData(form as HTMLFormElement)]
  }));
const checked = (page: Page, index: number) =>
  page
    .locator(`#group-${index}`)
    .evaluate(
      (host) =>
        (host.shadowRoot?.querySelector('input') as HTMLInputElement | null)?.checked ??
        (host as HTMLInputElement).checked
    );

for (const kind of ['wc', 'raw'] as const) {
  for (const oneRequired of [false, true]) {
    test(`${kind} ${oneRequired ? 'one' : 'both'} required permits either actual chosen member`, async ({
      page
    }) => {
      await load(page);
      await group(page, kind, { oneRequired });
      expect((await state(page)).valid).toBe(false);
      await click(page, kind, 0);
      await expect.poll(() => state(page)).toEqual({ valid: true, entries: [['plan', 'basic']] });
      await click(page, kind, 1);
      await expect.poll(() => state(page)).toEqual({ valid: true, entries: [['plan', 'pro']] });
      await page.getByRole('button', { name: 'Submit group', exact: true }).click();
      await expect(page.locator('#radio-form output')).toHaveText('[["plan","pro"]]');
    });
  }
  test(`${kind} external associated hosts have exclusive matching group selection`, async ({
    page
  }) => {
    await load(page);
    await group(page, kind, { external: true });
    await click(page, kind, 0);
    await click(page, kind, 1);
    await expect.poll(() => state(page)).toEqual({ valid: true, entries: [['plan', 'pro']] });
    expect(await checked(page, 0)).toBe(false);
  });
  test(`${kind} empty matching value is a real valid selection and ghost is not`, async ({
    page
  }) => {
    await load(page);
    await group(page, kind, { empty: true });
    await click(page, kind, 0);
    await expect.poll(() => state(page)).toEqual({ valid: true, entries: [['plan', '']] });
    await page.evaluate((kind) => {
      for (const index of [0, 1]) {
        const host = document.querySelector(`#group-${index}`)!;
        if (kind === 'wc') {
          Reflect.set(host, 'selectedValue', 'ghost');
        } else {
          (host as HTMLInputElement).checked = false;
        }
      }
    }, kind);
    await expect.poll(() => state(page)).toEqual({ valid: false, entries: [] });
  });
  test(`${kind} trusted Tab entry and exit follow the selected member`, async ({ page }) => {
    await load(page);
    await group(page, kind);
    await click(page, kind, 1);
    await page.locator('#before-group').click();
    await page.keyboard.press('Tab');
    await expect(
      kind === 'wc' ? page.locator('#group-1').getByRole('radio') : page.locator('#group-1')
    ).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => state(page)).toEqual({ valid: true, entries: [['plan', 'basic']] });
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Submit group', exact: true })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(
      kind === 'wc' ? page.locator('#group-0').getByRole('radio') : page.locator('#group-0')
    ).toBeFocused();
  });
  test(`${kind} reset, unknown programmatic choice and real programmatic selection retain validity`, async ({
    page
  }) => {
    await load(page);
    await group(page, kind);
    await click(page, kind, 1);
    await expect.poll(() => state(page)).toEqual({ valid: true, entries: [['plan', 'pro']] });
    await page.locator('#radio-form').evaluate((form) => (form as HTMLFormElement).reset());
    await expect.poll(() => state(page)).toEqual({ valid: false, entries: [] });
    await page.evaluate((kind) => {
      const host = document.querySelector('#group-1')!;
      if (kind === 'wc') {
        Reflect.set(host, 'selectedValue', 'pro');
      } else {
        (host as HTMLInputElement).checked = true;
      }
    }, kind);
    await expect.poll(() => state(page)).toEqual({ valid: true, entries: [['plan', 'pro']] });
  });
  test(`${kind} fieldset disabled blocks pointer, restores value and preserves legend exception`, async ({
    page
  }) => {
    await load(page);
    await group(page, kind, { fieldset: true });
    const target = kind === 'wc' ? page.locator('#group-0 label') : page.locator('#group-0');
    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    expect(await checked(page, 0)).toBe(false);
    expect(await state(page)).toEqual({ valid: true, entries: [] });
    await page
      .locator('#radio-form fieldset')
      .evaluate((fieldset) => ((fieldset as HTMLFieldSetElement).disabled = false));
    await click(page, kind, 1);
    await expect.poll(() => state(page)).toEqual({ valid: true, entries: [['plan', 'pro']] });
    await page
      .locator('#radio-form fieldset')
      .evaluate((fieldset) => ((fieldset as HTMLFieldSetElement).disabled = true));
    await expect.poll(() => state(page)).toEqual({ valid: true, entries: [] });
    await page.locator('#native-group').evaluate((section) => section.remove());
    await group(page, kind, { fieldset: true, legend: true });
    await click(page, kind, 0);
    await expect.poll(() => state(page)).toEqual({ valid: true, entries: [['plan', 'basic']] });
  });
  test(`${kind} selected removal and live name changes update remaining required groups`, async ({
    page
  }) => {
    await load(page);
    await group(page, kind);
    await click(page, kind, 1);
    await expect.poll(() => state(page)).toEqual({ valid: true, entries: [['plan', 'pro']] });
    await page.locator('#group-1').evaluate((host) => host.setAttribute('name', 'other'));
    await expect.poll(() => state(page)).toEqual({ valid: false, entries: [['other', 'pro']] });
    await page.locator('#group-1').evaluate((host) => host.setAttribute('name', 'plan'));
    await expect.poll(() => state(page)).toEqual({ valid: true, entries: [['plan', 'pro']] });
    await page.locator('#group-1').evaluate((host) => host.remove());
    await expect.poll(() => state(page)).toEqual({ valid: false, entries: [] });
  });
}

for (const tag of ['sui-checkbox', 'sui-toggle', 'sui-choicebox']) {
  test(`${tag} explicit empty and default on remain distinct native checked values`, async ({
    page
  }) => {
    await load(page);
    await page.evaluate((tag) => {
      const form = document.createElement('form');
      form.id = 'checked-values';
      for (const [id, empty] of [
        ['empty', true],
        ['default', false]
      ] as const) {
        const host = document.createElement(tag);
        host.setAttribute('name', id);
        host.setAttribute(tag === 'sui-choicebox' ? 'selected' : 'checked', '');
        if (tag === 'sui-choicebox') {
          host.setAttribute('mode', 'checkbox');
        }
        if (empty) {
          host.setAttribute('value', '');
        }
        form.append(host);
      }
      document.querySelector('main')!.prepend(form);
    }, tag);
    await expect
      .poll(() =>
        page
          .locator('#checked-values')
          .evaluate((form) => [...new FormData(form as HTMLFormElement)])
      )
      .toEqual([
        ['empty', ''],
        ['default', 'on']
      ]);
  });
}
