import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';
import { canHoldThroughDisplayExit } from './support/motion-observers';

const open = async (page: Page): Promise<void> => {
  await page.goto(`${fixtureBaseURL}/toast-close-lifecycle/`);
  await expect(page.getByTestId('show-toast')).toBeVisible();
};

const showVisible = async (page: Page): Promise<void> => {
  await page.getByTestId('show-toast').click();
  await expect(page.getByTestId('lifecycle-toast')).toBeVisible();
  await expect
    .poll(() =>
      page.getByTestId('lifecycle-toast').evaluate((node) => getComputedStyle(node).opacity)
    )
    .toBe('1');
};

const expectOneHide = async (page: Page): Promise<void> => {
  await expect(page.getByTestId('hide-count')).toHaveText('1');
  await expect(page.getByTestId('lifecycle-toast')).toBeHidden();
  // Outlast this fixture's entire 160ms exit to catch duplicate completion paths.
  await page.waitForTimeout(250);
  await expect(page.getByTestId('hide-count')).toHaveText('1');
};

test('same-task close reports one hide without requiring any CSS transition', async ({ page }) => {
  await open(page);
  await page.getByTestId('immediate-close').click();
  await expectOneHide(page);
});

test('normal native close retains exit motion and reports one hide', async ({ page }) => {
  await open(page);
  await showVisible(page);
  await page.getByTestId('toast-close').click();
  await expectOneHide(page);
});

test('reduced-motion native close still reports exactly one hide', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true
  );
  await showVisible(page);
  await page.getByTestId('toast-close').click();
  await expectOneHide(page);
});

test('an interrupted exit reports one hide even when no transition event arrives', async ({
  page
}) => {
  await open(page);
  await showVisible(page);
  const canHoldExit = await canHoldThroughDisplayExit(page);
  await page.getByTestId('lifecycle-toast').evaluate((node) => {
    (node as HTMLElement).style.setProperty('--toast-close-duration', '2000ms');
  });
  await page.getByTestId('toast-close').click();
  if (canHoldExit) {
    await expect
      .poll(() =>
        page
          .getByTestId('lifecycle-toast')
          .evaluate((node) =>
            node
              .getAnimations()
              .some(
                (animation) =>
                  'transitionProperty' in animation &&
                  animation.transitionProperty === 'opacity' &&
                  animation.playState === 'running'
              )
          )
      )
      .toBe(true);
  } else {
    await expect(page.getByTestId('lifecycle-toast')).toBeHidden();
  }
  await page.getByTestId('lifecycle-toast').evaluate((node) => {
    (node as HTMLElement).style.transition = 'none';
  });
  await expectOneHide(page);
});

test('re-show invalidates the old exit completion and the next close reports one hide', async ({
  page
}) => {
  await open(page);
  await showVisible(page);
  await page.evaluate(() => {
    document.querySelector<HTMLElement>('[data-pw="toast-close"]')?.click();
    document.querySelector<HTMLElement>('[data-pw="replace-message"]')?.click();
  });
  await expect(page.getByTestId('lifecycle-toast')).toContainText('Saved 1');
  await expect(page.getByTestId('lifecycle-toast')).toBeVisible();
  await page.waitForTimeout(250);
  await expect(page.getByTestId('hide-count')).toHaveText('0');
  await page.getByTestId('toast-close').click();
  await expectOneHide(page);
});

test('unmount cancels pending hide notification', async ({ page }) => {
  await open(page);
  await page.getByTestId('close-unmount').click();
  await expect(page.getByTestId('lifecycle-toast')).toHaveCount(0);
  await page.waitForTimeout(250);
  await expect(page.getByTestId('hide-count')).toHaveText('0');
});

test('two synchronous native closes still report one hide', async ({ page }) => {
  await open(page);
  await showVisible(page);
  await page.evaluate(() => {
    const close = document.querySelector<HTMLElement>('[data-pw="toast-close"]');
    close?.click();
    close?.click();
  });
  await expectOneHide(page);
});

test('active old exit is cancelled by re-show; only the new hide notifies', async ({
  page
}, testInfo) => {
  await page.goto(`${fixtureBaseURL}/toast-close-lifecycle/`);
  await page.getByTestId('show-toast').click();
  const toast = page.getByTestId('lifecycle-toast');
  await expect.poll(() => toast.evaluate((node) => getComputedStyle(node).opacity)).toBe('1');
  await toast.evaluate((node) =>
    (node as HTMLElement).style.setProperty('--toast-close-duration', '2000ms')
  );
  await page.getByTestId('toast-close').click();
  const old = await toast.evaluate((node) => {
    const animations = node
      .getAnimations()
      .filter((a) => 'transitionProperty' in a && a.transitionProperty === 'opacity');
    document.body.dataset.oldExitOutcome = animations.length ? 'pending' : 'no-held-exit';
    for (const a of animations) {
      void a.finished.then(
        () => {
          document.body.dataset.oldExitOutcome = 'finished';
        },
        () => {
          document.body.dataset.oldExitOutcome = 'cancelled';
        }
      );
    }
    return {
      count: animations.length,
      opacity: getComputedStyle(node).opacity,
      display: getComputedStyle(node).display,
      hides: document.querySelector('[data-pw="hide-count"]')?.textContent
    };
  });
  await page.getByTestId('replace-message').click();
  await expect(toast).toContainText('Saved 1');
  await expect.poll(() => toast.evaluate((node) => getComputedStyle(node).opacity)).toBe('1');
  if (old.count) {
    await expect
      .poll(() => page.evaluate(() => document.body.dataset.oldExitOutcome))
      .toBe('cancelled');
  } else {
    expect(old.display).toBe('none');
  }
  await page.waitForTimeout(2100);
  await expect(page.getByTestId('hide-count')).toHaveText(old.hides ?? '0');
  await page.getByTestId('toast-close').click();
  await expect(page.getByTestId('hide-count')).toHaveText(String(Number(old.hides) + 1));
  await expect(toast).toBeHidden();
  await page.waitForTimeout(250);
  await expect(page.getByTestId('hide-count')).toHaveText(String(Number(old.hides) + 1));
  await testInfo.attach('observed-old-exit', {
    body: JSON.stringify({
      ...old,
      oldOutcome: await page.evaluate(() => document.body.dataset.oldExitOutcome)
    }),
    contentType: 'application/json'
  });
});

test('a genuine queued old transitionend cannot duplicate the newly closed message notification', async ({
  page
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(`${fixtureBaseURL}/toast-close-lifecycle/`);
  await page.getByTestId('show-toast').click();
  const toast = page.getByTestId('lifecycle-toast');
  await expect.poll(() => toast.evaluate((node) => getComputedStyle(node).opacity)).toBe('1');
  await toast.evaluate(async (node) => {
    const entrances = node
      .getAnimations()
      .filter(
        (animation) =>
          'transitionProperty' in animation && animation.transitionProperty === 'opacity'
      );
    await Promise.all(entrances.map((animation) => animation.finished));
    if (getComputedStyle(node).transitionProperty !== 'opacity, transform, display') {
      throw new Error('Expected the Toast opacity, transform and discrete display transitions');
    }
    (node as HTMLElement).style.setProperty('--toast-close-duration', '700ms');
    // Keep display on screen past opacity completion. Some engines cancel opacity.finished
    // when discrete display reaches none at the same deadline; that is a different lifecycle.
    (node as HTMLElement).style.transitionDuration = '700ms, 700ms, 1000ms';
  });
  await page.getByTestId('toast-close').click();
  const observed = await toast.evaluate(async (node) => {
    const opacity = node
      .getAnimations()
      .find(
        (animation) =>
          'transitionProperty' in animation &&
          animation.transitionProperty === 'opacity' &&
          animation.playState === 'running' &&
          animation.effect instanceof KeyframeEffect &&
          String(animation.effect.getKeyframes().at(-1)?.opacity) === '0'
      );
    if (node.classList.contains('is-visible')) {
      throw new Error('Expected the native close to apply before observing its exit');
    }
    if (getComputedStyle(node).display !== 'none' && !opacity) {
      throw new Error('Expected an actual running opacity exit toward zero');
    }
    const initialHides = Number(document.querySelector('[data-pw="hide-count"]')?.textContent);
    if (opacity) {
      document.body.addEventListener(
        'transitionend',
        (event) => {
          if (event.target === node && (event as TransitionEvent).propertyName === 'opacity') {
            document.body.dataset.queuedOldEndText = node.textContent ?? '';
          }
        },
        { capture: true }
      );
      await opacity.finished;
    }
    const beforeReplace = Number(document.querySelector('[data-pw="hide-count"]')?.textContent);
    document.querySelector<HTMLElement>('[data-pw="replace-message"]')?.click();
    await Promise.resolve();
    const newShown = node.classList.contains('is-visible');
    document.querySelector<HTMLElement>('[data-pw="toast-close"]')?.click();
    return { heldExit: Boolean(opacity), initialHides, beforeReplace, newShown };
  });
  expect(observed.newShown).toBe(true);
  if (observed.heldExit) {
    expect(observed.beforeReplace).toBe(0);
  }
  await expect(page.getByTestId('hide-count')).toHaveText(String(observed.initialHides + 1));
  await expect(toast).toBeHidden();
  await page.waitForTimeout(250);
  await expect(page.getByTestId('hide-count')).toHaveText(String(observed.initialHides + 1));
  const oldEndText = await page.evaluate(() => document.body.dataset.queuedOldEndText);
  if (observed.heldExit) {
    expect(oldEndText).toContain('Saved 1');
  }
  await testInfo.attach('queued-real-old-end', {
    body: JSON.stringify({ ...observed, oldEndText }),
    contentType: 'application/json'
  });
});
