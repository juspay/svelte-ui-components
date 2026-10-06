// @vitest-environment jsdom
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import ColorPicker from '../ColorPicker/ColorPicker.svelte';
import Combobox from '../Combobox/Combobox.svelte';
import SplitInput from '../SplitInput/SplitInput.svelte';

/**
 * SplitInput, Combobox and ColorPicker rendered text fields that a screen reader
 * announced as "edit text, blank": 37 boxes across the SplitInput examples, the
 * Combobox's own input (its `ariaLabel` named only the popup) and the ColorPicker's
 * hex field, hue slider and RGB/HSL boxes.
 *
 * Names are read the way an accessibility client computes them (role + name through
 * testing-library), never as the presence of an attribute -- an `aria-label=""`
 * would satisfy an attribute check and announce nothing.
 */

const names = (elements: HTMLElement[]): string[] =>
  elements.map((element) => element.getAttribute('aria-label') ?? '');

describe('SplitInput names every box', () => {
  it('by position alone when nothing else was given', () => {
    const { getAllByRole } = render(SplitInput, { values: [], length: 4 });
    expect(names(getAllByRole('textbox'))).toEqual([
      'Digit 1 of 4',
      'Digit 2 of 4',
      'Digit 3 of 4',
      'Digit 4 of 4'
    ]);
  });

  it('with the group name leading, so a box is identifiable outside its group', () => {
    const { getByRole, getAllByRole } = render(SplitInput, {
      values: [],
      length: 6,
      ariaLabel: 'One-time code'
    });
    const group = getByRole('group', { name: 'One-time code' });
    const boxes = getAllByRole('textbox');
    expect(names(boxes)).toEqual(
      [1, 2, 3, 4, 5, 6].map((position) => `One-time code, digit ${position} of 6`)
    );
    expect(boxes.every((box) => group.contains(box))).toBe(true);
    // Every name distinct: one generic name reused across the boxes is the defect.
    expect(new Set(names(boxes)).size).toBe(6);
    expect(getAllByRole('textbox', { name: 'One-time code, digit 2 of 6' })).toHaveLength(1);
  });

  it('by the caller’s own field name when a fields entry has an ariaLabel', () => {
    const { getAllByRole } = render(SplitInput, {
      values: ['255', '0', '128'],
      ariaLabel: 'RGB color',
      fields: [
        { label: 'R', ariaLabel: 'Red', dataType: 'number' },
        { label: 'G', ariaLabel: 'Green', dataType: 'number' },
        { label: 'B', ariaLabel: 'Blue', dataType: 'number' }
      ]
    });
    expect(names(getAllByRole('spinbutton'))).toEqual(['Red', 'Green', 'Blue']);
  });

  it('by the visible caption, behind the group name, when only a label was given', () => {
    const { getAllByRole } = render(SplitInput, {
      values: ['1', '2', '3'],
      ariaLabel: 'RGB color',
      fields: [
        { label: 'R', dataType: 'number' },
        { label: 'G', dataType: 'number' },
        { label: 'B', dataType: 'number' }
      ]
    });
    expect(names(getAllByRole('spinbutton'))).toEqual([
      'RGB color, R',
      'RGB color, G',
      'RGB color, B'
    ]);
  });

  it('calls a wide box a field and honours positionLabel for another noun or language', () => {
    const wide = { dataType: 'number', maxLength: 3 } as const;
    const plain = render(SplitInput, {
      values: [],
      ariaLabel: 'IP address',
      fields: [wide, wide]
    });
    expect(names(plain.getAllByRole('spinbutton'))).toEqual([
      'IP address, field 1 of 2',
      'IP address, field 2 of 2'
    ]);
    plain.unmount();

    const custom = render(SplitInput, {
      values: [],
      ariaLabel: 'IP address',
      positionLabel: (position: number, total: number) => `octet ${position} of ${total}`,
      fields: [wide, wide]
    });
    expect(names(custom.getAllByRole('spinbutton'))).toEqual([
      'IP address, octet 1 of 2',
      'IP address, octet 2 of 2'
    ]);
  });

  it('keeps unrelated groups on one page from sharing a name', () => {
    const first = render(SplitInput, { values: [], length: 4, ariaLabel: 'PIN' });
    const firstNames = names(first.getAllByRole('textbox'));
    const second = render(SplitInput, { values: [], length: 4, ariaLabel: 'Backup code' });
    // Queries are bound to document.body, so the second render sees both groups.
    const all = names(second.getAllByRole('textbox'));
    expect(all).toHaveLength(8);
    expect(new Set(all).size).toBe(8);
    expect(firstNames.every((name) => name.startsWith('PIN, '))).toBe(true);
  });

  it('follows a change of group name, and still names a disabled box', async () => {
    const { getAllByRole, rerender } = render(SplitInput, {
      values: ['1', '2'],
      length: 2,
      disabled: true,
      ariaLabel: 'PIN'
    });
    expect(names(getAllByRole('textbox'))).toEqual(['PIN, digit 1 of 2', 'PIN, digit 2 of 2']);
    await rerender({ ariaLabel: 'Card PIN' });
    expect(names(getAllByRole('textbox'))).toEqual([
      'Card PIN, digit 1 of 2',
      'Card PIN, digit 2 of 2'
    ]);
    expect(
      getAllByRole('textbox').every((box) => box instanceof HTMLInputElement && box.disabled)
    ).toBe(true);
  });
});

describe('Combobox names its text field', () => {
  const items = [
    { id: 'apple', label: 'Apple' },
    { id: 'banana', label: 'Banana' }
  ];

  it('with ariaLabel, which used to name only the popup', async () => {
    const { getByRole } = render(Combobox, { items, ariaLabel: 'Fruit' });
    const input = getByRole('combobox', { name: 'Fruit' });
    await fireEvent.focus(input);
    await waitFor(() => expect(getByRole('listbox', { name: 'Fruit' })).toBeTruthy());
  });

  it('lets inputProperties.ariaLabel name the field apart from the popup', async () => {
    const { getByRole } = render(Combobox, {
      items,
      ariaLabel: 'Fruit options',
      inputProperties: { ariaLabel: 'Fruit' }
    });
    const input = getByRole('combobox', { name: 'Fruit' });
    await fireEvent.focus(input);
    await waitFor(() => expect(getByRole('listbox', { name: 'Fruit options' })).toBeTruthy());
  });

  it('uses inputProperties.label, which the docs said names the field but Input never rendered here', () => {
    const { getByRole, container } = render(Combobox, {
      items,
      inputProperties: { label: 'Country' }
    });
    expect(getByRole('combobox', { name: 'Country' })).toBeTruthy();
    // Named, not rendered: the control has never drawn Input's <label>, and still does not.
    expect(container.querySelector('label')).toBeNull();
  });

  it('keeps a name once picking a pill empties the placeholder of a multi-select', async () => {
    const { getByRole } = render(Combobox, {
      items,
      multiple: true,
      selected: [],
      placeholder: 'Pick fruits'
    });
    const input = getByRole('combobox', { name: 'Pick fruits' });
    await fireEvent.focus(input);
    await fireEvent.click(getByRole('option', { name: 'Apple' }));
    await tick();
    expect(input.getAttribute('placeholder')).toBe('');
    expect(getByRole('combobox', { name: 'Pick fruits' })).toBe(input);
  });

  it('prefers a real label over the placeholder', () => {
    const { getByRole } = render(Combobox, { items, ariaLabel: 'Fruit', placeholder: 'Search' });
    expect(getByRole('combobox').getAttribute('aria-label')).toBe('Fruit');
  });

  it('invents nothing when the caller gave nothing to name it with', () => {
    const { getByRole } = render(Combobox, { items });
    expect(getByRole('combobox').hasAttribute('aria-label')).toBe(false);
  });

  it('names a described group from the input and follows a change of field name', async () => {
    const { getByRole, rerender } = render(Combobox, {
      items,
      ariaLabel: 'Fruit options',
      inputProperties: { ariaLabel: 'Fruit' },
      errorMessage: 'Choose a fruit'
    });
    const group = getByRole('group', { name: 'Fruit' });
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(group.getAttribute('aria-describedby')!)?.textContent).toBe(
      'Choose a fruit'
    );
    await rerender({ inputProperties: { ariaLabel: 'Snack fruit' } });
    expect(getByRole('group', { name: 'Snack fruit' })).toBe(group);
    expect(getByRole('combobox', { name: 'Snack fruit' })).toBeTruthy();
  });

  it('distinguishes selected option removal and removes only the chosen option', async () => {
    const removed: string[] = [];
    const { getByRole, queryByRole } = render(Combobox, {
      items,
      ariaLabel: 'Fruits',
      multiple: true,
      selected: ['apple', 'banana'],
      onremove: (value: string) => removed.push(value)
    });
    const apple = getByRole('button', { name: 'Remove Apple from Fruits' });
    const banana = getByRole('button', { name: 'Remove Banana from Fruits' });
    await fireEvent.click(apple);
    await tick();
    expect(removed).toEqual(['apple']);
    expect(queryByRole('button', { name: 'Remove Apple from Fruits' })).toBeNull();
    expect(getByRole('button', { name: 'Remove Banana from Fruits' })).toBe(banana);
  });
});

describe('ColorPicker names its controls by purpose', () => {
  const openPopover = async (
    getByRole: (role: string, options?: { name: string | RegExp }) => HTMLElement,
    triggerName: string | RegExp
  ): Promise<void> => {
    await fireEvent.click(getByRole('button', { name: triggerName }));
    await tick();
  };

  it('names the hex field, the trigger and the dialog from the visible label', async () => {
    const { getByRole } = render(ColorPicker, {
      value: '#336699',
      label: 'Brand color',
      showValue: true
    });
    expect(getByRole('textbox', { name: 'Brand color hex value' })).toBeTruthy();
    await openPopover(getByRole, 'Pick a color: Brand color');
    expect(getByRole('dialog', { name: 'Brand color picker' })).toBeTruthy();
  });

  it('names a swatch-only picker from ariaLabel, so two pickers can be told apart', () => {
    const first = render(ColorPicker, { value: '#336699', ariaLabel: 'Highlight color' });
    const second = render(ColorPicker, { value: '#336699', ariaLabel: 'Border color' });
    expect(first.getByRole('button', { name: 'Pick a color: Highlight color' })).toBeTruthy();
    expect(second.getByRole('button', { name: 'Pick a color: Border color' })).toBeTruthy();
  });

  it('keeps the plain names when the picker was given no name at all', async () => {
    const { getByRole } = render(ColorPicker, { value: '#336699', showValue: true });
    expect(getByRole('textbox', { name: 'Color hex value' })).toBeTruthy();
    await openPopover(getByRole, 'Pick a color');
    expect(getByRole('dialog', { name: 'Color picker' })).toBeTruthy();
  });

  it('names the saturation panel, hue slider and hex field in the popover', async () => {
    const { getByRole } = render(ColorPicker, { value: '#336699' });
    await openPopover(getByRole, 'Pick a color');
    expect(getByRole('slider', { name: 'Saturation and brightness' })).toBeTruthy();
    expect(getByRole('slider', { name: 'Hue' })).toBeTruthy();
    expect(getByRole('textbox', { name: 'Hex value' })).toBeTruthy();
  });

  it('names the RGB and HSL channels, each group, and keeps them distinct from the hue slider', async () => {
    const { getByRole, getAllByRole } = render(ColorPicker, { value: '#336699' });
    await openPopover(getByRole, 'Pick a color');

    await fireEvent.click(getByRole('button', { name: 'Switch color mode' }));
    await tick();
    const rgb = getByRole('group', { name: 'RGB channels' });
    expect(names(getAllByRole('spinbutton')).sort(), 'RGB boxes are named by channel').toEqual([
      'Blue',
      'Green',
      'Red'
    ]);
    expect(getAllByRole('spinbutton').every((box) => rgb.contains(box))).toBe(true);

    await fireEvent.click(getByRole('button', { name: 'Switch color mode' }));
    await tick();
    const hsl = getByRole('group', { name: 'HSL channels' });
    const hslNames = names(getAllByRole('spinbutton'));
    expect(hslNames.sort()).toEqual([
      'Hue (degrees)',
      'Lightness (percent)',
      'Saturation (percent)'
    ]);
    expect(getAllByRole('spinbutton').every((box) => hsl.contains(box))).toBe(true);
    // The hue slider and the hue box edit one quantity but are not given one name.
    expect(getAllByRole('slider', { name: 'Hue' })).toHaveLength(1);
  });

  it('names the hex field of a disabled picker too', () => {
    const { getByRole } = render(ColorPicker, {
      value: '#ff5722',
      label: 'Locked color',
      showValue: true,
      disabled: true
    });
    const input = getByRole('textbox', { name: 'Locked color hex value' });
    expect(input instanceof HTMLInputElement && input.disabled).toBe(true);
  });
});
