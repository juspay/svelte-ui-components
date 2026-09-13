import { cleanup, render, waitFor } from '@testing-library/svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { tick } from 'svelte';
import TypewriterText from './TypewriterText.svelte';

const parser = vi.hoisted(() => {
  let rejectLoad: (reason: Error) => void = () => {};
  const pending = new Promise<never>((_resolve, reject) => {
    rejectLoad = reject;
  });
  return { pending, rejectLoad, started: false };
});

// Isolate the optional dependency failure without resetting Svelte's module instance.
vi.mock('../MarkdownText/markdown', async () => {
  parser.started = true;
  return await parser.pending;
});

afterEach(() => cleanup());

it('keeps source escaped while the optional parser loads and after it fails', async () => {
  const text = '**safe** <img src=x onerror="alert(1)">';
  const renderText = vi.fn(() => '<img src=x onerror="alert(2)">');
  const { container, rerender } = render(TypewriterText, { text });
  const output = container.querySelector('.typewriter-text');
  await tick();
  expect(output?.textContent).toBe(text);
  expect(parser.started).toBe(false);

  await rerender({ markdown: true, renderText });
  await waitFor(() => expect(parser.started).toBe(true));
  expect(output?.textContent).toBe(text);
  expect(output?.querySelector('img, strong, script')).toBeNull();
  expect(renderText).not.toHaveBeenCalled();

  parser.rejectLoad(new Error('The optional marked peer is not installed'));
  await vi.dynamicImportSettled();
  await tick();
  await rerender({ text: '<script>alert(3)</script>' });
  expect(output?.textContent).toBe('<script>alert(3)</script>');
  expect(output?.querySelector('script, img')).toBeNull();
  expect(renderText).not.toHaveBeenCalled();
});
