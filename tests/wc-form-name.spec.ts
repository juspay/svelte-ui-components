import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

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

for (const stage of [
  'authored-before-definition',
  'property-before-definition',
  'property-before-append'
]) {
  test(`name initialization survives ${stage}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await gotoHydrated(page, '/');
    const load = async () => {
      await page.addScriptTag({
        path: process.env.WC_NAME_BUNDLE ?? 'dist-wc/index.js',
        type: 'module'
      });
      await page.waitForFunction((tags) => tags.every((tag) => customElements.get(tag)), tags);
    };
    if (stage === 'property-before-append') {
      await load();
    }
    await page.evaluate(
      ({ tags, stage }) => {
        const form = document.createElement('form');
        form.id = 'initial-names';
        document.querySelector('main')!.prepend(form);
        for (const [index, tag] of tags.entries()) {
          const attrs = `${stage === 'authored-before-definition' ? `name="initial${index}"` : ''} ${tag === 'sui-select' ? '' : `value="${tag === 'sui-slider' || tag === 'sui-rating-group' ? '4' : `v${index}`}"`} ${tag === 'sui-checkbox' || tag === 'sui-toggle' ? 'checked' : ''} ${tag === 'sui-choicebox' ? 'mode="checkbox" selected' : ''} ${tag === 'sui-radio' ? `selected-value="v${index}"` : ''} ${tag === 'sui-select' || tag === 'sui-combobox' ? 'multiple' : ''}`;
          const holder = document.createElement('div');
          holder.innerHTML = `<${tag} ${attrs}></${tag}>`;
          const host = holder.firstElementChild!;
          if (stage !== 'authored-before-definition') {
            Object.assign(host, { name: `initial${index}` });
          }
          if (tag === 'sui-select' || tag === 'sui-combobox') {
            Reflect.set(host, 'items', [
              { id: 'a', label: 'Alpha' },
              { id: 'b', label: 'Beta' }
            ]);
            Reflect.set(host, tag === 'sui-select' ? 'value' : 'selected', ['a', 'b']);
          }
          form.append(host);
        }
      },
      { tags, stage }
    );
    if (stage !== 'property-before-append') {
      await load();
    }
    const entries = () =>
      page
        .locator('#initial-names')
        .evaluate((form) =>
          [...new FormData(form as HTMLFormElement)].map(([key, value]) => [key, String(value)])
        );
    await expect.poll(entries).toEqual([
      ['initial0', 'v0'],
      ['initial1', 'v1'],
      ['initial2', 'v2'],
      ['initial3', 'v3'],
      ['initial4', '4'],
      ['initial5', 'v5'],
      ['initial6', '4'],
      ['initial7', 'a'],
      ['initial7', 'b'],
      ['initial8', 'a'],
      ['initial8', 'b']
    ]);
    for (const [index, tag] of tags.entries()) {
      await expect(page.locator(`#initial-names > ${tag}`)).toHaveAttribute(
        'name',
        `initial${index}`
      );
    }
    expect(errors).toEqual([]);
  });
}

test('documented name setters reflect and rename actual FormData for every supported form WC', async ({
  page
}, testInfo) => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({
    path: process.env.WC_NAME_BUNDLE ?? 'dist-wc/index.js',
    type: 'module'
  });
  await page.waitForFunction((tags) => tags.every((tag) => customElements.get(tag)), tags);
  await page.evaluate((tags) => {
    const form = document.createElement('form');
    form.id = 'names';
    document.querySelector('main')!.prepend(form);
    for (const [index, tag] of tags.entries()) {
      const host = document.createElement(tag);
      host.id = `name-${index}`;
      host.setAttribute('name', `old${index}`);
      if (tag !== 'sui-select') {
        host.setAttribute(
          'value',
          tag === 'sui-slider' || tag === 'sui-rating-group' ? '4' : `v${index}`
        );
      }
      if (tag === 'sui-checkbox' || tag === 'sui-toggle') {
        host.setAttribute('checked', '');
      }
      if (tag === 'sui-choicebox') {
        host.setAttribute('mode', 'checkbox');
        host.setAttribute('selected', '');
      }
      if (tag === 'sui-radio') {
        host.setAttribute('selected-value', `v${index}`);
      }
      if (tag === 'sui-select' || tag === 'sui-combobox') {
        host.setAttribute('multiple', '');
      }
      form.append(host);
      if (tag === 'sui-select' || tag === 'sui-combobox') {
        Reflect.set(host, 'items', [
          { id: 'a', label: 'Alpha' },
          { id: 'b', label: 'Beta' }
        ]);
        Reflect.set(host, tag === 'sui-select' ? 'value' : 'selected', ['a', 'b']);
      }
    }
  }, tags);
  const entries = () =>
    page
      .locator('#names')
      .evaluate((form) =>
        [...new FormData(form as HTMLFormElement)].map(([key, value]) => [key, String(value)])
      );
  const values = [['v0'], ['v1'], ['v2'], ['v3'], ['4'], ['v5'], ['4'], ['a', 'b'], ['a', 'b']];
  const expected = (prefix: string) =>
    values.flatMap((list, index) => list.map((value) => [`${prefix}${index}`, value]));
  await expect.poll(entries).toEqual(expected('old'));
  const errors = await page.evaluate(
    (tags) =>
      tags.flatMap((tag, index) => {
        const host = document.querySelector(`#name-${index}`) as HTMLElement & { name: string };
        try {
          Object.assign(host, { name: `property${index}` });
          return [];
        } catch (error) {
          return [{ tag, error: String(error) }];
        }
      }),
    tags
  );
  await testInfo.attach('name-setter-errors', {
    body: JSON.stringify(errors, null, 2),
    contentType: 'application/json'
  });
  expect(errors).toEqual([]);
  await expect.poll(entries).toEqual(expected('property'));
  for (const [index, tag] of tags.entries()) {
    await expect(page.locator(`#names > ${tag}#name-${index}`)).toHaveAttribute(
      'name',
      `property${index}`
    );
  }
  await page.evaluate(
    (tags) =>
      tags.forEach((tag, index) =>
        document.querySelector(`#name-${index}`)!.setAttribute('name', `attribute${index}`)
      ),
    tags
  );
  await expect.poll(entries).toEqual(expected('attribute'));
  for (const [index, tag] of tags.entries()) {
    expect(
      await page
        .locator(`#names > ${tag}#name-${index}`)
        .evaluate((host) => Reflect.get(host, 'name'))
    ).toBe(`attribute${index}`);
  }
  await page.evaluate(
    (tags) =>
      tags.forEach((tag, index) => {
        Reflect.set(
          document.querySelector(`#name-${index}`)!,
          'name',
          index % 2 === 0 ? null : void 0
        );
      }),
    tags
  );
  await expect.poll(entries).toEqual([]);
  for (const [index, tag] of tags.entries()) {
    await expect(page.locator(`#names > ${tag}#name-${index}`)).not.toHaveAttribute('name');
  }
  await page.evaluate(
    (tags) =>
      tags.forEach((tag, index) =>
        Reflect.set(document.querySelector(`#name-${index}`)!, 'name', `restored${index}`)
      ),
    tags
  );
  await expect.poll(entries).toEqual(expected('restored'));
  const detached = await page.locator('#names').evaluate((form) => {
    const holder = document.createElement('template');
    holder.id = 'detached-names';
    document.body.append(holder);
    [...form.children].forEach((host, index) => {
      holder.content.append(host);
      Object.assign(host, { name: `reconnected${index}` });
    });
    return [...holder.content.children].map((host) => ({
      connected: host.isConnected,
      name: host.getAttribute('name')
    }));
  });
  expect(detached).toEqual(
    tags.map((tag, index) => ({ connected: false, name: `reconnected${index}` }))
  );
  expect(await entries()).toEqual([]);
  await page.locator('#names').evaluate((form) => {
    const holder = document.querySelector<HTMLTemplateElement>('#detached-names');
    if (holder === null) {
      throw new Error('Disconnected controls missing');
    }
    form.append(holder.content);
    holder.remove();
  });
  await expect.poll(entries).toEqual(expected('reconnected'));
});

test('live name attributes rename actual multi-value FormData without old or duplicate entries', async ({
  page
}) => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({
    path: process.env.WC_NAME_BUNDLE ?? 'dist-wc/index.js',
    type: 'module'
  });
  await page.waitForFunction(
    () => Boolean(customElements.get('sui-select')) && Boolean(customElements.get('sui-combobox'))
  );
  await page.evaluate(() => {
    const form = document.createElement('form');
    form.id = 'multi-names';
    document.querySelector('main')!.prepend(form);
    for (const [index, tag] of ['sui-select', 'sui-combobox'].entries()) {
      const host = document.createElement(tag);
      host.setAttribute('name', `old${index}`);
      host.setAttribute('multiple', '');
      form.append(host);
      Reflect.set(host, 'items', [
        { id: 'a', label: 'Alpha' },
        { id: 'b', label: 'Beta' }
      ]);
      Reflect.set(host, tag === 'sui-select' ? 'value' : 'selected', ['a', 'b']);
    }
  });
  const entries = () =>
    page
      .locator('#multi-names')
      .evaluate((form) =>
        [...new FormData(form as HTMLFormElement)].map(([key, value]) => [key, String(value)])
      );
  await expect.poll(entries).toEqual([
    ['old0', 'a'],
    ['old0', 'b'],
    ['old1', 'a'],
    ['old1', 'b']
  ]);
  await page
    .locator('#multi-names')
    .evaluate((form) =>
      [...form.children].forEach((host, index) => host.setAttribute('name', `new${index}`))
    );
  await expect.poll(entries).toEqual([
    ['new0', 'a'],
    ['new0', 'b'],
    ['new1', 'a'],
    ['new1', 'b']
  ]);
});

for (const adopted of [false, true]) {
  test(`name setter preserves actual external form, required, callbacks and reset${adopted ? ' after iframe adoption' : ''}`, async ({
    page
  }) => {
    await gotoHydrated(page, '/');
    if (adopted) {
      const preservesPrototype = await page.evaluate(() => {
        const frame = document.createElement('iframe');
        document.body.append(frame);
        class AdoptionControl extends HTMLElement {
          ownMethod(): void {}
        }
        customElements.define('name-adoption-control', AdoptionControl);
        const control = document.createElement('name-adoption-control');
        document.body.append(control);
        frame.contentDocument!.body.append(frame.contentDocument!.adoptNode(control));
        const supported = typeof Reflect.get(control, 'ownMethod') === 'function';
        frame.remove();
        return supported;
      });
      // Pinned Firefox 150 loses even a plain native custom element's class
      // when its target document has not registered it (OBS-029).
      test.skip(
        !preservesPrototype,
        'Native cross-document adoption removes custom-element methods'
      );
    }
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => Boolean(customElements.get('sui-choicebox')));
    await page.evaluate(async (adopted) => {
      let target = document;
      if (adopted) {
        const frame = document.createElement('iframe');
        frame.id = 'name-frame';
        document.querySelector('main')!.prepend(frame);
        await new Promise<void>((resolve) => {
          frame.onload = () => resolve();
          frame.srcdoc = '<!doctype html><html><body></body></html>';
        });
        target = frame.contentDocument!;
      }
      const form = target.createElement('form');
      form.id = 'external';
      const host = document.createElement('sui-choicebox');
      host.id = 'external-choice';
      host.textContent = 'Accept external choice';
      host.setAttribute('mode', 'checkbox');
      host.setAttribute('value', 'accepted');
      host.setAttribute('required', '');
      host.setAttribute('form', 'external');
      Reflect.set(host, 'name', 'before');
      if (adopted) {
        document.querySelector('main')!.prepend(host);
        await new Promise<void>((resolve) => {
          const observer = new MutationObserver(() => {
            if (host.shadowRoot?.querySelector('input.native-control')) {
              observer.disconnect();
              resolve();
            }
          });
          observer.observe(host.shadowRoot!, { childList: true, subtree: true });
        });
      }
      target.body.prepend(form, adopted ? target.adoptNode(host) : host);
      Reflect.set(host, 'onclick', (selected: boolean) => {
        form.dataset.callback = String(selected);
      });
    }, adopted);
    const root = adopted ? page.frameLocator('#name-frame') : page;
    const host = root.locator('#external-choice');
    const form = root.locator('#external');
    const entries = () =>
      form.evaluate((form) =>
        [...new FormData(form as HTMLFormElement)].map(([key, value]) => [key, String(value)])
      );
    await expect(host.getByRole('checkbox', { name: 'Accept external choice' })).toBeVisible();
    expect(await host.evaluate((host) => Reflect.get(host, 'form')?.id)).toBe('external');
    expect(await form.evaluate((form) => (form as HTMLFormElement).checkValidity())).toBe(false);
    await host.evaluate((host) => Reflect.set(host, 'name', 'after'));
    await expect(host.locator('input.native-control')).toHaveAttribute('name', 'after');
    await host.getByRole('checkbox', { name: 'Accept external choice' }).click();
    await expect(form).toHaveAttribute('data-callback', 'true');
    await expect.poll(entries).toEqual([['after', 'accepted']]);
    expect(await form.evaluate((form) => (form as HTMLFormElement).checkValidity())).toBe(true);
    await form.evaluate((form) => (form as HTMLFormElement).reset());
    await expect(host.getByRole('checkbox', { name: 'Accept external choice' })).not.toBeChecked();
    await expect.poll(entries).toEqual([]);
    await expect(host).toHaveAttribute('name', 'after');
    expect(await form.evaluate((form) => (form as HTMLFormElement).checkValidity())).toBe(false);
    expect(
      await host.evaluate((host) =>
        ['form', 'validity', 'willValidate', 'validationMessage'].map((prop) => {
          const before = Reflect.get(host, prop);
          const writable = Reflect.set(host, prop, null);
          return { prop, writable, same: Reflect.get(host, prop) === before };
        })
      )
    ).toEqual(
      ['form', 'validity', 'willValidate', 'validationMessage'].map((prop) => ({
        prop,
        writable: false,
        same: true
      }))
    );
  });
}

test('name setter, callbacks and FormData work with registration in the target iframe document', async ({
  page
}) => {
  await gotoHydrated(page, '/');
  await page.evaluate(async () => {
    const frame = document.createElement('iframe');
    frame.id = 'registered-name-frame';
    document.querySelector('main')!.prepend(frame);
    await new Promise<void>((resolve) => {
      frame.onload = () => resolve();
      frame.srcdoc =
        '<!doctype html><html><body><form id="target-form"></form><input id="before-target"></body></html>';
    });
  });
  const handle = await page.locator('#registered-name-frame').elementHandle();
  const frame = await handle?.contentFrame();
  if (frame === null || typeof frame === 'undefined') {
    throw new Error('Target iframe unavailable');
  }
  await frame.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await frame.waitForFunction(() => Boolean(customElements.get('sui-choicebox')));
  await frame.evaluate(() => {
    const host = document.createElement('sui-choicebox');
    host.id = 'registered-choice';
    host.textContent = 'Target choice';
    host.setAttribute('mode', 'checkbox');
    host.setAttribute('required', '');
    host.setAttribute('value', 'accepted');
    Object.assign(host, { name: 'initial' });
    Reflect.set(host, 'onclick', (selected: boolean) => {
      document.querySelector('#target-form')!.setAttribute('data-selected', String(selected));
    });
    document.querySelector('#target-form')!.append(host);
  });
  const host = frame.locator('#registered-choice');
  const owner = host.getByRole('checkbox', { name: 'Target choice' });
  const form = frame.locator('#target-form');
  const entries = () =>
    form.evaluate((form) =>
      [...new FormData(form as HTMLFormElement)].map(([key, value]) => [key, String(value)])
    );
  await expect(owner).toBeVisible();
  await frame.locator('#before-target').click();
  expect(await form.evaluate((form) => (form as HTMLFormElement).checkValidity())).toBe(false);
  await expect(frame.locator('#before-target')).toBeFocused();
  await host.evaluate((host) => Object.assign(host, { name: 'updated' }));
  await expect(host.locator('input.native-control')).toHaveAttribute('name', 'updated');
  await owner.click();
  await expect(form).toHaveAttribute('data-selected', 'true');
  await expect.poll(entries).toEqual([['updated', 'accepted']]);
  expect(await form.evaluate((form) => (form as HTMLFormElement).checkValidity())).toBe(true);
  await form.evaluate((form) => (form as HTMLFormElement).reset());
  await expect(owner).not.toBeChecked();
  await expect.poll(entries).toEqual([]);
});
