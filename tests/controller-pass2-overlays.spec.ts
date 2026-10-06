import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';
import { focusTabStopBefore, tabUntilFocused } from './support/tab-order';

for (const api of ['Svelte', 'WC']) {
  for (const panelKind of ['main', 'compare']) {
    for (const opening of ['pointer', 'keyboard']) {
      test(`${api} ${panelKind} DateRangePicker ${opening} returns to invoking button on Escape, Cancel and Apply`, async ({
        page
      }) => {
        await gotoHydrated(page, '/components/date-range-picker');
        let scope = page.getByTestId(
          panelKind === 'main' ? 'drp-range-demo' : 'drp-standalone-compare-demo'
        );
        if (api === 'WC') {
          await page.route('**/__pass2-wc.js', (route) =>
            route.fulfill({
              contentType: 'application/javascript',
              body: readFileSync('dist-wc/index.js', 'utf8')
            })
          );
          await page.addScriptTag({
            type: 'module',
            content: "import('/__pass2-wc.js').then(module => window.__pass2Wc = module)"
          });
          await page.waitForFunction(() => Reflect.has(window, '__pass2Wc'));
          await page.evaluate(() => {
            const module = Reflect.get(window, '__pass2Wc');
            const host = document.createElement('sui-date-range-picker');
            host.id = 'pass2-picker';
            Object.assign(host, {
              testId: 'pass2-picker',
              rangeStart: new Date(2026, 0, 5),
              rangeEnd: new Date(2026, 0, 10),
              compareStart: new Date(2025, 0, 5),
              compareEnd: new Date(2025, 0, 10),
              compareTrigger: module.createRawSnippet(() => ({
                render: () => '<span>Compare audit</span>'
              })),
              compareCalendar: module.createRawSnippet(() => ({
                render: () => '<div>Compare dates</div>'
              }))
            });
            document.body.prepend(host);
            const before = document.createElement('button');
            before.id = 'before-pass2-picker';
            before.textContent = 'Before picker';
            host.before(before);
          });
          scope = page.locator('#pass2-picker');
        }
        const trigger = scope.locator(
          panelKind === 'main'
            ? '.drp-trigger-wrapper button'
            : '.drp-compare-trigger-wrapper button'
        );
        const panel = scope.locator(panelKind === 'main' ? '.drp-panel' : '.drp-compare-panel');
        // The standalone calendar is consumer-owned. Seed a supported committed
        // compare range before exercising the three closing paths.
        if (api === 'Svelte' && panelKind === 'compare') {
          await trigger.click();
          const dates = panel.locator('button.cell:not([disabled])');
          await dates.nth(8).click();
          await dates.nth(12).click();
          await page.keyboard.press('Escape');
          await expect(panel).toBeHidden();
        }
        for (const close of ['Escape', 'Cancel', 'Apply']) {
          if (opening === 'keyboard') {
            // Arrival is a native Tab event, and Enter opens from that arrival.
            if (api === 'WC') {
              await page.locator('#before-pass2-picker').focus();
              await page.keyboard.press('Tab');
              if (panelKind === 'compare') {
                await page.keyboard.press('Tab');
              }
            } else {
              expect(await focusTabStopBefore(trigger)).toBe(true);
              expect(await tabUntilFocused(page, trigger)).not.toBeNull();
            }
            await expect(trigger).toBeFocused();
            await page.keyboard.press('Enter');
          } else {
            await page.locator('main h1').click();
            await trigger.click();
          }
          await expect(panel).toBeVisible();
          const focusInside = () =>
            panel.evaluate((el) => {
              let active = document.activeElement;
              while (active?.shadowRoot?.activeElement) {
                active = active.shadowRoot.activeElement;
              }
              return Boolean(active && el.contains(active));
            });
          await expect.poll(focusInside).toBe(true);
          await page.keyboard.press('Shift+Tab');
          await expect.poll(focusInside).toBe(true);
          await page.keyboard.press('Tab');
          await expect.poll(focusInside).toBe(true);
          if (close === 'Escape') {
            await page.keyboard.press('Escape');
          } else {
            const button = panel.getByRole('button', {
              name:
                close === 'Apply'
                  ? panelKind === 'main'
                    ? 'Apply date selection'
                    : 'Apply compare selection'
                  : panelKind === 'main'
                    ? 'Cancel date selection'
                    : 'Cancel compare selection',
              exact: true
            });
            if (close === 'Apply' && api === 'Svelte' && panelKind === 'main') {
              await panel.getByRole('option', { name: 'Today', exact: true }).click();
            }
            await expect(button).toBeEnabled();
            await button.click();
          }
          await expect(panel).toBeHidden();
          await expect(trigger).toBeFocused();
        }
      });
    }
  }
}

for (const preference of ['fresh', 'mounted']) {
  test(`reduced ModalAnimation has opaque first painted frames (${preference}, token overrides)`, async ({
    page
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: preference === 'fresh' ? 'reduce' : 'no-preference' });
    await gotoHydrated(page, '/components/modal');
    await page.addStyleTag({
      content:
        ':root { --motion-duration: 5s; --modal-transition-duration: 5s; --modal-transition-distance: 200px; }'
    });
    if (preference === 'mounted') {
      await page.emulateMedia({ reducedMotion: 'reduce' });
    }
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
      true
    );
    await page.evaluate(() => {
      const samples: { opacity: number; transform: string }[] = [];
      Reflect.set(window, 'pass2PaintSamples', samples);
      const tick = () => {
        const content = document.querySelector('.modal-content');
        if (content?.parentElement) {
          const style = getComputedStyle(content.parentElement);
          samples.push({ opacity: Number(style.opacity), transform: style.transform });
        }
        if (samples.length < 8) {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    });
    await page.getByText('Open Modal', { exact: true }).click();
    await expect(page.locator('.modal-content')).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => Reflect.get(window, 'pass2PaintSamples').length))
      .toBe(8);
    const samples = await page.evaluate(() => Reflect.get(window, 'pass2PaintSamples'));
    expect(samples.every((sample: { opacity: number }) => sample.opacity > 0.9)).toBe(true);
    await testInfo.attach('first-painted-frames.json', {
      body: JSON.stringify(samples),
      contentType: 'application/json'
    });
    await page.keyboard.press('Escape');
    await expect(page.locator('.modal-content')).toHaveCount(0);
  });
}
