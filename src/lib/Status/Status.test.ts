import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Status from './Status.svelte';

/**
 * Which URL `Status` hands to the image layer, and what happens when it fails.
 *
 * `statusIcon` used to default to the relative URL `icons/order-success-icon.svg`,
 * a file the library never shipped, so every render that relied on the default
 * requested a path that 404ed before the fallback appeared. The default is now
 * the built-in icon itself. Fetches are recorded rather than mocked away: the
 * claim under test is exactly which URLs get requested.
 *
 * The browser specs (tests/status-default-icon.spec.ts) prove the same thing in
 * real engines at the network layer; this file pins the resolution logic where a
 * regression would first show.
 */
const LEGACY_URL = 'icons/order-success-icon.svg';

const decodeDataUrl = (url: string): string => decodeURIComponent(url.slice(url.indexOf(',') + 1));

let requested: string[];

beforeEach(() => {
  requested = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      requested.push(url);
      return url.startsWith('data:image/svg+xml')
        ? new Response(decodeDataUrl(url), { status: 200 })
        : new Response('missing', { status: 404 });
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// `OMITTED` rather than `undefined`: the repo's lint rule forbids the literal, and a
// sentinel also keeps "omit the prop" distinct from "pass null" at the call site.
const OMITTED = Symbol('statusIcon omitted');

const renderStatus = (statusIcon: string | null | typeof OMITTED = OMITTED) =>
  render(Status, {
    props: {
      statusText: 'Payment Successful',
      statusDescription: '',
      // `null` is what a <sui-status> hands over once its `status-icon` attribute
      // is removed; the declared type says string | undefined, the runtime says otherwise.
      ...(statusIcon === OMITTED ? {} : { statusIcon: statusIcon as string })
    }
  });

describe('Status default icon', () => {
  it('renders the built-in checkmark without requesting any file when statusIcon is omitted', async () => {
    const { container } = renderStatus();

    await waitFor(() => expect(container.querySelector('.status-image svg circle')).not.toBeNull());

    expect(container.querySelector('.status-image svg path')).not.toBeNull();
    expect(container.querySelector('.status-image img')).toBeNull();
    // The only fetch is of the inlined data: URL, which never leaves the page.
    expect(requested).toHaveLength(1);
    expect(requested[0]).toMatch(/^data:image\/svg\+xml/);
    expect(requested.some((url) => url.includes('order-success-icon'))).toBe(false);
  });

  it('treats a null statusIcon (a removed web-component attribute) as omitted', async () => {
    const { container } = renderStatus(null);

    await waitFor(() => expect(container.querySelector('.status-image svg circle')).not.toBeNull());
    expect(requested.every((url) => url.startsWith('data:image/svg+xml'))).toBe(true);
  });

  it('keeps the accessible name on the default icon', async () => {
    const { container } = renderStatus();

    await waitFor(() => expect(container.querySelector('.status-image svg')).not.toBeNull());
    expect(container.querySelector('.status-image svg')?.getAttribute('aria-label')).toBe('status');
  });
});

describe('Status explicit icon URLs', () => {
  it('requests exactly the URL the caller passed', async () => {
    renderStatus('/assets/failed.svg');

    await waitFor(() => expect(requested).toContain('/assets/failed.svg'));
    expect(requested).toEqual(['/assets/failed.svg']);
  });

  it('never replaces a caller URL that fails with the built-in checkmark', async () => {
    const { container } = renderStatus('/assets/failed.svg');

    // Inlining failed (404), so the plain <img> takes over for that URL.
    const image = await waitFor(() => {
      const found = container.querySelector<HTMLImageElement>('.status-image img');
      expect(found).not.toBeNull();
      return found as HTMLImageElement;
    });
    expect(image.getAttribute('src')).toBe('/assets/failed.svg');

    await fireEvent.error(image);

    expect(container.querySelector('.status-image img')?.getAttribute('src')).toBe(
      '/assets/failed.svg'
    );
    expect(container.querySelector('.status-image svg')).toBeNull();
    expect(requested.some((url) => url.startsWith('data:'))).toBe(false);
  });

  it('keeps the built-in fallback for a caller who spells out the former default', async () => {
    const { container } = renderStatus(LEGACY_URL);

    const image = await waitFor(() => {
      const found = container.querySelector<HTMLImageElement>('.status-image img');
      expect(found).not.toBeNull();
      return found as HTMLImageElement;
    });
    expect(image.getAttribute('src')).toBe(LEGACY_URL);

    await fireEvent.error(image);

    await waitFor(() => expect(container.querySelector('.status-image svg circle')).not.toBeNull());
    expect(container.querySelector('.status-image img')).toBeNull();
  });
});
