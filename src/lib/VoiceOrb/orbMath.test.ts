import { describe, expect, it } from 'vitest';
import {
  AUDIO_SCALE_RANGE,
  AUDIO_SPEED_RANGE,
  LISTENING_CYCLE_MS,
  audioScale,
  audioSpeed,
  followEnvelope,
  generateOrbParticles,
  hashSeed,
  listeningScale,
  listeningSpeed,
  mulberry32,
  orbDepthScale,
  parseCssColor,
  resolveExplicitSeed,
  resolveMotionScale,
  resolveMotionSpeed,
  rmsFromTimeDomain,
  rotateOrbPoint
} from './orbMath';

/**
 * `VoiceOrb` draws to a canvas, which this repo's vitest suite cannot exercise
 * — `getContext` is unimplemented in jsdom. Everything that decides *what* is
 * drawn is pure and lives in `orbMath`, so it is tested here; the component
 * keeps only the `ctx` calls.
 */

describe('seeding', () => {
  it('turns the same string into the same number, every time', () => {
    // The whole point of the `seed` prop: an orb keyed to a session id has to
    // look like the same object across navigations.
    expect(hashSeed('session-abc')).toBe(hashSeed('session-abc'));
  });

  it('turns different strings into different numbers', () => {
    expect(hashSeed('session-abc')).not.toBe(hashSeed('session-abd'));
  });

  it('returns an unsigned 32-bit integer even for long input', () => {
    const hash = hashSeed('x'.repeat(500));
    expect(Number.isInteger(hash)).toBe(true);
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(hash).toBeLessThanOrEqual(0xffffffff);
  });

  it('handles an empty string without producing NaN', () => {
    expect(Number.isFinite(hashSeed(''))).toBe(true);
  });
});

describe('resolveExplicitSeed', () => {
  // The web component can only ever hand this a string -- HTML has no numeric
  // attribute type -- so `<sui-voice-orb seed="42">` has to resolve to the same
  // orb as the Svelte-native `seed={42}`. Before this, a numeric-looking string
  // was hashed like any other string, so the "same" seed painted two different
  // orbs depending on which API reached it. Pins that parity.
  it('gives the same integer for a number and for the equivalent numeric string', () => {
    expect(resolveExplicitSeed('42')).toBe(resolveExplicitSeed(42));
  });

  it('still hashes a non-numeric string exactly as before', () => {
    expect(resolveExplicitSeed('session-abc')).toBe(hashSeed('session-abc'));
  });

  it('treats a negative numeric string the same as the negative number', () => {
    expect(resolveExplicitSeed('-7')).toBe(resolveExplicitSeed(-7));
  });

  it('does not mistake whitespace for the number zero', () => {
    expect(resolveExplicitSeed('   ')).toBeNull();
  });

  it('returns null for an empty string, so the caller falls back to its own seed', () => {
    expect(resolveExplicitSeed('')).toBeNull();
  });

  it('returns null when no seed is given at all', () => {
    expect(resolveExplicitSeed()).toBeNull();
  });

  it('treats a non-finite number as no seed, rather than producing NaN', () => {
    expect(resolveExplicitSeed(Number.NaN)).toBeNull();
  });
});

describe('resolveMotionSpeed', () => {
  it('matches the plain idle speed when motion is unrestricted', () => {
    expect(resolveMotionSpeed(2, 'idle', 0, null, false)).toBe(2);
  });

  it('freezes idle rotation under reduced motion', () => {
    expect(resolveMotionSpeed(2, 'idle', 0, null, true)).toBe(0);
  });

  it('freezes the sine-wave listening breathing under reduced motion', () => {
    expect(resolveMotionSpeed(1, 'listening', 400, null, true)).toBe(0);
  });

  it('still breathes on the sine wave while motion is unrestricted', () => {
    expect(resolveMotionSpeed(1, 'listening', 400, null, false)).toBe(listeningSpeed(400, 1));
  });

  it('keeps following real audio under reduced motion -- it is state, not decoration', () => {
    expect(resolveMotionSpeed(1, 'listening', 0, 0.8, true)).toBe(audioSpeed(0.8, 1));
    expect(resolveMotionSpeed(1, 'listening', 0, 0.8, true)).not.toBe(0);
  });

  it('falls back to 1 for an unusable multiplier, same as the idle path always has', () => {
    expect(resolveMotionSpeed(Number.NaN, 'idle', 0, null, false)).toBe(1);
  });
});

describe('resolveMotionScale', () => {
  it('is 1 while idle, whether or not motion is restricted', () => {
    expect(resolveMotionScale('idle', 0, null, false)).toBe(1);
    expect(resolveMotionScale('idle', 0, null, true)).toBe(1);
  });

  it('freezes the listening breathing scale under reduced motion', () => {
    expect(resolveMotionScale('listening', 400, null, true)).toBe(1);
  });

  it('still breathes the scale while motion is unrestricted', () => {
    expect(resolveMotionScale('listening', 400, null, false)).toBe(listeningScale(400));
  });

  it('keeps scaling with real audio under reduced motion', () => {
    expect(resolveMotionScale('listening', 0, 0.8, true)).toBe(audioScale(0.8));
  });
});

describe('mulberry32', () => {
  it('replays an identical sequence from the same seed', () => {
    const first = mulberry32(42);
    const second = mulberry32(42);
    const a = [first(), first(), first(), first()];
    const b = [second(), second(), second(), second()];
    expect(a).toEqual(b);
  });

  it('diverges from a different seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(43);
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()]);
  });

  it('stays within [0, 1)', () => {
    const random = mulberry32(7);
    for (let index = 0; index < 200; index += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('particle generation', () => {
  it('places every particle on the sphere surface', () => {
    const radius = 140;
    const particles = generateOrbParticles(300, radius, mulberry32(1));

    for (const particle of particles) {
      const distance = Math.sqrt(
        particle.baseX * particle.baseX +
          particle.baseY * particle.baseY +
          particle.baseZ * particle.baseZ
      );
      expect(distance).toBeCloseTo(radius, 6);
    }
  });

  it('spreads points evenly rather than crowding the poles', () => {
    // The reason cos(phi) is sampled uniformly instead of phi. With uniform
    // phi, the |z| > 0.8r caps would hold far more than their share of the
    // surface; sampled correctly they hold close to the 20% of the sphere they
    // actually cover.
    const radius = 100;
    const particles = generateOrbParticles(4000, radius, mulberry32(99));
    const nearPoles = particles.filter((p) => Math.abs(p.baseZ) > radius * 0.8).length;
    const share = nearPoles / particles.length;

    expect(share).toBeGreaterThan(0.13);
    expect(share).toBeLessThan(0.27);
  });

  it('is reproducible for a given seed', () => {
    const a = generateOrbParticles(50, 140, mulberry32(5));
    const b = generateOrbParticles(50, 140, mulberry32(5));
    expect(a).toEqual(b);
  });

  it('returns nothing for a count that is not a usable number', () => {
    expect(generateOrbParticles(0, 140, mulberry32(1))).toEqual([]);
    expect(generateOrbParticles(-10, 140, mulberry32(1))).toEqual([]);
    expect(generateOrbParticles(Number.NaN, 140, mulberry32(1))).toEqual([]);
  });

  it('falls back to the default radius when given an unusable one', () => {
    // A plain-JS or web-component caller can pass anything; a NaN radius would
    // otherwise put every particle at NaN and draw nothing at all.
    const particles = generateOrbParticles(10, Number.NaN, mulberry32(1));
    for (const particle of particles) {
      expect(Number.isFinite(particle.baseX)).toBe(true);
      expect(Number.isFinite(particle.baseZ)).toBe(true);
    }
  });
});

describe('rotation and projection', () => {
  it('leaves a point on the rotation axis where it is', () => {
    expect(rotateOrbPoint({ x: 0, y: 0, z: 0 }, 1.2, 0.7)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('preserves distance from the origin', () => {
    const point = { x: 30, y: -40, z: 120 };
    const rotated = rotateOrbPoint(point, 0.9, -0.4);
    const before = Math.sqrt(point.x ** 2 + point.y ** 2 + point.z ** 2);
    const after = Math.sqrt(rotated.x ** 2 + rotated.y ** 2 + rotated.z ** 2);
    expect(after).toBeCloseTo(before, 6);
  });

  it('is a no-op at zero angles', () => {
    const point = { x: 3, y: 5, z: 7 };
    const rotated = rotateOrbPoint(point, 0, 0);
    expect(rotated.x).toBeCloseTo(3, 10);
    expect(rotated.y).toBeCloseTo(5, 10);
    expect(rotated.z).toBeCloseTo(7, 10);
  });

  it('makes nearer points larger and farther points smaller', () => {
    const focal = 600;
    expect(orbDepthScale(0, focal)).toBe(1);
    expect(orbDepthScale(-140, focal)).toBeGreaterThan(1);
    expect(orbDepthScale(140, focal)).toBeLessThan(1);
  });
});

describe('listening envelope', () => {
  it('runs a full cycle and returns to where it started', () => {
    expect(listeningScale(0)).toBeCloseTo(listeningScale(LISTENING_CYCLE_MS), 10);
  });

  it('stays inside the declared speed range', () => {
    for (let elapsed = 0; elapsed <= LISTENING_CYCLE_MS; elapsed += 100) {
      const speed = listeningSpeed(elapsed, 1);
      expect(speed).toBeGreaterThanOrEqual(0.8 - 1e-9);
      expect(speed).toBeLessThanOrEqual(1.2 + 1e-9);
    }
  });

  it('stays inside the declared scale range', () => {
    for (let elapsed = 0; elapsed <= LISTENING_CYCLE_MS; elapsed += 100) {
      const scale = listeningScale(elapsed);
      expect(scale).toBeGreaterThanOrEqual(0.9 - 1e-9);
      expect(scale).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it('scales with the caller multiplier', () => {
    expect(listeningSpeed(400, 2)).toBeCloseTo(listeningSpeed(400, 1) * 2, 10);
  });

  it('treats an unusable multiplier as 1 rather than producing NaN', () => {
    expect(listeningSpeed(400, Number.NaN)).toBeCloseTo(listeningSpeed(400, 1), 10);
  });

  it('keeps running past one cycle rather than clamping', () => {
    expect(listeningScale(LISTENING_CYCLE_MS * 3.5)).toBeCloseTo(
      listeningScale(LISTENING_CYCLE_MS * 0.5),
      10
    );
  });
});

describe('parseCssColor', () => {
  it('reads the six-digit hex a canvas hands back', () => {
    expect(parseCssColor('#1a2b3c')).toEqual({ r: 26, g: 43, b: 60 });
  });

  it('expands three-digit hex by doubling each digit, not by padding it', () => {
    // #f80 is ff8800, not f08000. Padding instead of doubling passes a naive
    // check on #fff and #000 and is wrong for every other colour.
    expect(parseCssColor('#f80')).toEqual({ r: 255, g: 136, b: 0 });
  });

  it('is case-insensitive about hex digits', () => {
    expect(parseCssColor('#ABCDEF')).toEqual(parseCssColor('#abcdef'));
  });

  it('reads the comma form getComputedStyle returns', () => {
    expect(parseCssColor('rgb(10, 20, 30)')).toEqual({ r: 10, g: 20, b: 30 });
  });

  it('reads the space-and-slash form, which modern browsers also return', () => {
    expect(parseCssColor('rgba(10 20 30 / 0.5)')).toEqual({ r: 10, g: 20, b: 30 });
  });

  it('keeps the channels and drops the alpha, which the orb applies itself', () => {
    expect(parseCssColor('rgba(200, 100, 50, 0.25)')).toEqual({ r: 200, g: 100, b: 50 });
  });

  it('rounds and clamps out-of-range channels rather than emitting them', () => {
    // A channel above 255 reaches the canvas as a broken rgba() string and the
    // particle silently stops drawing, which is the failure this prevents.
    expect(parseCssColor('rgb(300, -20, 12.6)')).toEqual({ r: 255, g: 0, b: 13 });
  });

  it('returns null for a colour it cannot read, so the caller can fall through', () => {
    expect(parseCssColor('rebeccapurple')).toBeNull();
    expect(parseCssColor('oklch(0.7 0.1 200)')).toBeNull();
    expect(parseCssColor('')).toBeNull();
    expect(parseCssColor('#ab')).toBeNull();
    expect(parseCssColor('rgb(1, 2)')).toBeNull();
  });

  it('returns null when a channel is not a number', () => {
    // `Number('')` is 0 and `Number('x')` is NaN -- without the finite check a
    // malformed string parses to a plausible-looking black.
    expect(parseCssColor('rgb(a, b, c)')).toBeNull();
  });

  it('tolerates the surrounding whitespace a custom property carries', () => {
    expect(parseCssColor('  #1a2b3c  ')).toEqual({ r: 26, g: 43, b: 60 });
  });
});

describe('rmsFromTimeDomain', () => {
  it('reads digital silence as zero', () => {
    // Byte time-domain data is centred on 128, not 0. Forgetting that makes
    // silence measure near full scale and the orb roar at nothing -- which is
    // the single most likely way to get this wrong.
    expect(rmsFromTimeDomain(new Uint8Array(64).fill(128))).toBe(0);
  });

  it('reads a full-scale square wave as very close to one', () => {
    const samples = new Uint8Array(64);
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = index % 2 === 0 ? 0 : 255;
    }
    expect(rmsFromTimeDomain(samples)).toBeGreaterThan(0.98);
  });

  it('reads a half-amplitude wave as roughly half', () => {
    const samples = new Uint8Array(64);
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = index % 2 === 0 ? 64 : 192;
    }
    expect(rmsFromTimeDomain(samples)).toBeCloseTo(0.5, 1);
  });

  it('is insensitive to the sign of the excursion', () => {
    const quiet = new Uint8Array(32).fill(108);
    const loud = new Uint8Array(32).fill(148);
    expect(rmsFromTimeDomain(quiet)).toBeCloseTo(rmsFromTimeDomain(loud), 5);
  });

  it('returns zero for an empty buffer rather than NaN', () => {
    // A detached or zero-fftSize analyser hands back an empty array, and NaN
    // would propagate into the scale and blank the canvas.
    expect(rmsFromTimeDomain(new Uint8Array(0))).toBe(0);
  });
});

describe('followEnvelope', () => {
  it('moves toward a louder target', () => {
    const next = followEnvelope(0, 1, 16, 60, 320);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(1);
  });

  it('rises faster than it falls, which is what makes speech legible', () => {
    // Symmetric smoothing either chatters on every syllable gap or lags the
    // onset. Fast attack, slow release is the whole design.
    const rise = followEnvelope(0, 1, 16, 60, 320) - 0;
    const fall = 1 - followEnvelope(1, 0, 16, 60, 320);
    expect(rise).toBeGreaterThan(fall * 2);
  });

  it('does not move when no time has passed', () => {
    expect(followEnvelope(0.4, 1, 0, 60, 320)).toBe(0.4);
  });

  it('converges on the target over a long step rather than overshooting', () => {
    const next = followEnvelope(0, 1, 5000, 60, 320);
    expect(next).toBeGreaterThan(0.99);
    expect(next).toBeLessThanOrEqual(1);
  });

  it('never overshoots a falling target either', () => {
    expect(followEnvelope(1, 0, 5000, 60, 320)).toBeGreaterThanOrEqual(0);
  });

  it('holds its current value when handed unusable numbers', () => {
    expect(followEnvelope(0.5, Number.NaN, 16, 60, 320)).toBe(0.5);
    expect(followEnvelope(0.5, 1, Number.NaN, 60, 320)).toBe(0.5);
  });
});

describe('audio-driven envelope', () => {
  it('maps silence to the smallest orb and full level to the largest', () => {
    expect(audioScale(0)).toBeCloseTo(AUDIO_SCALE_RANGE.min, 5);
    expect(audioScale(1)).toBeCloseTo(AUDIO_SCALE_RANGE.max, 5);
  });

  it('never scales above 1, so a loud voice cannot clip the sphere', () => {
    expect(audioScale(4)).toBeLessThanOrEqual(1);
  });

  it('clamps a negative level rather than inverting the orb', () => {
    expect(audioScale(-2)).toBeCloseTo(AUDIO_SCALE_RANGE.min, 5);
  });

  it('speeds rotation with level, and respects the caller multiplier', () => {
    expect(audioSpeed(1, 1)).toBeGreaterThan(audioSpeed(0, 1));
    expect(audioSpeed(1, 1)).toBeCloseTo(AUDIO_SPEED_RANGE.max, 5);
    expect(audioSpeed(1, 2)).toBeCloseTo(AUDIO_SPEED_RANGE.max * 2, 5);
  });

  it('a zero multiplier still freezes an audio-driven orb', () => {
    // `speedMultiplier={0}` is documented as freezing the orb. Audio must not
    // quietly re-animate it.
    expect(audioSpeed(1, 0)).toBe(0);
  });

  it('falls back to a sane multiplier when handed a bad one', () => {
    expect(audioSpeed(1, Number.NaN)).toBeCloseTo(AUDIO_SPEED_RANGE.max, 5);
  });
});
