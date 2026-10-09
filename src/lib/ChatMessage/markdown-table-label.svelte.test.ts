import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/svelte';
import ChatMessage from './ChatMessage.svelte';
import ChatMessageList from '../ChatMessageList/ChatMessageList.svelte';
import { renderMarkdown } from '../MarkdownText/markdown';

const table = '| Status | Count |\n| --- | --- |\n| Paid | 11 |';
const extended = `${table}\n| COD | 1 |`;

afterEach(cleanup);

describe('ChatMessage markdown table context', () => {
  it('preserves the shared raw wrapper when omitted or explicitly empty', async () => {
    const view = render(ChatMessage, { role: 'responder', markdown: table });
    await waitFor(() => expect(view.container.querySelector('table')).not.toBeNull());
    expect(view.container.querySelector('.body')?.innerHTML).toBe(renderMarkdown(table));
    await view.rerender({ role: 'responder', markdown: table, markdownTableLabel: '' });
    expect(view.container.querySelector('.body')?.innerHTML).toBe(renderMarkdown(table));
    expect(view.container.querySelector('.markdown-table-wrapper')?.hasAttribute('role')).toBe(
      false
    );
  });

  it('escapes a contextual label while preserving the sanitized table and source text', async () => {
    const label = 'Orders "<review>" & totals';
    const view = render(ChatMessage, {
      role: 'responder',
      markdown: `${table}\n\n[x](javascript:alert(1))`,
      markdownTableLabel: label
    });
    await waitFor(() =>
      expect(
        view.container.querySelector('.markdown-table-wrapper')?.getAttribute('aria-label')
      ).toBe(label)
    );
    expect(view.container.querySelector('.markdown-table-wrapper')?.getAttribute('role')).toBe(
      'region'
    );
    expect(view.container.querySelectorAll('table')).toHaveLength(1);
    expect(
      view.container.querySelectorAll('script, [onmouseover], a[href^="javascript:"]')
    ).toHaveLength(0);
    expect(view.container.textContent).toContain('Paid');
  });

  it('updates the locale and preserves an explicit empty opt-out while mounted', async () => {
    const props = { role: 'responder', markdown: table, markdownTableLabel: 'Order summary' };
    const view = render(ChatMessage, props);
    await waitFor(() =>
      expect(
        view.container.querySelector('.markdown-table-wrapper')?.getAttribute('aria-label')
      ).toBe('Order summary')
    );
    await view.rerender({ ...props, markdownTableLabel: 'Résumé des commandes' });
    expect(
      view.container.querySelector('.markdown-table-wrapper')?.getAttribute('aria-label')
    ).toBe('Résumé des commandes');
    await view.rerender({ ...props, markdownTableLabel: '' });
    expect(view.container.querySelector('.body')?.innerHTML).toBe(renderMarkdown(table));
  });

  it('keeps the same named renderer through progressive growth and stream settlement', async () => {
    const props = {
      role: 'responder',
      markdown: table,
      markdownTableLabel: 'Streamed order summary',
      typewriter: true,
      streaming: true,
      typewriterSpeed: 1
    };
    const view = render(ChatMessage, props);
    await waitFor(() =>
      expect(view.container.querySelector('tbody')?.textContent).toContain('Paid')
    );
    await view.rerender({
      ...props,
      markdown: extended,
      markdownTableLabel: 'Commandes en direct'
    });
    await waitFor(() =>
      expect(view.container.querySelector('tbody')?.textContent).toContain('COD')
    );
    expect(
      view.container.querySelector('.markdown-table-wrapper')?.getAttribute('aria-label')
    ).toBe('Commandes en direct');
    expect(view.container.querySelector('.body')?.getAttribute('aria-busy')).toBe('true');
    await view.rerender({ ...props, markdown: extended, streaming: false });
    expect(view.container.querySelector('.markdown-table-wrapper')?.outerHTML).toBe(
      renderMarkdown(extended, { tableLabel: 'Streamed order summary' }).trim()
    );
    expect(view.container.querySelector('.body')?.hasAttribute('aria-busy')).toBe(false);
  });

  it('threads per-message context through ChatMessageList without a body snippet', async () => {
    const view = render(ChatMessageList, {
      messages: [
        {
          id: 'named-table',
          role: 'assistant',
          content: '',
          markdown: table,
          markdownTableLabel: 'Order list summary'
        }
      ]
    });
    await waitFor(() =>
      expect(
        view.container.querySelector('.markdown-table-wrapper')?.getAttribute('aria-label')
      ).toBe('Order list summary')
    );
    expect(view.container.querySelector('tbody')?.textContent).toContain('Paid');
  });
});
