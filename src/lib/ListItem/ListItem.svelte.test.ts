import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import ListItem from './ListItem.svelte';

// Every sub-region (top-section, left image, center text, right image) previously took
// role="button" + tabindex="0" unconditionally, nesting up to four buttons inside the
// root's own role="button" whenever any content was supplied for those slots -- even with
// zero click handlers wired. DESIGN_PRINCIPLES.md principle 4: a region is only interactive
// when it was actually given its own click handler.
describe('ListItem nested interactive semantics', () => {
  const svgIcon =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Ccircle cx="12" cy="12" r="8" fill="currentColor"/%3E%3C/svg%3E';

  it('a zone with no handler of its own has no role and no tabindex, even with content and sibling handlers', () => {
    const { container } = render(ListItem, {
      label: 'John Doe',
      leftImageUrl: svgIcon,
      rightImageUrl: svgIcon,
      rightContentText: '$120.00',
      topSectionTestId: 'top',
      leftImageTestId: 'left',
      centerTextTestId: 'center',
      rightImageTestId: 'right',
      // Only the root gets a handler -- none of the four sub-regions do.
      onitemclick: vi.fn()
    });

    const topSection = container.querySelector('[data-pw="top"]');
    const leftImage = container.querySelector('[data-pw="left"]');
    const centerText = container.querySelector('[data-pw="center"]');
    const rightImage = container.querySelector('[data-pw="right"]');

    for (const zone of [topSection, leftImage, centerText, rightImage]) {
      expect(zone?.hasAttribute('role')).toBe(false);
      expect(zone?.hasAttribute('tabindex')).toBe(false);
    }
  });

  it('the root alone stays interactive when only its handler is given (no nested buttons)', () => {
    const { container, getAllByRole } = render(ListItem, {
      label: 'John Doe',
      leftImageUrl: svgIcon,
      rightImageUrl: svgIcon,
      onitemclick: vi.fn()
    });

    const root = container.querySelector('.item');
    expect(root?.getAttribute('role')).toBe('button');
    expect(root?.getAttribute('tabindex')).toBe('0');
    // Exactly one button in the whole tree -- the root. No nesting.
    expect(getAllByRole('button')).toHaveLength(1);
  });

  it('a zone given its own handler becomes a real button and activates on Enter and Space', async () => {
    const ontopsectionclick = vi.fn();
    const { container } = render(ListItem, {
      label: 'John Doe',
      topSectionTestId: 'top',
      ontopsectionclick
    });

    const topSection = container.querySelector('[data-pw="top"]');
    expect(topSection?.getAttribute('role')).toBe('button');
    expect(topSection?.getAttribute('tabindex')).toBe('0');

    if (topSection === null) {
      throw new Error('top section not found');
    }
    await fireEvent.keyDown(topSection, { key: 'Enter' });
    await fireEvent.keyDown(topSection, { key: ' ' });
    expect(ontopsectionclick).toHaveBeenCalledTimes(2);
  });

  it('left image, center text, and right image each become real buttons only once handed their own handler', async () => {
    const onleftimageclick = vi.fn();
    const oncentertextclick = vi.fn();
    const onrightimageclick = vi.fn();
    const { container } = render(ListItem, {
      label: 'John Doe',
      leftImageUrl: svgIcon,
      rightImageUrl: svgIcon,
      leftImageTestId: 'left',
      centerTextTestId: 'center',
      rightImageTestId: 'right',
      onleftimageclick,
      oncentertextclick,
      onrightimageclick
    });

    const zones: Array<[Element | null, ReturnType<typeof vi.fn>]> = [
      [container.querySelector('[data-pw="left"]'), onleftimageclick],
      [container.querySelector('[data-pw="center"]'), oncentertextclick],
      [container.querySelector('[data-pw="right"]'), onrightimageclick]
    ];

    for (const [zone, handler] of zones) {
      expect(zone?.getAttribute('role')).toBe('button');
      expect(zone?.getAttribute('tabindex')).toBe('0');
      if (zone === null) {
        throw new Error('zone not found');
      }
      await fireEvent.keyDown(zone, { key: 'Enter' });
      expect(handler).toHaveBeenCalledTimes(1);
      await fireEvent.click(zone);
      expect(handler).toHaveBeenCalledTimes(2);
    }
  });

  it('root defaults retain synthetic button semantics with no handlers at all (existing contract)', () => {
    const { container } = render(ListItem, { label: 'John Doe', rightContentText: '$120.00' });
    const root = container.querySelector('.item');
    expect(root?.getAttribute('role')).toBe('button');
    expect(root?.getAttribute('tabindex')).toBe('0');
  });

  it('itemRole="option" still yields role="option" and tabindex="-1" on the root', () => {
    const { container } = render(ListItem, { label: 'John Doe', role: 'option' });
    const root = container.querySelector('.item');
    expect(root?.getAttribute('role')).toBe('option');
    expect(root?.getAttribute('tabindex')).toBe('-1');
  });

  it('suppressRoleAndTabindex removes role/tabindex from every zone even when each has its own handler, but every click callback still fires', async () => {
    const onitemclick = vi.fn();
    const ontopsectionclick = vi.fn();
    const onleftimageclick = vi.fn();
    const oncentertextclick = vi.fn();
    const onrightimageclick = vi.fn();
    const { container } = render(ListItem, {
      label: 'John Doe',
      leftImageUrl: svgIcon,
      rightImageUrl: svgIcon,
      testId: 'item',
      topSectionTestId: 'top',
      leftImageTestId: 'left',
      centerTextTestId: 'center',
      rightImageTestId: 'right',
      suppressRoleAndTabindex: true,
      onitemclick,
      ontopsectionclick,
      onleftimageclick,
      oncentertextclick,
      onrightimageclick
    });

    const root = container.querySelector('[data-pw="item"]');
    const zones = [
      root,
      container.querySelector('[data-pw="top"]'),
      container.querySelector('[data-pw="left"]'),
      container.querySelector('[data-pw="center"]'),
      container.querySelector('[data-pw="right"]')
    ];
    for (const zone of zones) {
      expect(zone?.hasAttribute('role')).toBe(false);
      expect(zone?.hasAttribute('tabindex')).toBe(false);
    }

    if (container.querySelector('[data-pw="left"]') === null) {
      throw new Error('left image not found');
    }
    await fireEvent.click(container.querySelector('[data-pw="left"]') as Element);
    expect(onleftimageclick).toHaveBeenCalledTimes(1);
    // Click bubbles from the left image through top-section up to the root, so
    // ontopsectionclick and onitemclick also fire -- unchanged, pre-existing composition.
    expect(ontopsectionclick).toHaveBeenCalledTimes(1);
    expect(onitemclick).toHaveBeenCalledTimes(1);
    expect(oncentertextclick).not.toHaveBeenCalled();
    expect(onrightimageclick).not.toHaveBeenCalled();
  });

  it('composed root + sub-region handlers: a click on the sub-region fires both, and Enter on the focused sub-region fires its own handler exactly once (no double-fire through bubbling)', async () => {
    const onitemclick = vi.fn();
    const ontopsectionclick = vi.fn();
    const { container } = render(ListItem, {
      label: 'John Doe',
      topSectionTestId: 'top',
      onitemclick,
      ontopsectionclick
    });

    const topSection = container.querySelector('[data-pw="top"]');
    if (topSection === null) {
      throw new Error('top section not found');
    }

    await fireEvent.click(topSection);
    expect(ontopsectionclick).toHaveBeenCalledTimes(1);
    // The click bubbles into the root's own onclick, exactly like today.
    expect(onitemclick).toHaveBeenCalledTimes(1);

    await fireEvent.keyDown(topSection, { key: 'Enter' });
    // The synthesized click from Enter also bubbles once -- not twice, even though the
    // root's own keydown listener also observes the (bubbled) keydown event.
    expect(ontopsectionclick).toHaveBeenCalledTimes(2);
    expect(onitemclick).toHaveBeenCalledTimes(2);
  });

  it('still forwards the consumer onkeydown handler and ignores non-activation keys on an interactive zone', async () => {
    const onkeydown = vi.fn();
    const ontopsectionclick = vi.fn();
    const { container } = render(ListItem, {
      label: 'John Doe',
      topSectionTestId: 'top',
      ontopsectionclick,
      onkeydown
    });

    const topSection = container.querySelector('[data-pw="top"]');
    if (topSection === null) {
      throw new Error('top section not found');
    }
    // The root keeps its own preserved default role="button"/tabindex="0" (unrelated to
    // this defect), so the keydown -- unhandled by Escape -- also bubbles into root's own
    // forwarding listener: two deliveries of the same consumer callback for one keypress,
    // pre-existing and orthogonal to the nested-role fix.
    await fireEvent.keyDown(topSection, { key: 'Escape' });
    expect(ontopsectionclick).not.toHaveBeenCalled();
    expect(onkeydown).toHaveBeenCalledTimes(2);

    await fireEvent.keyDown(topSection, { key: 'Enter' });
    // Enter activates top-section's own handler exactly once -- root's own keydown
    // listener sees the bubbled event too but is not the original target, so it does not
    // synthesize a second click.
    expect(ontopsectionclick).toHaveBeenCalledTimes(1);
    expect(onkeydown).toHaveBeenCalledTimes(4);
  });
});
