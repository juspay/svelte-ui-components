import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ToggleBinding from './ToggleBinding.test.svelte';

// Checkbox, Radio and Slider all expose their state as a bindable prop. Toggle did
// not, so `bind:checked` on a <Toggle> could not report the switch back to its
// parent while the same spelling worked on every sibling control.
describe('Toggle two-way binding', () => {
  it('reports the switch state back to a bound parent', async () => {
    const { getByRole, getByTestId } = render(ToggleBinding);
    expect(getByTestId('state').textContent).toBe('off');

    await fireEvent.click(getByRole('checkbox'));
    expect(getByTestId('state').textContent).toBe('on');

    await fireEvent.click(getByRole('checkbox'));
    expect(getByTestId('state').textContent).toBe('off');
  });

  it('follows the parent when the parent writes the value', async () => {
    const { getByRole, getByTestId } = render(ToggleBinding);
    const input = getByRole('checkbox');

    await fireEvent.click(getByTestId('force-on'));
    expect(input instanceof HTMLInputElement && input.checked).toBe(true);
    expect(getByTestId('state').textContent).toBe('on');
  });
});
