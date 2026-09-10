import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// Menu hands its `trigger` snippet the interaction wiring (MenuTriggerProps) so a consumer
// whose trigger is itself an interactive element can spread it and set `interactiveTrigger`.
// The custom-element wrapper used to render `props.trigger()` with no argument, and declared
// no parameter to forward, so through `sui-menu` that argument was always undefined and the
// whole feature was unreachable. Nothing failed: the menu still opened, the trigger just
// never received its wiring.
const loadBundle = async (page: import('@playwright/test').Page): Promise<void> => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-menu') !== 'undefined', null, {
    timeout: 15_000
  });
};

test.describe('sui-menu — trigger wiring', () => {
  test('forwards MenuTriggerProps to a property-assigned trigger', async ({ page }) => {
    await loadBundle(page);

    const received = await page.evaluate(async () => {
      const menu = document.createElement('sui-menu') as HTMLElement & Record<string, unknown>;
      menu.items = [{ label: 'Edit', value: 'edit' }];

      // A snippet is invoked as (anchor, ...argThunks); the wiring is the first thunk.
      // Capturing it is the whole assertion — if the wrapper drops it, this stays null.
      const captured: { value: unknown } = { value: null };
      menu.trigger = (_anchor: unknown, getProps?: () => unknown) => {
        captured.value = typeof getProps === 'function' ? getProps() : null;
      };

      document.body.append(menu);
      await new Promise((resolve) => setTimeout(resolve, 400));

      const props = captured.value as Record<string, unknown> | null;
      return {
        gotSomething: typeof props === 'object' && props !== null,
        keys: props ? Object.keys(props).sort() : [],
        ariaHaspopup: props ? props.ariaHaspopup : null,
        ariaExpandedType: props ? typeof props.ariaExpanded : null,
        onclickType: props ? typeof props.onclick : null,
        onkeydownType: props ? typeof props.onkeydown : null
      };
    });

    expect(received.gotSomething).toBe(true);
    expect(received.keys).toEqual(['ariaExpanded', 'ariaHaspopup', 'onclick', 'onkeydown']);
    expect(received.ariaHaspopup).toBe('menu');
    expect(received.ariaExpandedType).toBe('boolean');
    expect(received.onclickType).toBe('function');
    expect(received.onkeydownType).toBe('function');
  });
});
