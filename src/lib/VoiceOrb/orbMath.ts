/**
 * The deterministic half of `VoiceOrb`, extracted so it can be tested.
 *
 * This repo's vitest suite runs no canvas — `getContext` is unimplemented in
 * jsdom — so anything left inside the component is unreachable by a test. The
 * geometry, the seeding and the listening envelope are all pure, so they live
 * here and the component keeps only the drawing. Same split as
 * `Pill/pillTone.ts` and `Table/normalizeColumns.ts`.
 */

import type { Rgb } from '../types';
import type { VoiceOrbVariant } from './properties';

export type OrbParticle = {
  baseX: number;
  baseY: number;
  baseZ: number;
  size: number;
};

export type OrbPoint = { x: number; y: number; z: number };

const SIZE_RANDOMNESS = 0.95;
const BASE_PARTICLE_SIZE = 1.6;

export const LISTENING_CYCLE_MS = 3000;
export const LISTENING_SPEED_RANGE = { min: 0.8, max: 1.2 };
export const LISTENING_SCALE_RANGE = { min: 0.9, max: 1 };

/**
 * FNV-1a. A string seed has to produce the same number on every mount, or the
 * orb a consumer keyed to a session id would look different on each navigation
 * — which is the whole reason the prop exists.
 */
export const hashSeed = (value: string): number => {
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/**
 * Turns an explicit `seed` prop into the integer `mulberry32` wants, or null
 * when there is nothing explicit to resolve -- the caller then falls back to
 * its own stable per-mount random value rather than treating null as zero.
 *
 * A numeric-looking string is parsed back into the number it names rather
 * than hashed. Every custom-element attribute arrives as a string -- HTML has
 * no way to write a "number" attribute -- so without this, the web
 * component's `<sui-voice-orb seed="42">` would hash `"42"` while the Svelte
 * `seed={42}` it is meant to be the markup spelling of used the number
 * directly, and the same intended seed would paint two different orbs
 * depending on which API reached it. A non-numeric string (a session id)
 * still hashes, unchanged.
 */
export const resolveExplicitSeed = (seed?: string | number): number | null => {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return seed >>> 0;
  }
  if (typeof seed !== 'string' || seed.trim().length === 0) {
    return null;
  }
  const numeric = Number(seed);
  return Number.isFinite(numeric) ? numeric >>> 0 : hashSeed(seed);
};

/** Mulberry32: small, fast, and reproducible from one integer. */
export const mulberry32 = (initial: number): (() => number) => {
  let state = initial | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Points spread evenly over a sphere.
 *
 * `cos(phi)` is taken uniformly in [-1, 1] rather than `phi` itself: sampling
 * the angle uniformly packs points towards the poles, because the rings of
 * constant `phi` near a pole have far less circumference than those at the
 * equator. The visible symptom is two dense caps and a sparse middle.
 */
export const generateOrbParticles = (
  count: number,
  radius: number,
  random: () => number
): readonly OrbParticle[] => {
  const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  const safeRadius = Number.isFinite(radius) && radius > 0 ? radius : 140;
  const minMultiplier = 1 - SIZE_RANDOMNESS * 0.7;
  const maxMultiplier = 1 + SIZE_RANDOMNESS * 0.2;
  const particles: OrbParticle[] = [];

  for (let index = 0; index < safeCount; index += 1) {
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(Math.max(-1, Math.min(1, 2 * random() - 1)));
    const sinPhi = Math.sin(phi);

    particles.push({
      baseX: safeRadius * sinPhi * Math.cos(theta),
      baseY: safeRadius * sinPhi * Math.sin(theta),
      baseZ: safeRadius * Math.cos(phi),
      size: BASE_PARTICLE_SIZE * (minMultiplier + random() * (maxMultiplier - minMultiplier))
    });
  }

  return particles;
};

/** Rotates about X then Y, which is the order the projection assumes. */
export const rotateOrbPoint = (point: OrbPoint, angleX: number, angleY: number): OrbPoint => {
  const cosX = Math.cos(angleX);
  const sinX = Math.sin(angleX);
  const y = point.y * cosX - point.z * sinX;
  const z = point.y * sinX + point.z * cosX;

  const cosY = Math.cos(angleY);
  const sinY = Math.sin(angleY);
  return {
    x: z * sinY + point.x * cosY,
    y,
    z: z * cosY - point.x * sinY
  };
};

/**
 * Perspective depth for a point: 1 at the sphere's centre plane, larger as it
 * comes towards the viewer. Used for both scale and opacity, so a particle
 * behind the sphere reads as further away.
 */
export const orbDepthScale = (z: number, focalLength: number): number =>
  focalLength / (focalLength + z);

/** The 0..1 breathing envelope, one full cycle per `LISTENING_CYCLE_MS`. */
export const listeningWave = (elapsedMs: number): number => {
  const normalized = (elapsedMs % LISTENING_CYCLE_MS) / LISTENING_CYCLE_MS;
  return (Math.sin(normalized * Math.PI * 2) + 1) / 2;
};

export const listeningSpeed = (elapsedMs: number, speedMultiplier: number): number => {
  const base = Number.isFinite(speedMultiplier) ? speedMultiplier : 1;
  const wave = listeningWave(elapsedMs);
  return (
    base *
    (LISTENING_SPEED_RANGE.min + wave * (LISTENING_SPEED_RANGE.max - LISTENING_SPEED_RANGE.min))
  );
};

export const listeningScale = (elapsedMs: number): number => {
  const wave = listeningWave(elapsedMs);
  return LISTENING_SCALE_RANGE.min + wave * (LISTENING_SCALE_RANGE.max - LISTENING_SCALE_RANGE.min);
};

/**
 * Parses the two colour shapes a browser hands back: `getComputedStyle().color`
 * is always `rgb()`/`rgba()`, and a canvas `fillStyle` read back after a write
 * is always `#rrggbb` (or `rgba()` when it carries alpha). Between them those
 * cover every CSS colour syntax, because the canvas does the hard parsing --
 * `oklch()`, `color(display-p3 ...)` and named colours all normalise through it.
 *
 * The library's own `hexToRgb` handles only hex, which is why this exists
 * alongside it rather than replacing it.
 */
export const parseCssColor = (value: string): Rgb | null => {
  const trimmed = value.trim();

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(trimmed);
  if (hex !== null) {
    const digits = hex[1];
    const expanded =
      digits.length === 3
        ? `${digits[0]}${digits[0]}${digits[1]}${digits[1]}${digits[2]}${digits[2]}`
        : digits;
    return {
      r: Number.parseInt(expanded.slice(0, 2), 16),
      g: Number.parseInt(expanded.slice(2, 4), 16),
      b: Number.parseInt(expanded.slice(4, 6), 16)
    };
  }

  const functional = /^rgba?\(([^)]*)\)$/i.exec(trimmed);
  if (functional === null) {
    return null;
  }

  const channels = functional[1]
    .split(/[,\s/]+/)
    .filter((part) => part.length > 0)
    .map(Number);
  if (channels.length < 3 || channels.slice(0, 3).some((channel) => !Number.isFinite(channel))) {
    return null;
  }

  const clamp = (channel: number): number => Math.max(0, Math.min(255, Math.round(channel)));
  return { r: clamp(channels[0]), g: clamp(channels[1]), b: clamp(channels[2]) };
};

/*
 * Audio-reactive envelope.
 *
 * The component never opens a microphone. It reads an `AnalyserNode` the
 * consumer already owns, which keeps permissions, the `AudioContext` lifecycle
 * and the choice of source (microphone, an element, a synthesised tone) on the
 * side of the application that has the context to decide them.
 */

/** Scale at silence and at full level. Capped at 1 so a shout cannot clip the sphere. */
export const AUDIO_SCALE_RANGE = { min: 0.82, max: 1 };
/** Rotation multiplier at silence and at full level, before `speedMultiplier`. */
export const AUDIO_SPEED_RANGE = { min: 0.5, max: 2.4 };
/**
 * How far the level must move before `onlevel` fires again.
 *
 * Without a threshold the callback runs every frame forever, including through
 * silence, and a consumer who sets component state from it re-renders 60 times
 * a second for no reason. A hundredth of the range is below anything a meter
 * or a caption can show.
 */
export const LEVEL_REPORT_EPSILON = 0.01;

/** Envelope-follower time constants. Fast onset, unhurried decay. */
export const AUDIO_ATTACK_MS = 60;
export const AUDIO_RELEASE_MS = 320;

/**
 * RMS of one buffer of byte time-domain data, as 0..1.
 *
 * `getByteTimeDomainData` centres silence on 128, so each sample is an
 * excursion from that midpoint rather than a magnitude. Treating the raw byte
 * as amplitude reads silence as roughly full scale.
 */
export const rmsFromTimeDomain = (samples: Uint8Array): number => {
  if (samples.length === 0) {
    return 0;
  }
  let total = 0;
  for (const sample of samples) {
    const excursion = (sample - 128) / 128;
    total += excursion * excursion;
  }
  return Math.sqrt(total / samples.length);
};

/**
 * One-pole envelope follower, stepped by wall-clock rather than by frame, so
 * the response is the same on a 60Hz and a 120Hz display.
 *
 * Separate attack and release constants are the point: speech is a burst
 * followed by a gap, and a symmetric filter either chatters through every
 * syllable or lags the onset that makes the orb feel connected to the voice.
 */
export const followEnvelope = (
  current: number,
  target: number,
  deltaMs: number,
  attackMs: number,
  releaseMs: number
): number => {
  if (!Number.isFinite(current)) {
    return 0;
  }
  if (!Number.isFinite(target) || !Number.isFinite(deltaMs) || deltaMs <= 0) {
    return current;
  }
  const timeConstant = target > current ? attackMs : releaseMs;
  if (!Number.isFinite(timeConstant) || timeConstant <= 0) {
    return target;
  }
  const coefficient = 1 - Math.exp(-deltaMs / timeConstant);
  return current + (target - current) * coefficient;
};

const clampLevel = (level: number): number =>
  Number.isFinite(level) ? Math.max(0, Math.min(1, level)) : 0;

export const audioScale = (level: number): number =>
  AUDIO_SCALE_RANGE.min + clampLevel(level) * (AUDIO_SCALE_RANGE.max - AUDIO_SCALE_RANGE.min);

export const audioSpeed = (level: number, speedMultiplier: number): number => {
  const base = Number.isFinite(speedMultiplier) ? speedMultiplier : 1;
  return (
    base *
    (AUDIO_SPEED_RANGE.min + clampLevel(level) * (AUDIO_SPEED_RANGE.max - AUDIO_SPEED_RANGE.min))
  );
};

/*
 * `prefers-reduced-motion` support.
 *
 * The two decorative sources -- idle rotation and the sine-wave breathing
 * `listening` rides without an `analyser` -- are what the OS setting exists to
 * suppress. `level` (non-null only while a real `AnalyserNode` is actually
 * driving the orb) is left alone in both functions below: it reports what the
 * microphone is doing right now, which is state, not decoration, and freezing
 * it would take away the only feedback a caller gave the user that the app is
 * listening. Documented in docs/VoiceOrb.md's Accessibility section.
 */

/** Effective rotation speed for one frame. See the reduced-motion note above. */
export const resolveMotionSpeed = (
  speedMultiplier: number,
  variant: VoiceOrbVariant,
  listeningElapsedMs: number,
  level: number | null,
  reducedMotion: boolean
): number => {
  if (level !== null) {
    return audioSpeed(level, speedMultiplier);
  }
  if (reducedMotion) {
    return 0;
  }
  if (variant === 'listening') {
    return listeningSpeed(listeningElapsedMs, speedMultiplier);
  }
  return Number.isFinite(speedMultiplier) ? speedMultiplier : 1;
};

/** Effective breathing scale for one frame. Same split as `resolveMotionSpeed`. */
export const resolveMotionScale = (
  variant: VoiceOrbVariant,
  listeningElapsedMs: number,
  level: number | null,
  reducedMotion: boolean
): number => {
  if (level !== null) {
    return audioScale(level);
  }
  if (reducedMotion || variant !== 'listening') {
    return 1;
  }
  return listeningScale(listeningElapsedMs);
};
