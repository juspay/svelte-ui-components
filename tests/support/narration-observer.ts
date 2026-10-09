import type { Page } from '@playwright/test';

export type NarrationDot = {
  index: number;
  label: string;
  cx: number;
  cy: number;
  radius: number;
  initialRadius: number;
  focusCoordinatesAgree: boolean;
  connected: boolean;
  visible: boolean;
  opacity: number;
  strokeWidth: number;
  rect: { x: number; y: number; width: number; height: number };
  insideSvg: boolean;
  intersectsViewport: boolean;
  crosshairX: number | null;
};
export type NarrationFrame = {
  seq: number;
  at: number;
  kind: 'initial' | 'mutation' | 'raf' | 'trusted-play';
  turn: number;
  trusted: boolean;
  readout: string;
  transcript: string;
  dotCount: number;
  highlighted: NarrationDot[];
};
export type NarrationEvidence = {
  rows: NarrationFrame[];
  counters: {
    frames: number;
    mutationCallbacks: number;
    mutationRecords: number;
    trustedPlays: number;
  };
  nativeApis: Record<string, string>;
  timersUnchanged: boolean;
};

/** Observe the real DOM before the first trusted play; never wrap the app's APIs. */
export async function installNarrationObserver(page: Page): Promise<void> {
  await page.evaluate(() => {
    const chart = document.querySelector('[data-pw="line-highlight-hook-chart"]');
    const readout = document.querySelector('[data-pw="narration-highlighted"]');
    const transcript = document.querySelector('[data-pw="narration-transcript"]');
    if (!chart || !readout || !transcript) {
      throw new Error('Missing actual narration/chart actors');
    }
    const dots = [...chart.querySelectorAll<SVGCircleElement>('circle.dot')];
    const focuses = [...chart.querySelectorAll<SVGCircleElement>('circle.focus-target')];
    if (dots.length !== 12 || focuses.length !== 12) {
      throw new Error('Expected the real twelve-month series');
    }
    const initialRadii = dots.map((dot) => Number(dot.getAttribute('r')));
    const timers = { setTimeout, clearTimeout, setInterval, clearInterval };
    const rows: NarrationFrame[] = [];
    const counters = { frames: 0, mutationCallbacks: 0, mutationRecords: 0, trustedPlays: 0 };
    let turn = 0;
    let sequence = 0;
    let running = true;
    let frameHandle = 0;
    const rect = (r: DOMRect) => ({ x: r.x, y: r.y, width: r.width, height: r.height });
    const snapshot = (kind: NarrationFrame['kind'], trusted = false): void => {
      const svg = chart.querySelector('svg');
      const svgRect = svg?.getBoundingClientRect();
      const currentDots = [...chart.querySelectorAll<SVGCircleElement>('circle.dot')];
      const highlighted = currentDots
        .filter((dot) => dot.classList.contains('highlighted'))
        .map((dot) => {
          const index = dots.indexOf(dot);
          const focus = focuses[index];
          const bounds = dot.getBoundingClientRect();
          const computed = getComputedStyle(dot);
          let visible = true;
          let opacity = 1;
          for (let node: Element | null = dot; node; node = node.parentElement) {
            const style = getComputedStyle(node);
            if (
              style.display === 'none' ||
              style.visibility === 'hidden' ||
              style.visibility === 'collapse'
            ) {
              visible = false;
            }
            opacity *= Number(style.opacity);
          }
          const cx = Number(dot.getAttribute('cx'));
          const cy = Number(dot.getAttribute('cy'));
          const crosshair = chart.querySelector('line.hover-line');
          return {
            index,
            label: focus?.getAttribute('aria-label') ?? '',
            cx,
            cy,
            radius: Number(dot.getAttribute('r')),
            initialRadius: initialRadii[index] ?? NaN,
            focusCoordinatesAgree: Boolean(
              focus &&
              Number(focus.getAttribute('cx')) === cx &&
              Number(focus.getAttribute('cy')) === cy
            ),
            connected: dot.isConnected,
            visible,
            opacity,
            strokeWidth: Number.parseFloat(computed.strokeWidth),
            rect: rect(bounds),
            insideSvg: Boolean(
              svgRect &&
              bounds.x < svgRect.right &&
              bounds.right > svgRect.x &&
              bounds.y < svgRect.bottom &&
              bounds.bottom > svgRect.y
            ),
            intersectsViewport:
              bounds.x < innerWidth &&
              bounds.right > 0 &&
              bounds.y < innerHeight &&
              bounds.bottom > 0,
            crosshairX: crosshair ? Number(crosshair.getAttribute('x1')) : null
          };
        });
      rows.push({
        seq: ++sequence,
        at: performance.now(),
        kind,
        turn,
        trusted,
        readout: readout.textContent?.trim() ?? '',
        transcript: transcript.textContent?.trim() ?? '',
        dotCount: currentDots.length,
        highlighted
      });
    };
    const click = (event: Event): void => {
      if (
        event.isTrusted &&
        event.target instanceof Element &&
        event.target.closest('[data-pw="narration-play"]')
      ) {
        turn += 1;
        counters.trustedPlays += 1;
        snapshot('trusted-play', true);
      }
    };
    // A capture listener only observes the trusted action before the original handler.
    document.addEventListener('click', click, { capture: true, passive: true });
    const observer = new MutationObserver((records) => {
      counters.mutationCallbacks += 1;
      counters.mutationRecords += records.length;
      snapshot('mutation');
    });
    observer.observe(chart, { subtree: true, childList: true, attributes: true });
    observer.observe(readout, { subtree: true, childList: true, characterData: true });
    observer.observe(transcript, { subtree: true, childList: true, characterData: true });
    const frame = (): void => {
      if (!running) {
        return;
      }
      counters.frames += 1;
      if (turn > 0) {
        snapshot('raf');
      }
      frameHandle = requestAnimationFrame(frame);
    };
    snapshot('initial');
    frameHandle = requestAnimationFrame(frame);
    const evidence = (): NarrationEvidence => ({
      rows,
      counters,
      nativeApis: Object.fromEntries(
        Object.entries({ MutationObserver, requestAnimationFrame, cancelAnimationFrame }).map(
          ([name, fn]) => [name, Function.prototype.toString.call(fn)]
        )
      ),
      timersUnchanged:
        setTimeout === timers.setTimeout &&
        clearTimeout === timers.clearTimeout &&
        setInterval === timers.setInterval &&
        clearInterval === timers.clearInterval
    });
    Reflect.set(window, '__nativeNarrationEvidence', {
      read: evidence,
      stop: () => {
        running = false;
        cancelAnimationFrame(frameHandle);
        observer.disconnect();
        document.removeEventListener('click', click, true);
        return evidence();
      }
    });
  });
}
export async function readNarrationEvidence(page: Page): Promise<NarrationEvidence> {
  return page.evaluate(() => Reflect.get(window, '__nativeNarrationEvidence').read());
}
export async function stopNarrationObserver(page: Page): Promise<NarrationEvidence> {
  return page.evaluate(() => Reflect.get(window, '__nativeNarrationEvidence').stop());
}

/** Durable, generation-bound paired SVG witnesses; a readout alone cannot satisfy it. */
export function narrationProblems(
  evidence: NarrationEvidence,
  turn: number,
  phases: readonly string[] = ['Feb', 'Jun', 'Nov']
): string[] {
  const errors: string[] = [];
  const clicks = evidence.rows.filter(
    (row) => row.kind === 'trusted-play' && row.trusted && row.turn === turn
  );
  if (clicks.length !== 1) {
    return ['missing unique trusted play generation'];
  }
  const click = clicks[0];
  const expected = [
    { month: 'Feb', index: 1, label: 'Feb: 45' },
    { month: 'Jun', index: 5, label: 'Jun: 61' },
    { month: 'Nov', index: 10, label: 'Nov: 75' }
  ];
  const reset =
    turn === 1 &&
    click.readout === 'nothing highlighted' &&
    click.transcript === '' &&
    click.highlighted.length === 0
      ? click
      : evidence.rows.find(
          (row) =>
            row.turn === turn &&
            row.seq > click.seq &&
            row.at >= click.at &&
            row.readout === 'nothing highlighted' &&
            row.transcript === '' &&
            row.highlighted.length === 0
        );
  if (!reset) {
    errors.push('missing fresh reset after this trusted play');
  }
  let prior = reset?.seq ?? click.seq;
  for (const phase of phases) {
    const target = expected.find((item) => item.month === phase);
    if (!target) {
      throw new Error('Unknown expected narration phase');
    }
    const witness = evidence.rows.find((row) => {
      if (
        row.kind !== 'raf' ||
        row.turn !== turn ||
        row.seq <= prior ||
        row.at < click.at ||
        row.readout !== `last matched ${phase}` ||
        row.dotCount !== 12 ||
        row.highlighted.length !== 1
      ) {
        return false;
      }
      const dot = row.highlighted[0];
      const words = expected.map((item) => new RegExp(`\\b${item.month}\\b`).test(row.transcript));
      const position = expected.indexOf(target);
      const transcriptAgrees = words.every((present, index) => present === index <= position);
      return (
        transcriptAgrees &&
        dot.index === target.index &&
        dot.label === target.label &&
        dot.focusCoordinatesAgree &&
        dot.connected &&
        dot.visible &&
        dot.opacity > 0 &&
        Number.isFinite(dot.cx) &&
        Number.isFinite(dot.cy) &&
        dot.rect.width > 0 &&
        dot.rect.height > 0 &&
        dot.insideSvg &&
        dot.initialRadius > 0 &&
        dot.radius === dot.initialRadius * 1.5 &&
        dot.strokeWidth > 2 &&
        dot.crosshairX === dot.cx
      );
    });
    if (!witness) {
      errors.push(`missing fresh paired RAF SVG witness for ${phase}`);
    } else {
      prior = witness.seq;
    }
  }
  if (!evidence.timersUnchanged) {
    errors.push('native timer references changed');
  }
  return errors;
}
