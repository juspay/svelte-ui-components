import { expect, test } from '@playwright/test';

test.describe('DateRangePicker — typeable date inputs (showDateInputs)', () => {
  // The start/end date boxes are real <input> elements now, not read-only display text:
  // typing a valid date and committing it (Enter) updates the draft, clears whichever
  // preset was active (a typed date is a custom selection, same as a calendar click),
  // and leaves Apply enabled since both boundaries are still set.
  test('typing a valid date commits it on Enter and clears the active preset', async ({ page }) => {
    await page.goto('/components/date-range-picker');

    const picker = page.getByTestId('drp-typeable-dates-demo');
    await picker.getByRole('button', { name: 'Open date picker' }).click();
    await expect(page.getByTestId('drp-typeable-dates-demo-panel')).toBeVisible();

    // Seeded from the "Today" preset via initialPresetLabel — it starts active.
    await expect(picker.getByRole('option', { selected: true })).toContainText('Today');

    const startDateInput = page.getByTestId('drp-typeable-dates-demo-start-date');
    const target = new Date();
    target.setDate(target.getDate() - 5);

    await startDateInput.fill(
      `${target.getMonth() + 1}/${target.getDate()}/${target.getFullYear()}`
    );
    await startDateInput.press('Enter');

    // The field re-renders with the canonical formatted display of the committed date.
    const committedValue = await startDateInput.inputValue();
    expect(committedValue).toContain(String(target.getDate()));
    expect(committedValue).toContain(String(target.getFullYear()));

    // A typed date is a custom selection — no preset stays highlighted.
    await expect(picker.getByRole('option', { selected: true })).toHaveCount(0);

    // The calendar/draft state stayed in sync with the typed value, so Apply is still enabled.
    await expect(picker.getByRole('button', { name: 'Apply date selection' })).toBeEnabled();
  });

  test('committing a typed date also works via blur, not just Enter', async ({ page }) => {
    await page.goto('/components/date-range-picker');

    const picker = page.getByTestId('drp-typeable-dates-demo');
    await picker.getByRole('button', { name: 'Open date picker' }).click();

    const startDateInput = page.getByTestId('drp-typeable-dates-demo-start-date');
    const endDateInput = page.getByTestId('drp-typeable-dates-demo-end-date');

    // The seeded "Today" preset puts draftStart at today, and this fixture's maxDate is
    // also today — so an end date a few days back would cross the (still-today) start
    // boundary. Move start back first (a valid Enter-committed edit, exercised in other
    // tests here) to open up room for a distinct, non-crossing end date to commit via blur.
    const newStart = new Date();
    newStart.setDate(newStart.getDate() - 10);
    await startDateInput.fill(
      `${newStart.getMonth() + 1}/${newStart.getDate()}/${newStart.getFullYear()}`
    );
    await startDateInput.press('Enter');

    const target = new Date();
    target.setDate(target.getDate() - 3);

    await endDateInput.fill(`${target.getMonth() + 1}/${target.getDate()}/${target.getFullYear()}`);
    await endDateInput.blur();

    const committedValue = await endDateInput.inputValue();
    expect(committedValue).toContain(String(target.getDate()));
    expect(committedValue).toContain(String(target.getFullYear()));
  });

  test('unparseable text is rejected and reverts to the last committed value on blur', async ({
    page
  }) => {
    await page.goto('/components/date-range-picker');

    const picker = page.getByTestId('drp-typeable-dates-demo');
    await picker.getByRole('button', { name: 'Open date picker' }).click();

    const startDateInput = page.getByTestId('drp-typeable-dates-demo-start-date');
    const originalValue = await startDateInput.inputValue();

    await startDateInput.fill('not a date');
    await startDateInput.blur();

    await expect(startDateInput).toHaveValue(originalValue);
  });

  test('a date past maxDate is rejected and reverts, leaving Apply enabled', async ({ page }) => {
    await page.goto('/components/date-range-picker');

    const picker = page.getByTestId('drp-typeable-dates-demo');
    await picker.getByRole('button', { name: 'Open date picker' }).click();

    const endDateInput = page.getByTestId('drp-typeable-dates-demo-end-date');
    const originalValue = await endDateInput.inputValue();

    // This fixture's maxDate is today, so tomorrow is always out of range.
    const beyondMax = new Date();
    beyondMax.setDate(beyondMax.getDate() + 1);
    await endDateInput.fill(
      `${beyondMax.getMonth() + 1}/${beyondMax.getDate()}/${beyondMax.getFullYear()}`
    );
    await endDateInput.press('Enter');

    await expect(endDateInput).toHaveValue(originalValue);
    await expect(picker.getByRole('button', { name: 'Apply date selection' })).toBeEnabled();
  });

  test('a date before minDate is rejected and reverts', async ({ page }) => {
    await page.goto('/components/date-range-picker');

    const picker = page.getByTestId('drp-typeable-dates-demo');
    await picker.getByRole('button', { name: 'Open date picker' }).click();

    const startDateInput = page.getByTestId('drp-typeable-dates-demo-start-date');
    const originalValue = await startDateInput.inputValue();

    // This fixture's minDate is 30 days back; 40 days back is always out of range.
    const beforeMin = new Date();
    beforeMin.setDate(beforeMin.getDate() - 40);
    await startDateInput.fill(
      `${beforeMin.getMonth() + 1}/${beforeMin.getDate()}/${beforeMin.getFullYear()}`
    );
    await startDateInput.press('Enter');

    await expect(startDateInput).toHaveValue(originalValue);
  });

  test('typing a start date after the committed end date is rejected (boundary crossing)', async ({
    page
  }) => {
    await page.goto('/components/date-range-picker');

    const picker = page.getByTestId('drp-typeable-dates-demo');
    await picker.getByRole('button', { name: 'Open date picker' }).click();

    const startDateInput = page.getByTestId('drp-typeable-dates-demo-start-date');
    const endDateInput = page.getByTestId('drp-typeable-dates-demo-end-date');

    // Move start well before the seeded "Today" end, then move end back in — both
    // valid commits — so start and end no longer share a day and a genuine
    // start-after-end attempt below isn't also blocked by minDate/maxDate.
    const newStart = new Date();
    newStart.setDate(newStart.getDate() - 20);
    await startDateInput.fill(
      `${newStart.getMonth() + 1}/${newStart.getDate()}/${newStart.getFullYear()}`
    );
    await startDateInput.press('Enter');

    const newEnd = new Date();
    newEnd.setDate(newEnd.getDate() - 15);
    await endDateInput.fill(`${newEnd.getMonth() + 1}/${newEnd.getDate()}/${newEnd.getFullYear()}`);
    await endDateInput.press('Enter');

    const startValueBeforeCrossing = await startDateInput.inputValue();

    // Now try to push start past the committed end — still within minDate/maxDate,
    // so only the boundary-crossing check can reject it.
    const afterEnd = new Date();
    afterEnd.setDate(afterEnd.getDate() - 10);
    await startDateInput.fill(
      `${afterEnd.getMonth() + 1}/${afterEnd.getDate()}/${afterEnd.getFullYear()}`
    );
    await startDateInput.press('Enter');

    await expect(startDateInput).toHaveValue(startValueBeforeCrossing);
  });

  // The live invalid border and the commit rule must agree. While they were separate
  // expressions, a boundary-crossing date typed cleanly with no invalid styling and then
  // silently reverted on commit, leaving no cue as to why — the field just snapped back.
  test('a boundary-crossing date is flagged invalid while typing, before any commit', async ({
    page
  }) => {
    await page.goto('/components/date-range-picker');

    const picker = page.getByTestId('drp-typeable-dates-demo');
    await picker.getByRole('button', { name: 'Open date picker' }).click();

    const startDateInput = page.getByTestId('drp-typeable-dates-demo-start-date');
    const endDateInput = page.getByTestId('drp-typeable-dates-demo-end-date');

    // Open a gap between the boundaries so the crossing attempt below is rejected
    // only by the crossing rule, not by minDate/maxDate.
    const newStart = new Date();
    newStart.setDate(newStart.getDate() - 20);
    await startDateInput.fill(
      `${newStart.getMonth() + 1}/${newStart.getDate()}/${newStart.getFullYear()}`
    );
    await startDateInput.press('Enter');

    const newEnd = new Date();
    newEnd.setDate(newEnd.getDate() - 15);
    await endDateInput.fill(`${newEnd.getMonth() + 1}/${newEnd.getDate()}/${newEnd.getFullYear()}`);
    await endDateInput.press('Enter');

    await expect(startDateInput).toHaveAttribute('aria-invalid', 'false');

    // A start 10 days back sits after the committed end (15 days back) and is inside
    // minDate/maxDate, so only the crossing rule can reject it.
    const afterEnd = new Date();
    afterEnd.setDate(afterEnd.getDate() - 10);
    await startDateInput.fill(
      `${afterEnd.getMonth() + 1}/${afterEnd.getDate()}/${afterEnd.getFullYear()}`
    );

    // Flagged immediately — no Enter, no blur.
    await expect(startDateInput).toHaveAttribute('aria-invalid', 'true');
  });

  // maxRangeDays is enforced by the calendar grid only while a range is mid-selection
  // (start set, end still null). Once both boundaries exist that guard goes quiet, so
  // the typed path has to check the span itself or it can commit a range the grid would
  // never have allowed.
  test('retyping a boundary cannot stretch a completed range past maxRangeDays', async ({
    page
  }) => {
    await page.goto('/components/date-range-picker');

    const picker = page.getByTestId('drp-typeable-maxrange-demo');
    await picker.getByRole('button', { name: 'Open date picker' }).click();
    await expect(page.getByTestId('drp-typeable-maxrange-demo-panel')).toBeVisible();

    const startDateInput = page.getByTestId('drp-typeable-maxrange-demo-start-date');
    const endDateInput = page.getByTestId('drp-typeable-maxrange-demo-end-date');

    // Seeded from "Today", so both boundaries are already set — the range is complete
    // and the grid's own span guard is therefore inactive.
    const committedStart = await startDateInput.inputValue();

    // 20 days back against a today-ish end is a ~21-day span, well past the demo's
    // maxRangeDays of 7, while still inside the demo's 30-day minDate.
    const tooFarBack = new Date();
    tooFarBack.setDate(tooFarBack.getDate() - 20);
    await startDateInput.fill(
      `${tooFarBack.getMonth() + 1}/${tooFarBack.getDate()}/${tooFarBack.getFullYear()}`
    );

    // Flagged live...
    await expect(startDateInput).toHaveAttribute('aria-invalid', 'true');

    // ...and refused on commit, reverting to the previously committed value.
    await startDateInput.press('Enter');
    await expect(startDateInput).toHaveValue(committedStart);

    // A span inside the limit still commits, so the guard is not simply rejecting everything.
    const withinLimit = new Date();
    withinLimit.setDate(withinLimit.getDate() - 3);
    await startDateInput.fill(
      `${withinLimit.getMonth() + 1}/${withinLimit.getDate()}/${withinLimit.getFullYear()}`
    );
    await expect(startDateInput).toHaveAttribute('aria-invalid', 'false');
    await startDateInput.press('Enter');
    await expect(startDateInput).toHaveValue(new RegExp(String(withinLimit.getDate()) + '\\b'));
  });
});
