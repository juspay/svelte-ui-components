import { describe, expect, it } from 'vitest';
import { computeSelectDropdownPosition } from './dropdownPosition';

const trigger = { left: 100, right: 300, top: 200, bottom: 240, width: 200 };
const viewport = { width: 1000, height: 800 };

describe('computeSelectDropdownPosition', () => {
  it('anchors a left-aligned panel to the trigger left edge and matches its width', () => {
    const placement = computeSelectDropdownPosition({
      trigger,
      dropdown: { width: 200, height: 120 },
      viewport,
      align: 'left',
      gap: 4
    });
    expect(placement.left).toBe(100);
    expect(placement.top).toBe(244); // bottom (240) + gap (4)
    expect(placement.width).toBe(200);
    expect(placement.minWidth).toBe(200);
    expect(placement.flippedUp).toBe(false);
  });

  it('hangs a wider right-aligned panel leftward from the trigger right edge', () => {
    // trigger right edge at 600; a 320px panel therefore starts at 280 — left of
    // the trigger's own left edge (400), i.e. it hangs leftward.
    const rightTrigger = { left: 400, right: 600, top: 200, bottom: 240, width: 200 };
    const placement = computeSelectDropdownPosition({
      trigger: rightTrigger,
      dropdown: { width: 320, height: 120 },
      viewport,
      align: 'right',
      gap: 4
    });
    expect(placement.left).toBe(600 - 320); // right edge minus measured width → 280
    expect(placement.left).toBeLessThan(rightTrigger.left); // hangs leftward
    expect(placement.width).toBeNull(); // right-aligned panels keep their content width
    expect(placement.minWidth).toBe(200);
  });

  it('clamps a right-aligned panel to the left viewport margin when it would overflow', () => {
    const placement = computeSelectDropdownPosition({
      trigger,
      dropdown: { width: 320, height: 120 },
      viewport,
      align: 'right',
      gap: 4
    });
    // right edge 300 minus 320 = -20 → clamped to the 8px margin
    expect(placement.left).toBe(8);
  });

  it('flips above the trigger when there is no room below and more room above', () => {
    const lowTrigger = { left: 100, right: 300, top: 700, bottom: 740, width: 200 };
    const placement = computeSelectDropdownPosition({
      trigger: lowTrigger,
      dropdown: { width: 200, height: 200 },
      viewport,
      align: 'left',
      gap: 4
    });
    expect(placement.flippedUp).toBe(true);
    expect(placement.top).toBe(700 - 4 - 200); // trigger top - gap - height
  });

  it('does not flip when the panel height is unmeasured (0)', () => {
    const lowTrigger = { left: 100, right: 300, top: 700, bottom: 740, width: 200 };
    const placement = computeSelectDropdownPosition({
      trigger: lowTrigger,
      dropdown: { width: 200, height: 0 },
      viewport,
      align: 'left',
      gap: 4
    });
    expect(placement.flippedUp).toBe(false);
    expect(placement.top).toBe(744);
  });

  it('clamps a panel to the right viewport margin instead of overflowing', () => {
    const rightTrigger = { left: 900, right: 990, top: 200, bottom: 240, width: 90 };
    const placement = computeSelectDropdownPosition({
      trigger: rightTrigger,
      dropdown: { width: 300, height: 120 },
      viewport,
      align: 'left',
      gap: 4
    });
    // left-aligned width matches the 90px trigger, so it fits: left stays at the trigger left
    expect(placement.left).toBe(900);
    expect(placement.width).toBe(90);
  });
});
