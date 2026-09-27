// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ChatMessageList from './ChatMessageList.svelte';
import type { ChatMessageData } from '../Chat/types';

const messages: ChatMessageData[] = [
  { id: 'a', role: 'user', content: 'hi' },
  { id: 'b', role: 'assistant', content: 'hello' }
];

const SCROLL_HEIGHT = 480;

afterEach(() => {
  vi.unstubAllGlobals();
});

// jsdom has no layout, so the list is given a height and a scrollTop whose
// setter records the inline `scroll-behavior` in force at the moment of each
// jump -- which is what proves the behaviour applied to the jump itself rather
// than only being written around it.
const mountList = () => {
  const utils = render(ChatMessageList, { messages });
  const list = utils.container.querySelector('.chat-message-list');
  if (!(list instanceof HTMLElement)) {
    throw new Error('ChatMessageList root is missing');
  }
  const jumps: { top: number; behavior: string }[] = [];
  let top = 0;
  Object.defineProperty(list, 'scrollHeight', { value: SCROLL_HEIGHT, configurable: true });
  Object.defineProperty(list, 'scrollTop', {
    configurable: true,
    get: () => top,
    set: (value: number) => {
      top = value;
      jumps.push({ top: value, behavior: list.style.scrollBehavior });
    }
  });
  return { ...utils, list, jumps };
};

// Frames are captured, not run, so the test decides when "the next frame" is.
const captureFrames = (): FrameRequestCallback[] => {
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback): number => {
    frames.push(callback);
    return frames.length;
  });
  return frames;
};

const stubMotion = (reduce: boolean): void => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {}
  }));
};

const runFrames = (frames: FrameRequestCallback[]): void => {
  for (const frame of frames.splice(0)) {
    frame(0);
  }
};

describe('ChatMessageList scrollToBottom', () => {
  it('with no argument just jumps to the bottom: no scroll-behavior written, no frame scheduled', () => {
    const { component, list, jumps } = mountList();
    stubMotion(false);
    const frames = captureFrames();
    component.scrollToBottom();
    expect(jumps).toEqual([{ top: SCROLL_HEIGHT, behavior: '' }]);
    expect(list.style.scrollBehavior).toBe('');
    expect(frames).toHaveLength(0);
  });

  it("'instant' jumps under scroll-behavior: auto, then clears it on the next frame", () => {
    const { component, list, jumps } = mountList();
    stubMotion(false);
    const frames = captureFrames();
    component.scrollToBottom('instant');
    // The CSS property has no `instant` keyword, so `auto` is what is written.
    expect(jumps).toEqual([{ top: SCROLL_HEIGHT, behavior: 'auto' }]);
    expect(list.style.scrollBehavior).toBe('auto');
    runFrames(frames);
    expect(list.style.scrollBehavior).toBe('');
  });

  it("'smooth' jumps under scroll-behavior: smooth, then clears it on the next frame", () => {
    const { component, list, jumps } = mountList();
    stubMotion(false);
    const frames = captureFrames();
    component.scrollToBottom('smooth');
    expect(jumps).toEqual([{ top: SCROLL_HEIGHT, behavior: 'smooth' }]);
    expect(list.style.scrollBehavior).toBe('smooth');
    runFrames(frames);
    expect(list.style.scrollBehavior).toBe('');
  });

  it("turns 'smooth' into auto for a viewer who prefers reduced motion", () => {
    const { component, list, jumps } = mountList();
    stubMotion(true);
    const frames = captureFrames();
    component.scrollToBottom('smooth');
    expect(jumps).toEqual([{ top: SCROLL_HEIGHT, behavior: 'auto' }]);
    runFrames(frames);
    expect(list.style.scrollBehavior).toBe('');
  });

  it('the built-in jump control scrolls to the latest message, writing no behavior', async () => {
    const { list, jumps, getByRole } = mountList();
    stubMotion(false);
    const frames = captureFrames();
    // Scrolled away from the bottom: the control appears.
    await fireEvent.scroll(list);
    await tick();
    await fireEvent.click(getByRole('button', { name: 'Jump to latest' }));
    expect(jumps.at(-1)).toEqual({ top: SCROLL_HEIGHT, behavior: '' });
    expect(frames).toHaveLength(0);
  });
});
