import { cleanup, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TypewriterText from './TypewriterText.svelte';
import TypewriterTextSnippet from './TypewriterTextSnippet.test.svelte';
import type { TypewriterProgress, TypewriterTextProperties } from './properties';

function mockReducedMotion(reduce: boolean): void {
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: reduce && media === '(prefers-reduced-motion: reduce)',
    media,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true
  }));
}

function root(container: HTMLElement): HTMLElement {
  const element = container.querySelector('.typewriter-text');
  if (!(element instanceof HTMLElement)) {
    throw new Error('TypewriterText root is missing');
  }
  return element;
}

function expectSafeDOM(container: HTMLElement): void {
  expect(
    container.querySelector('script, iframe, object, embed, svg, math, style, link, meta')
  ).toBeNull();
  for (const element of container.querySelectorAll('*')) {
    for (const attribute of element.attributes) {
      expect(attribute.name.startsWith('on')).toBe(false);
      expect(attribute.name).not.toBe('srcdoc');
      if (attribute.name === 'href' || attribute.name === 'src') {
        // The browser resolves incomplete Markdown destinations as relative URLs too.
        const protocol = new URL(attribute.value, 'https://example.test/').protocol;
        expect(
          element.tagName === 'IMG' ? ['http:', 'https:'] : ['http:', 'https:', 'mailto:', 'tel:']
        ).toContain(protocol);
      }
    }
  }
}

async function settleRenderer(): Promise<void> {
  await vi.dynamicImportSettled();
  await tick();
}

async function advance(milliseconds: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(milliseconds);
  await tick();
}

beforeEach(() => {
  vi.useFakeTimers();
  mockReducedMotion(false);
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('TypewriterText reveal timer ownership', () => {
  it('starts one reveal chain for initially nonempty streaming text', async () => {
    const onprogress = vi.fn<(progress: TypewriterProgress) => void>();
    const { container } = render(TypewriterText, {
      text: 'Read this answer',
      isStreaming: true,
      speed: 25,
      onprogress
    });
    await tick();

    expect(root(container).textContent).toBe('R');
    expect(onprogress).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);
    await advance(24);
    expect(root(container).textContent).toBe('R');
    await advance(1);
    expect(root(container).textContent).toBe('Re');
    expect(onprogress).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('cancels every pending reveal before unmount returns', async () => {
    const onprogress = vi.fn<(progress: TypewriterProgress) => void>();
    const resolveDelay = vi.fn(() => 25);
    const { unmount } = render(TypewriterText, {
      text: 'This answer is still arriving',
      isStreaming: true,
      onprogress,
      resolveDelay
    });
    await tick();
    await advance(25);
    const progressCount = onprogress.mock.calls.length;
    const delayCount = resolveDelay.mock.calls.length;

    await unmount();
    // Assert before afterEach's generic timer cleanup can hide leaked work.
    expect(vi.getTimerCount()).toBe(0);
    await advance(1000);
    expect(onprogress).toHaveBeenCalledTimes(progressCount);
    expect(resolveDelay).toHaveBeenCalledTimes(delayCount);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not schedule a successor when onprogress synchronously unmounts it', async () => {
    let unmountOnProgress: (() => void) | null = null;
    const onprogress = vi.fn(() => {
      unmountOnProgress?.();
    });
    const resolveDelay = vi.fn(() => 25);
    const view = render(TypewriterText, {
      text: 'Remove this answer while it is revealing',
      isStreaming: true,
      onprogress,
      resolveDelay
    });
    await tick();
    const delayCount = resolveDelay.mock.calls.length;
    unmountOnProgress = view.unmount;
    await advance(25);
    expect(view.container.querySelector('.typewriter-text')).toBeNull();
    const progressCount = onprogress.mock.calls.length;
    expect(resolveDelay).toHaveBeenCalledTimes(delayCount);
    expect(vi.getTimerCount()).toBe(0);
    await advance(1000);
    expect(onprogress).toHaveBeenCalledTimes(progressCount);
    expect(resolveDelay).toHaveBeenCalledTimes(delayCount);
  });

  it('continues an append without starting another chain while text is pending', async () => {
    const onprogress = vi.fn<(progress: TypewriterProgress) => void>();
    const { container, rerender } = render(TypewriterText, {
      text: 'abc',
      isStreaming: true,
      speed: 25,
      onprogress
    });
    await tick();
    await rerender({ text: 'abcdef' });
    expect(root(container).textContent).toBe('a');
    expect(onprogress).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);
    await advance(25);
    expect(root(container).textContent).toBe('ab');
    expect(onprogress).toHaveBeenLastCalledWith({
      index: 2,
      total: 6,
      displayedText: 'ab'
    });
    expect(vi.getTimerCount()).toBe(1);
  });

  it('resumes an append after catching up without retaining the old timeout', async () => {
    const { container, rerender } = render(TypewriterText, {
      text: 'abc',
      isStreaming: true,
      speed: 25
    });
    await tick();
    await advance(50);
    expect(root(container).textContent).toBe('abc');
    await rerender({ text: 'abcde' });
    expect(root(container).textContent).toBe('abcd');
    expect(vi.getTimerCount()).toBe(1);
    await advance(25);
    expect(root(container).textContent).toBe('abcde');
  });

  it('cancels the old chain when nonempty text is replaced or shortened', async () => {
    const { container, rerender } = render(TypewriterText, {
      text: 'Original answer',
      isStreaming: true,
      speed: 25
    });
    await tick();
    await advance(25);
    await rerender({ text: 'New' });
    expect(root(container).textContent).toBe('N');
    expect(vi.getTimerCount()).toBe(1);
    await advance(25);
    expect(root(container).textContent).toBe('Ne');
    await rerender({ text: 'N' });
    expect(root(container).textContent).toBe('N');
    expect(vi.getTimerCount()).toBe(1);
    await advance(25);
    expect(root(container).textContent).toBe('N');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('discloses stream completion and historic text without pending reveal work', async () => {
    const onprogress = vi.fn<(progress: TypewriterProgress) => void>();
    const text = 'The answer is complete';
    const { container, rerender, unmount } = render(TypewriterText, {
      text,
      isStreaming: true,
      speed: 25,
      onprogress
    });
    await tick();
    await rerender({ isStreaming: false });
    expect(root(container).textContent).toBe(text);
    expect(onprogress).toHaveBeenLastCalledWith({
      index: text.length,
      total: text.length,
      displayedText: text
    });
    expect(vi.getTimerCount()).toBe(0);
    await unmount();

    const historic = render(TypewriterText, { text });
    await tick();
    expect(root(historic.container).textContent).toBe(text);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('discloses initially nonempty reduced-motion text without pacing callbacks', async () => {
    mockReducedMotion(true);
    const resolveDelay = vi.fn(() => 25);
    const onprogress = vi.fn<(progress: TypewriterProgress) => void>();
    const text = 'Show the whole answer';
    const { container } = render(TypewriterText, {
      text,
      isStreaming: true,
      resolveDelay,
      onprogress
    });
    await tick();
    expect(root(container).textContent).toBe(text);
    expect(onprogress).toHaveBeenCalledTimes(1);
    expect(resolveDelay).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels pending pacing when reduced motion becomes active', async () => {
    const resolveDelay = vi.fn(() => 25);
    const text = 'The stream is still in progress';
    const { container } = render(TypewriterText, {
      text,
      isStreaming: true,
      resolveDelay
    });
    await tick();
    expect(root(container).textContent).toBe('T');
    mockReducedMotion(true);
    await advance(25);
    expect(root(container).textContent).toBe(text);
    expect(resolveDelay).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('TypewriterText safe Markdown mode', () => {
  it('renders rich Markdown without requiring a callback or the plain whitespace class', async () => {
    const { container } = render(TypewriterText, {
      text: '# Title\n\n**bold** *emphasis* `code`\n\n- item\n\n[site](https://example.test)\n\n![cat](https://example.test/cat.png)',
      markdown: true,
      classes: 'custom',
      testId: 'answer'
    });
    await settleRenderer();
    expect(container.querySelector('h1')?.textContent).toBe('Title');
    expect(container.querySelector('strong')?.textContent).toBe('bold');
    expect(container.querySelector('em')?.textContent).toBe('emphasis');
    expect(container.querySelector('code')?.textContent).toBe('code');
    expect(container.querySelector('li')?.textContent).toBe('item');
    const link = container.querySelector('a');
    expect(link?.getAttribute('href')).toBe('https://example.test');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      'https://example.test/cat.png'
    );
    expect(root(container).classList.contains('plain')).toBe(false);
    expect(root(container).classList.contains('custom')).toBe(true);
    expect(root(container).getAttribute('data-pw')).toBe('answer');
    expectSafeDOM(container);
  });

  it('keeps escaped plain text and default styling when Markdown is not enabled', async () => {
    const text = '**literal**\n  <img src=x onerror="alert(1)">';
    const { container } = render(TypewriterText, { text });
    await settleRenderer();
    expect(root(container).textContent).toBe(text);
    expect(container.querySelector('img, strong')).toBeNull();
    expect(root(container).classList.contains('plain')).toBe(true);
  });

  it('preserves the trusted HTML callback ahead of snippets and ignores Markdown options outside safe mode', async () => {
    const { container } = render(TypewriterTextSnippet, {
      text: 'source',
      markdown: false,
      markdownOptions: { sanitize: { allowedProtocols: [], allowedTags: [] } },
      renderText: (text) => `<a href="mailto:trusted@example.test"><em>${text}</em></a>`
    });
    await settleRenderer();
    expect(container.querySelector('em')?.textContent).toBe('source');
    expect(container.querySelector('a')?.getAttribute('href')).toBe('mailto:trusted@example.test');
    expect(container.querySelector('[data-character]')).toBeNull();
    expect(root(container).classList.contains('plain')).toBe(false);
  });

  it('preserves the character snippet ahead of escaped plain text', async () => {
    const { container } = render(TypewriterTextSnippet, { text: '<1>' });
    await settleRenderer();
    expect(
      [...container.querySelectorAll('[data-character]')].map((node) => node.textContent)
    ).toEqual(['<', '1', '>']);
    expect(container.querySelector('[data-character="1"]')?.textContent).toBe('1');
    expect(root(container).classList.contains('plain')).toBe(true);
  });

  it('gives Markdown priority over both an unsafe HTML callback and a character snippet', async () => {
    const { container } = render(TypewriterTextSnippet, {
      text: '**safe**\n\n<img src=x onerror="alert(1)">',
      markdown: true,
      renderText: () => '<script>alert(1)</script><img src=x onerror="alert(1)">'
    });
    await settleRenderer();
    expectSafeDOM(container);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-character]')).toBeNull();
    expect(container.querySelector('strong')?.textContent).toBe('safe');
  });

  it('gives Markdown priority when only a character snippet is supplied', async () => {
    const { container } = render(TypewriterTextSnippet, { text: '**safe**', markdown: true });
    await settleRenderer();
    expect(container.querySelector('strong')?.textContent).toBe('safe');
    expect(container.querySelector('[data-character]')).toBeNull();
    expect(root(container).classList.contains('plain')).toBe(false);
  });

  it('switches rendering modes without replacing revealed source', async () => {
    const { container, rerender } = render(TypewriterText, { text: '**safe**' });
    await settleRenderer();
    expect(root(container).textContent).toBe('**safe**');
    await rerender({ markdown: true });
    await settleRenderer();
    expect(container.querySelector('strong')?.textContent).toBe('safe');
    await rerender({ markdown: false });
    expect(root(container).textContent).toBe('**safe**');
    expect(container.querySelector('strong')).toBeNull();
    expect(root(container).classList.contains('plain')).toBe(true);
  });

  it('accepts null options from JavaScript before and after the renderer loads', async () => {
    const nullOptions = null as unknown as TypewriterTextProperties['markdownOptions'];
    const { container, rerender } = render(TypewriterText, {
      text: '**safe** [blocked](javascript:alert(1))',
      markdown: true,
      markdownOptions: nullOptions
    });
    await settleRenderer();
    expect(container.querySelector('strong')?.textContent).toBe('safe');
    expect(container.querySelector('a')).toBeNull();
    await rerender({ markdownOptions: { inline: true } });
    expect(container.querySelector('p')).toBeNull();
    await rerender({ markdownOptions: nullOptions });
    expect(container.querySelector('strong')?.textContent).toBe('safe');
    expect(container.querySelector('p')).not.toBeNull();
    expectSafeDOM(container);
  });

  it('forwards a narrower URL policy and reacts when options change', async () => {
    const { container, rerender } = render(TypewriterText, {
      text: '[web](https://example.test) [mail](mailto:x@example.test) [phone](tel:+15550100)\n\n![cat](http://example.test/cat.png)',
      markdown: true,
      markdownOptions: { sanitize: { allowedProtocols: ['https:'] } }
    });
    await settleRenderer();
    expect([...container.querySelectorAll('a')].map((link) => link.getAttribute('href'))).toEqual([
      'https://example.test'
    ]);
    expect(container.querySelector('img')).toBeNull();
    expect(root(container).textContent).toContain('mail phone');
    expect(root(container).textContent).toContain('cat');
    await rerender({ markdownOptions: {} });
    expect(container.querySelectorAll('a').length).toBe(3);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('http://example.test/cat.png');
  });

  it('forwards inline, breaks, tag restrictions and task-list options', async () => {
    const { container, rerender } = render(TypewriterText, {
      text: '**bold**\n*soft*',
      markdown: true,
      markdownOptions: { inline: true, breaks: true, sanitize: { allowedTags: ['strong'] } }
    });
    await settleRenderer();
    expect(container.querySelector('strong')?.textContent).toBe('bold');
    expect(container.querySelector('p, em')).toBeNull();
    expect(container.querySelector('br')).not.toBeNull();
    await rerender({
      text: '- [ ] task',
      markdownOptions: { sanitize: { disableTaskLists: true } }
    });
    expect(container.querySelector('li')?.textContent).toContain('task');
    expect(container.querySelector('input')).toBeNull();
  });

  it('forwards the accessible table label without permitting attribute injection', async () => {
    const label = 'Results" onmouseover="alert(1)';
    const { container } = render(TypewriterText, {
      text: '| A | B |\n| --- | --- |\n| 1 | 2 |',
      markdown: true,
      markdownOptions: { tableLabel: label }
    });
    await settleRenderer();
    const region = container.querySelector('[role="region"]');
    expect(region?.getAttribute('aria-label')).toBe(label);
    expect(region?.getAttribute('tabindex')).toBe('0');
    expect(region?.querySelector('table')).not.toBeNull();
    expectSafeDOM(container);
  });

  it.each([
    '<script>alert(1)</script>',
    '<img src=x onerror="alert(1)">',
    '<svg onload="alert(1)"><a href="javascript:alert(1)">x</a></svg>',
    '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
    '[click](javascript:alert(1))',
    '![image](javascript:alert(1))',
    '[click](data:text/html;base64,PHNjcmlwdD4=)',
    '![image](data:image/svg+xml;base64,PHN2Zz4=)',
    '[click](jav&#x09;ascript:alert(1))',
    '[click](java&Tab;script:alert(1))',
    '[click](java&NewLine;script:alert(1))',
    '[click](&#106;avascript&#58;alert(1))',
    '![image](jav&#97;script:alert(1))',
    '[click](javascript%3Aalert(1))'
  ])('keeps every streaming prefix safe for %s', async (payload) => {
    const text = `${payload}\n\n**safe**`;
    const onprogress = vi.fn<(progress: TypewriterProgress) => void>();
    // Starting empty isolates each reveal; mounting nonempty text can batch disclosures.
    const { container, rerender } = render(TypewriterText, {
      text: '',
      markdown: true,
      isStreaming: true,
      speed: 10,
      renderText: (source) => source,
      onprogress
    });
    await settleRenderer();
    await rerender({ text });
    for (let index = 1; index <= text.length; index += 1) {
      expect(onprogress).toHaveBeenLastCalledWith({
        index,
        total: text.length,
        displayedText: text.slice(0, index)
      });
      expect(onprogress).toHaveBeenCalledTimes(index);
      expectSafeDOM(container);
      expect(root(container).classList.contains('plain')).toBe(false);
      if (index < text.length) {
        await advance(10);
      }
    }
    expect(container.querySelector('strong')?.textContent).toBe('safe');
  });

  it('continues appended Markdown and resets replaced source while progress stays raw', async () => {
    const onprogress = vi.fn<(progress: TypewriterProgress) => void>();
    const { container, rerender } = render(TypewriterText, {
      text: '',
      markdown: true,
      isStreaming: true,
      speed: 10,
      onprogress
    });
    await settleRenderer();
    await rerender({ text: '**Hi**' });
    await advance(50);
    expect(container.querySelector('strong')?.textContent).toBe('Hi');
    await rerender({ text: '**Hi** *there*' });
    expect(onprogress).toHaveBeenLastCalledWith({ index: 7, total: 14, displayedText: '**Hi** ' });
    await advance(70);
    expect(container.querySelector('em')?.textContent).toBe('there');
    await rerender({ text: '**New**' });
    expect(onprogress).toHaveBeenLastCalledWith({ index: 1, total: 7, displayedText: '*' });
    expect(container.querySelector('strong, em')).toBeNull();
    await advance(60);
    expect(container.querySelector('strong')?.textContent).toBe('New');
    expect(onprogress).toHaveBeenLastCalledWith({ index: 7, total: 7, displayedText: '**New**' });
  });

  it('sanitizes the bulk disclosure on completion without changing progress', async () => {
    const text = '**done** <img src=x onerror="alert(1)">';
    const onprogress = vi.fn<(progress: TypewriterProgress) => void>();
    const { container, rerender } = render(TypewriterText, {
      text: '',
      markdown: true,
      isStreaming: true,
      onprogress
    });
    await settleRenderer();
    await rerender({ text });
    expect(onprogress).toHaveBeenLastCalledWith({
      index: 1,
      total: text.length,
      displayedText: '*'
    });
    await rerender({ isStreaming: false });
    expect(container.querySelector('strong')?.textContent).toBe('done');
    expect(container.querySelector('img')).toBeNull();
    expect(onprogress).toHaveBeenLastCalledWith({
      index: text.length,
      total: text.length,
      displayedText: text
    });
    expect(onprogress).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
    expectSafeDOM(container);
  });

  it('discloses sanitized Markdown immediately with reduced motion and bypasses pacing', async () => {
    mockReducedMotion(true);
    const text = '**now** <img src=x onerror="alert(1)">';
    const onprogress = vi.fn<(progress: TypewriterProgress) => void>();
    const resolveDelay = vi.fn(() => 5000);
    const { container, rerender } = render(TypewriterText, {
      text: '',
      markdown: true,
      isStreaming: true,
      speed: 5000,
      variableDelay: { default: { min: 5000, max: 5000 } },
      resolveDelay,
      onprogress
    });
    await settleRenderer();
    await rerender({ text });
    expect(container.querySelector('strong')?.textContent).toBe('now');
    expect(container.querySelector('img')).toBeNull();
    expect(onprogress).toHaveBeenCalledTimes(1);
    expect(onprogress).toHaveBeenLastCalledWith({
      index: text.length,
      total: text.length,
      displayedText: text
    });
    expect(resolveDelay).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    await rerender({ text: `${text} *more*` });
    expect(container.querySelector('em')?.textContent).toBe('more');
    expect(onprogress).toHaveBeenCalledTimes(2);
    expectSafeDOM(container);
  });
});
