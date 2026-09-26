/**
 * The two "network" modes: `connecting` draws a small graph of nodes on a
 * sphere with pulses running its edges, and `weaving` draws three strands
 * braided around a sphere. Both are built from the same handful of points
 * placed on a sphere and rotated over time, so they share their sizing and
 * projection setup below.
 */

import type { Dot, Frame, ModeContext, ModeFn, ModeSize, Stroke } from '../types';
import type { ModeSizing, Point3 } from '../space';
import { hashUnit, modeSizing, project, rotateX, rotateY, sampleSphere } from '../space';

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/** Both modes read as a sphere of this radius, centred in the canvas -- the spec's ~40% of `size`. */
const SPHERE_RADIUS_RATIO = 0.4;

type SphereGeometry = {
  sizing: ModeSizing;
  originPx: number;
  sphereRadius: number;
};

/** The count/radius scaler, canvas centre and world sphere radius every mode below draws into. */
const sphereGeometry = (ctx: ModeContext): SphereGeometry => ({
  sizing: modeSizing(ctx.size, ctx.density, ctx.dotScale),
  originPx: ctx.size / 2,
  sphereRadius: ctx.size * SPHERE_RADIUS_RATIO
});

const squaredDistance = (a: Point3, b: Point3): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
};

// ---------------------------------------------------------------------------
// connecting -- a few nodes on a sphere, linked to their nearest neighbours,
// with small bright pulses running along the links.
// ---------------------------------------------------------------------------

/** A few nodes, not a molecule: at 16 nodes x 3 neighbours the 64px graph carried ~24 edges, each
 * with its own pulse, and the pulses were lost among the nodes. */
const NODE_BASE_COUNT = 10;
const MIN_NODE_COUNT = 6;
const NEIGHBOR_COUNT = 2;
const NODE_BASE_RADIUS = 3.4;
/** Well under a node's radius, so a pulse reads as something travelling a link, not another node. */
const PULSE_BASE_RADIUS = 1.4;
const EDGE_BASE_WIDTH = 1.1;
const NODE_ROTATE_SPEED = 0.35;
const NODE_TILT = 0.45;
const EDGE_FLICKER_SPEED = 0.5;
const EDGE_MIN_ALPHA = 0.25;
const PULSE_SPEED = 0.6;

/**
 * Every unordered pair `(i, j)` where `j` is one of `i`'s `perNode` closest
 * points (by straight-line distance), deduplicated so a mutual pair is only
 * one edge. `points` are pre-rotation world positions: a rigid rotation
 * never changes which points are nearest, so the graph itself can be built
 * once per frame from them and stay stable as the sphere spins.
 */
const nearestNeighborEdges = (
  points: readonly Point3[],
  perNode: number
): ReadonlyArray<readonly [number, number]> => {
  const indices = points.map((_, index) => index);
  const candidates: ReadonlyArray<readonly [number, number]> = indices.flatMap((i) =>
    indices
      .filter((j) => j !== i)
      .sort((a, b) => squaredDistance(points[i], points[a]) - squaredDistance(points[i], points[b]))
      .slice(0, perNode)
      .map((j): readonly [number, number] => (i < j ? [i, j] : [j, i]))
  );
  return candidates.filter(
    ([a, b], index) => candidates.findIndex(([x, y]) => x === a && y === b) === index
  );
};

/** A few nodes on a sphere; lines to near neighbours carry small travelling pulses. */
export const connecting: ModeFn = (t, ctx): Frame => {
  const { sizing, originPx, sphereRadius } = sphereGeometry(ctx);
  const nodeCount = Math.max(MIN_NODE_COUNT, sizing.count(NODE_BASE_COUNT));

  const basePoints = Array.from({ length: nodeCount }, (_, index) =>
    sampleSphere(index, nodeCount, sphereRadius)
  );
  const projected = basePoints
    .map((point) => rotateX(point, NODE_TILT))
    .map((point) => rotateY(point, t * NODE_ROTATE_SPEED))
    .map((point) => project(point, originPx, sphereRadius));

  const nodeDots: Dot[] = projected.map((p) => ({
    x: p.x,
    y: p.y,
    depth: p.depth,
    radius: sizing.radius(NODE_BASE_RADIUS),
    ink: clamp01(1 - p.depth * 0.85),
    alpha: 0.5 + p.depth * 0.45
  }));

  const edges = nearestNeighborEdges(basePoints, NEIGHBOR_COUNT);

  const strokes: Stroke[] = edges.map(([a, b], index) => {
    const pa = projected[a];
    const pb = projected[b];
    const depth = (pa.depth + pb.depth) / 2;
    const flicker =
      0.5 +
      0.5 *
        Math.sin(t * EDGE_FLICKER_SPEED * Math.PI * 2 + hashUnit(index * 97 + 11) * Math.PI * 2);
    return {
      x1: pa.x,
      y1: pa.y,
      x2: pb.x,
      y2: pb.y,
      depth,
      width: sizing.radius(EDGE_BASE_WIDTH),
      ink: clamp01(1 - depth * 0.7),
      alpha: EDGE_MIN_ALPHA + (1 - EDGE_MIN_ALPHA) * flicker
    };
  });

  const pulses: Dot[] = edges.map(([a, b], index) => {
    const pa = projected[a];
    const pb = projected[b];
    const travel =
      0.5 + 0.5 * Math.sin(t * PULSE_SPEED * Math.PI * 2 + hashUnit(index * 53 + 7) * Math.PI * 2);
    return {
      x: pa.x + (pb.x - pa.x) * travel,
      y: pa.y + (pb.y - pa.y) * travel,
      depth: pa.depth + (pb.depth - pa.depth) * travel,
      radius: sizing.radius(PULSE_BASE_RADIUS),
      ink: 0.05,
      alpha: 0.9
    };
  });

  return { dots: [...nodeDots, ...pulses], strokes };
};

// ---------------------------------------------------------------------------
// weaving -- three closed strands wrapped around a sphere like the windings on
// a ball of yarn; the depth sort in `paintFrame` is what makes them cross over
// and under each other.
// ---------------------------------------------------------------------------

const STRAND_COUNT = 3;
/** Points around each closed strand at 64px, through `countAlongPath`. */
const STRAND_POINTS_BASE_COUNT = 40;
/** Enough points that a strand still draws as a curve at 20px; at 10 its segments were long
 * enough to show as straight edges and the three strands drew an angular cage. */
const MIN_STRAND_POINTS = 16;
/** Each strand is a great circle tilted this far off the horizontal, and the three are turned
 * 120 degrees apart about the vertical axis, so every pair crosses twice per turn. A pole-to-pole
 * spiral kept projecting two strands onto nearly the same path. */
const STRAND_INCLINATION = 0.6;
/** A slow wave running along each strand, so the three read as threads being worked rather than
 * three rigid hoops. Small, so the wave never folds a strand across its neighbour's path. */
const STRAND_WAVE_COUNT = 3;
const STRAND_WAVE_AMPLITUDE = 0.12;
const STRAND_WAVE_SPEED = 0.9;
const STRAND_ROTATE_SPEED = 0.3;
/** How far the camera looks down on the sphere: 1.1 rad, about 63 degrees. A ring turns edge-on,
 * and draws as a straight bar, when its axis is square to the line of sight. Each ring's axis sits
 * STRAND_INCLINATION (about 34 degrees) off vertical, and this tilt leaves the vertical about
 * 90 - 63 = 27 degrees off the line of sight, so a ring's axis is never more than 34 + 27 = 61
 * degrees off it. No spin angle, and so no paused frame, draws a ring flatter than about
 * cos 61 = 48% of its width. */
const STRAND_TILT = 1.1;
const STRAND_DOT_BASE_RADIUS = 1.6;
const STRAND_STROKE_BASE_WIDTH = 1.4;
/** At the small sizes the strand lines carry the motif and the beads only clutter it, so lines
 * thicken and beads shrink as the canvas does. */
const STRAND_STROKE_SIZE_FACTOR: Record<ModeSize, number> = { 64: 1, 32: 1.2, 20: 1.5 };
const STRAND_DOT_SIZE_FACTOR: Record<ModeSize, number> = { 64: 1, 32: 0.85, 20: 0.7 };
/** Depth still dims a strand's far side, but only this far, so no stretch of it disappears. */
const STRAND_DEPTH_INK = 0.45;
/** A slight per-strand shade; the paths and their over/under crossings are what separate them. */
const STRAND_SHADE_STEP = 0.1;

const strandBaseAngle = (strand: number): number => (strand / STRAND_COUNT) * Math.PI * 2;

/**
 * The `pointIndex`-th of `pointsPerStrand` points around closed `strand`: a
 * great circle (the first and last points meet) with a small wave in latitude
 * travelling along it, inclined by `STRAND_INCLINATION`, turned to its own
 * 120-degree slot and spun with the rest. Latitude and longitude keep every
 * point exactly on the sphere, whatever the wave does.
 */
const strandPoint = (
  strand: number,
  pointIndex: number,
  pointsPerStrand: number,
  sphereRadius: number,
  t: number
): Point3 => {
  const u = (pointIndex / (pointsPerStrand - 1)) * Math.PI * 2;
  const latitude =
    STRAND_WAVE_AMPLITUDE *
    Math.sin(u * STRAND_WAVE_COUNT + t * STRAND_WAVE_SPEED + strandBaseAngle(strand));
  const onCircle: Point3 = {
    x: sphereRadius * Math.cos(latitude) * Math.cos(u),
    y: sphereRadius * Math.sin(latitude),
    z: sphereRadius * Math.cos(latitude) * Math.sin(u)
  };
  const inclined = rotateX(onCircle, STRAND_INCLINATION);
  const turned = rotateY(inclined, strandBaseAngle(strand) + t * STRAND_ROTATE_SPEED);
  return rotateX(turned, STRAND_TILT);
};

/** Three closed strands wrapped around a sphere, crossing over and under each other as they turn. */
export const weaving: ModeFn = (t, ctx): Frame => {
  const { sizing, originPx, sphereRadius } = sphereGeometry(ctx);
  const pointsPerStrand = Math.max(
    MIN_STRAND_POINTS,
    sizing.countAlongPath(STRAND_POINTS_BASE_COUNT)
  );

  const strands = Array.from({ length: STRAND_COUNT }, (_, strand) =>
    Array.from({ length: pointsPerStrand }, (_, pointIndex) =>
      project(
        strandPoint(strand, pointIndex, pointsPerStrand, sphereRadius, t),
        originPx,
        sphereRadius
      )
    )
  );

  const dots: Dot[] = strands.flatMap((points, strand) =>
    points.map((p) => ({
      x: p.x,
      y: p.y,
      depth: p.depth,
      radius: sizing.radius(STRAND_DOT_BASE_RADIUS) * STRAND_DOT_SIZE_FACTOR[ctx.size],
      ink: clamp01((1 - p.depth) * STRAND_DEPTH_INK + strand * STRAND_SHADE_STEP),
      alpha: 0.55 + p.depth * 0.4
    }))
  );

  const strokes: Stroke[] = strands.flatMap((points, strand) =>
    points.slice(1).map((p, i) => {
      const previous = points[i];
      const depth = (previous.depth + p.depth) / 2;
      return {
        x1: previous.x,
        y1: previous.y,
        x2: p.x,
        y2: p.y,
        depth,
        width: sizing.radius(STRAND_STROKE_BASE_WIDTH) * STRAND_STROKE_SIZE_FACTOR[ctx.size],
        ink: clamp01((1 - depth) * STRAND_DEPTH_INK + strand * STRAND_SHADE_STEP),
        alpha: 0.6 + depth * 0.35
      };
    })
  );

  return { dots, strokes };
};
