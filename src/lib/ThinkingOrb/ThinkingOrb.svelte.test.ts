import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ThinkingOrb from './ThinkingOrb.svelte';
import type { OrbState } from './properties';

type DrawLog = {
  readonly inks: string[];
  /** One entry per clearRect (i.e. per draw), holding each dot's `x,y,radius`. */
  readonly frames: string[][];
};

/**
 * jsdom exposes no 2D canvas context, so `getContext('2d')` returns null and
 * the component bails before painting. This stands in for one, recording
 * just enough of what `paintFrame` calls to prove a frame was drawn, what it
 * looked like, and what colour it used -- without a real canvas anywhere.
 */
const recordingContext = (): { context: CanvasRenderingContext2D } & DrawLog => {
  const inks: string[] = [];
  const frames: string[][] = [];
  let fillStyle = '#000000';
  const noop = (): null => null;
  const context = {
    // `paintFrame` clears via `ctx.canvas.width/height`; `stubGetContext`
    // below fills this in with whichever real canvas element requested the
    // context, since jsdom's canvas has no real backing store of its own.
    canvas: { width: 0, height: 0 },
    get fillStyle(): string {
      return fillStyle;
    },
    set fillStyle(value: string) {
      fillStyle = value;
    },
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    setTransform: noop,
    clearRect: (): null => {
      frames.push([]);
      return null;
    },
    beginPath: noop,
    arc: (x: number, y: number, r: number): null => {
      frames[frames.length - 1]?.push(`${x},${y},${r}`);
      return null;
    },
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    fill: (): void => {
      inks.push(fillStyle);
    }
  };
  return { context: context as unknown as CanvasRenderingContext2D, inks, frames };
};

const stubGetContext = (context: CanvasRenderingContext2D): void => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
    this: HTMLCanvasElement
  ) {
    Object.assign(context, { canvas: this });
    return context;
  } as unknown as HTMLCanvasElement['getContext']);
};

const stubComputedColor = (readColor: () => string): void => {
  vi.spyOn(globalThis, 'getComputedStyle').mockImplementation(
    () => ({ color: readColor(), getPropertyValue: () => '' }) as unknown as CSSStyleDeclaration
  );
};

const transitionEnd = (propertyName: string): Event => {
  const event = new Event('transitionend', { bubbles: true });
  Object.defineProperty(event, 'propertyName', { value: propertyName });
  return event;
};

describe('ThinkingOrb labels and sizing', () => {
  it("labels the default state 'Working…'", () => {
    const { getByRole } = render(ThinkingOrb);
    expect(getByRole('img', { name: 'Working…' }).tagName).toBe('CANVAS');
  });

  it('capitalises every state name for its default label, with no exceptions', () => {
    const states: ReadonlyArray<[OrbState, string]> = [
      ['searching', 'Searching…'],
      ['solving', 'Solving…'],
      ['listening', 'Listening…'],
      ['connecting', 'Connecting…'],
      ['weaving', 'Weaving…'],
      ['composing', 'Composing…'],
      ['breathing', 'Breathing…'],
      ['shaping', 'Shaping…']
    ];
    for (const [state, label] of states) {
      const { getByRole, unmount } = render(ThinkingOrb, { props: { state } });
      expect(getByRole('img', { name: label })).toBeTruthy();
      unmount();
    }
  });

  it('lets ariaLabel override the default per-state label', () => {
    const { getByRole } = render(ThinkingOrb, {
      props: { state: 'working', ariaLabel: 'Loading response' }
    });
    expect(getByRole('img', { name: 'Loading response' })).toBeTruthy();
  });

  it('sizes the canvas element to the size prop', () => {
    const { getByRole } = render(ThinkingOrb, { props: { size: 20 } });
    const canvas = getByRole('img') as HTMLCanvasElement;
    expect(canvas.style.width).toBe('20px');
    expect(canvas.style.height).toBe('20px');
  });

  it('applies classes and data-pw from testId', () => {
    const { getByRole } = render(ThinkingOrb, {
      props: { classes: 'custom-class', testId: 'my-orb' }
    });
    const canvas = getByRole('img');
    expect(canvas.className).toContain('custom-class');
    expect(canvas.getAttribute('data-pw')).toBe('my-orb');
  });

  it('falls back to the defaults for a state or size nothing recognises, and still paints', async () => {
    const { context, frames } = recordingContext();
    stubGetContext(context);
    // What <sui-thinking-orb state="bogus" size="48"> hands the component:
    // the custom element's String/Number props carry no type check.
    const { getByRole } = render(ThinkingOrb, {
      props: { state: 'bogus', size: 48 } as unknown as Record<string, never>
    });
    await tick();
    const canvas = getByRole('img', { name: 'Working…' }) as HTMLCanvasElement;
    expect(canvas.style.width).toBe('64px');
    expect(frames.some((frame) => frame.length > 0)).toBe(true);
    vi.restoreAllMocks();
  });
});

describe('ThinkingOrb still-orb repaint', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // `vi.stubGlobal` (used for matchMedia below) outlives `restoreAllMocks`,
    // which only reverts spies -- left unstubbed it would leak a fake
    // reduced-motion match into every test that runs after it.
    vi.unstubAllGlobals();
  });

  const renderPaused = async (
    readColor: () => string
  ): Promise<{ context: CanvasRenderingContext2D } & DrawLog> => {
    const recorder = recordingContext();
    stubGetContext(recorder.context);
    stubComputedColor(readColor);
    render(ThinkingOrb, { props: { paused: true } });
    await tick();
    return recorder;
  };

  it('repaints a paused orb once the resolved colour actually changes after a transition', async () => {
    let inherited = 'rgb(20, 20, 20)';
    const { inks } = await renderPaused(() => inherited);
    const paintedBefore = inks.length;
    expect(paintedBefore).toBeGreaterThan(0);
    const inkBefore = inks[paintedBefore - 1];

    inherited = 'rgb(230, 230, 230)';
    document.body.dispatchEvent(transitionEnd('color'));

    expect(inks.length).toBeGreaterThan(paintedBefore);
    expect(inks[inks.length - 1]).not.toBe(inkBefore);
  });

  it('ignores a transition on a property that could not have changed the ink', async () => {
    let inherited = 'rgb(20, 20, 20)';
    const { inks } = await renderPaused(() => inherited);
    const painted = inks.length;

    document.body.dispatchEvent(transitionEnd('color'));
    inherited = 'rgb(230, 230, 230)';
    document.body.dispatchEvent(transitionEnd('background-color'));

    expect(inks.length).toBe(painted);
  });

  it('keeps a paused orb on the pose it froze at when the theme flips', async () => {
    const clock = vi.spyOn(performance, 'now').mockReturnValue(1_000);
    const { frames } = await renderPaused(() => 'rgb(20, 20, 20)');
    const drawsBefore = frames.length;
    const frozenPose = frames[drawsBefore - 1];
    expect(frozenPose.length).toBeGreaterThan(0);

    clock.mockReturnValue(9_000);
    document.documentElement.setAttribute('data-theme', 'dark');
    try {
      await new Promise((resolve) => setTimeout(resolve, 0));
      await tick();
      expect(frames.length).toBeGreaterThan(drawsBefore);
      expect(frames[frames.length - 1]).toEqual(frozenPose);
    } finally {
      document.documentElement.removeAttribute('data-theme');
    }
  });

  it('keeps a paused orb on the pose it froze at when speed changes while it stays still', async () => {
    const clock = vi.spyOn(performance, 'now').mockReturnValue(1_000);
    const recorder = recordingContext();
    stubGetContext(recorder.context);
    stubComputedColor(() => 'rgb(20, 20, 20)');
    const { rerender } = render(ThinkingOrb, { props: { paused: true, speed: 1 } });
    await tick();
    const drawsBefore = recorder.frames.length;
    const frozenPose = recorder.frames[drawsBefore - 1];
    expect(frozenPose.length).toBeGreaterThan(0);

    // Advancing the clock proves a later redraw would look different if the
    // frozen instant were re-derived instead of replayed -- the pose below
    // must come from the captured instant, not from "now" at any speed.
    clock.mockReturnValue(9_000);
    await rerender({ paused: true, speed: 2 });
    expect(recorder.frames[recorder.frames.length - 1]).toEqual(frozenPose);
  });

  it('keeps a reduced-motion orb on its fixed instant when speed changes', async () => {
    // jsdom has no matchMedia of its own to spy on, so it's stubbed onto
    // `window` outright rather than mocked in place (see TypewriterText's
    // test for the same shape).
    vi.stubGlobal(
      'matchMedia',
      (query: string) =>
        ({
          matches: true,
          media: query,
          addEventListener: (): void => {},
          removeEventListener: (): void => {}
        }) as unknown as MediaQueryList
    );
    const recorder = recordingContext();
    stubGetContext(recorder.context);
    stubComputedColor(() => 'rgb(20, 20, 20)');
    const { rerender } = render(ThinkingOrb, { props: { speed: 1 } });
    await tick();
    const frozenPose = recorder.frames[recorder.frames.length - 1];
    expect(frozenPose.length).toBeGreaterThan(0);

    await rerender({ speed: 3 });
    expect(recorder.frames[recorder.frames.length - 1]).toEqual(frozenPose);
  });
});

describe('ThinkingOrb gravity wiring', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const moveAndLeave = (canvas: HTMLCanvasElement): void => {
    canvas.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 32, clientY: 32, bubbles: true })
    );
  };

  it('repaints a still orb on pointermove when gravity is on, and pointerleave restores the pose', async () => {
    const { context, frames } = recordingContext();
    stubGetContext(context);
    const { getByRole } = render(ThinkingOrb, { props: { paused: true, gravity: true } });
    await tick();
    const canvas = getByRole('img') as HTMLCanvasElement;
    const original = frames[frames.length - 1];

    moveAndLeave(canvas);
    expect(frames[frames.length - 1]).not.toEqual(original);

    canvas.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
    expect(frames[frames.length - 1]).toEqual(original);
  });

  it('does not repaint a still orb on pointermove when gravity is off', async () => {
    const { context, frames } = recordingContext();
    stubGetContext(context);
    const { getByRole } = render(ThinkingOrb, { props: { paused: true } });
    await tick();
    const canvas = getByRole('img') as HTMLCanvasElement;
    const paintsBefore = frames.length;

    moveAndLeave(canvas);
    expect(frames.length).toBe(paintsBefore);
  });

  it('ignores the pointer under reduced motion: no pull, and no repaint', async () => {
    vi.stubGlobal(
      'matchMedia',
      (query: string) =>
        ({
          matches: true,
          media: query,
          addEventListener: (): void => {},
          removeEventListener: (): void => {}
        }) as unknown as MediaQueryList
    );
    const { context, frames } = recordingContext();
    stubGetContext(context);
    const { getByRole } = render(ThinkingOrb, { props: { gravity: true } });
    await tick();
    const canvas = getByRole('img') as HTMLCanvasElement;
    const paintsBefore = frames.length;
    const original = frames[frames.length - 1];

    moveAndLeave(canvas);
    expect(frames.length).toBe(paintsBefore);
    expect(frames[frames.length - 1]).toEqual(original);
  });
});

describe('ThinkingOrb onfirstframe', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fires exactly once, on the first painted frame, and never again on later repaints', async () => {
    const { context } = recordingContext();
    stubGetContext(context);
    const onfirstframe = vi.fn();
    const { rerender } = render(ThinkingOrb, { props: { paused: true, onfirstframe } });
    await tick();
    expect(onfirstframe).toHaveBeenCalledTimes(1);

    await rerender({ paused: true, onfirstframe, state: 'searching' });
    document.documentElement.setAttribute('data-theme', 'dark');
    try {
      await tick();
      expect(onfirstframe).toHaveBeenCalledTimes(1);
    } finally {
      document.documentElement.removeAttribute('data-theme');
    }
  });
});
