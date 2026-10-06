import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

type LifecycleFixture = {
  host: HTMLElement;
  source: HTMLElement | ShadowRoot;
  target: HTMLElement | ShadowRoot;
  label: HTMLSpanElement;
  targetLabel: HTMLSpanElement;
  originalControl?: Element | null;
};
type LifecycleWindow = Window & { lifecycleFixture: LifecycleFixture };

const mount = async (
  page: Page,
  root: 'document' | 'shadow',
  anotherRoot = false,
  explicit = ''
) => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => !!customElements.get('sui-select'));
  await page.evaluate(
    ({ root, anotherRoot, explicit }) => {
      const shell = document.createElement('div');
      shell.id = 'label-lifecycle-source';
      document.body.appendChild(shell);
      const source = root === 'shadow' ? shell.attachShadow({ mode: 'open' }) : shell;
      const label = document.createElement('span');
      label.id = 'lifecycle-label';
      label.textContent = 'Country of residence';
      const host = document.createElement('sui-select');
      host.setAttribute('data-pw', 'label-lifecycle-select');
      host.setAttribute('aria-labelledby', label.id);
      host.setAttribute('placeholder', 'Pick');
      if (explicit) {
        host.setAttribute('aria-label', explicit);
      }
      Reflect.set(host, 'items', [
        { id: 'in', label: 'India' },
        { id: 'jp', label: 'Japan' }
      ]);
      let target: HTMLElement | ShadowRoot = source;
      let targetLabel = label;
      if (anotherRoot) {
        const targetShell = document.createElement('div');
        document.body.appendChild(targetShell);
        target = targetShell.attachShadow({ mode: 'open' });
        targetLabel = document.createElement('span');
        targetLabel.id = label.id;
        targetLabel.textContent = 'Inside country';
        target.appendChild(targetLabel);
      }
      source.appendChild(label);
      source.appendChild(host);
      (window as unknown as LifecycleWindow).lifecycleFixture = {
        host,
        source,
        target,
        label,
        targetLabel
      };
    },
    { root, anotherRoot, explicit }
  );
  const control = page.getByTestId('label-lifecycle-select').getByRole('combobox');
  await expect(control).toHaveAccessibleName(explicit || 'Country of residence');
  await page.evaluate(() => {
    const fixture = (window as unknown as LifecycleWindow).lifecycleFixture;
    fixture.originalControl = fixture.host.shadowRoot?.querySelector('[role="combobox"]');
  });
  return control;
};

const reconnectInObserver = async (page: Page) => {
  await page.evaluate(async () => {
    const { host, source, target } = (window as unknown as LifecycleWindow).lifecycleFixture;
    await new Promise<void>((resolve) => {
      const reconnect = new MutationObserver((records) => {
        if (records.some((record) => Array.from(record.removedNodes).includes(host))) {
          reconnect.disconnect();
          target.appendChild(host);
          resolve();
        }
      });
      reconnect.observe(source, { childList: true, subtree: true });
      host.remove();
    });
  });
  // This must exercise the retained component, rather than pass because its
  // disconnected callback destroyed it and a replacement took over.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const fixture = (window as unknown as LifecycleWindow).lifecycleFixture;
        return (
          fixture.host.shadowRoot?.querySelector('[role="combobox"]') === fixture.originalControl
        );
      })
    )
    .toBe(true);
};

for (const root of ['document', 'shadow'] as const) {
  test(`WC Select follows real label edits after observer-checkpoint reconnect in ${root}`, async ({
    page
  }) => {
    const control = await mount(page, root);
    await reconnectInObserver(page);
    await expect(control).toHaveAccessibleName('Country of residence');
    await page.evaluate(() => {
      (window as unknown as LifecycleWindow).lifecycleFixture.label.textContent = 'Updated country';
    });
    await expect(control).toHaveAccessibleName('Updated country');
    await page.evaluate(() => {
      const fixture = (window as unknown as LifecycleWindow).lifecycleFixture;
      const replacement = document.createElement('span');
      replacement.id = fixture.label.id;
      replacement.textContent = 'Replacement country';
      fixture.label.replaceWith(replacement);
      fixture.label = replacement;
    });
    await expect(control).toHaveAccessibleName('Replacement country');
  });
}

test('WC Select changes observation root after a native checkpoint reconnect into another shadow root', async ({
  page
}) => {
  const control = await mount(page, 'document', true);
  await reconnectInObserver(page);
  await expect(control).toHaveAccessibleName('Inside country');
  await page.evaluate(() => {
    (window as unknown as LifecycleWindow).lifecycleFixture.targetLabel.textContent =
      'Updated inside country';
  });
  await expect(control).toHaveAccessibleName('Updated inside country');
});

test('explicit WC names keep their priority and clearing them exposes the live reference after reconnect', async ({
  page
}) => {
  const control = await mount(page, 'document', false, 'Explicit country');
  await reconnectInObserver(page);
  await expect(control).toHaveAccessibleName('Explicit country');
  await page.evaluate(() => {
    (window as unknown as LifecycleWindow).lifecycleFixture.label.textContent = 'Reference country';
  });
  await expect(control).toHaveAccessibleName('Explicit country');
  await page.evaluate(() => {
    (window as unknown as LifecycleWindow).lifecycleFixture.host.setAttribute('aria-label', '');
  });
  await expect(control).toHaveAccessibleName('Reference country');
});

test('one Promise microtask reconnect recreates the core and keeps later references live', async ({
  page
}) => {
  const control = await mount(page, 'document');
  await page.evaluate(async () => {
    const fixture = (window as unknown as LifecycleWindow).lifecycleFixture;
    fixture.host.remove();
    await Promise.resolve();
    fixture.source.appendChild(fixture.host);
  });
  await expect(control).toHaveAccessibleName('Country of residence');
  expect(
    await page.evaluate(() => {
      const fixture = (window as unknown as LifecycleWindow).lifecycleFixture;
      return (
        fixture.host.shadowRoot?.querySelector('[role="combobox"]') === fixture.originalControl
      );
    })
  ).toBe(false);
  await page.evaluate(() => {
    (window as unknown as LifecycleWindow).lifecycleFixture.label.textContent = 'Recreated country';
  });
  await expect(control).toHaveAccessibleName('Recreated country');
});

test('actual WC teardown leaves no control or resurrection after later label changes', async ({
  page
}) => {
  await mount(page, 'document');
  await page.evaluate(async () => {
    const fixture = (window as unknown as LifecycleWindow).lifecycleFixture;
    fixture.host.remove();
    await Promise.resolve();
    await Promise.resolve();
    fixture.label.textContent = 'After teardown';
    await Promise.resolve();
  });
  expect(
    await page.evaluate(() => {
      const fixture = (window as unknown as LifecycleWindow).lifecycleFixture;
      return {
        connected: fixture.host.isConnected,
        controls: fixture.host.shadowRoot?.querySelectorAll('[role="combobox"]').length
      };
    })
  ).toEqual({ connected: false, controls: 0 });
});
