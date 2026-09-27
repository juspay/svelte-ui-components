// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import Toolbar from './Toolbar.svelte';

const root = (container: HTMLElement): HTMLElement => {
  const node = container.querySelector('.toolbar');
  if (!(node instanceof HTMLElement)) {
    throw new Error('Toolbar root is missing');
  }
  return node;
};

// Nothing here passes a new prop, so this is the markup every pre-existing
// consumer already gets.
describe('Toolbar default path', () => {
  it('renders a div root with the text in .text, and no title block', () => {
    const { container } = render(Toolbar, { text: 'Settings', testId: 'bar' });
    expect(root(container).tagName).toBe('DIV');
    expect(root(container).hasAttribute('data-variant')).toBe(false);
    expect(container.querySelector('.text')?.textContent?.trim()).toBe('Settings');
    expect(container.querySelector('.titles')).toBeNull();
    expect(root(container).getAttribute('data-pw')).toBe('bar');
  });
});

describe('Toolbar title and subtitle', () => {
  it('renders a plain span when no headingLevel is given', () => {
    const { container } = render(Toolbar, { title: 'Accounts' });
    const heading = container.querySelector('.titles > span');
    expect(heading?.textContent).toBe('Accounts');
    expect(container.querySelector('.titles h1, .titles h2, .titles h3')).toBeNull();
  });

  it.each([1, 2, 3, 4, 5, 6] as const)('headingLevel %i renders the matching h-tag', (level) => {
    const { container } = render(Toolbar, { title: 'Accounts', headingLevel: level });
    expect(container.querySelector(`.titles > h${level}`)?.textContent).toBe('Accounts');
  });

  it.each([0, 7, 2.5, Number.NaN, -1])('falls back to a span for headingLevel %s', (level) => {
    // Deliberately outside 1-6: a web-component attribute can carry any number.
    const { container } = render(Toolbar, {
      title: 'Accounts',
      headingLevel: level as unknown as 4
    });
    expect(container.querySelector('.titles > span')?.textContent).toBe('Accounts');
    expect(container.querySelector('.titles :is(h1, h2, h3, h4, h5, h6)')).toBeNull();
  });

  it('shows the subtitle under the title, and only when it is non-empty', () => {
    const withSubtitle = render(Toolbar, { title: 'Accounts', subtitle: 'Usage this week' });
    expect(withSubtitle.container.querySelector('.titles > p.subtitle')?.textContent).toBe(
      'Usage this week'
    );

    const empty = render(Toolbar, { title: 'Accounts', subtitle: '' });
    expect(empty.container.querySelector('.subtitle')).toBeNull();
  });

  it('does not render a subtitle that has no title to sit under', () => {
    const { container } = render(Toolbar, { text: 'Accounts', subtitle: 'Usage this week' });
    expect(container.querySelector('.subtitle')).toBeNull();
    expect(container.querySelector('.text')?.textContent?.trim()).toBe('Accounts');
  });

  it('prefers title over text', () => {
    const { container } = render(Toolbar, { title: 'Accounts', text: 'ignored' });
    expect(container.querySelector('.titles')).not.toBeNull();
    expect(container.querySelector('.text')).toBeNull();
  });

  it('lets a centerContent snippet win over title', () => {
    const centerContent = createRawSnippet(() => ({
      render: () => '<span class="mine">custom</span>'
    }));
    const { container } = render(Toolbar, { title: 'Accounts', centerContent });
    expect(container.querySelector('.center-content .mine')).not.toBeNull();
    expect(container.querySelector('.titles')).toBeNull();
  });

  it('puts headingTestId on the title block, and on .text when there is no title', () => {
    const titled = render(Toolbar, { title: 'Accounts', headingTestId: 'heading' });
    expect(titled.container.querySelector('.titles')?.getAttribute('data-pw')).toBe('heading');

    const plain = render(Toolbar, { text: 'Accounts', headingTestId: 'heading' });
    expect(plain.container.querySelector('.text')?.getAttribute('data-pw')).toBe('heading');
  });
});

describe('Toolbar rootTag', () => {
  it.each(['header', 'nav', 'aside', 'footer', 'div'] as const)(
    'renders the root as <%s>',
    (tag) => {
      const { container } = render(Toolbar, { text: 'x', rootTag: tag, testId: 'bar' });
      expect(root(container).tagName).toBe(tag.toUpperCase());
      expect(root(container).getAttribute('data-pw')).toBe('bar');
    }
  );
});

describe('Toolbar variant', () => {
  it('marks the page-header variant on the root', () => {
    const { container } = render(Toolbar, { text: 'x', variant: 'page-header' });
    expect(root(container).getAttribute('data-variant')).toBe('page-header');
  });

  it('keeps a page-header class the consumer passes, whatever the variant', () => {
    const chrome = render(Toolbar, { text: 'x', classes: 'page-header' });
    expect(root(chrome.container).classList.contains('page-header')).toBe(true);
    expect(root(chrome.container).hasAttribute('data-variant')).toBe(false);
  });

  it('leaves the chrome variant unmarked, explicit or not', () => {
    const implicit = render(Toolbar, { text: 'x' });
    expect(root(implicit.container).hasAttribute('data-variant')).toBe(false);
    const explicit = render(Toolbar, { text: 'x', variant: 'chrome' });
    expect(root(explicit.container).hasAttribute('data-variant')).toBe(false);
  });
});
