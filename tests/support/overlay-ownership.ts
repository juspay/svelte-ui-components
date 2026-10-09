import { expect, test, type Locator, type Page } from '@playwright/test';
import { activateOverlay } from './overlay-assertions';

/** Pointer and focus+Enter come from the shared helper; `tab` reaches the opener by real Tab traversal. */
export type OverlayActivation = 'pointer' | 'keyboard' | 'tab';

export async function activateOverlayBy(
  page: Page,
  opener: Locator,
  activation: OverlayActivation
): Promise<() => Promise<void>> {
  if (activation !== 'tab') {
    return activateOverlay(opener, activation);
  }
  await openByKeyboard(page, opener);
  return () => expect(opener).toBeFocused();
}

/** Establish an actual keyboard opener before asserting focus restoration. */
export async function openByKeyboard(page: Page, opener: Locator): Promise<void> {
  const key = test.info().project.name === 'webkit' ? 'Alt+Tab' : 'Tab';
  for (let count = 0; count < 25; count += 1) {
    const focused = await opener.evaluate((element) => {
      let active = document.activeElement;
      while (active?.shadowRoot?.activeElement) {
        active = active.shadowRoot.activeElement;
      }
      return active === element;
    });
    if (focused) {
      break;
    }
    await page.keyboard.press(key);
  }
  await expect(opener).toBeFocused();
  await page.keyboard.press('Enter');
}

/** Owned styles restore values/priorities, not serialization among unrelated properties. */
export async function ownedStyle(owner: Locator) {
  return owner.evaluate((element) => {
    if (!(element instanceof HTMLElement)) {
      throw new Error('Expected an HTML scroll owner');
    }
    const node = element;
    const computed = getComputedStyle(node);
    return {
      inline: Object.fromEntries(
        [...node.style]
          .sort()
          .map((name) => [
            name,
            [node.style.getPropertyValue(name), node.style.getPropertyPriority(name)]
          ])
      ),
      computed: {
        overflowX: computed.overflowX,
        overflowY: computed.overflowY,
        paddingRight: computed.paddingRight
      },
      scrollTop: node.scrollTop,
      scrollLeft: node.scrollLeft
    };
  });
}
