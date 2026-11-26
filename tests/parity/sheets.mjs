/**
 * Builds one contact sheet per component from the last run's report, for reading by eye.
 *
 * Each row is one case: the published render, the candidate render and, when they differ, the difference
 * image, all cropped to the same box around whatever either render drew. The crop is only for
 * reading; the pass or fail verdict comes from run.mjs, which compares the full screenshots.
 *
 * Usage: node tests/parity/sheets.mjs [reportDir] [outDir]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const HERE = dirname(fileURLToPath(import.meta.url));
const reportDir = resolve(process.argv[2] ?? join(HERE, '.report'));
const outDir = resolve(process.argv[3] ?? join(reportDir, 'sheets'));
mkdirSync(outDir, { recursive: true });
const { summary, results } = JSON.parse(readFileSync(join(reportDir, 'summary.json'), 'utf8'));

const byComponent = new Map();
for (const result of results) {
  const component = result.id.split(':')[0];
  if (!byComponent.has(component)) {
    byComponent.set(component, []);
  }
  byComponent.get(component).push(result);
}

const read = (name) => {
  try {
    return readFileSync(join(reportDir, 'images', name)).toString('base64');
  } catch {
    return null;
  }
};

const browser = await chromium.launch();
const page = await browser.newPage();
const index = [];
for (const [component, rows] of byComponent) {
  const payload = rows.map((row) => ({
    id: row.id,
    status: row.status,
    control: row.control === true,
    problems: row.problems,
    reason: row.knownDifference,
    before: read(`${row.image}.before.png`),
    after: read(`${row.image}.after.png`),
    diff: read(`${row.image}.diff.png`)
  }));
  const png = await page.evaluate(async (items) => {
    const load = async (data) => {
      if (data === null) {
        return null;
      }
      const blob = await (await fetch(`data:image/png;base64,${data}`)).blob();
      return createImageBitmap(blob);
    };
    const inkBox = (bitmap) => {
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext('2d');
      context.drawImage(bitmap, 0, 0);
      const { data, width, height } = context.getImageData(0, 0, bitmap.width, bitmap.height);
      let left = width;
      let top = height;
      let right = -1;
      let bottom = -1;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) {
            left = Math.min(left, x);
            top = Math.min(top, y);
            right = Math.max(right, x);
            bottom = Math.max(bottom, y);
          }
        }
      }
      return right < 0 ? null : { left, top, right, bottom };
    };
    const PAD = 8;
    const LABEL = 22;
    const GAP = 12;
    const prepared = [];
    let sheetWidth = 0;
    let sheetHeight = 0;
    for (const item of items) {
      const before = await load(item.before);
      const after = await load(item.after);
      const diff = await load(item.diff);
      const boxes = [before, after].filter(Boolean).map(inkBox).filter(Boolean);
      const box = boxes.length
        ? {
            left: Math.max(0, Math.min(...boxes.map((b) => b.left)) - PAD),
            top: Math.max(0, Math.min(...boxes.map((b) => b.top)) - PAD),
            right: Math.min(before.width - 1, Math.max(...boxes.map((b) => b.right)) + PAD),
            bottom: Math.min(before.height - 1, Math.max(...boxes.map((b) => b.bottom)) + PAD)
          }
        : { left: 0, top: 0, right: 119, bottom: 39 };
      const width = box.right - box.left + 1;
      const height = box.bottom - box.top + 1;
      const panels = [before, after, diff].filter(Boolean).length;
      prepared.push({ item, before, after, diff, box, width, height });
      sheetWidth = Math.max(sheetWidth, panels * (width + GAP) + GAP, 760);
      sheetHeight += LABEL + height + GAP;
    }
    const canvas = new OffscreenCanvas(sheetWidth, sheetHeight + GAP);
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;
    const colour = {
      pass: '#17683a',
      'known-difference': '#8a5300',
      fail: '#b3261e',
      flaky: '#b3261e'
    };
    let y = GAP;
    for (const { item, before, after, diff, box, width, height } of prepared) {
      const verdict = item.control
        ? item.status === 'pass'
          ? 'control: must differ, and does'
          : 'control FAILED: it should differ'
        : item.status === 'pass'
          ? 'identical'
          : item.status === 'known-difference'
            ? `known difference: ${item.reason}`
            : `${item.status}: ${item.problems.join('; ')}`;
      context.font = '13px sans-serif';
      context.fillStyle = '#111111';
      context.fillText(item.id, GAP, y + 14);
      context.fillStyle = colour[item.status] ?? '#4a5565';
      context.fillText(
        verdict.slice(0, 140),
        GAP + context.measureText(item.id).width + 12,
        y + 14
      );
      y += LABEL;
      let x = GAP;
      for (const [bitmap, name] of [
        [before, 'published'],
        [after, 'this branch'],
        [diff, 'difference']
      ]) {
        if (!bitmap) {
          continue;
        }
        context.drawImage(bitmap, box.left, box.top, width, height, x, y, width, height);
        context.strokeStyle = name === 'difference' ? '#dc003c' : '#d0d5dc';
        context.strokeRect(x - 0.5, y - 0.5, width + 1, height + 1);
        x += width + GAP;
      }
      y += height + GAP;
    }
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }, payload);
  const file = `${component}.png`;
  writeFileSync(join(outDir, file), Buffer.from(png, 'base64'));
  index.push({
    component,
    file,
    cases: rows.length,
    identical: rows.filter((row) => row.status === 'pass' && !row.control).length,
    controls: rows.filter((row) => row.control).length,
    knownDifferences: rows.filter((row) => row.status === 'known-difference').length,
    other: rows.filter((row) => !['pass', 'known-difference'].includes(row.status)).length
  });
}
await browser.close();
writeFileSync(join(outDir, 'index.json'), JSON.stringify({ summary, sheets: index }, null, 1));
console.log(`${index.length} sheets written to ${outDir}`);
