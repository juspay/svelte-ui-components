/**
 * Sphere-family modes: marks that read as points spread across, or orbiting,
 * a solid sphere. Each mode is a pure function of `(t, ctx)` -- the geometry,
 * tuning constants and small helpers below are local to this file so every
 * mode's numbers stay easy to read next to the mode that uses them.
 */

import {
  easeInOutCubic,
  easeOutCubic,
  hashUnit,
  modeSizing,
  project,
  rotateX,
  rotateY,
  rotateZ,
  sampleSphere,
  type Point3,
  type Projected
} from '../space';
import type { Dot, ModeContext, ModeFn, ModeSize, Stroke } from '../types';

const TWO_PI = Math.PI * 2;

/**
 * `project`'s perspective makes a near point's on-screen radius bulge past
 * its world radius, so every mode keeps its sphere a little inside the 40%
 * mark to leave that bulge room before the canvas edge.
 */
const WORLD_RADIUS_RATIO = 0.38;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const originOf = (ctx: ModeContext): number => ctx.size / 2;
const worldRadiusOf = (ctx: ModeContext): number => ctx.size * WORLD_RADIUS_RATIO;

/** Near marks read brighter (low ink); far ones fade toward the background. */
const INK_NEAR = 0.05;
const INK_FAR = 0.72;
const shadeByDepth = (depth: number): number => INK_FAR - (INK_FAR - INK_NEAR) * clamp01(depth);

type Vec = Pick<Projected, 'x' | 'y' | 'depth'>;

const toDot = (at: Vec, radius: number, ink: number, alpha: number): Dot => ({
  x: at.x,
  y: at.y,
  depth: at.depth,
  radius,
  ink: clamp01(ink),
  alpha: clamp01(alpha)
});

const toStroke = (from: Vec, to: Vec, width: number, ink: number, alpha: number): Stroke => ({
  x1: from.x,
  y1: from.y,
  x2: to.x,
  y2: to.y,
  depth: (from.depth + to.depth) / 2,
  width,
  ink: clamp01(ink),
  alpha: clamp01(alpha)
});

// ---------------------------------------------------------------------------
// working -- particles travelling several tilted orbits around a centre
// ---------------------------------------------------------------------------

/** Particles travel in short trailing arcs ("trains") rather than scattering
 * independently around their orbit -- a lone random phase per particle reads
 * as noise once density thins the count out at 32/20px, while a handful of
 * particles held close together always reads as motion along a path. */
const WORKING_TRAIN_BASE_COUNT = 22;
/** Keeps at least this many short arcs on screen at each size. At 32/64px the
 * area scaler alone already clears this floor, so it only bites at 20px. More
 * than one train per orbit (WORKING_ORBIT_COUNT = 6) matters because depth
 * shading fades whichever half of each orbit is on the far side of the
 * sphere at a given instant almost to the background -- one train per orbit
 * left whole quadrants with no train currently on the near side to fill
 * them; two independently-phased laps around the six orbits keeps at least
 * a couple of quadrants covered at every instant, not just on average. */
const WORKING_MIN_TRAINS: Record<ModeSize, number> = { 64: 3, 32: 3, 20: 12 };
const WORKING_TRAIN_LENGTH = 5;
/** How far apart, in radians, a train's particles trail behind its lead --
 * wide enough to read as a short curved arc, short enough to stay a cluster
 * rather than smearing back into the full-orbit scatter this replaces. */
const WORKING_TRAIN_ARC_SPAN = 0.5;
const WORKING_BASE_RADIUS_PX = 1.6;
const WORKING_ORBIT_COUNT = 6;
const WORKING_ANGULAR_SPEED = 1.1;
/** How far an orbit's `weight` can push its dots' ink away from the shared
 * depth shading, so each of the six paths reads as its own band rather than
 * all of them blurring into one undifferentiated cloud. */
const WORKING_ORBIT_INK_SPREAD = 0.3;
/** However low an orbit's `weight` sits, its dots never fade past this floor. */
const WORKING_ORBIT_ALPHA_FLOOR = 0.65;
/** A train's trailing-most particle never fades past this floor, so the arc's
 * tail stays legible instead of thinning away to nothing. */
const WORKING_TRAIL_ALPHA_FLOOR = 0.35;

/** Every particle's own orbital plane, radius, pace and shading weight, keyed by its orbit. */
const workingOrbit = (
  orbit: number
): {
  tilt: number;
  roll: number;
  orbitRadiusFactor: number;
  speedFactor: number;
  weight: number;
} => {
  const seed = orbit * 31 + 7;
  return {
    tilt: (hashUnit(seed) - 0.5) * Math.PI,
    roll: hashUnit(seed + 3) * TWO_PI,
    orbitRadiusFactor: 0.5 + 0.45 * hashUnit(seed + 5),
    speedFactor: 0.6 + 1.3 * hashUnit(seed + 9),
    weight: 0.35 + 0.65 * hashUnit(seed + 15)
  };
};

export const working: ModeFn = (t, ctx) => {
  const sizing = modeSizing(ctx.size, ctx.density, ctx.dotScale);
  const origin = originOf(ctx);
  const worldRadius = worldRadiusOf(ctx);
  const trainCount = Math.max(WORKING_MIN_TRAINS[ctx.size], sizing.count(WORKING_TRAIN_BASE_COUNT));
  const arcStep = WORKING_TRAIN_ARC_SPAN / (WORKING_TRAIN_LENGTH - 1);

  const dots: Dot[] = [];
  for (let train = 0; train < trainCount; train += 1) {
    const orbit = workingOrbit(train % WORKING_ORBIT_COUNT);
    const leadPhase = hashUnit(train * 5 + 1) * TWO_PI;
    const leadAngle = leadPhase + t * WORKING_ANGULAR_SPEED * orbit.speedFactor;
    const orbitRadius = worldRadius * orbit.orbitRadiusFactor;

    for (let slot = 0; slot < WORKING_TRAIN_LENGTH; slot += 1) {
      const angle = leadAngle - slot * arcStep;
      const planar: Point3 = {
        x: Math.cos(angle) * orbitRadius,
        y: 0,
        z: Math.sin(angle) * orbitRadius
      };
      const tilted = rotateX(planar, orbit.tilt);
      const point = rotateZ(tilted, orbit.roll);
      const projected = project(point, origin, worldRadius);

      const seed = train * 13 + slot * 7 + 2;
      const trail = 1 - slot / (WORKING_TRAIN_LENGTH - 1);
      const ink =
        shadeByDepth(projected.depth) +
        (hashUnit(seed) - 0.5) * 0.08 -
        (orbit.weight - 0.5) * WORKING_ORBIT_INK_SPREAD;
      const alpha =
        (WORKING_TRAIL_ALPHA_FLOOR + (1 - WORKING_TRAIL_ALPHA_FLOOR) * trail) *
        (WORKING_ORBIT_ALPHA_FLOOR + (1 - WORKING_ORBIT_ALPHA_FLOOR) * orbit.weight);
      const radius = sizing.radius(WORKING_BASE_RADIUS_PX) * (0.75 + 0.5 * hashUnit(seed + 3));

      dots.push(toDot(projected, radius, ink, alpha));
    }
  }

  return { dots, strokes: [] };
};

// ---------------------------------------------------------------------------
// searching -- a dotted globe with a meridian band sweeping around it
// ---------------------------------------------------------------------------

const SEARCHING_BASE_COUNT = 150;
const SEARCHING_BASE_RADIUS_PX = 1.5;
const SEARCHING_BAND_HALF_WIDTH = 0.42;
const SEARCHING_SWEEP_SPEED = 1.15;
const SEARCHING_SPIN_SPEED = 0.18;
const SEARCHING_TILT = -0.55;
const SEARCHING_ARC_SEGMENTS = 10;
/** How much of the pole-to-pole range the band's guide arc spans, short of
 * the poles themselves so its end segments stay distinct marks rather than
 * converging to a single point. */
const SEARCHING_ARC_LATITUDE_SPAN = 0.92;
/** How much darker, more opaque and larger a dot gets the closer the sweep
 * passes over it, so the band reads as a clear lit stripe against the rest
 * of the dotted globe instead of a faint gradient. */
const SEARCHING_BAND_INK_BOOST = 0.75;
const SEARCHING_BAND_ALPHA_BOOST = 0.35;
const SEARCHING_BAND_RADIUS_BOOST = 1.3;
/** The guide arc itself: wide, dark and opaque so the sweep's leading edge
 * is legible on its own, not just via the dots it lifts. */
const SEARCHING_ARC_STROKE_RADIUS = 2.2;
const SEARCHING_ARC_INK = 0;
const SEARCHING_ARC_ALPHA = 0.7;

/** Shortest signed-free distance between two angles, always in 0..π. */
const angleDistance = (a: number, b: number): number => {
  const diff = Math.abs(a - b) % TWO_PI;
  return diff > Math.PI ? TWO_PI - diff : diff;
};

export const searching: ModeFn = (t, ctx) => {
  const sizing = modeSizing(ctx.size, ctx.density, ctx.dotScale);
  const origin = originOf(ctx);
  const worldRadius = worldRadiusOf(ctx);
  const count = sizing.count(SEARCHING_BASE_COUNT);
  const sweepAngle = t * SEARCHING_SWEEP_SPEED;

  const dots = Array.from({ length: count }, (_unused, i) => {
    const surface = sampleSphere(i, count, worldRadius);
    const tilted = rotateX(surface, SEARCHING_TILT);
    const point = rotateY(tilted, t * SEARCHING_SPIN_SPEED);

    const longitude = Math.atan2(point.z, point.x);
    const distance = angleDistance(longitude, sweepAngle);
    const lift = easeOutCubic(clamp01(1 - distance / SEARCHING_BAND_HALF_WIDTH));

    const projected = project(point, origin, worldRadius);
    const ink = shadeByDepth(projected.depth) - lift * SEARCHING_BAND_INK_BOOST;
    const alpha = 0.55 + projected.depth * 0.25 + lift * SEARCHING_BAND_ALPHA_BOOST;
    const radius =
      sizing.radius(SEARCHING_BASE_RADIUS_PX) * (1 + lift * SEARCHING_BAND_RADIUS_BOOST);

    return toDot(projected, radius, ink, alpha);
  });

  const arcPoints = Array.from({ length: SEARCHING_ARC_SEGMENTS + 1 }, (_unused, j) => {
    const latFrac = j / SEARCHING_ARC_SEGMENTS;
    const phi = (latFrac - 0.5) * Math.PI * SEARCHING_ARC_LATITUDE_SPAN;
    const point: Point3 = {
      x: Math.cos(phi) * Math.cos(sweepAngle) * worldRadius,
      y: Math.sin(phi) * worldRadius,
      z: Math.cos(phi) * Math.sin(sweepAngle) * worldRadius
    };
    return project(point, origin, worldRadius);
  });

  const strokeWidth = sizing.radius(SEARCHING_ARC_STROKE_RADIUS);
  const strokes = Array.from({ length: SEARCHING_ARC_SEGMENTS }, (_unused, j) =>
    toStroke(arcPoints[j], arcPoints[j + 1], strokeWidth, SEARCHING_ARC_INK, SEARCHING_ARC_ALPHA)
  );

  return { dots, strokes };
};

// ---------------------------------------------------------------------------
// solving -- tiers that snap a quarter turn out of alignment, hold scrambled,
// then resolve back, on a loop. Landmark dots and fixed seam rings make the
// misalignment legible: an otherwise-uniform, evenly-sampled dot texture
// looks identical under any rotation about the spin axis, so turning a
// "band" of it invisibly wouldn't read as scrambling at all.
// ---------------------------------------------------------------------------

const SOLVING_BASE_COUNT = 130;
const SOLVING_BASE_RADIUS_PX = 1.5;
const SOLVING_TIER_COUNT = 4;
const SOLVING_TURN_DURATION = 0.16;
const SOLVING_TURN_GAP = 0.3;
const SOLVING_HOLD_GAP = 0.55;
const SOLVING_TILT = -0.5;

/** Each tier carries this many oversized landmark dots at fixed, evenly
 * spaced longitudes, so a quarter turn visibly displaces a recognisable
 * cluster relative to its neighbours instead of only reshuffling texture
 * that looks the same before and after. */
const SOLVING_LANDMARKS_PER_TIER = 3;
const SOLVING_LANDMARK_RADIUS_PX = 3.1;
const SOLVING_LANDMARK_INK_BOOST = 0.45;
const SOLVING_LANDMARK_ALPHA = 0.9;

/** A static ring of short strokes at each cut between tiers, unaffected by
 * any turn, so the "cut into bands" structure reads even while the puzzle
 * sits solved and nothing is moving. */
const SOLVING_SEAM_SEGMENTS = 12;
const SOLVING_SEAM_STROKE_RADIUS = 1.05;
const SOLVING_SEAM_INK = 0.15;
const SOLVING_SEAM_ALPHA = 0.5;

const solvingTurnStart = (tier: number): number => tier * SOLVING_TURN_GAP;
const solvingTurnEnd = (tier: number): number => solvingTurnStart(tier) + SOLVING_TURN_DURATION;
const SOLVING_HOLD_START = solvingTurnEnd(SOLVING_TIER_COUNT - 1) + SOLVING_HOLD_GAP;
const solvingReturnStart = (tier: number): number =>
  SOLVING_HOLD_START + (SOLVING_TIER_COUNT - 1 - tier) * SOLVING_TURN_GAP;
const solvingReturnEnd = (tier: number): number => solvingReturnStart(tier) + SOLVING_TURN_DURATION;
/** Full snap-scramble-then-resolve length; the mode repeats every this many seconds. */
const SOLVING_CYCLE = solvingReturnEnd(0) + SOLVING_HOLD_GAP;

/** 0 (solved) snaps out to 1 (quarter-turned) and back. The snap out eases
 * only at its landing (a fast start reads as a sudden turn); the return to
 * solved eases at both ends, reading as a calmer resolve. */
const solvingTierTurn = (tier: number, cyclePos: number): number => {
  const turnStart = solvingTurnStart(tier);
  const turnEnd = solvingTurnEnd(tier);
  const returnStart = solvingReturnStart(tier);
  const returnEnd = solvingReturnEnd(tier);

  if (cyclePos <= turnStart) {
    return 0;
  }
  if (cyclePos < turnEnd) {
    return easeOutCubic((cyclePos - turnStart) / SOLVING_TURN_DURATION);
  }
  if (cyclePos < returnStart) {
    return 1;
  }
  if (cyclePos < returnEnd) {
    return 1 - easeInOutCubic((cyclePos - returnStart) / SOLVING_TURN_DURATION);
  }
  return 0;
};

const solvingTierOf = (yUnit: number): number =>
  clamp(Math.floor(((1 - yUnit) / 2) * SOLVING_TIER_COUNT), 0, SOLVING_TIER_COUNT - 1);

const solvingTierDirection = (tier: number): number => (hashUnit(tier * 53 + 21) < 0.5 ? -1 : 1);

/** The y-unit (-1..1) at the centre of a tier's latitude band. */
const solvingTierCenterYUnit = (tier: number): number => 1 - (2 * tier + 1) / SOLVING_TIER_COUNT;

/** The y-unit (-1..1) of the fixed cut between one tier and the next. */
const solvingSeamYUnit = (seam: number): number => 1 - (2 * (seam + 1)) / SOLVING_TIER_COUNT;

const solvingTurnAngle = (tier: number, cyclePos: number): number =>
  solvingTierTurn(tier, cyclePos) * solvingTierDirection(tier) * (Math.PI / 2);

export const solving: ModeFn = (t, ctx) => {
  const sizing = modeSizing(ctx.size, ctx.density, ctx.dotScale);
  const origin = originOf(ctx);
  const worldRadius = worldRadiusOf(ctx);
  const count = sizing.count(SOLVING_BASE_COUNT);
  const cyclePos = t - SOLVING_CYCLE * Math.floor(t / SOLVING_CYCLE);

  const texture = Array.from({ length: count }, (_unused, i) => {
    const surface = sampleSphere(i, count, worldRadius);
    const yUnit = worldRadius > 0 ? surface.y / worldRadius : 0;
    const tier = solvingTierOf(yUnit);
    const turned = rotateY(surface, solvingTurnAngle(tier, cyclePos));
    const point = rotateX(turned, SOLVING_TILT);
    const projected = project(point, origin, worldRadius);

    const ink = shadeByDepth(projected.depth);
    const alpha = 0.55 + 0.3 * hashUnit(i * 3 + 9);
    const radius = sizing.radius(SOLVING_BASE_RADIUS_PX);
    return toDot(projected, radius, ink, alpha);
  });

  const landmarks = Array.from(
    { length: SOLVING_TIER_COUNT * SOLVING_LANDMARKS_PER_TIER },
    (_unused, i) => {
      const tier = Math.floor(i / SOLVING_LANDMARKS_PER_TIER);
      const slot = i % SOLVING_LANDMARKS_PER_TIER;
      const yUnit = solvingTierCenterYUnit(tier);
      const y = yUnit * worldRadius;
      const ringRadius = Math.sqrt(Math.max(0, 1 - yUnit * yUnit)) * worldRadius;
      const phase = hashUnit(tier * 29 + 5) * TWO_PI;
      const longitude = phase + (slot / SOLVING_LANDMARKS_PER_TIER) * TWO_PI;
      const base: Point3 = {
        x: Math.cos(longitude) * ringRadius,
        y,
        z: Math.sin(longitude) * ringRadius
      };
      const turned = rotateY(base, solvingTurnAngle(tier, cyclePos));
      const point = rotateX(turned, SOLVING_TILT);
      const projected = project(point, origin, worldRadius);

      const ink = shadeByDepth(projected.depth) - SOLVING_LANDMARK_INK_BOOST;
      return toDot(
        projected,
        sizing.radius(SOLVING_LANDMARK_RADIUS_PX),
        ink,
        SOLVING_LANDMARK_ALPHA
      );
    }
  );

  const seamWidth = sizing.radius(SOLVING_SEAM_STROKE_RADIUS);
  const seams = Array.from({ length: SOLVING_TIER_COUNT - 1 }, (_unused, seam) => {
    const yUnit = solvingSeamYUnit(seam);
    const y = yUnit * worldRadius;
    const ringRadius = Math.sqrt(Math.max(0, 1 - yUnit * yUnit)) * worldRadius;
    const ringPoints = Array.from({ length: SOLVING_SEAM_SEGMENTS + 1 }, (_unusedPoint, j) => {
      const angle = (j / SOLVING_SEAM_SEGMENTS) * TWO_PI;
      const point: Point3 = {
        x: Math.cos(angle) * ringRadius,
        y,
        z: Math.sin(angle) * ringRadius
      };
      return project(rotateX(point, SOLVING_TILT), origin, worldRadius);
    });
    return Array.from({ length: SOLVING_SEAM_SEGMENTS }, (_unusedSegment, j) =>
      toStroke(ringPoints[j], ringPoints[j + 1], seamWidth, SOLVING_SEAM_INK, SOLVING_SEAM_ALPHA)
    );
  }).flat();

  return { dots: [...texture, ...landmarks], strokes: seams };
};

// ---------------------------------------------------------------------------
// listening -- stacked horizontal rings with a wave rolling through them
// ---------------------------------------------------------------------------

/** Fewer, fatter rings at the smaller presets read as distinct stacked bands;
 * six thin rings at 20px used to compress into a single smudge. */
const LISTENING_RING_COUNT: Record<ModeSize, number> = { 64: 5, 32: 4, 20: 3 };
const LISTENING_DOTS_PER_RING_BASE = 26;
/** A ring below this many dots reads as a loose cluster of points rather than
 * a line, especially once it is a small ellipse at 20px. */
const LISTENING_MIN_DOTS_PER_RING = 10;
const LISTENING_BASE_RADIUS_PX = 1.5;
const LISTENING_WAVE_SPEED = 0.6;
const LISTENING_SWELL = 0.55;
const LISTENING_LIFT_INK = 0.45;
const LISTENING_SPIN_SPEED = 0.12;
/** A ring's own vertical thickness once tilted is (its radius) x sin(tilt); a
 * ring near the equator is nearly as wide as the sphere itself, so even this
 * shallow a tilt must stay well under the gap between ring centres below or
 * neighbouring rings' ellipses swallow the empty space between them. Kept
 * shallow rather than flattened to zero so a ring still reads as an ellipse
 * seen slightly from above, not a flat line. */
const LISTENING_TILT = -0.13;
/** Rings are stacked between +/- this fraction of the world radius, short of
 * the poles so the top and bottom rings stay full circles, not points. */
const LISTENING_Y_SPAN = 0.82;

const listeningRing = (
  ring: number,
  ringCount: number,
  worldRadius: number
): { y: number; ringRadius: number; phase: number; wave: (t: number) => number } => {
  const yUnit = (-1 + (2 * ring + 1) / ringCount) * LISTENING_Y_SPAN;
  const y = yUnit * worldRadius;
  const ringRadius = Math.sqrt(Math.max(0, worldRadius * worldRadius - y * y));
  const phase = hashUnit(ring * 17 + 3) * TWO_PI;
  const wave = (t: number): number =>
    (Math.sin(TWO_PI * (ring / ringCount - t * LISTENING_WAVE_SPEED)) + 1) / 2;
  return { y, ringRadius, phase, wave };
};

export const listening: ModeFn = (t, ctx) => {
  const sizing = modeSizing(ctx.size, ctx.density, ctx.dotScale);
  const origin = originOf(ctx);
  const worldRadius = worldRadiusOf(ctx);
  const ringCount = LISTENING_RING_COUNT[ctx.size];
  const totalBase = ringCount * LISTENING_DOTS_PER_RING_BASE;
  const dotsPerRing = Math.max(
    LISTENING_MIN_DOTS_PER_RING,
    Math.round(sizing.count(totalBase) / ringCount)
  );

  const dots = Array.from({ length: ringCount }, (_unused, r) => {
    const ring = listeningRing(r, ringCount, worldRadius);
    const wave = ring.wave(t);

    return Array.from({ length: dotsPerRing }, (_unusedDot, k) => {
      const angle = (k / dotsPerRing) * TWO_PI + ring.phase;
      const planar: Point3 = {
        x: Math.cos(angle) * ring.ringRadius,
        y: ring.y,
        z: Math.sin(angle) * ring.ringRadius
      };
      const tilted = rotateX(planar, LISTENING_TILT);
      const point = rotateY(tilted, t * LISTENING_SPIN_SPEED);
      const projected = project(point, origin, worldRadius);

      const ink = shadeByDepth(projected.depth) - wave * LISTENING_LIFT_INK;
      const alpha = 0.6 + wave * 0.3;
      const radius = sizing.radius(LISTENING_BASE_RADIUS_PX) * (1 + wave * LISTENING_SWELL);

      return toDot(projected, radius, ink, alpha);
    });
  }).flat();

  return { dots, strokes: [] };
};
