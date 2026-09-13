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

  it('clamps a flipped-up panel so it never gets a negative top in a short viewport', () => {
    // Short viewport (100px); trigger sits just below its top edge, so there is
    // more room above (50) than below (10) and the panel flips up — but the
    // panel (80px) is still taller than the 50px available above it.
    const shortViewport = { width: 1000, height: 100 };
    const nearTopTrigger = { left: 100, right: 300, top: 50, bottom: 60, width: 200 };
    const placement = computeSelectDropdownPosition({
      trigger: nearTopTrigger,
      dropdown: { width: 200, height: 80 },
      viewport: shortViewport,
      align: 'left',
      gap: 4
    });
    expect(placement.flippedUp).toBe(true);
    // Unclamped this would be 50 - 4 - 80 = -34.
    expect(placement.top).toBeGreaterThanOrEqual(0);
    expect(placement.top).toBe(8); // clamped to the margin
  });

  it('keeps a tall panel placed below the trigger within the viewport when it would otherwise run past the bottom', () => {
    // A 200px-tall viewport with a trigger near the top: space below (160px) is
    // still bigger than space above (20px), so the panel stays below rather
    // than flipping — but the 180px panel is taller than the 160px available,
    // so unclamped it would run 24px past the viewport bottom.
    const viewport200 = { width: 1000, height: 200 };
    const nearTopTriggerTallPanel = { left: 100, right: 300, top: 20, bottom: 40, width: 200 };
    const placement = computeSelectDropdownPosition({
      trigger: nearTopTriggerTallPanel,
      dropdown: { width: 200, height: 180 },
      viewport: viewport200,
      align: 'left',
      gap: 4
    });
    expect(placement.flippedUp).toBe(false); // more room below (160) than above (20)
    // Unclamped this would be 40 + 4 = 44, and 44 + 180 = 224 overflows the 200px viewport.
    expect(placement.top).toBe(12); // clamped to viewport.height (200) - dropdown height (180) - margin (8)
    expect(placement.top + 180).toBeLessThanOrEqual(viewport200.height - 8);
  });

  it('keeps a normal panel in a roomy viewport at its unclamped placement (regression guard)', () => {
    const placement = computeSelectDropdownPosition({
      trigger,
      dropdown: { width: 200, height: 120 },
      viewport,
      align: 'left',
      gap: 4
    });
    // Same as the very first test: plenty of room, so clamping must be a no-op.
    expect(placement.top).toBe(244);
  });

  it('leaves the vertical placement unclamped (not NaN) when the viewport height is non-finite', () => {
    const infiniteViewport = { width: 1000, height: Number.POSITIVE_INFINITY };
    const placement = computeSelectDropdownPosition({
      trigger,
      dropdown: { width: 200, height: 120 },
      viewport: infiniteViewport,
      align: 'left',
      gap: 4
    });
    expect(placement.top).toBe(244); // trigger.bottom + gap, untouched by clamping
    expect(Number.isNaN(placement.top)).toBe(false);
  });
});

/*
 * `vertical` is the seam that lets a caller pin the panel above or below the
 * trigger instead of taking the fit-based flip. Omitting it has to keep the
 * pre-existing auto-flip exactly, because that is what every portaled Select
 * shipped before `placement` existed relies on.
 */
describe('computeSelectDropdownPosition vertical placement', () => {
  // Room below for a 120px panel: 800 - 240 = 560. No flip would ever happen here.
  it('forces the panel above the trigger when vertical is "top", despite room below', () => {
    const placement = computeSelectDropdownPosition({
      trigger,
      dropdown: { width: 200, height: 120 },
      viewport,
      align: 'left',
      vertical: 'top',
      gap: 4
    });
    expect(placement.flippedUp).toBe(true);
    expect(placement.top).toBe(200 - 4 - 120); // trigger top - gap - height
  });

  it('keeps the panel below when vertical is "bottom", even with no room for it', () => {
    // Trigger sits 40px from the viewport bottom; a 400px panel cannot fit below.
    const lowTrigger = { left: 100, right: 300, top: 720, bottom: 760, width: 200 };
    const placement = computeSelectDropdownPosition({
      trigger: lowTrigger,
      dropdown: { width: 200, height: 400 },
      viewport,
      align: 'left',
      vertical: 'bottom',
      gap: 4
    });
    expect(placement.flippedUp).toBe(false);
    expect(placement.top).toBe(764); // bottom (760) + gap (4)
  });

  it('still flips on fit when vertical is omitted, matching the previous behaviour', () => {
    const lowTrigger = { left: 100, right: 300, top: 720, bottom: 760, width: 200 };
    const placement = computeSelectDropdownPosition({
      trigger: lowTrigger,
      dropdown: { width: 200, height: 400 },
      viewport,
      align: 'left',
      gap: 4
    });
    expect(placement.flippedUp).toBe(true);
    expect(placement.top).toBe(720 - 4 - 400);
  });

  it('treats an explicit "auto" the same as omitting it', () => {
    const lowTrigger = { left: 100, right: 300, top: 720, bottom: 760, width: 200 };
    const omitted = computeSelectDropdownPosition({
      trigger: lowTrigger,
      dropdown: { width: 200, height: 400 },
      viewport,
      align: 'left',
      gap: 4
    });
    const explicit = computeSelectDropdownPosition({
      trigger: lowTrigger,
      dropdown: { width: 200, height: 400 },
      viewport,
      align: 'left',
      vertical: 'auto',
      gap: 4
    });
    expect(explicit).toEqual(omitted);
  });
});

/*
 * Pinning a side is new, and it introduces a case the fit-based flip never
 * could: the caller asks for a side the panel does not fit on. Honouring the
 * request is right, but it must not put the panel where nothing can reach it.
 */
describe('computeSelectDropdownPosition pinned-side clamping', () => {
  it('keeps a pinned-top panel on screen when there is not enough room above', () => {
    // Trigger 50px from the top; a 400px panel pinned above would start at -354.
    const highTrigger = { left: 100, right: 300, top: 50, bottom: 90, width: 200 };
    const placement = computeSelectDropdownPosition({
      trigger: highTrigger,
      dropdown: { width: 200, height: 400 },
      viewport,
      align: 'left',
      vertical: 'top',
      gap: 4
    });
    expect(placement.flippedUp).toBe(true);
    expect(placement.top).toBeGreaterThanOrEqual(0);
  });

  /*
   * Deliberately NOT clamped: pulling a too-tall pinned-bottom panel up to fit
   * would park it over the trigger the caller just pinned it below, and the
   * panel's own max-height/overflow already keeps its contents reachable. Only
   * the top edge is unrecoverable, so only the top edge is held.
   */
  it('leaves a pinned-bottom panel below the trigger even when it overflows', () => {
    const lowTrigger = { left: 100, right: 300, top: 720, bottom: 760, width: 200 };
    const placement = computeSelectDropdownPosition({
      trigger: lowTrigger,
      dropdown: { width: 200, height: 400 },
      viewport,
      align: 'left',
      vertical: 'bottom',
      gap: 4
    });
    expect(placement.flippedUp).toBe(false);
    expect(placement.top).toBe(764);
  });

  it('leaves an unconstrained panel exactly where it was', () => {
    const placement = computeSelectDropdownPosition({
      trigger,
      dropdown: { width: 200, height: 120 },
      viewport,
      align: 'left',
      gap: 4
    });
    expect(placement.top).toBe(244);
  });
});

/*
 * An auto-resolved side can still overflow: `'auto'` only prefers the side with
 * more room, and in a short viewport neither side has enough. The panel is
 * `position: fixed` when portaled, so anything past the bottom edge cannot be
 * scrolled back into view -- which is why the auto path clamps both ends and the
 * pinned path, above, deliberately clamps only the top.
 */
describe('computeSelectDropdownPosition auto-side overflow', () => {
  const shortViewport = { width: 1000, height: 200 };
  const shortTrigger = { left: 100, right: 300, top: 20, bottom: 40, width: 200 };

  it('holds an auto-placed panel inside a short viewport', () => {
    const placement = computeSelectDropdownPosition({
      trigger: shortTrigger,
      dropdown: { width: 200, height: 180 },
      viewport: shortViewport,
      align: 'left',
      gap: 4
    });
    // Neither side fits: below has 160px, above has 20px, the panel needs 184px.
    expect(placement.flippedUp).toBe(false);
    expect(placement.top).toBe(12); // viewport 200 - height 180 - margin 8
    expect(placement.top + 180).toBeLessThanOrEqual(shortViewport.height - 8);
  });

  it('does not apply that upper clamp to a pinned side', () => {
    const placement = computeSelectDropdownPosition({
      trigger: shortTrigger,
      dropdown: { width: 200, height: 180 },
      viewport: shortViewport,
      align: 'left',
      vertical: 'bottom',
      gap: 4
    });
    // Pinned below stays below its trigger rather than being dragged over it.
    expect(placement.top).toBe(44);
  });
});
