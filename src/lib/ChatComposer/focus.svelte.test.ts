import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import ChatComposer from './ChatComposer.svelte';

describe('ChatComposer focus and trailing controls', () => {
  it.each(['row', 'stacked'] as const)(
    'focuses the %s textarea and fires the non-colliding callback',
    (layout) => {
      const oninputfocus = vi.fn();
      const { component, getByRole } = render(ChatComposer, { props: { layout, oninputfocus } });
      const input = getByRole('textbox');
      component.focus({ preventScroll: true });
      expect(input.ownerDocument.activeElement).toBe(input);
      expect(oninputfocus).toHaveBeenCalledTimes(1);
    }
  );

  it.each(['row', 'stacked'] as const)('does not focus a disabled %s textarea', (layout) => {
    const oninputfocus = vi.fn();
    const { component, getByRole } = render(ChatComposer, {
      props: { layout, disabled: true, oninputfocus }
    });
    component.focus();
    expect(getByRole('textbox').ownerDocument.activeElement).not.toBe(getByRole('textbox'));
    expect(oninputfocus).not.toHaveBeenCalled();
  });

  it.each(['row', 'stacked'] as const)(
    'places the trailing snippet after the release action text in the %s layout',
    (layout) => {
      const trailing = createRawSnippet(() => ({ render: () => '<button>Open panel</button>' }));
      const onaction = vi.fn();
      const { container, getByRole, getAllByRole } = render(ChatComposer, {
        props: { layout, actionText: 'Start voice', onaction, trailing }
      });
      const open = getByRole('button', { name: 'Open panel' });
      const row = container.querySelector(layout === 'stacked' ? '.control-row' : '.input-row');
      expect(getByRole('button', { name: 'Voice conversation' }).textContent?.trim()).toBe(
        'Start voice'
      );
      expect(row?.lastElementChild).toBe(open);
      expect(getAllByRole('textbox')).toHaveLength(1);
    }
  );

  it('focuses the current textarea after switching layouts', async () => {
    const oninputfocus = vi.fn();
    const { component, getByRole, rerender } = render(ChatComposer, {
      props: { layout: 'row', oninputfocus }
    });
    const original = getByRole('textbox');
    await rerender({ layout: 'stacked', oninputfocus });
    const current = getByRole('textbox');
    expect(current).not.toBe(original);
    component.focus({ preventScroll: true });
    expect(current.ownerDocument.activeElement).toBe(current);
    expect(oninputfocus).toHaveBeenCalledTimes(1);
  });
});
