/**
 * Parity check: renders every case on two stacks and compares them pixel for pixel.
 *
 *   baseline  = the latest published @juspay/svelte-ui-components (tests/parity/baseline), on the
 *               same Svelte, Vite and plugin versions as this repo
 *   candidate = this repo's src/lib (or, with --target dist, the packaged output)
 *
 * It answers one question for a pull request: does any component render or behave differently
 * from the release consumers run today? A change that is meant to alter a component shows up
 * here, and the case's expected output is then updated on purpose (see AUTHORING.md).
 *
 * The same case files are compiled unchanged by both stacks; only the import alias differs.
 * A case passes when its two screenshots are identical in every pixel AND its recorded events
 * are identical. Nothing is tolerated: there is no threshold.
 *
 * What a pass does NOT show: behaviour in states no case renders, other browsers than Chromium,
 * and viewport sizes other than the one below. `Control:mismatch` must fail on every run, and a
 * screenshot with no ink fails unless the case says `allowBlank`, so a green run cannot come from
 * a comparator or a page that measured nothing.
 *
 * Usage: node tests/parity/run.mjs [--filter Button] [--target dist] [--aa baseline] [--strict]
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const REPORT = join(HERE, '.report');
const VIEWPORT = { width: 420, height: 800 };
const args = process.argv.slice(2);
const argValue = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : null);
const filter = argValue('--filter');
const target = argValue('--target') ?? 'src';
// `--aa baseline` (or candidate) compares a stack with itself: any failure is a case that is not
// deterministic, and so cannot be used to compare the two stacks.
const selfCheck = argValue('--aa');
// --strict also fails the run on flaky cases.
const strict = args.includes('--strict');

const STACKS = [
  {
    name: 'baseline',
    dir: join(HERE, 'baseline'),
    vite: join(HERE, 'baseline/node_modules/.bin/vite')
  },
  { name: 'candidate', dir: join(HERE, 'candidate'), vite: join(ROOT, 'node_modules/.bin/vite') }
];

function prepare(stack) {
  const source = join(stack.dir, '.src');
  rmSync(source, { recursive: true, force: true });
  mkdirSync(source, { recursive: true });
  cpSync(join(HERE, 'app'), source, { recursive: true });
  cpSync(join(HERE, 'cases'), join(source, 'cases'), { recursive: true });
  if (stack.name === 'baseline' && !existsSync(join(stack.dir, 'node_modules'))) {
    console.log('installing the baseline stack (the published library)...');
    execFileSync(
      'pnpm',
      [
        'install',
        '--frozen-lockfile',
        '--ignore-scripts',
        '--config.strict-peer-dependencies=false'
      ],
      {
        cwd: stack.dir,
        stdio: 'inherit'
      }
    );
  }
  const built = spawnSync(stack.vite, ['build', '--config', join(stack.dir, 'vite.config.js')], {
    cwd: stack.dir,
    env: { ...process.env, VITE_STACK: stack.name, PARITY_TARGET: target },
    encoding: 'utf8'
  });
  if (built.status !== 0) {
    throw new Error(`${stack.name} build failed:\n${built.stdout}\n${built.stderr}`);
  }
  return built.stderr;
}

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml'
};
function serve(directory) {
  return new Promise((ready) => {
    const server = createServer((request, response) => {
      const path = new URL(request.url, 'http://x').pathname;
      const file = join(directory, path === '/' ? 'index.html' : path);
      if (!file.startsWith(directory) || !existsSync(file)) {
        response.writeHead(404).end();
        return;
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
}

async function runAction(page, [verb, selector, option]) {
  const locator = selector ? page.locator(selector).first() : null;
  if (verb === 'click') {
    await locator.click(option ?? {});
  } else if (verb === 'hover') {
    await locator.hover(option ?? {});
  } else if (verb === 'focus') {
    await locator.focus();
  } else if (verb === 'blur') {
    await locator.blur();
  } else if (verb === 'fill') {
    await locator.fill(option);
  } else if (verb === 'type') {
    await locator.pressSequentially(option);
  } else if (verb === 'press') {
    await (locator ? locator.press(option) : page.keyboard.press(option));
  } else if (verb === 'key') {
    await page.keyboard.press(selector);
  } else if (verb === 'wait') {
    await page.waitForTimeout(Number(selector));
  } else if (verb === 'mouse') {
    await page.mouse.click(selector, option);
  } else {
    throw new Error(`unknown action "${verb}"`);
  }
}

async function capture(page, origin, entry) {
  await page.goto(`${origin}/?case=${encodeURIComponent(entry.id)}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 15000 });
  let actionError = null;
  for (const action of entry.actions) {
    try {
      await runAction(page, action);
    } catch (error) {
      actionError = `${action[0]} ${action[1] ?? ''}: ${String(error.message).split('\n')[0]}`;
      break;
    }
  }
  // Let every finite animation and transition end by itself, so the screenshot shows the settled
  // page and not a frame Playwright fast-forwarded. Animations that never end (spinners) and ones
  // longer than the budget are then frozen by `animations: 'disabled'`, identically on both stacks.
  await page.evaluate(async () => {
    const deadline = performance.now() + 2500;
    const running = () =>
      document.getAnimations().filter((animation) => {
        const timing = animation.effect ? animation.effect.getComputedTiming() : null;
        return (
          timing !== null && Number.isFinite(timing.endTime) && animation.playState === 'running'
        );
      });
    while (running().length > 0 && performance.now() < deadline) {
      await Promise.race([
        Promise.allSettled(running().map((animation) => animation.finished)),
        new Promise((done) => setTimeout(done, 200))
      ]);
    }
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  });
  await page.waitForTimeout(60);
  const shot = await page.screenshot({ animations: 'disabled', caret: 'hide' });
  const state = await page.evaluate(() => ({ events: window.__events, errors: window.__errors }));
  return { shot, events: state.events, errors: state.errors, actionError };
}

/** Exact comparison in the browser: no image library, and no tolerance. */
async function compare(page, before, after) {
  return page.evaluate(
    async ([a, b]) => {
      const load = async (base64) => {
        const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
        const bitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const context = canvas.getContext('2d');
        context.drawImage(bitmap, 0, 0);
        return context.getImageData(0, 0, bitmap.width, bitmap.height);
      };
      const [one, two] = [await load(a), await load(b)];
      const ink = (image) => {
        let count = 0;
        for (let i = 0; i < image.data.length; i += 4) {
          if (image.data[i] < 250 || image.data[i + 1] < 250 || image.data[i + 2] < 250) {
            count++;
          }
        }
        return count;
      };
      const sizeMatches = one.width === two.width && one.height === two.height;
      const width = Math.max(one.width, two.width);
      const height = Math.max(one.height, two.height);
      const canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext('2d');
      const out = context.createImageData(width, height);
      let different = 0;
      const box = { left: width, top: height, right: -1, bottom: -1 };
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const o = (y * width + x) * 4;
          const i1 = x < one.width && y < one.height ? (y * one.width + x) * 4 : -1;
          const i2 = x < two.width && y < two.height ? (y * two.width + x) * 4 : -1;
          const same =
            i1 >= 0 &&
            i2 >= 0 &&
            one.data[i1] === two.data[i2] &&
            one.data[i1 + 1] === two.data[i2 + 1] &&
            one.data[i1 + 2] === two.data[i2 + 2] &&
            one.data[i1 + 3] === two.data[i2 + 3];
          if (same) {
            const grey =
              255 -
              Math.round((255 - (one.data[i1] + one.data[i1 + 1] + one.data[i1 + 2]) / 3) * 0.15);
            out.data[o] = out.data[o + 1] = out.data[o + 2] = grey;
          } else {
            different++;
            box.left = Math.min(box.left, x);
            box.top = Math.min(box.top, y);
            box.right = Math.max(box.right, x);
            box.bottom = Math.max(box.bottom, y);
            out.data[o] = 220;
            out.data[o + 1] = 0;
            out.data[o + 2] = 60;
          }
          out.data[o + 3] = 255;
        }
      }
      let diff = null;
      if (different > 0) {
        context.putImageData(out, 0, 0);
        const blob = await canvas.convertToBlob({ type: 'image/png' });
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let binary = '';
        for (const byte of bytes) {
          binary += String.fromCharCode(byte);
        }
        diff = btoa(binary);
      }
      return {
        different,
        total: width * height,
        sizeMatches,
        inkBefore: ink(one),
        inkAfter: ink(two),
        diff,
        box: different > 0 ? box : null
      };
    },
    [before.toString('base64'), after.toString('base64')]
  );
}

const warnings = {};
for (const stack of STACKS) {
  warnings[stack.name] = prepare(stack);
}
rmSync(REPORT, { recursive: true, force: true });
mkdirSync(join(REPORT, 'images'), { recursive: true });

const servers = {};
for (const stack of STACKS) {
  servers[stack.name] = await serve(join(stack.dir, 'dist'));
}
const browser = await chromium.launch(
  process.env.PARITY_CHANNEL ? { channel: process.env.PARITY_CHANNEL } : {}
);
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 1,
  reducedMotion: 'no-preference'
});
const page = await context.newPage();
const comparer = await context.newPage();
await comparer.goto(`${servers.candidate.origin}/`);

const lists = {};
for (const stack of STACKS) {
  await page.goto(`${servers[stack.name].origin}/`, { waitUntil: 'load' });
  await page.waitForFunction(() => Array.isArray(window.__cases), null, { timeout: 15000 });
  lists[stack.name] = await page.evaluate(() => window.__cases);
}
if (JSON.stringify(lists.baseline) !== JSON.stringify(lists.candidate)) {
  throw new Error(
    'The two stacks do not expose the same case list; the comparison would be meaningless.'
  );
}

const results = [];
const WORKERS = Number(process.env.PARITY_WORKERS ?? 4);
const filters = filter ? filter.split(',') : null;
const entries = lists.baseline.filter(
  (entry) =>
    !filters ||
    entry.id.startsWith('Control') ||
    filters.some((prefix) => entry.id.startsWith(prefix))
);
async function runEntry(entry, worker) {
  const before = await capture(worker.page, servers[selfCheck ?? 'baseline'].origin, entry);
  const after = await capture(worker.page, servers[selfCheck ?? 'candidate'].origin, entry);
  const pixels = await compare(worker.comparer, before.shot, after.shot);
  const eventsMatch = JSON.stringify(before.events) === JSON.stringify(after.events);
  const errorsMatch = JSON.stringify(before.errors) === JSON.stringify(after.errors);
  const blank = pixels.inkBefore === 0 || pixels.inkAfter === 0;
  const identical = pixels.different === 0 && pixels.sizeMatches;
  const problems = [];
  // A blank render, a page error or a failed action is never excused by a known difference: those
  // cover only the pixel or event difference the entry documents.
  let fatal = false;
  if (entry.expectDifferent && selfCheck) {
    // The mismatch control differs between stacks by design, so it cannot differ within one.
  } else if (entry.expectDifferent) {
    if (identical) {
      problems.push('control did not detect a difference');
    }
  } else {
    if (!identical) {
      problems.push(`${pixels.different} of ${pixels.total} pixels differ`);
    }
    if (!eventsMatch) {
      problems.push('events differ');
    }
    if (!errorsMatch) {
      problems.push('page errors differ');
      fatal = true;
    }
    if (blank && !entry.allowBlank) {
      problems.push('rendered nothing');
      fatal = true;
    }
    if (before.actionError || after.actionError) {
      fatal = true;
      problems.push(
        `action failed (baseline: ${before.actionError ?? 'ok'}; candidate: ${after.actionError ?? 'ok'})`
      );
    }
  }
  // A known difference is reported, not passed: it keeps its own status and its reason, and it
  // must still differ, so a fix is noticed and the entry removed.
  // In a self-check both sides come from one stack, so a known difference is an ordinary case there.
  let status = problems.length === 0 ? 'pass' : 'fail';
  if (entry.knownDifference && !entry.expectDifferent && !selfCheck && !fatal) {
    status = problems.length > 0 ? 'known-difference' : 'known-difference-resolved';
  }
  const safe = entry.id.replace(/[^A-Za-z0-9_-]/g, '_');
  writeFileSync(join(REPORT, 'images', `${safe}.before.png`), before.shot);
  writeFileSync(join(REPORT, 'images', `${safe}.after.png`), after.shot);
  if (pixels.diff) {
    writeFileSync(join(REPORT, 'images', `${safe}.diff.png`), Buffer.from(pixels.diff, 'base64'));
  }
  results.push({
    id: entry.id,
    control: entry.expectDifferent,
    status,
    knownDifference: entry.knownDifference,
    pass: status === 'pass',
    problems,
    differentPixels: pixels.different,
    differentBox: pixels.box,
    totalPixels: pixels.total,
    inkBefore: pixels.inkBefore,
    inkAfter: pixels.inkAfter,
    actions: entry.actions.length,
    eventsBefore: before.events,
    eventsAfter: after.events,
    errorsBefore: before.errors,
    errorsAfter: after.errors,
    image: safe
  });
  return status;
}

// Each worker has its own browser context, so focus, storage and timers are never shared.
async function newWorker() {
  const own = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference'
  });
  const ownComparer = await own.newPage();
  await ownComparer.goto(`${servers.candidate.origin}/`);
  return { context: own, page: await own.newPage(), comparer: ownComparer };
}
const queue = [...entries];
const workers = [];
for (let index = 0; index < WORKERS; index++) {
  workers.push(await newWorker());
}
await Promise.all(
  workers.map(async (worker) => {
    for (let entry = queue.shift(); entry; entry = queue.shift()) {
      await runEntry(entry, worker);
    }
  })
);

// A case that failed under parallel load is run again on its own, three times. It is reported as
// failing if any of those runs fails; one that passes all three is reported as flaky. A change to a
// component differs every time, alone or not, so a flaky case is a capture taken mid-settle under
// load, not a regression: the run lists it but does not fail on it (unless --strict).
const retry = await newWorker();
for (const result of [...results]) {
  if (result.status !== 'fail' || result.control) {
    continue;
  }
  const entry = entries.find((e) => e.id === result.id);
  results.splice(results.indexOf(result), 1);
  let passedAlone = true;
  for (let attempt = 0; attempt < 3 && passedAlone; attempt++) {
    if (attempt > 0) {
      results.splice(
        results.findIndex((r) => r.id === entry.id),
        1
      );
    }
    passedAlone = (await runEntry(entry, retry)) === 'pass';
  }
  const again = results.find((r) => r.id === entry.id);
  if (passedAlone) {
    again.status = 'flaky';
    again.pass = false;
    again.problems = [
      `failed under parallel load (${result.problems.join('; ')}), passed alone 3 times`
    ];
  }
}
for (const worker of [...workers, retry]) {
  await worker.context.close();
}
for (const result of results) {
  if (result.status === 'fail' || result.status === 'flaky') {
    console.log(`${result.status.toUpperCase()} ${result.id}: ${result.problems.join('; ')}`);
  }
}
results.sort(
  (left, right) =>
    entries.findIndex((e) => e.id === left.id) - entries.findIndex((e) => e.id === right.id)
);

await browser.close();
for (const stack of STACKS) {
  servers[stack.name].server.close();
}

const real = results.filter((result) => !result.control);
const count = (status) => real.filter((result) => result.status === status).length;
const summary = {
  mode: selfCheck ? `self-check of ${selfCheck}` : 'baseline against candidate',
  target,
  viewport: VIEWPORT,
  cases: real.length,
  passed: count('pass'),
  failed: count('fail'),
  flaky: count('flaky'),
  knownDifferences: count('known-difference'),
  knownDifferencesResolved: count('known-difference-resolved'),
  controlsHeld: results.filter((result) => result.control).every((result) => result.pass),
  pixelsCompared: real.reduce((sum, result) => sum + result.totalPixels, 0),
  pixelsDifferent: real.reduce((sum, result) => sum + result.differentPixels, 0),
  eventsCompared: real.reduce((sum, result) => sum + result.eventsBefore.length, 0)
};
writeFileSync(join(REPORT, 'summary.json'), JSON.stringify({ summary, results }, null, 1));
console.log(JSON.stringify(summary));
const failedRun =
  summary.failed > 0 ||
  (strict && summary.flaky > 0) ||
  summary.knownDifferencesResolved > 0 ||
  !summary.controlsHeld ||
  results.length === 0;
if (!results.some((result) => result.control)) {
  console.log('No control case ran: this run proves nothing.');
  process.exit(2);
}
process.exit(failedRun ? 1 : 0);
