import { expect } from '@playwright/test';
import type { JSHandle, Page } from '@playwright/test';

/**
 * Observers for the two overlay motions whose contracts changed under the tests
 * that watched them: Toast (CSS-native transitions, `@starting-style`) and Sheet
 * (`transition:tokenizedFly`, a Svelte JS transition on the Web Animations API).
 *
 * Both are read from the engine's own animation objects rather than from a
 * handful of requestAnimationFrame readings. A frame reading depends on when the
 * first frame lands relative to a 50ms or 300ms transition, so it reports a
 * different "start" in every engine and under every load -- the earlier
 * walkthrough assertions failed for exactly that reason as well as for expecting
 * the retired 400px entry. The animation's first/last keyframe and duration are
 * the documented contract itself (`--distance-overlay`, `--toast-open-duration`,
 * `--sheet-panel-transition-distance`, ...), identical in Chromium, Firefox and
 * WebKit, and cannot be missed by a late observer. Frame readings are kept only
 * for what a single instant can prove (that nothing ever travelled beyond a
 * bound, where the panel finally rested). They are never used to say how long
 * something moved or how many frames were seen: that is wall-clock timing, and on
 * a loaded machine the engine simply drops frames, so such a threshold fails for
 * load rather than for behaviour. "It really slid, and did not flash" is carried
 * by the animation's keyframes, its duration and its having run to its end.
 *
 * Every observer is installed BEFORE the click that mounts the overlay and read
 * after it, so the starting point is the overlay's real first frame.
 */

/** A translate() offset in px. */
export type Offset = { readonly x: number; readonly y: number };

const ZERO: Offset = { x: 0, y: 0 };

/**
 * Parses the `translate(...)` spelling each engine uses for a keyframe or
 * computed value: `translate(0px, -60px)` (Chromium, WebKit) and `translate(60px)`
 * (Firefox) both appear for the same keyframe. `none`/empty means no offset.
 * Anything else throws, so an engine that serialises differently fails loudly
 * instead of silently reading as "no travel".
 */
export const parseTranslate = (value: string | null): Offset => {
  if (value === null) {
    return ZERO;
  }
  const text = value.trim();
  if (text === '' || text === 'none') {
    return ZERO;
  }
  const translate = /^translate\(\s*(-?[\d.]+)(?:px)?\s*(?:,\s*(-?[\d.]+)(?:px)?\s*)?\)$/.exec(
    text
  );
  if (translate !== null) {
    return { x: Number(translate[1]), y: translate[2] ? Number(translate[2]) : 0 };
  }
  throw new Error(`parseTranslate: cannot read an offset from "${value}"`);
};

/** Euclidean length of an offset. */
export const distance = (offset: Offset): number => Math.hypot(offset.x, offset.y);

/**
 * CSSTransition durations are floating point (a 700ms transition reads back as
 * 700.0000000000001), so exact equality would fail on representation, not on
 * behaviour. Three decimals is orders of magnitude tighter than any real
 * difference between two configured durations.
 */
export const expectMs = (actual: number, expected: number): void => {
  expect(actual).toBeCloseTo(expected, 3);
};

/* ------------------------------------------------------------------ Toast */

export type ToastPhase = 'enter' | 'exit';
export type ToastProperty = 'opacity' | 'transform';

/** One CSS transition the engine started on the toast, read from its CSSTransition. */
export type ToastTransitionRun = {
  readonly phase: ToastPhase;
  readonly property: ToastProperty;
  readonly durationMs: number;
  /** Value of the first keyframe: where the property starts. */
  readonly from: string;
  /** Value of the last keyframe: where it settles. */
  readonly to: string;
};

/** A `transitionend` the toast fired, with the transition's own elapsed time. */
export type ToastTransitionEnd = {
  readonly phase: ToastPhase;
  readonly property: ToastProperty;
  readonly elapsedMs: number;
};

export type ToastRecording = {
  readonly runs: readonly ToastTransitionRun[];
  readonly ends: readonly ToastTransitionEnd[];
  /**
   * Largest translate length (px) seen on any animation frame while the toast was
   * displayed, per phase. A frame reading can only prove a ceiling, never a start.
   */
  readonly maxFrameOffsetPx: Readonly<Record<ToastPhase, number>>;
  /** ms from recording start to the toast element leaving its root, or null. */
  readonly removedAfterMs: number | null;
};

type RecorderState = {
  readonly runs: ToastTransitionRun[];
  readonly ends: ToastTransitionEnd[];
  readonly maxFrameOffsetPx: Record<ToastPhase, number>;
  removedAfterMs: number | null;
  active: boolean;
};

/** A handle onto the in-page recorder; create one per toast under observation. */
export type ToastRecorder = JSHandle<RecorderState>;

type ToastHostSpec = {
  readonly tag: string;
  readonly attributes: Readonly<Record<string, string>>;
};

type ToastRecordingOptions = {
  /**
   * Observe a `<sui-toast>` instead of the light DOM: the element is created with
   * these attributes, appended, and its open shadow root is observed. Creating it
   * inside the same page call that attaches the listeners means the entrance
   * cannot start before they exist.
   */
  readonly host?: ToastHostSpec;
};

export const startToastRecording = (
  page: Page,
  options: ToastRecordingOptions = {}
): Promise<ToastRecorder> =>
  page.evaluateHandle((host) => {
    const startedAt = performance.now();
    const state: RecorderState = {
      runs: [],
      ends: [],
      maxFrameOffsetPx: { enter: 0, exit: 0 },
      removedAfterMs: null,
      active: true
    };

    let observed: Document | ShadowRoot = document;
    if (host !== null) {
      const element = document.createElement(host.tag);
      for (const [name, value] of Object.entries(host.attributes)) {
        element.setAttribute(name, value);
      }
      document.body.append(element);
      if (element.shadowRoot === null) {
        throw new Error(`startToastRecording: <${host.tag}> has no open shadow root`);
      }
      observed = element.shadowRoot;
    }

    const phaseOf = (element: Element): ToastPhase =>
      element.classList.contains('is-visible') ? 'enter' : 'exit';
    const asProperty = (name: string): ToastProperty | null =>
      name === 'opacity' || name === 'transform' ? name : null;

    // Transitions are captured from the animation objects themselves, at the moment
    // the DOM change that starts them is observed -- not from the `transitionrun`
    // event. That event is dispatched on a later frame, and a 50ms transition on a
    // janked main thread can already be over by then, leaving getAnimations() empty
    // and the run unrecorded. `getAnimations()` forces the style update that
    // creates the transitions, so calling it in the mutation microtask (before any
    // frame) sees them every time. Each Animation is recorded once.
    const recorded = new WeakSet<Animation>();
    const scan = (): void => {
      const toast = observed.querySelector('.toast');
      if (toast === null) {
        return;
      }
      for (const animation of toast.getAnimations()) {
        if (!(animation instanceof CSSTransition) || recorded.has(animation)) {
          continue;
        }
        const property = asProperty(animation.transitionProperty);
        const effect = animation.effect;
        if (property === null || !(effect instanceof KeyframeEffect)) {
          continue;
        }
        recorded.add(animation);
        const frames = effect.getKeyframes();
        const read = (index: number): string => {
          const raw = frames.length > index ? frames[index][property] : '';
          return typeof raw === 'string' ? raw : '';
        };
        state.runs.push({
          phase: phaseOf(toast),
          property,
          durationMs: Number(effect.getComputedTiming().duration),
          from: read(0),
          to: read(frames.length - 1)
        });
      }
    };
    new MutationObserver(scan).observe(observed, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
    // Belt and braces for engines that start the transition a task later.
    observed.addEventListener('transitionrun', scan, true);

    observed.addEventListener(
      'transitionend',
      (event) => {
        if (!(event instanceof TransitionEvent) || !(event.target instanceof Element)) {
          return;
        }
        const property = asProperty(event.propertyName);
        if (property === null || !event.target.classList.contains('toast')) {
          return;
        }
        state.ends.push({
          phase: phaseOf(event.target),
          property,
          elapsedMs: event.elapsedTime * 1000
        });
      },
      true
    );

    const offsetOf = (element: Element): number => {
      const match = /matrix\(([^)]+)\)/.exec(getComputedStyle(element).transform);
      if (match === null) {
        return 0;
      }
      const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
      return parts.length === 6 ? Math.hypot(parts[4], parts[5]) : 0;
    };

    let seen = false;
    const frame = (): void => {
      scan();
      const toast = observed.querySelector('.toast');
      if (toast !== null) {
        seen = true;
        // display:none is the closed state: its computed transform is the hidden
        // offset, not a frame anyone could see.
        if (getComputedStyle(toast).display !== 'none') {
          const phase = phaseOf(toast);
          state.maxFrameOffsetPx[phase] = Math.max(state.maxFrameOffsetPx[phase], offsetOf(toast));
        }
      } else if (seen && state.removedAfterMs === null) {
        state.removedAfterMs = performance.now() - startedAt;
      }
      if (state.active) {
        requestAnimationFrame(frame);
      }
    };
    requestAnimationFrame(frame);

    return state;
  }, options.host ?? null);

const takeToastRecording = (recorder: ToastRecorder, stop: boolean): Promise<ToastRecording> =>
  recorder.evaluate((state, stopSampling) => {
    if (stopSampling) {
      state.active = false;
    }
    return {
      runs: state.runs,
      ends: state.ends,
      maxFrameOffsetPx: state.maxFrameOffsetPx,
      removedAfterMs: state.removedAfterMs
    };
  }, stop);

/** The recording so far, leaving it running. */
export const peekToastRecording = (recorder: ToastRecorder): Promise<ToastRecording> =>
  takeToastRecording(recorder, false);

/** The recording, and stops its frame sampling. */
export const readToastRecording = (recorder: ToastRecorder): Promise<ToastRecording> =>
  takeToastRecording(recorder, true);

/** The recorded transitions of one phase and property. */
export const toastRuns = (
  recording: ToastRecording,
  phase: ToastPhase,
  property: ToastProperty
): readonly ToastTransitionRun[] =>
  recording.runs.filter((run) => run.phase === phase && run.property === property);

/** The recorded `transitionend`s of one phase and property. */
export const toastEnds = (
  recording: ToastRecording,
  phase: ToastPhase,
  property: ToastProperty
): readonly ToastTransitionEnd[] =>
  recording.ends.filter((end) => end.phase === phase && end.property === property);

/** The one transition of a phase and property; fails the test if there is not exactly one. */
export const onlyRun = (
  recording: ToastRecording,
  phase: ToastPhase,
  property: ToastProperty
): ToastTransitionRun => {
  const runs = toastRuns(recording, phase, property);
  expect(runs, `exactly one ${phase} ${property} transition`).toHaveLength(1);
  return runs[0];
};

/** The first `transitionend` of a phase and property; fails the test if there is none. */
export const firstEnd = (
  recording: ToastRecording,
  phase: ToastPhase,
  property: ToastProperty
): ToastTransitionEnd => {
  const ends = toastEnds(recording, phase, property);
  expect(ends.length, `a ${phase} ${property} transitionend`).toBeGreaterThan(0);
  return ends[0];
};

/**
 * Whether this engine keeps an element displayed through a `display: flex -> none`
 * change when `display` is listed with `allow-discrete`. Measured on a throwaway
 * element, so it says nothing about Toast itself.
 *
 * Toast's exit rides on that discrete transition. An engine without it (Firefox
 * 150, as shipped in Playwright 1.60) applies `display: none` at once, so there is
 * no exit to observe; the contract there is "no exit animation, but the hide is
 * still reported and the toast removed". Callers choose between the two by this
 * probe -- never by engine name -- so the assertion follows the capability.
 */
export const canHoldThroughDisplayExit = (page: Page): Promise<boolean> =>
  page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent =
      '.probe-exit{display:flex;opacity:1;transition:opacity 5s, display 5s allow-discrete}' +
      '.probe-exit.closed{display:none;opacity:0}';
    const probe = document.createElement('div');
    probe.className = 'probe-exit';
    document.head.append(style);
    document.body.append(probe);
    void getComputedStyle(probe).display;
    probe.classList.add('closed');
    const held = getComputedStyle(probe).display === 'flex';
    probe.remove();
    style.remove();
    return held;
  });

/**
 * The exit transform: asserted when the engine can run an exit, and asserted to be
 * ABSENT when it cannot.
 */
export const expectExitTransform = (
  recording: ToastRecording,
  canExit: boolean,
  expected: { readonly to: Offset; readonly durationMs: number }
): void => {
  if (!canExit) {
    expect(
      toastRuns(recording, 'exit', 'transform'),
      'no exit can run where display:none applies at once'
    ).toHaveLength(0);
    return;
  }
  const run = onlyRun(recording, 'exit', 'transform');
  expect(distance(parseTranslate(run.from))).toBe(0);
  expect(parseTranslate(run.to)).toEqual(expected.to);
  expectMs(run.durationMs, expected.durationMs);
};

/** The exit fade, with the same capability rule; it must have run to completion. */
export const expectExitOpacity = (
  recording: ToastRecording,
  canExit: boolean,
  durationMs: number
): void => {
  if (!canExit) {
    expect(
      toastRuns(recording, 'exit', 'opacity'),
      'no exit can run where display:none applies at once'
    ).toHaveLength(0);
    return;
  }
  const run = onlyRun(recording, 'exit', 'opacity');
  expect(Number(run.to)).toBe(0);
  expectMs(run.durationMs, durationMs);
  // It ran to completion rather than being cancelled -- what raises ontoasthide.
  expectMs(firstEnd(recording, 'exit', 'opacity').elapsedMs, durationMs);
};

/* ------------------------------------------------------------------ Sheet */

/** One frame of the panel's rendered state. */
export type PanelFrame = {
  readonly tMs: number;
  readonly offset: number;
  readonly opacity: number;
};

export type SheetIntro = {
  readonly durationMs: number;
  readonly firstTransform: string;
  readonly lastTransform: string;
  readonly keyframeCount: number;
};

export type SheetEntrance = {
  /**
   * The panel's transform at its first appearance -- the animation's first
   * keyframe, read when the node is inserted, before any frame has advanced it.
   * Null only if the engine exposed no animation at all.
   */
  readonly startTransform: string | null;
  /** The intro animation, read from the first frame the panel exists. Null only if the engine exposed none. */
  readonly run: SheetIntro | null;
  /**
   * Whether the engine ran that intro animation to its end (`playState` is
   * `finished`), as opposed to cancelling it or never starting it. Read from the
   * Animation at introend before Svelte releases its effect, so it does not depend on
   * how many frames were sampled. Null when no intro animation was seen.
   */
  readonly introFinished: boolean | null;
  /** Native animation time at first observation and after settlement; not rAF wall time. */
  readonly introTime: { readonly startMs: number; readonly endMs: number } | null;
  /** Every animation frame from first sight until the window closed. */
  readonly frames: readonly PanelFrame[];
};

type SheetObserveOptions = {
  /** CSS selector of the panel. */
  readonly selector?: string;
  /**
   * The least time to keep sampling after first sight. Sampling goes on past it
   * (up to a fixed grace) until the intro animation has settled, so a stalled
   * main thread cannot end the observation before the animation does.
   */
  readonly windowMs?: number;
};

/**
 * Starts watching for a sheet panel to mount and resolves with its entrance once
 * the sampling window closes. Call it, hold the promise un-awaited, THEN click the
 * trigger: the observer has to exist before the node does.
 */
export const observeSheetEntrance = (
  page: Page,
  options: SheetObserveOptions = {}
): Promise<SheetEntrance> =>
  page.evaluate(
    ({ selector, windowMs }) =>
      new Promise<SheetEntrance>((resolve) => {
        const giveUpAt = performance.now() + 4_000;
        const frames: PanelFrame[] = [];
        let startTransform: string | null = null;
        let run: SheetIntro | null = null;
        let introAnimation: Animation | null = null;
        let introStartMs: number | null = null;
        let introEndMs: number | null = null;
        let introFinished: boolean | null = null;
        let firstSeenAt: number | null = null;
        let finished = false;
        // Longest the observer waits past its window for the animation to settle.
        const SETTLE_GRACE_MS = 3_000;

        const firstKeyframeTransform = (element: Element): string | null => {
          for (const animation of element.getAnimations()) {
            const effect = animation.effect;
            if (effect instanceof KeyframeEffect) {
              const keyframes = effect.getKeyframes();
              if (keyframes.length > 0 && typeof keyframes[0].transform === 'string') {
                return keyframes[0].transform;
              }
            }
          }
          return null;
        };

        const readIntro = (
          element: Element
        ): { readonly animation: Animation; readonly intro: SheetIntro } | null => {
          // The transition's own animation is the one with the most keyframes (the
          // eased frames); a bare fade has two.
          let best: { animation: Animation; effect: KeyframeEffect } | null = null;
          for (const animation of element.getAnimations()) {
            const effect = animation.effect;
            if (
              effect instanceof KeyframeEffect &&
              (best === null || effect.getKeyframes().length > best.effect.getKeyframes().length)
            ) {
              best = { animation, effect };
            }
          }
          if (best === null) {
            return null;
          }
          const keyframes = best.effect.getKeyframes();
          const first = keyframes[0].transform;
          const last = keyframes[keyframes.length - 1].transform;
          return {
            animation: best.animation,
            intro: {
              durationMs: Number(best.effect.getComputedTiming().duration),
              firstTransform: typeof first === 'string' ? first : '',
              lastTransform: typeof last === 'string' ? last : '',
              keyframeCount: keyframes.length
            }
          };
        };

        const captureIntro = (panel: Element): void => {
          const read = readIntro(panel);
          if (read !== null && (run === null || read.intro.keyframeCount > run.keyframeCount)) {
            run = read.intro;
            introAnimation = read.animation;
            introStartMs =
              typeof read.animation.currentTime === 'number' ? read.animation.currentTime : null;
            // A just-created animation can still be pending (currentTime=null),
            // especially in Firefox. Its ready promise observes the real native
            // start even when the next rendered frame lands much later.
            void read.animation.ready.then(() => {
              if (
                introAnimation === read.animation &&
                introStartMs === null &&
                typeof read.animation.currentTime === 'number'
              ) {
                introStartMs = read.animation.currentTime;
              }
            });
          }
        };

        // finished: ran to its end. idle: cancelled or removed -- it will never
        // finish, so waiting for it would only burn the grace period.
        const settled = (animation: Animation | null): boolean =>
          animation === null ||
          animation.playState === 'finished' ||
          animation.playState === 'idle';

        // Svelte cancels an intro immediately after dispatching introend to
        // release its effect. Observe that lifecycle event in capture phase,
        // while the genuine native Animation still has finished/currentTime.
        const onIntroStart = (event: Event): void => {
          const panel = event.target;
          if (panel instanceof Element && panel.matches(selector)) {
            queueMicrotask(() => captureIntro(panel));
          }
        };
        const onIntroEnd = (event: Event): void => {
          const panel = event.target;
          if (panel instanceof Element && panel.matches(selector)) {
            captureIntro(panel);
            introFinished = introAnimation?.playState === 'finished';
            introEndMs =
              typeof introAnimation?.currentTime === 'number' ? introAnimation.currentTime : null;
          }
        };
        document.addEventListener('introstart', onIntroStart, true);
        document.addEventListener('introend', onIntroEnd, true);

        const observer = new MutationObserver(() => {
          const panel = document.querySelector(selector);
          if (panel !== null && startTransform === null) {
            startTransform = firstKeyframeTransform(panel);
            captureIntro(panel);
          }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });

        const finish = (): void => {
          if (!finished) {
            finished = true;
            observer.disconnect();
            document.removeEventListener('introstart', onIntroStart, true);
            document.removeEventListener('introend', onIntroEnd, true);
            resolve({
              startTransform,
              run,
              introFinished,
              introTime:
                introStartMs !== null && introEndMs !== null
                  ? { startMs: introStartMs, endMs: introEndMs }
                  : null,
              frames
            });
          }
        };

        const offsetOf = (element: Element): number => {
          const match = /matrix\(([^)]+)\)/.exec(getComputedStyle(element).transform);
          if (match === null) {
            return 0;
          }
          const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
          return parts.length === 6 ? Math.hypot(parts[4], parts[5]) : 0;
        };

        const frame = (): void => {
          const now = performance.now();
          const panel = document.querySelector(selector);
          if (panel !== null) {
            if (firstSeenAt === null) {
              firstSeenAt = now;
              startTransform ??= firstKeyframeTransform(panel);
            }
            captureIntro(panel);
            const style = getComputedStyle(panel);
            frames.push({
              tMs: now,
              offset: offsetOf(panel),
              opacity: Number.parseFloat(style.opacity)
            });
          } else if (now > giveUpAt) {
            finish();
            return;
          }
          if (
            firstSeenAt !== null &&
            now - firstSeenAt >= windowMs &&
            (settled(introAnimation) || now - firstSeenAt >= windowMs + SETTLE_GRACE_MS)
          ) {
            finish();
            return;
          }
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }),
    { selector: options.selector ?? '.sheet-panel', windowMs: options.windowMs ?? 700 }
  );

/**
 * Largest and final rendered offset of a sampled entrance. Deliberately nothing
 * about elapsed time or frame counts: how many frames an engine manages to render
 * during a 300ms slide depends on machine load, so any such number is a flake in
 * waiting.
 */
export const summarizeFrames = (
  frames: readonly PanelFrame[]
): { readonly peak: number; readonly final: number } => {
  if (frames.length === 0) {
    return { peak: 0, final: 0 };
  }
  return {
    peak: frames.reduce((max, entry) => Math.max(max, entry.offset), 0),
    final: frames[frames.length - 1].offset
  };
};

/** Verify natural native-timeline progress without imposing a wall-clock frame budget. */
export const expectSheetIntroProgress = (entrance: SheetEntrance): void => {
  expect(entrance.run, 'the engine exposed the native intro').not.toBeNull();
  expect(entrance.introTime, 'the native timeline was observed').not.toBeNull();
  expect(entrance.introFinished, 'the native intro reached its end').toBe(true);
  expect(entrance.introTime?.endMs ?? Number.NaN).toBeGreaterThan(
    entrance.introTime?.startMs ?? Number.NaN
  );
  expect(entrance.introTime?.endMs ?? Number.NaN).toBeGreaterThanOrEqual(
    entrance.run?.durationMs ?? Number.NaN
  );
};
