// @vitest-environment jsdom
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import ColorPicker from './ColorPicker.svelte';
import { hexToHsv } from '../utils';

// hsvToHex(0, 1, 1) -- i.e. the panel's fixed pre-fix starting point (hue 0,
// sat 100%, val 100%) -- so the external-sync fixtures below (which now assert
// the panel actually reflects whatever `value` was mounted/changed to) still
// read naturally against it.
const FIXTURE_HEX = '#ff0000';

async function settle() {
  await tick();
  await Promise.resolve();
  await tick();
}

function openPicker(getByRole: (role: string, opts?: { name: string }) => HTMLElement) {
  const trigger = getByRole('button', { name: 'Pick a color' });
  trigger.click();
  return trigger;
}

function satPanel(getByRole: (role: string, opts?: { name: string }) => HTMLElement) {
  return getByRole('slider', { name: 'Saturation and brightness' });
}

/** The hue slider renders as a bare `<input type="range">` (no `ariaLabel` is passed
 *  to it), so it can't be told apart from the sat panel via `getByRole('slider')` --
 *  it's the only range input the popover renders, so a plain selector finds it. */
function hueSliderInput(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector('input[type="range"]');
  if (!(el instanceof HTMLInputElement)) {
    throw new Error('hue slider input not found');
  }
  return el;
}

/** Raw synchronous dispatch (mirrors Tabs.test.ts's own `key` helper) -- lets a
 *  bulk loop skip `fireEvent`'s promise and exposes whether the key was consumed
 *  via the event's own `defaultPrevented`/return-value contract. */
function dispatchKey(el: HTMLElement, key: string): boolean {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  return el.dispatchEvent(event);
}

/** Decodes a committed hex value back to {s, v} percentages via the same
 *  hexToHsv the component itself uses -- independent of the keyboard step math
 *  under test, so it verifies the *callback contract* rather than restating it. */
function decodePercent(hex: string): { s: number; v: number } {
  const hsv = hexToHsv(hex);
  if (hsv === null) {
    throw new Error(`invalid hex from callback: ${hex}`);
  }
  return { s: Math.round(hsv.s * 100), v: Math.round(hsv.v * 100) };
}

describe('ColorPicker saturation/brightness panel keyboard control', () => {
  it('ArrowRight/ArrowLeft step saturation by 1%, firing the pointer-path callbacks', async () => {
    const oninput = vi.fn();
    const onchange = vi.fn();
    const { getByRole } = render(ColorPicker, { value: FIXTURE_HEX, oninput, onchange });
    openPicker(getByRole);
    await settle();
    const panel = satPanel(getByRole);
    expect(panel.getAttribute('aria-valuenow')).toBe('100');

    await fireEvent.keyDown(panel, { key: 'ArrowLeft' });
    expect(panel.getAttribute('aria-valuenow')).toBe('99');
    expect(oninput).toHaveBeenCalledTimes(1);
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(oninput.mock.calls.at(0)?.[0]).toBe(onchange.mock.calls.at(0)?.[0]);
    expect(decodePercent(oninput.mock.calls.at(0)?.[0])).toEqual({ s: 99, v: 100 });

    await fireEvent.keyDown(panel, { key: 'ArrowRight' });
    expect(panel.getAttribute('aria-valuenow')).toBe('100');
    expect(oninput).toHaveBeenCalledTimes(2);
    expect(decodePercent(oninput.mock.calls.at(1)?.[0])).toEqual({ s: 100, v: 100 });
  });

  it('ArrowUp/ArrowDown step brightness by 1% and keep aria-valuetext truthful', async () => {
    const oninput = vi.fn();
    const { getByRole } = render(ColorPicker, { value: FIXTURE_HEX, oninput });
    openPicker(getByRole);
    await settle();
    const panel = satPanel(getByRole);
    expect(panel.getAttribute('aria-valuetext')).toBe('100% saturation, 100% brightness');

    await fireEvent.keyDown(panel, { key: 'ArrowDown' });
    expect(panel.getAttribute('aria-valuetext')).toBe('100% saturation, 99% brightness');
    // ArrowUp/Down must leave saturation (aria-valuenow) untouched.
    expect(panel.getAttribute('aria-valuenow')).toBe('100');
    expect(decodePercent(oninput.mock.calls.at(-1)?.[0])).toEqual({ s: 100, v: 99 });

    await fireEvent.keyDown(panel, { key: 'ArrowUp' });
    expect(panel.getAttribute('aria-valuetext')).toBe('100% saturation, 100% brightness');
  });

  it('clamps saturation and brightness at their ends without wrapping', async () => {
    const oninput = vi.fn();
    const { getByRole } = render(ColorPicker, { value: FIXTURE_HEX, oninput }); // sat=100%, val=100%
    openPicker(getByRole);
    await settle();
    const panel = satPanel(getByRole);
    expect(panel.getAttribute('aria-valuetext')).toBe('100% saturation, 100% brightness');

    // Already at the upper bound on both axes -- incrementing further must not
    // wrap to the opposite end, and a true no-op must not fire a callback.
    dispatchKey(panel, 'ArrowRight');
    dispatchKey(panel, 'ArrowUp');
    await settle();
    expect(panel.getAttribute('aria-valuetext')).toBe('100% saturation, 100% brightness');
    expect(oninput).not.toHaveBeenCalled();

    // Home jumps saturation straight to its lower bound; a further decrement
    // from there must not wrap back up to 100%.
    dispatchKey(panel, 'Home');
    await settle();
    expect(panel.getAttribute('aria-valuenow')).toBe('0');
    dispatchKey(panel, 'ArrowLeft');
    await settle();
    expect(panel.getAttribute('aria-valuenow')).toBe('0');

    // Walk brightness all the way down to its lower bound (1% steps) and
    // confirm the last decrement past it doesn't wrap either.
    for (let i = 0; i < 100; i += 1) {
      dispatchKey(panel, 'ArrowDown');
    }
    await settle();
    expect(panel.getAttribute('aria-valuetext')).toBe('0% saturation, 0% brightness');
    dispatchKey(panel, 'ArrowDown');
    await settle();
    expect(panel.getAttribute('aria-valuetext')).toBe('0% saturation, 0% brightness');
  });

  it('Home/End jump saturation to the extremes without touching brightness', async () => {
    const { getByRole } = render(ColorPicker, { value: FIXTURE_HEX });
    openPicker(getByRole);
    await settle();
    const panel = satPanel(getByRole);

    // Nudge brightness to a distinctive value first so a later assertion that
    // Home/End left it alone is actually meaningful.
    await fireEvent.keyDown(panel, { key: 'ArrowDown' });
    expect(panel.getAttribute('aria-valuetext')).toBe('100% saturation, 99% brightness');

    await fireEvent.keyDown(panel, { key: 'Home' });
    expect(panel.getAttribute('aria-valuenow')).toBe('0');
    expect(panel.getAttribute('aria-valuetext')).toBe('0% saturation, 99% brightness');

    await fireEvent.keyDown(panel, { key: 'End' });
    expect(panel.getAttribute('aria-valuenow')).toBe('100');
    expect(panel.getAttribute('aria-valuetext')).toBe('100% saturation, 99% brightness');
  });

  it('PageUp/PageDown take a larger step than the arrow keys', async () => {
    const { getByRole } = render(ColorPicker, { value: FIXTURE_HEX });
    openPicker(getByRole);
    await settle();
    const panel = satPanel(getByRole);
    expect(panel.getAttribute('aria-valuenow')).toBe('100');

    await fireEvent.keyDown(panel, { key: 'PageDown' });
    expect(panel.getAttribute('aria-valuenow')).toBe('90');
    await fireEvent.keyDown(panel, { key: 'PageDown' });
    expect(panel.getAttribute('aria-valuenow')).toBe('80');
    await fireEvent.keyDown(panel, { key: 'PageUp' });
    expect(panel.getAttribute('aria-valuenow')).toBe('90');
  });

  it('does nothing while disabled', async () => {
    const oninput = vi.fn();
    const { getByRole, rerender } = render(ColorPicker, { value: FIXTURE_HEX, oninput });
    openPicker(getByRole);
    await settle();
    const panel = satPanel(getByRole);

    await rerender({ value: FIXTURE_HEX, oninput, disabled: true });
    await settle();

    dispatchKey(panel, 'ArrowLeft');
    dispatchKey(panel, 'ArrowUp');
    dispatchKey(panel, 'ArrowDown');
    dispatchKey(panel, 'PageDown');
    dispatchKey(panel, 'Home');
    dispatchKey(panel, 'End');
    await settle();

    expect(panel.getAttribute('aria-valuenow')).toBe('100');
    expect(panel.getAttribute('aria-valuetext')).toBe('100% saturation, 100% brightness');
    expect(oninput).not.toHaveBeenCalled();
  });

  it('leaves keys the panel does not use unconsumed', async () => {
    const { getByRole } = render(ColorPicker, { value: FIXTURE_HEX });
    openPicker(getByRole);
    await settle();
    const panel = satPanel(getByRole);

    const notPrevented = dispatchKey(panel, 'a');
    await settle();

    expect(notPrevented).toBe(true);
    expect(panel.getAttribute('aria-valuenow')).toBe('100');
  });
});

describe('ColorPicker popover Escape handling', () => {
  it('closes the popover and returns focus to the trigger on Escape', async () => {
    const { getByRole, queryByRole } = render(ColorPicker, { value: FIXTURE_HEX });
    const trigger = openPicker(getByRole);
    await settle();
    expect(queryByRole('dialog', { name: 'Color picker' })).not.toBeNull();

    const panel = satPanel(getByRole);
    panel.focus();
    expect(document.activeElement).toBe(panel);

    await fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(queryByRole('dialog', { name: 'Color picker' })).toBeNull();
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it('still closes on outside click (no regression)', async () => {
    const { getByRole, queryByRole } = render(ColorPicker, { value: FIXTURE_HEX });
    openPicker(getByRole);
    await settle();
    expect(queryByRole('dialog', { name: 'Color picker' })).not.toBeNull();

    document.body.click();
    await settle();

    expect(queryByRole('dialog', { name: 'Color picker' })).toBeNull();
  });

  it('ignores Escape while the popover is already closed', async () => {
    const { queryByRole } = render(ColorPicker, { value: FIXTURE_HEX });
    expect(queryByRole('dialog', { name: 'Color picker' })).toBeNull();

    await fireEvent.keyDown(window, { key: 'Escape' });
    await settle();

    expect(queryByRole('dialog', { name: 'Color picker' })).toBeNull();
  });
});

describe('ColorPicker external value sync', () => {
  it('an external `value` change moves the saturation panel and the hue slider', async () => {
    const { getByRole, container, rerender } = render(ColorPicker, { value: FIXTURE_HEX });
    openPicker(getByRole);
    await settle();
    const panel = satPanel(getByRole);
    const hueInput = hueSliderInput(container);
    // FIXTURE_HEX is hsvToHex(0, 1, 1) -- confirms the mounted `value` itself
    // reached the panel/slider before touching anything external.
    expect(panel.getAttribute('aria-valuenow')).toBe('100');
    expect(hueInput.value).toBe('0');

    const EXTERNAL_HEX = '#3355ee';
    const expectedHsv = hexToHsv(EXTERNAL_HEX);
    if (expectedHsv === null) {
      throw new Error(`bad fixture hex: ${EXTERNAL_HEX}`);
    }

    await rerender({ value: EXTERNAL_HEX });
    await settle();

    expect(panel.getAttribute('aria-valuenow')).toBe(String(Math.round(expectedHsv.s * 100)));
    expect(hueInput.value).toBe(String(Math.round(expectedHsv.h * 360)));
  });

  it('still commits through commitColor, firing oninput/onchange exactly once, after an external value change', async () => {
    const oninput = vi.fn();
    const onchange = vi.fn();
    const { getByRole, rerender } = render(ColorPicker, {
      value: FIXTURE_HEX,
      oninput,
      onchange
    });
    openPicker(getByRole);
    await settle();

    // The parent rebinds `value` out from under the panel -- the sync path this
    // fix adds must not leave the ordinary commit path broken afterwards.
    await rerender({ value: '#0000ff', oninput, onchange });
    await settle();
    const panel = satPanel(getByRole);
    expect(panel.getAttribute('aria-valuenow')).toBe('100');

    await fireEvent.keyDown(panel, { key: 'ArrowDown' });

    expect(oninput).toHaveBeenCalledTimes(1);
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(oninput.mock.calls.at(0)?.[0]).toBe(onchange.mock.calls.at(0)?.[0]);
    expect(panel.getAttribute('aria-valuetext')).toBe('100% saturation, 99% brightness');
  });

  it('does not reset the hue slider when a user interaction desaturates the colour to grey', async () => {
    const oninput = vi.fn();
    const { getByRole, container } = render(ColorPicker, { value: FIXTURE_HEX, oninput });
    openPicker(getByRole);
    await settle();

    // Move the hue away from FIXTURE_HEX's 0 first, so a later assertion that it
    // survived the drag to grey is actually meaningful.
    const hueInput = hueSliderInput(container);
    await fireEvent.input(hueInput, { target: { value: '240' } });
    await settle();
    expect(hueInput.value).toBe('240');

    // Home drives saturation straight to 0 -- fully achromatic -- the same
    // panel interaction ArrowLeft/PageDown use, just at the extreme.
    const panel = satPanel(getByRole);
    await fireEvent.keyDown(panel, { key: 'Home' });
    await settle();
    expect(panel.getAttribute('aria-valuenow')).toBe('0');

    // Read the colour commitColor actually produced -- `oninput`'s own callback
    // argument, not something scraped back off a DOM style attribute (jsdom
    // normalises `background-color: #ffffff` to `rgb(255, 255, 255)` on
    // read-back, so parsing it out of the DOM would be testing jsdom, not this
    // component).
    const grey = oninput.mock.calls.at(-1)?.[0];
    if (typeof grey !== 'string') {
      throw new Error('Home keydown on the panel did not commit a colour');
    }
    const hsvAtGrey = hexToHsv(grey);
    if (hsvAtGrey === null) {
      throw new Error(`invalid hex committed: ${grey}`);
    }
    // Confirms the committed colour really is achromatic, i.e. that hue is
    // genuinely unrecoverable from it -- otherwise the assertion below would be
    // trivially true for the wrong reason.
    expect(hsvAtGrey.s).toBe(0);

    expect(hueInput.value).toBe('240');
  });

  it('does not fabricate a hue of 0 when `value` is changed externally to a grey hex', async () => {
    // Mounts already blue (hue 240) so the panel's own initial-value sync (the
    // other half of this fix) is what puts the hue there -- not a drag.
    const { getByRole, container, rerender } = render(ColorPicker, { value: '#0000ff' });
    openPicker(getByRole);
    await settle();
    const hueInput = hueSliderInput(container);
    expect(hueInput.value).toBe('240');

    // A grey hex has no hue of its own; assigning one from outside must not
    // invent a 0 that was never chosen.
    await rerender({ value: '#808080' });
    await settle();

    expect(hueInput.value).toBe('240');
  });
});
