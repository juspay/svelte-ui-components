import { expect, test } from '@playwright/test';

// Progress previously rendered with no ARIA at all -- a screen reader had no
// way to know the .container div was a progress indicator, let alone its
// current value. This adds role="progressbar" plus aria-valuenow/-min/-max,
// matching the same percentage-based convention Gauge.svelte already ships
// in this repo (0-100 regardless of the raw value/max domain, so "45%" reads
// the same regardless of what value/max the consumer actually passed).
test.describe('Progress ARIA', () => {
  test('determinate progress bar exposes role, value, and label attributes', async ({ page }) => {
    await page.goto('/components/progress');

    const bar = page.getByTestId('progress-determinate-demo');
    await expect(bar).toHaveAttribute('role', 'progressbar');
    await expect(bar).toHaveAttribute('aria-valuemin', '0');
    await expect(bar).toHaveAttribute('aria-valuemax', '100');
    // Demo seeds progressValue = 65 at max = 100.
    await expect(bar).toHaveAttribute('aria-valuenow', '65');
    // Demo passes an explicit ariaLabel -- it must win over the percentage fallback.
    await expect(bar).toHaveAttribute('aria-label', 'File upload progress');
  });

  test('aria-valuenow tracks the visible label for whole-number percentages', async ({ page }) => {
    await page.goto('/components/progress');

    const bar = page.getByTestId('progress-determinate-demo');
    await page.getByRole('button', { name: '+10' }).click();

    // 75 and 55 out of 100 round to a clean 2-decimal value with no
    // remainder, so aria-valuenow (2-decimal precision) and the whole-number
    // .label text still coincide here. The fractional-demo test below covers
    // the case where they diverge.
    await expect(bar).toHaveAttribute('aria-valuenow', '75');
    await expect(bar.locator('.label')).toHaveText('75%');

    await page.getByRole('button', { name: '-10' }).click();
    await page.getByRole('button', { name: '-10' }).click();

    await expect(bar).toHaveAttribute('aria-valuenow', '55');
    await expect(bar.locator('.label')).toHaveText('55%');
  });

  test('aria-valuenow uses 2-decimal precision to stay in step with the bar width', async ({
    page
  }) => {
    await page.goto('/components/progress');

    // value=1, max=3 -> a repeating-decimal 33.333...% bar width. Whole-number
    // rounding (the old behavior) would report aria-valuenow="33", a full
    // percentage point off from what's visually rendered. 2-decimal rounding
    // keeps the announced value within 0.003 of the true width instead.
    const bar = page.getByTestId('progress-fractional-demo');
    await expect(bar).toHaveAttribute('aria-valuenow', '33.33');
    // The human-readable label still rounds to a whole percent for readability.
    await expect(bar.locator('.label')).toHaveText('33%');
    // No explicit ariaLabel on this demo -- falls back to the same label text.
    await expect(bar).toHaveAttribute('aria-label', '33%');
  });

  test('indeterminate progress bar omits aria-valuenow and announces busy state', async ({
    page
  }) => {
    await page.goto('/components/progress');

    const bar = page.getByTestId('progress-indeterminate-demo');
    await expect(bar).toHaveAttribute('role', 'progressbar');
    // aria-valuemin/-valuemax are kept even while indeterminate: the 0-100
    // scale itself isn't unknown, only the current position within it is.
    await expect(bar).toHaveAttribute('aria-valuemin', '0');
    await expect(bar).toHaveAttribute('aria-valuemax', '100');
    await expect(bar).not.toHaveAttribute('aria-valuenow');
    await expect(bar).toHaveAttribute('aria-valuetext', 'indeterminate');
    await expect(bar).toHaveAttribute('aria-busy', 'true');
    // No explicit ariaLabel on this demo -- falls back to "Loading", matching
    // the aria-label LoadingDots already uses for its own loading state.
    await expect(bar).toHaveAttribute('aria-label', 'Loading');
  });

  test('all demo instances are discoverable via the progressbar role', async ({ page }) => {
    await page.goto('/components/progress');

    await expect(page.getByRole('progressbar')).toHaveCount(8);
  });
});

// CodeRabbit flagged that value={0} max={0} makes (value / max) * 100 evaluate
// to NaN, which the old clamps preserved as-is -- landing "NaN" in
// aria-valuenow (not a valid ARIA value), a "NaN%" bar width, and a "NaN%"
// visible label. An invalid range (a max that isn't finite and positive, or a
// non-finite value) is now treated as a 0% determinate bar instead: no NaN
// reaches the DOM, and the bar renders exactly as an empty progress bar would.
test.describe('Progress invalid range fallback', () => {
  test('value=0, max=0 renders a 0% bar instead of NaN', async ({ page }) => {
    await page.goto('/components/progress');

    const bar = page.getByTestId('progress-zero-range-demo');
    await expect(bar).toHaveAttribute('role', 'progressbar');
    await expect(bar).toHaveAttribute('aria-valuenow', '0');
    await expect(bar).not.toHaveAttribute('aria-valuenow', 'NaN');
    await expect(bar).toHaveAttribute('aria-label', '0%');
    await expect(bar.locator('.label')).toHaveText('0%');
    await expect(bar.locator('.bar')).toHaveCSS('width', '0px');
  });

  test('a negative max is an invalid range and also falls back to 0%', async ({ page }) => {
    await page.goto('/components/progress');

    const bar = page.getByTestId('progress-negative-max-demo');
    await expect(bar).toHaveAttribute('aria-valuenow', '0');
    await expect(bar).toHaveAttribute('aria-label', '0%');
  });

  test('a non-finite max is an invalid range and also falls back to 0%', async ({ page }) => {
    await page.goto('/components/progress');

    const bar = page.getByTestId('progress-nan-max-demo');
    await expect(bar).toHaveAttribute('aria-valuenow', '0');
    await expect(bar).toHaveAttribute('aria-label', '0%');
  });

  test('a non-finite value is an invalid range, not indeterminate', async ({ page }) => {
    await page.goto('/components/progress');

    // NaN < 0 is false, so a NaN value doesn't trip the isIndeterminate check
    // on its own -- it must be caught by the same finite-range guard as an
    // invalid max, otherwise it would slip through to the same NaN path.
    const bar = page.getByTestId('progress-nan-value-demo');
    await expect(bar).not.toHaveAttribute('aria-busy');
    await expect(bar).toHaveAttribute('aria-valuenow', '0');
    await expect(bar).toHaveAttribute('aria-label', '0%');
  });

  test('a negative value paired with an invalid max is still indeterminate', async ({ page }) => {
    // Regression guard: the invalid-range fallback (max=0 here) must stay
    // scoped to `percentage`/`aria-valuenow` and must not suppress the
    // pre-existing negative-value indeterminate behavior, since indeterminate
    // mode never reads `percentage` in the markup anyway.
    await page.goto('/components/progress');

    const bar = page.getByTestId('progress-negative-value-invalid-max-demo');
    await expect(bar).toHaveAttribute('aria-busy', 'true');
    await expect(bar).toHaveAttribute('aria-valuetext', 'indeterminate');
    await expect(bar).not.toHaveAttribute('aria-valuenow');
  });
});
