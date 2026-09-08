import { expect, test } from '@playwright/test';

// #464. The demo shell used to set `--pill-background` / `--pill-color` on
// `[data-theme='dark']` itself, for the untoned chat suggestion chips and composer
// attachment pills. But Pill resolves colour as
// `var(--pill-background, var(--_pill-tone-background, …))`, so a bare value on the theme
// root wins over the tone layer by design — which silently flattened every `tone="…"` chip
// to that same grey. All five tones rendered byte-identical, so the Pill demo showed five
// indistinguishable chips labelled Accent/Ok/Warn/Danger/Muted in dark mode.
//
// This guards both halves of the fix: tones stay distinct, and the untoned pills keep the
// neutral chip the override existed to give them.

const TONES = ['accent', 'ok', 'warn', 'danger', 'muted'] as const;

const NEUTRAL_DARK_BACKGROUND = 'rgb(37, 37, 53)';
const NEUTRAL_DARK_COLOR = 'rgb(209, 213, 219)';

const paintOf = (page: import('@playwright/test').Page, testId: string) =>
  page.locator(`[data-pw="${testId}"]`).evaluate((el) => {
    const s = getComputedStyle(el);
    return `${s.backgroundColor} / ${s.color}`;
  });

// `paintOf` is a one-shot read, so the dark theme has to have actually landed before any of
// them run. Rather than poll a custom property by string — `getPropertyValue` returns values
// verbatim, leading whitespace included, so an equality check there is its own flake — this
// waits on a web-first assertion, which retries until the style resolves. Nothing transitions
// in the demo shell today, so this is future-proofing rather than a live fix.
test.beforeEach(async ({ page }) => {
  await page.goto('/components/pill');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await expect(page.locator('[data-pw="attrs-none-pill"]')).toHaveCSS(
    'background-color',
    NEUTRAL_DARK_BACKGROUND
  );
});

test('every tone stays visually distinct in the dark theme', async ({ page }) => {
  const paints = await Promise.all(TONES.map((tone) => paintOf(page, `pill-tone-${tone}`)));

  expect(new Set(paints).size).toBe(TONES.length);

  // ...and none of them has collapsed to the neutral chip, which is what the regression
  // looked like. `muted` deliberately shares the neutral background but not its text
  // colour, so compare the pair rather than the background alone.
  for (const paint of paints) {
    expect(paint).not.toBe(`${NEUTRAL_DARK_BACKGROUND} / ${NEUTRAL_DARK_COLOR}`);
  }
});

test('an untoned pill still gets the neutral dark chip', async ({ page }) => {
  expect(await paintOf(page, 'attrs-none-pill')).toBe(
    `${NEUTRAL_DARK_BACKGROUND} / ${NEUTRAL_DARK_COLOR}`
  );
});
