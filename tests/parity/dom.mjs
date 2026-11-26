// Prints the rendered markup of one case on both stacks, from the builds the last run left behind.
// Usage: node tests/parity/dom.mjs <File:case> [css selector to describe]
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const HERE = dirname(fileURLToPath(import.meta.url));
const [id, selector] = process.argv.slice(2);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const serve = (directory) =>
  new Promise((ready) => {
    const server = createServer((request, response) => {
      const path = new URL(request.url, 'http://x').pathname;
      const file = join(directory, path === '/' ? 'index.html' : path);
      if (!existsSync(file)) {
        return response.writeHead(404).end();
      }
      response.writeHead(200, {
        'content-type': MIME[extname(file)] ?? 'application/octet-stream'
      });
      response.end(readFileSync(file));
    });
    server.listen(0, '127.0.0.1', () =>
      ready({ server, origin: `http://127.0.0.1:${server.address().port}` })
    );
  });

const browser = await chromium.launch(
  process.env.PARITY_CHANNEL ? { channel: process.env.PARITY_CHANNEL } : {}
);
const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
for (const stack of ['baseline', 'candidate']) {
  const { server, origin } = await serve(join(HERE, stack, 'dist'));
  await page.goto(`${origin}/?case=${encodeURIComponent(id)}`);
  await page.waitForFunction(() => window.__ready === true);
  await page.waitForTimeout(400);
  const html = await page.evaluate(() => {
    // Drop comment nodes (Svelte's anchors) through the DOM, then print the markup for reading.
    const copy = document.getElementById('stage').cloneNode(true);
    const walker = document.createTreeWalker(copy, NodeFilter.SHOW_COMMENT);
    const comments = [];
    while (walker.nextNode()) {
      comments.push(walker.currentNode);
    }
    comments.forEach((node) => node.remove());
    return copy.innerHTML.replace(
      / class="([^"]*)"/g,
      (_, c) => ` class="${c.replace(/\s*(s-|svelte-)[\w-]+/g, '').trim()}"`
    );
  });
  console.log(`--- ${stack}\n${html}`);
  if (selector) {
    const info = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) {
        return null;
      }
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const pick = [
        'background-color',
        'border',
        'outline',
        'opacity',
        'filter',
        'padding',
        'color',
        'font-size'
      ];
      return {
        box: [box.x, box.y, box.width, box.height],
        display: style.display,
        attrs: el.getAttributeNames(),
        style: Object.fromEntries(pick.map((name) => [name, style.getPropertyValue(name)])),
        image:
          el instanceof HTMLImageElement
            ? { complete: el.complete, currentSrc: el.currentSrc, src: el.getAttribute('src') }
            : null
      };
    }, selector);
    console.log(`    ${selector}: ${JSON.stringify(info)}`);
  }
  server.close();
}
await browser.close();
