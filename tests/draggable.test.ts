import { expect, test } from '@playwright/test';

test.describe('Draggable', () => {
  test('dragging the handle moves the element', async ({ page }) => {
    await page.goto('/components/draggable');

    const box = page.getByTestId('draggable-demo');
    const before = await box.boundingBox();
    if (before === null) {
      throw new Error('Draggable boundingBox is null');
    }

    const handle = page.locator('.drag-handle');
    const handleBox = await handle.boundingBox();
    if (handleBox === null) {
      throw new Error('handle boundingBox is null');
    }

    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;
    const deltaX = 80;
    const deltaY = 40;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 5 });
    await page.mouse.up();

    const after = await box.boundingBox();
    if (after === null) {
      throw new Error('Draggable boundingBox is null after drag');
    }
    // The element moves by exactly the pointer delta (position is unconstrained here).
    expect(Math.round(after.x - before.x)).toBe(deltaX);
    expect(Math.round(after.y - before.y)).toBe(deltaY);
  });

  test('clicking body content outside the handle does not start a drag', async ({ page }) => {
    await page.goto('/components/draggable');

    const box = page.getByTestId('draggable-demo');
    const before = await box.boundingBox();
    if (before === null) {
      throw new Error('Draggable boundingBox is null');
    }

    const label = page.getByText(/^\d+, \d+$/);
    const labelBox = await label.boundingBox();
    if (labelBox === null) {
      throw new Error('label boundingBox is null');
    }

    await page.mouse.move(labelBox.x + labelBox.width / 2, labelBox.y + labelBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(labelBox.x + 60, labelBox.y + 60, { steps: 5 });
    await page.mouse.up();

    const after = await box.boundingBox();
    if (after === null) {
      throw new Error('Draggable boundingBox is null after attempted drag');
    }
    expect(Math.round(after.x)).toBe(Math.round(before.x));
    expect(Math.round(after.y)).toBe(Math.round(before.y));
  });

  test('arrow keys move the element by step once focused', async ({ page }) => {
    await page.goto('/components/draggable');

    const box = page.getByTestId('draggable-demo');
    await box.focus();
    const before = await box.boundingBox();
    if (before === null) {
      throw new Error('Draggable boundingBox is null');
    }

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');

    const after = await box.boundingBox();
    if (after === null) {
      throw new Error('Draggable boundingBox is null after keyboard move');
    }
    expect(Math.round(after.x - before.x)).toBe(32); // 2 x default step (16px)
    expect(Math.round(after.y - before.y)).toBe(16);
  });

  test('bounds="viewport" keeps the element from being dragged off-screen', async ({ page }) => {
    await page.goto('/components/draggable');

    const box = page.getByTestId('draggable-demo');
    const handle = page.locator('.drag-handle');
    const handleBox = await handle.boundingBox();
    if (handleBox === null) {
      throw new Error('handle boundingBox is null');
    }
    const viewport = page.viewportSize();
    if (viewport === null) {
      throw new Error('viewport is null');
    }

    // Drag far past the left/top viewport edge.
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(-500, -500, { steps: 10 });
    await page.mouse.up();

    const after = await box.boundingBox();
    if (after === null) {
      throw new Error('Draggable boundingBox is null after clamped drag');
    }
    expect(after.x).toBeGreaterThanOrEqual(-1);
    expect(after.y).toBeGreaterThanOrEqual(-1);
    expect(after.x).toBeLessThanOrEqual(viewport.width);
    expect(after.y).toBeLessThanOrEqual(viewport.height);
  });
});
