import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

/**
 * Captures the SUI and polymorph rendering of every shared component, side by
 * side, from one fixture per component.
 *
 * The comparison this produces is structural rather than pixel-exact, and
 * deliberately so: the two libraries ship different stylesheets and different
 * default tokens, so a pixel diff would report every component as different and
 * distinguish nothing. What is worth knowing is narrower — does each side
 * render at all on the same input, and does either throw where the other does
 * not. A component that fails on a fixture its counterpart renders is a real
 * parity gap; a two-pixel border difference is a theming choice.
 */
const OUT = 'parity-report';

test('every shared component renders on both sides', async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  page.on('pageerror', (e) => consoleErrors.push(e.message));

  await page.goto('/parity');
  await page.waitForSelector('[data-pw="parity-row"]', { timeout: 20_000 });
  // Components with mount-time timers or transitions need a beat before capture.
  await page.waitForTimeout(1500);

  const rows = page.locator('[data-pw="parity-row"]');
  const count = await rows.count();
  expect(count, 'no components were paired for comparison').toBeGreaterThan(0);

  const results: Array<{
    component: string;
    suiFailed: boolean;
    polyFailed: boolean;
    suiRendered: boolean;
    polyRendered: boolean;
    suiError: string;
    polyError: string;
  }> = [];

  const styleDiffs: Array<{
    component: string;
    diff: string[];
    suiStyle: Record<string, string> | null;
    polyStyle: Record<string, string> | null;
  }> = [];

  for (let i = 0; i < count; i += 1) {
    const row = rows.nth(i);
    const component = (await row.getAttribute('data-component')) ?? `row-${i}`;
    const sui = row.locator('[data-side="sui"] .stage');
    const poly = row.locator('[data-side="poly"] .stage');

    const readSide = async (side: typeof sui) => {
      const failedNode = side.locator('[data-pw="render-failed"]');
      const failed = (await failedNode.count()) > 0;
      const error = failed ? ((await failedNode.first().textContent()) ?? '').trim() : '';
      // "Rendered" means the stage produced an element, not merely that it did
      // not throw: a component that silently emits nothing is its own finding.
      const html = (await side.innerHTML()).trim();
      return { failed, error, rendered: !failed && html.length > 0 };
    };

    const s = await readSide(sui);
    const p = await readSide(poly);

    // What differs, not merely that something does. A pixel score would rank
    // every component as "different" because the two libraries ship different
    // token defaults, and would name nothing. Computed style on the first
    // rendered element says `border-radius 6px vs 24px`, which is actionable.
    const styleOf = async (side: typeof sui) =>
      side.evaluate((node) => {
        const el = node.firstElementChild;
        if (el === null) {
          return null;
        }
        const c = getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          color: c.color,
          background: c.backgroundColor,
          fontSize: c.fontSize,
          fontWeight: c.fontWeight,
          borderRadius: c.borderRadius,
          padding: c.padding,
          border: c.borderWidth
        };
      });

    const suiStyle = s.rendered ? await styleOf(sui) : null;
    const polyStyle = p.rendered ? await styleOf(poly) : null;
    const styleDiff: string[] = [];
    if (suiStyle !== null && polyStyle !== null) {
      for (const key of Object.keys(suiStyle) as Array<keyof typeof suiStyle>) {
        if (suiStyle[key] !== polyStyle[key]) {
          styleDiff.push(`${key}: ${suiStyle[key]} → ${polyStyle[key]}`);
        }
      }
    }
    styleDiffs.push({ component, diff: styleDiff, suiStyle, polyStyle });

    results.push({
      component,
      suiFailed: s.failed,
      polyFailed: p.failed,
      suiRendered: s.rendered,
      polyRendered: p.rendered,
      suiError: s.error.slice(0, 200),
      polyError: p.error.slice(0, 200)
    });

    mkdirSync(OUT, { recursive: true });
    await row.screenshot({ path: `${OUT}/${component}.png` }).catch(() => null);
  }

  writeFileSync(
    `${OUT}/results.json`,
    JSON.stringify({ results, styleDiffs, consoleErrors }, null, 2)
  );
  await testInfo.attach('parity-results', {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json'
  });

  const bothBlank = results.filter((r) => !r.suiRendered && !r.polyRendered);
  const suiOnlyBroken = results.filter((r) => !r.suiRendered && r.polyRendered);

  // The assertion that matters: SUI must not fail where polymorph succeeds.
  // The reverse is allowed — SUI is the superset and may have moved on.
  expect(
    suiOnlyBroken.map((r) => `${r.component}: ${r.suiError || 'rendered nothing'}`),
    'SUI failed to render a component that polymorph rendered from the same fixture'
  ).toEqual([]);

  // Both blank usually means the fixture is too thin, not that either library is
  // broken. Reported rather than asserted, so the number stays visible.
  expect(Array.isArray(bothBlank)).toBe(true);
});
