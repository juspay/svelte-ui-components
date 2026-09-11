<script lang="ts">
  import { onMount } from 'svelte';
  import {
    AUDIO_ATTACK_MS,
    AUDIO_RELEASE_MS,
    LEVEL_REPORT_EPSILON,
    followEnvelope,
    generateOrbParticles,
    mulberry32,
    orbDepthScale,
    parseCssColor,
    resolveExplicitSeed,
    resolveMotionScale,
    resolveMotionSpeed,
    rmsFromTimeDomain,
    rotateOrbPoint,
    type OrbParticle
  } from './orbMath';
  import type { Rgb } from '../types';
  import { prefersReducedMotion } from '../utils';
  import type { VoiceOrbProperties } from './properties';

  let {
    variant = 'idle',
    speedMultiplier = 1,
    seed,
    height = 400,
    particleCount = 1000,
    radius = 140,
    interactive = true,
    repelRadius = 200,
    analyser,
    sensitivity = 1,
    persistKey,
    classes,
    testId,
    onfirstframe,
    onlevel
  }: VoiceOrbProperties = $props();

  const FOCAL_LENGTH = 600;
  const BASE_ROTATION_X = 0.0021;
  const BASE_ROTATION_Y = 0.0014;
  /*
   * Last resort only, and deliberately a mid-grey that is visible on any
   * ground. It is reached when neither the custom property nor the inherited
   * colour normalises, which a browser has to work at to produce. The real
   * default is the inherited text colour -- see `particleRgb`.
   */
  const FALLBACK_PARTICLE_RGB: Rgb = { r: 128, g: 128, b: 128 };

  let canvas: HTMLCanvasElement | null = $state(null);
  let container: HTMLDivElement | null = $state(null);

  const pointer: { x: number | null; y: number | null } = { x: null, y: null };
  const orb = { width: 0, height: 0, angleX: 0, angleY: 0 };

  let listeningElapsedMs = 0;
  /* Explicitly over ArrayBuffer: `getByteTimeDomainData` will not accept the
     ArrayBufferLike default that a bare `Uint8Array` annotation now means. */
  let audioBuffer: Uint8Array<ArrayBuffer> | null = null;
  let audioLevel = 0;
  let reportedLevel = 0;
  let resolvedColorInput = '';
  let resolvedRgb: Rgb = FALLBACK_PARTICLE_RGB;
  let frame: number | null = null;
  let previousTime: number | null = null;
  let announcedFirstFrame = false;

  /*
   * Resolved once per instance rather than inside `resolveSeed` itself: an
   * unseeded orb should only ever get a new random pattern from an actual new
   * mount, never from `particleCount`/`radius` changing underneath it (see
   * `particles` below, and finding 2 in the review this fixed).
   */
  let unseededSeed = Math.floor(Math.random() * 0xffffffff) >>> 0;

  const resolveSeed = (): number => resolveExplicitSeed(seed) ?? unseededSeed;

  /*
   * $derived rather than assigned once in `onMount`: `particleCount`, `radius`
   * and `seed` are reactive props, and generating the sphere only at mount
   * meant changing any of them afterwards silently kept the original geometry.
   * `unseededSeed` above is what keeps an unseeded orb from also reshuffling
   * on a change to `particleCount`/`radius` alone.
   */
  const particles: readonly OrbParticle[] = $derived.by(() =>
    generateOrbParticles(particleCount, radius, mulberry32(resolveSeed()))
  );

  /*
   * Storage is namespaced by the caller's key and every read is guarded: a
   * browser with storage disabled throws on access rather than returning null,
   * and a persisted value can be anything by the time it is read back.
   */
  const readPersisted = (suffix: string): number | null => {
    if (typeof persistKey !== 'string' || persistKey.length === 0) {
      return null;
    }
    try {
      const raw = localStorage.getItem(`${persistKey}:${suffix}`);
      if (raw === null) {
        return null;
      }
      const parsed = Number.parseFloat(raw);
      return Number.isFinite(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const writePersisted = (): void => {
    if (typeof persistKey !== 'string' || persistKey.length === 0) {
      return;
    }
    try {
      localStorage.setItem(`${persistKey}:angleX`, String(orb.angleX));
      localStorage.setItem(`${persistKey}:angleY`, String(orb.angleY));
      localStorage.setItem(`${persistKey}:listeningMs`, String(listeningElapsedMs));
    } catch {
      /* Storage full or blocked: rotation resumes from zero, which is cosmetic. */
    }
  };

  const resize = (): void => {
    if (canvas === null || container === null) {
      return;
    }
    orb.width = container.clientWidth;
    orb.height = Number.isFinite(height) && height > 0 ? height : 400;
    canvas.width = orb.width;
    canvas.height = orb.height;
  };

  /*
   * Assigning an unparseable colour to `fillStyle` is a no-op by spec, so the
   * candidate is tried against two different sentinels: agreeing reads mean the
   * browser accepted it, differing reads mean it fell through. Reading it back
   * yields a normalised `#rrggbb`, which is how `oklch()`, `color(display-p3 ...)`
   * and named colours reach the particle maths without this component
   * implementing a CSS colour parser.
   */
  const normalizeColor = (context: CanvasRenderingContext2D, value: string): string | null => {
    if (value.length === 0) {
      return null;
    }
    const previous = context.fillStyle;
    context.fillStyle = '#000000';
    context.fillStyle = value;
    const onBlack = context.fillStyle;
    context.fillStyle = '#ffffff';
    context.fillStyle = value;
    const onWhite = context.fillStyle;
    context.fillStyle = previous;
    return typeof onBlack === 'string' && onBlack === onWhite ? onBlack : null;
  };

  /**
   * The current smoothed audio level, or null when the orb is not being driven
   * by audio -- no analyser, or not listening -- in which case the caller falls
   * back to the sine-wave envelope.
   *
   * Wrapped because a consumer closing their `AudioContext` while the orb is
   * still mounted makes the read throw, and an exception inside the rAF
   * callback kills the loop for good: the orb would freeze rather than degrade.
   */
  const audioEnvelope = (deltaMs: number): number | null => {
    if (!analyser || variant !== 'listening') {
      audioLevel = 0;
      return null;
    }
    try {
      const size = analyser.fftSize;
      if (audioBuffer === null || audioBuffer.length !== size) {
        audioBuffer = new Uint8Array(size);
      }
      analyser.getByteTimeDomainData(audioBuffer);
      const gain = Number.isFinite(sensitivity) && sensitivity > 0 ? sensitivity : 1;
      const target = rmsFromTimeDomain(audioBuffer) * gain;
      audioLevel = followEnvelope(audioLevel, target, deltaMs, AUDIO_ATTACK_MS, AUDIO_RELEASE_MS);
      return audioLevel;
    } catch {
      return null;
    }
  };

  /*
   * The default is the inherited text colour, so the orb is legible on whatever
   * ground a consumer puts it on and follows their theme without being told.
   * A fixed default cannot: the first revision of this component shipped a
   * light grey that was invisible on a light page.
   *
   * Resolved every frame rather than once at mount, so a theme switch reaches a
   * running orb. The cache key is the raw strings, so the parse only repeats
   * when the page actually changes -- the `getComputedStyle` read is a colour
   * lookup, which needs no layout.
   */
  const particleRgb = (context: CanvasRenderingContext2D): Rgb => {
    if (canvas === null) {
      return resolvedRgb;
    }
    const styles = getComputedStyle(canvas);
    const declared = styles.getPropertyValue('--sui-orb-particle-color').trim();
    const inherited = styles.color.trim();
    const input = `${declared}|${inherited}`;
    if (input === resolvedColorInput) {
      return resolvedRgb;
    }

    resolvedColorInput = input;
    const normalized = normalizeColor(context, declared) ?? normalizeColor(context, inherited);
    resolvedRgb = (normalized === null ? null : parseCssColor(normalized)) ?? FALLBACK_PARTICLE_RGB;
    return resolvedRgb;
  };

  const draw = (time: number): void => {
    if (canvas === null) {
      return;
    }
    const context = canvas.getContext('2d');
    if (context === null) {
      return;
    }

    const delta = previousTime === null ? 16 : Math.min(64, time - previousTime);
    previousTime = time;
    if (variant === 'listening') {
      listeningElapsedMs += delta;
    }

    const level = audioEnvelope(delta);
    const reportable = level ?? 0;
    if (Math.abs(reportable - reportedLevel) >= LEVEL_REPORT_EPSILON) {
      reportedLevel = reportable;
      onlevel?.(reportable);
    }
    // Read once per frame and threaded through both calls below: two
    // `matchMedia` reads per frame is wasted work `draw` already runs 60 times
    // a second, and could observe the preference flip between them.
    const reducedMotion = prefersReducedMotion();
    const speed = resolveMotionSpeed(
      speedMultiplier,
      variant,
      listeningElapsedMs,
      level,
      reducedMotion
    );
    const normalizedDelta = delta / 16;
    orb.angleX += BASE_ROTATION_X * speed * normalizedDelta;
    orb.angleY += BASE_ROTATION_Y * speed * normalizedDelta;

    const rgb = particleRgb(context);

    const centreX = orb.width / 2;
    const centreY = orb.height / 2;
    const scale = resolveMotionScale(variant, listeningElapsedMs, level, reducedMotion);

    context.clearRect(0, 0, orb.width, orb.height);
    context.save();
    context.translate(centreX, centreY);
    context.scale(scale, scale);
    context.translate(-centreX, -centreY);

    for (const particle of particles) {
      const rotated = rotateOrbPoint(
        { x: particle.baseX, y: particle.baseY, z: particle.baseZ },
        orb.angleX,
        orb.angleY
      );
      const depth = orbDepthScale(rotated.z, FOCAL_LENGTH);
      let x = centreX + rotated.x * depth;
      let y = centreY + rotated.y * depth;

      if (interactive && pointer.x !== null && pointer.y !== null) {
        const dx = pointer.x - x;
        const dy = pointer.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < repelRadius && distance > 0) {
          const force = (repelRadius - distance) / repelRadius;
          x -= (dx / distance) * force * 20;
          y -= (dy / distance) * force * 20;
        }
      }

      const gradient = context.createLinearGradient(centreX, centreY, x, y);
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${depth * 0.25})`);
      gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${depth * 0.35})`);

      context.beginPath();
      context.moveTo(centreX, centreY);
      context.lineTo(x, y);
      context.strokeStyle = gradient;
      context.lineWidth = 0.3;
      context.stroke();

      context.beginPath();
      context.arc(x, y, particle.size * depth, 0, Math.PI * 2);
      context.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${depth * 0.8})`;
      context.fill();
    }

    context.restore();

    if (!announcedFirstFrame) {
      announcedFirstFrame = true;
      onfirstframe?.();
    }

    frame = requestAnimationFrame(draw);
  };

  const trackPointer = (event: PointerEvent): void => {
    if (canvas === null || !interactive) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  };

  const releasePointer = (): void => {
    pointer.x = null;
    pointer.y = null;
  };

  onMount(() => {
    orb.angleX = readPersisted('angleX') ?? 0;
    orb.angleY = readPersisted('angleY') ?? 0;
    listeningElapsedMs = readPersisted('listeningMs') ?? 0;

    resize();

    const observer =
      typeof ResizeObserver === 'function' ? new ResizeObserver(() => resize()) : null;
    if (observer !== null && container !== null) {
      observer.observe(container);
    }

    frame = requestAnimationFrame(draw);

    return () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
      observer?.disconnect();
      writePersisted();
    };
  });
</script>

<div
  bind:this={container}
  class="voice-orb {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  <canvas
    bind:this={canvas}
    class="voice-orb-canvas"
    style:height={`${Number.isFinite(height) && height > 0 ? height : 400}px`}
    onpointermove={trackPointer}
    onpointerleave={releasePointer}
    onpointercancel={releasePointer}
    aria-hidden="true"
  ></canvas>
</div>

<style>
  .voice-orb {
    width: 100%;
    overflow: visible;
  }

  .voice-orb-canvas {
    width: 100%;
    display: block;
    /* Pointer repulsion needs the move events a default touch gesture would eat. */
    touch-action: none;
  }
</style>
