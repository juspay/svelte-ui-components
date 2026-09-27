// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import Banner from './Banner.svelte';
import type { BannerProperties, MandatoryBannerProperties } from './properties';

const body = createRawSnippet(() => ({
  render: () => '<p class="mine">a <b>marked-up</b> message</p>'
}));

// The annotations are the test: `npm run check` fails if a value typed with the
// 4.33.3 exports stops compiling.
const legacyMandatory: MandatoryBannerProperties = { text: 'message' };
const legacyProps: BannerProperties = { text: 'message', dismissible: true, linkText: 'More' };

describe('Banner prop types', () => {
  it('still accept values typed with the 4.33.3 exports', () => {
    expect(legacyMandatory.text).toBe('message');
    expect(
      render(Banner, legacyProps).container.querySelector('.banner-text')?.textContent
    ).toContain('message');
  });
});

// `children` is opt-in. Without it the banner is exactly what it always was:
// `text`, then `linkText` in its own span, inside `.banner-text`.
describe('Banner default body', () => {
  it('renders text and linkText in .banner-text, the link in its own span', () => {
    const { container } = render(Banner, { text: 'Update available', linkText: 'Update now' });
    const text = container.querySelector('.banner-body > .banner-text');
    expect(text?.textContent).toContain('Update available');
    expect(text?.querySelector('.banner-link-text')?.textContent).toBe('Update now');
  });

  it('renders no link span when linkText is absent or empty', () => {
    const absent = render(Banner, { text: 'Hello' });
    expect(absent.container.querySelector('.banner-link-text')).toBeNull();
    const empty = render(Banner, { text: 'Hello', linkText: '' });
    expect(empty.container.querySelector('.banner-link-text')).toBeNull();
  });

  it('may omit text entirely', () => {
    const { container } = render(Banner, {});
    expect(container.querySelector('.banner')).not.toBeNull();
    expect(container.querySelector('.banner-text')?.textContent?.trim()).toBe('');
  });
});

describe('Banner children', () => {
  it('renders as the body in place of text and linkText', () => {
    const { container } = render(Banner, {
      text: 'ignored',
      linkText: 'ignored too',
      children: body
    });
    expect(container.querySelector('.banner-body > .mine b')?.textContent).toBe('marked-up');
    expect(container.querySelector('.banner-text')).toBeNull();
    expect(container.querySelector('.banner-link-text')).toBeNull();
  });

  it('needs no text at all', () => {
    const { container } = render(Banner, { children: body });
    expect(container.querySelector('.mine')).not.toBeNull();
  });

  it('keeps the title above it', () => {
    const title = createRawSnippet(() => ({
      render: () => '<span class="heading">Heads up</span>'
    }));
    const { container } = render(Banner, { children: body, title });
    const parts = Array.from(container.querySelector('.banner-body')?.children ?? []).map((node) =>
      node.classList.contains('banner-title')
        ? 'title'
        : node.classList.contains('mine')
          ? 'body'
          : 'other'
    );
    expect(parts).toEqual(['title', 'body']);
  });
});
