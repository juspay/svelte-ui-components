import { expect, test, type Page } from '@playwright/test';

const attack =
  '**Safe** [guide](https://example.com)\n\n' +
  '[unsafe](javascript:window.__typewriterExecuted=1) ' +
  '[encoded](jav&#x09;ascript:window.__typewriterExecuted=2) ' +
  '<script>window.__typewriterExecuted=3</script>' +
  '<img src=x onerror="window.__typewriterExecuted=4">';

type Frame = { index: number; unsafe: string[] };
type Audit = {
  frames: Frame[];
  index: number;
  callbacks: number;
  observed: boolean;
};

const loadBundle = async (page: Page): Promise<void> => {
  await page.goto('/components/typewriter-text');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => Boolean(customElements.get('sui-typewriter-text')));
};

const installAudit = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    const audit: Audit = { frames: [], index: 0, callbacks: 0, observed: false };
    Object.assign(window, { __typewriterAudit: audit, __typewriterExecuted: 0 });
    const el = document.createElement('sui-typewriter-text');
    el.id = 'safe-typewriter';
    el.setAttribute('markdown', '');
    el.setAttribute('is-streaming', '');
    el.setAttribute('speed', '10');
    el.setAttribute('test-id', 'safe-typewriter-content');
    Object.assign(el, {
      text: '',
      onprogress: (progress: { index: number }) => {
        audit.index = progress.index;
      },
      renderText: () => {
        audit.callbacks += 1;
        return '<img src=x onerror="window.__typewriterExecuted=5">';
      }
    });
    document.body.append(el);
  });
  await page.waitForFunction(() =>
    Boolean(
      document.getElementById('safe-typewriter')?.shadowRoot?.querySelector('.typewriter-text')
    )
  );
  await page.evaluate(() => {
    const root = document.getElementById('safe-typewriter')?.shadowRoot;
    const content = root?.querySelector('.typewriter-text');
    if (!content) {
      throw new Error('Typewriter content did not mount');
    }
    const audit = (window as unknown as { __typewriterAudit: Audit }).__typewriterAudit;
    const sample = () => {
      const unsafe: string[] = [];
      for (const node of content.querySelectorAll('*')) {
        if (['SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH'].includes(node.tagName)) {
          unsafe.push(node.tagName);
        }
        for (const attr of [...node.attributes]) {
          if (attr.name.startsWith('on') || attr.name === 'srcdoc') {
            unsafe.push(attr.name);
          }
        }
        for (const attr of ['href', 'src']) {
          const value = node.getAttribute(attr);
          if (value === null) {
            continue;
          }
          const protocol = new URL(value, location.href).protocol;
          const allowed =
            attr === 'src' ? ['https:', 'http:'] : ['https:', 'http:', 'mailto:', 'tel:'];
          if (!allowed.includes(protocol)) {
            unsafe.push(`${attr}:${protocol}`);
          }
        }
      }
      audit.frames.push({ index: audit.index, unsafe });
    };
    new MutationObserver(sample).observe(content, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    });
    sample();
    Object.assign(window, { __typewriterSample: sample });
    audit.observed = true;
  });
};

const sampleCurrentFrame = (page: Page) =>
  page.evaluate(() => {
    (window as unknown as { __typewriterSample: () => void }).__typewriterSample();
  });

const readAudit = (page: Page) =>
  page.evaluate(() => {
    const audit = (window as unknown as { __typewriterAudit: Audit }).__typewriterAudit;
    return {
      ...audit,
      executed: (window as unknown as { __typewriterExecuted: number }).__typewriterExecuted
    };
  });

test('the Svelte demo reveals real Markdown with the default safe renderer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/components/typewriter-text');
  await page.getByTestId('typewriter-markdown-start').click();
  const output = page.getByTestId('typewriter-markdown-demo');
  await expect(output.locator('strong')).toHaveText('Refund summary');
  await expect(output.getByRole('link', { name: 'guide' })).toHaveAttribute(
    'href',
    'https://example.com/refunds'
  );
  await expect(output.locator('li')).toHaveCount(2);
  await expect(output).not.toHaveClass(/\bplain\b/);
});

test('every streamed frame is safe and the HTML callback cannot bypass Markdown mode', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await loadBundle(page);
  await installAudit(page);
  await page.clock.install({ time: new Date('2030-01-01T00:00:00Z') });
  // install alone still advances with wall time between calls on a loaded runner.
  await page.clock.pauseAt(new Date('2030-01-01T00:00:01Z'));
  await page.evaluate(
    (text) => Object.assign(document.getElementById('safe-typewriter')!, { text }),
    attack
  );
  // A Markdown prefix can produce the same HTML as its predecessor, so a mutation
  // observer alone misses disclosures such as blank lines. Sample after each reveal
  // as well as observing DOM mutations; the clock keeps every prefix observable.
  await sampleCurrentFrame(page);
  for (let index = 0; index <= attack.length; index += 1) {
    await page.clock.runFor(10);
    await sampleCurrentFrame(page);
  }
  const result = await readAudit(page);
  expect(result.observed).toBe(true);
  expect(result.callbacks).toBe(0);
  expect(result.executed).toBe(0);
  expect([...new Set(result.frames.map((frame) => frame.index))].sort((a, b) => a - b)).toEqual(
    Array.from({ length: attack.length + 1 }, (_, index) => index)
  );
  expect(result.frames.flatMap((frame) => frame.unsafe)).toEqual([]);
  const output = page.getByTestId('safe-typewriter-content');
  await expect(output.locator('strong')).toHaveText('Safe');
  await expect(output.getByRole('link')).toHaveCount(1);
  await expect(output).toContainText('<script>window.__typewriterExecuted=3</script>');
});

test('reduced motion renders safe Markdown immediately and options only narrow the policy', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadBundle(page);
  await installAudit(page);
  await page.evaluate((text) => {
    const el = document.getElementById('safe-typewriter');
    el?.setAttribute('markdown-options', JSON.stringify({ sanitize: { allowedProtocols: [] } }));
    Object.assign(el!, { text });
  }, attack);
  const output = page.getByTestId('safe-typewriter-content');
  await expect(output.locator('strong')).toHaveText('Safe');
  await expect(output).toContainText('<script>window.__typewriterExecuted=3</script>');
  await expect(output.getByRole('link')).toHaveCount(0);
  const result = await readAudit(page);
  expect(result.index).toBe(attack.length);
  expect(result.callbacks).toBe(0);
  expect(result.executed).toBe(0);
  expect(result.frames.flatMap((frame) => frame.unsafe)).toEqual([]);
});

test('custom-element options tolerate JSON null and JavaScript null updates', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadBundle(page);
  await page.evaluate(() => {
    const el = document.createElement('sui-typewriter-text');
    el.id = 'null-options-typewriter';
    el.setAttribute('markdown', '');
    el.setAttribute('markdown-options', 'null');
    el.setAttribute('text', '**safe** [blocked](javascript:alert(1))');
    document.body.append(el);
  });
  const output = page.locator('#null-options-typewriter');
  await expect(output.locator('strong')).toHaveText('safe');
  await page.evaluate(() =>
    Object.assign(document.getElementById('null-options-typewriter')!, {
      markdownOptions: { inline: true }
    })
  );
  await expect(output.locator('p')).toHaveCount(0);
  await page.evaluate(() =>
    Object.assign(document.getElementById('null-options-typewriter')!, {
      markdownOptions: null,
      text: '**updated** [blocked](javascript:alert(1))'
    })
  );
  await expect(output.locator('strong')).toHaveText('updated');
  await expect(output.locator('p')).toHaveCount(1);
  await expect(output.locator('a')).toHaveCount(0);
  expect(errors).toEqual([]);
});
