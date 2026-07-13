import { describe, expect, it } from 'vitest';
import { computeMenuDropdownPosition } from './dropdownPosition';

const viewport = { width: 1000, height: 800 };
const dropdown = { width: 160, height: 200 };

describe('computeMenuDropdownPosition', () => {
  it('bottom-left: panel left edge to container left, below the container', () => {
    const container = { left: 100, right: 180, top: 200, bottom: 230 };
    const pos = computeMenuDropdownPosition({
      container,
      dropdown,
      placement: 'bottom-left',
      gap: 4,
      viewport
    });
    expect(pos).toEqual({ left: 100, top: 234 });
  });

  it('bottom-right: panel right edge to container right, below the container', () => {
    const container = { left: 100, right: 180, top: 200, bottom: 230 };
    const pos = computeMenuDropdownPosition({
      container,
      dropdown,
      placement: 'bottom-right',
      gap: 4,
      viewport
    });
    expect(pos).toEqual({ left: 180 - 160, top: 234 });
  });

  it('top-left: panel left edge to container left, above the container', () => {
    const container = { left: 100, right: 180, top: 400, bottom: 430 };
    const pos = computeMenuDropdownPosition({
      container,
      dropdown,
      placement: 'top-left',
      gap: 4,
      viewport
    });
    expect(pos).toEqual({ left: 100, top: 400 - 200 - 4 });
  });

  it('top-right: panel right edge to container right, above the container', () => {
    const container = { left: 300, right: 400, top: 400, bottom: 430 };
    const pos = computeMenuDropdownPosition({
      container,
      dropdown,
      placement: 'top-right',
      gap: 4,
      viewport
    });
    expect(pos).toEqual({ left: 400 - 160, top: 400 - 200 - 4 });
  });

  it('clamps to the viewport margin when a corner would overflow', () => {
    // Trigger pinned to the bottom-right corner: both axes overflow.
    const container = { left: 960, right: 995, top: 760, bottom: 790 };
    const pos = computeMenuDropdownPosition({
      container,
      dropdown,
      placement: 'bottom-right',
      gap: 4,
      viewport
    });
    // left 995 - 160 = 835 > maxLeft (1000 - 160 - 8 = 832) → clamp to 832
    expect(pos.left).toBe(viewport.width - dropdown.width - 8);
    // top 790 + 4 = 794 > maxTop (800 - 200 - 8 = 592) → clamp to 592
    expect(pos.top).toBe(viewport.height - dropdown.height - 8);
  });
});
