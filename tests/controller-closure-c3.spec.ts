import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

async function loadWebComponents(page: Page): Promise<void> {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => Boolean(customElements.get('sui-tabs')));
}

test('compound Pill delivers each trusted primary and dismiss action once', async ({ page }) => {
  await gotoHydrated(page, '/components/pill');
  const pill = page.getByTestId('pill-interactive');
  const primary = pill.getByRole('button', {
    name: 'Interactive pill',
    exact: true
  });
  const dismiss = pill.getByRole('button', { name: 'Dismiss', exact: true });
  await expect(pill.getByRole('button')).toHaveCount(2);
  await primary.click();
  await primary.press('Enter');
  await primary.press('Space');
  await expect(page.getByTestId('pill-click-count')).toHaveText('3');
  await dismiss.click();
  await dismiss.press('Enter');
  await dismiss.press('Space');
  await expect(page.getByTestId('pill-dismiss-count')).toHaveText('3');
  await expect(page.getByTestId('pill-click-count')).toHaveText('3');
});

test('compound WC Pill carries consumer naming and state on its operative action', async ({
  page
}) => {
  await loadWebComponents(page);
  await page.evaluate(() => {
    const host = document.createElement('sui-pill');
    let expanded = false;
    let pressed = false;
    host.id = 'closure-pill';
    Object.assign(host, {
      text: 'Team',
      dismissible: true,
      pillAriaExpanded: false,
      pillAriaPressed: false,
      dismissLabel: 'Remove team filter',
      attrs: { 'aria-label': 'Choose assigned team' },
      onclick: () => {
        host.dataset.primary = String(Number(host.dataset.primary ?? 0) + 1);
        expanded = !expanded;
        pressed = !pressed;
        Object.assign(host, { pillAriaExpanded: expanded, pillAriaPressed: pressed });
      },
      ondismiss: () => {
        host.dataset.dismiss = String(Number(host.dataset.dismiss ?? 0) + 1);
      }
    });
    document.querySelector('main')?.prepend(host);
  });
  const host = page.locator('#closure-pill');
  const primary = host.getByRole('button', {
    name: 'Choose assigned team',
    exact: true
  });
  const dismiss = host.getByRole('button', {
    name: 'Remove team filter',
    exact: true
  });
  await expect(primary).toHaveAttribute('aria-expanded', 'false');
  await expect(primary).toHaveAttribute('aria-pressed', 'false');
  await primary.click();
  await expect(host).toHaveAttribute('data-primary', '1');
  await expect(primary).toHaveAttribute('aria-expanded', 'true');
  await expect(primary).toHaveAttribute('aria-pressed', 'true');
  await dismiss.press('Enter');
  await expect(host).toHaveAttribute('data-dismiss', '1');
  await expect(host).toHaveAttribute('data-primary', '1');
  await host.evaluate((element) => {
    Object.assign(element, { disabled: true });
  });
  await expect(primary).toBeDisabled();
  await expect(dismiss).toBeDisabled();
  await page.keyboard.press('Space');
  await expect(host).toHaveAttribute('data-primary', '1');
  await expect(host).toHaveAttribute('data-dismiss', '1');
});

test('WC Button and Pill preserve explicit false ARIA states through attribute and property updates', async ({
  page
}) => {
  await loadWebComponents(page);
  await page.evaluate(() => {
    for (const tag of ['sui-button', 'sui-pill']) {
      const host = document.createElement(tag);
      host.id = `closure-${tag}`;
      Object.assign(host, { text: tag, as: 'button', onclick: () => {} });
      host.setAttribute('aria-expanded', 'false');
      host.setAttribute('aria-pressed', 'false');
      document.querySelector('main')?.prepend(host);
    }
  });
  for (const tag of ['sui-button', 'sui-pill']) {
    const host = page.locator(`#closure-${tag}`);
    const action = host.getByRole('button', { name: tag, exact: true });
    for (const attr of ['aria-expanded', 'aria-pressed']) {
      await expect(action).toHaveAttribute(attr, 'false');
      await host.evaluate((element, attr) => element.setAttribute(attr, 'true'), attr);
      await expect(action).toHaveAttribute(attr, 'true');
      await host.evaluate((element, attr) => element.removeAttribute(attr), attr);
      await expect(action).not.toHaveAttribute(attr);
    }
    await host.evaluate((element, tag) => {
      const prefix = tag === 'sui-pill' ? 'pill' : 'button';
      Object.assign(element, { [`${prefix}AriaExpanded`]: false, [`${prefix}AriaPressed`]: false });
    }, tag);
    await expect(action).toHaveAttribute('aria-expanded', 'false');
    await expect(action).toHaveAttribute('aria-pressed', 'false');
  }
});

test('WC Lottie accepts explicit false and true hidden states and preserves the absent default', async ({
  page
}) => {
  await loadWebComponents(page);
  await page.evaluate(() => {
    const host = document.createElement('sui-lottie-player');
    host.id = 'closure-lottie';
    host.setAttribute('aria-hidden', 'false');
    document.querySelector('main')?.prepend(host);
  });
  const host = page.locator('#closure-lottie');
  const visual = host.locator('.lottie-player');
  await expect(visual).not.toHaveAttribute('aria-hidden', 'true');
  await expect(visual).toHaveAttribute('role', 'img');
  await host.evaluate((element) => element.setAttribute('aria-hidden', 'true'));
  await expect(visual).toHaveAttribute('aria-hidden', 'true');
  await expect(visual).not.toHaveAttribute('role');
  await host.evaluate((element) => element.removeAttribute('aria-hidden'));
  await expect(visual).toHaveAttribute('aria-hidden', 'true');
  await host.evaluate((element) => Object.assign(element, { lottiePlayerAriaHidden: false }));
  await expect(visual).not.toHaveAttribute('aria-hidden', 'true');
  await expect(visual).toHaveAttribute('role', 'img');
});

test('workspace file closure uses independent controls and restores a surviving tab', async ({
  page
}) => {
  await gotoHydrated(page, '/components/tabs');
  const workspace = page.getByTestId('workspace-tabs-demo');
  await workspace.getByRole('tab', { name: 'App.svelte', exact: true }).click();
  await workspace.getByRole('button', { name: 'Close App.svelte', exact: true }).click();
  await expect(workspace.getByRole('tab', { name: 'App.svelte', exact: true })).toHaveCount(0);
  const selected = workspace.locator('[role="tab"][aria-selected="true"]');
  await expect(selected).toHaveAccessibleName('styles.css');
  await expect(selected).toBeFocused();
  await expect(workspace.locator('[role="tab"] button')).toHaveCount(0);
  for (const file of ['index.ts', 'styles.css', 'utils.ts']) {
    await workspace.getByRole('button', { name: `Close ${file}`, exact: true }).click();
  }
  await expect(workspace.getByRole('tab')).toHaveCount(0);
  await expect(workspace).toContainText('Active file: none');
});

async function tabsFixture(page: Page): Promise<void> {
  await loadWebComponents(page);
  await page.evaluate(() => {
    type TabsHost = HTMLElement & {
      items: { key: string; label: string }[];
      activeKey: string;
    };
    const before = document.createElement('input');
    before.id = 'closure-tabs-before';
    before.placeholder = 'Before tab list';
    const host = document.createElement('sui-tabs') as TabsHost;
    host.id = 'closure-tabs';
    Object.assign(host, {
      items: [
        { key: 'one', label: 'One' },
        { key: 'two', label: 'Two' },
        { key: 'three', label: 'Three' }
      ],
      activeKey: 'one',
      activationMode: 'manual',
      ariaLabel: 'Files'
    });
    const external = document.createElement('input');
    external.id = 'closure-tabs-external';
    external.placeholder = 'External selection';
    external.oninput = () => {
      host.activeKey = 'three';
      host.items = [
        { key: 'one', label: 'One' },
        { key: 'two', label: 'Two' },
        { key: 'three', label: 'Three updated' }
      ];
    };
    document.querySelector('main')?.prepend(before, host, external);
  });
  // Pointer focus on the input and real Tab also work in Safari, whose default
  // pointer policy does not focus every button or synthetic tab.
  await page.locator('#closure-tabs-before').click();
  await page.keyboard.press('Tab');
  await expect(
    page.locator('#closure-tabs').getByRole('tab', { name: 'One', exact: true })
  ).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(
    page.locator('#closure-tabs').getByRole('tab', { name: 'Two', exact: true })
  ).toBeFocused();
}

test('WC Tabs recover keyboard focus when a parent removes the focused keyed tab', async ({
  page
}) => {
  await tabsFixture(page);
  const host = page.locator('#closure-tabs');
  await host.evaluate((element) => {
    Object.assign(element, {
      items: [
        { key: 'one', label: 'One' },
        { key: 'three', label: 'Three' }
      ],
      activeKey: 'three'
    });
  });
  await expect(host.getByRole('tab', { name: 'Two', exact: true })).toHaveCount(0);
  await expect(host.getByRole('tab', { name: 'Three', exact: true })).toBeFocused();
});

test('WC Tabs retain an external input focus through controlled selection and item changes', async ({
  page
}) => {
  await tabsFixture(page);
  const external = page.locator('#closure-tabs-external');
  await external.fill('Change selection');
  await expect(external).toBeFocused();
  await expect(
    page.locator('#closure-tabs').getByRole('tab', { name: 'Three updated', exact: true })
  ).toHaveAttribute('aria-selected', 'true');
});

test('Pill and Select documentation tables expose meaningful column names', async ({ page }) => {
  for (const route of ['pill', 'select']) {
    await gotoHydrated(page, `/components/${route}`);
    const headers = page.getByRole('columnheader');
    expect(await headers.count()).toBeGreaterThan(0);
    for (const header of await headers.all()) {
      await expect(header).toHaveAccessibleName(/\S/);
    }
  }
});

test('single selection headers remain named and respect consumer localization', async ({
  page
}) => {
  await gotoHydrated(page, '/components/table');
  await expect(page.getByRole('columnheader', { name: 'Row selection', exact: true })).toHaveCount(
    1
  );
  await loadWebComponents(page);
  await page.evaluate(() => {
    const host = document.createElement('sui-table');
    host.id = 'closure-table';
    Object.assign(host, {
      tableHeaders: ['Name'],
      tableData: [['Alpha'], ['Beta']],
      checkboxSelection: {
        selectionMode: 'single',
        getRowId: (row: string[]) => row[0]
      },
      labels: { selectionColumn: 'Sélection de ligne' }
    });
    document.querySelector('main')?.prepend(host);
  });
  const table = page.locator('#closure-table');
  await expect(
    table.getByRole('columnheader', {
      name: 'Sélection de ligne',
      exact: true
    })
  ).toHaveCount(1);
  await table.getByRole('checkbox', { name: 'Select row Alpha', exact: true }).click();
  await expect(
    table.getByRole('checkbox', { name: 'Select row Alpha', exact: true })
  ).toHaveAttribute('aria-checked', 'true');
});

for (const theme of ['light', 'dark'] as const) {
  test(`320px ChatMessageList resizing emits no page error during real streaming (${theme})`, async ({
    page
  }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await gotoHydrated(page, '/components/chat-message-list');
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    await page.getByTestId('pin-nohold-send').click();
    await page.getByTestId('pin-nohold-send').click();
    await page.getByTestId('reveal-start').click();
    await page.screenshot({ fullPage: true });
    await page.getByTestId('reveal-finish').click();
    await page.screenshot({ fullPage: true });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    );
    expect(errors).toEqual([]);
  });
}
