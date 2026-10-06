import { expect } from '@playwright/test';
import type { BrowserContext, Locator, Page } from '@playwright/test';

/** Chromium exposes permission names the other engines do not share. */
export const prepareNativeClipboard = async (context: BrowserContext): Promise<void> => {
  const engine = context.browser()?.browserType().name();
  if (engine === 'chromium') {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  } else if (engine === 'webkit') {
    await context.grantPermissions(['clipboard-read']);
  }
  // Firefox permits a user-activated write; its native paste shortcut below
  // supplies the read gesture. No navigator.clipboard replacement is installed.
};

/** Read the real browser clipboard, using a native paste gesture in Firefox. */
export const readNativeClipboard = async (page: Page): Promise<string> => {
  if (page.context().browser()?.browserType().name() !== 'firefox') {
    return page.evaluate(() => navigator.clipboard.readText());
  }
  const previous = await page.evaluateHandle(() => document.activeElement);
  await page.evaluate(() => {
    const sink = document.createElement('textarea');
    sink.dataset.pw = 'native-clipboard-read';
    sink.setAttribute('aria-label', 'Native clipboard verification');
    sink.style.cssText = 'position:fixed;left:8px;top:8px;width:240px;height:40px;z-index:10000';
    document.body.append(sink);
  });
  const sink = page.getByTestId('native-clipboard-read');
  try {
    await sink.click();
    await sink.press('ControlOrMeta+V');
    await expect(sink).not.toHaveValue('');
    return await sink.inputValue();
  } finally {
    await sink.evaluate((element) => element.remove());
    await previous.evaluate((element) => {
      if (element instanceof HTMLElement) {
        element.focus();
      }
    });
    await previous.dispose();
  }
};

/** Exact geometry compared to a native box at the same layout coordinates. */
export const nativeBoxDimensions = async (
  target: Locator,
  size: { width: number; height: number }
): Promise<{
  actual: { width: number; height: number };
  expected: { width: number; height: number };
}> =>
  target.evaluate((element, wanted) => {
    const actual = element.getBoundingClientRect();
    const reference = document.createElement('div');
    reference.style.cssText = `position:absolute;box-sizing:border-box;padding:0;border:0;left:${actual.left + scrollX}px;top:${actual.top + scrollY}px;width:${wanted.width}px;height:${wanted.height}px`;
    document.body.append(reference);
    const expected = reference.getBoundingClientRect();
    reference.remove();
    return {
      actual: { width: actual.width, height: actual.height },
      expected: { width: expected.width, height: expected.height }
    };
  }, size);

/** CSS serialization stays exact; the native reference shares the engine's precision. */
export const nativeLineHeight = async (
  target: Locator,
  lineHeight: string
): Promise<{ actual: string; expected: string }> =>
  target.evaluate((element, wanted) => {
    const style = getComputedStyle(element);
    const reference = document.createElement('span');
    reference.style.fontSize = style.fontSize;
    reference.style.lineHeight = wanted;
    document.body.append(reference);
    const expected = getComputedStyle(reference).lineHeight;
    reference.remove();
    return { actual: style.lineHeight, expected };
  }, lineHeight);

/** Measure the engine's actual native button pointer-focus convention. */
export const nativeButtonPointerFocus = async (page: Page): Promise<boolean> => {
  await page.evaluate(() => {
    const reference = document.createElement('button');
    reference.dataset.pw = 'native-pointer-focus';
    reference.textContent = 'Native pointer focus verification';
    reference.style.cssText = 'position:fixed;left:8px;top:8px;z-index:10000';
    document.body.append(reference);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });
  const reference = page.getByTestId('native-pointer-focus');
  try {
    await reference.click();
    return await reference.evaluate((element) => document.activeElement === element);
  } finally {
    await reference.evaluate((element) => element.remove());
  }
};

/** Compare held-Space :active with a real native button, without guessing an engine rule. */
export const nativeButtonSpaceActive = async (page: Page): Promise<boolean> => {
  await page.evaluate(() => {
    const reference = document.createElement('button');
    reference.dataset.pw = 'native-space-active';
    reference.textContent = 'Native Space verification';
    document.body.append(reference);
  });
  const reference = page.getByTestId('native-space-active');
  try {
    await reference.focus();
    await page.keyboard.down('Space');
    return await reference.evaluate((element) => element.matches(':active'));
  } finally {
    await page.keyboard.up('Space');
    await reference.evaluate((element) => element.remove());
  }
};
