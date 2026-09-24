/**
 * The two "network" modes: `connecting` draws a small graph of nodes on a
 * sphere with pulses running its edges, and `weaving` draws three strands
 * braided around a sphere. Both are built from the same handful of points
 * placed on a sphere and rotated over time, so they share their sizing and
 * projection setup below.
 */

import type { Dot, Frame, ModeContext, ModeFn, Stroke } from '../types';
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

const NODE_BASE_COUNT = 16;
const MIN_NODE_COUNT = 6;
const NEIGHBOR_COUNT = 3;
const NODE_BASE_RADIUS = 3.4;
const PULSE_BASE_RADIUS = 2;
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
// weaving -- three strands spiralling from top to bottom around a sphere, offset
// in phase so they interleave; the depth sort in `paintFrame` is what makes
// them cross over and under each other.
// ---------------------------------------------------------------------------

const STRAND_COUNT = 3;
const STRAND_POINTS_BASE_COUNT = 26;
const MIN_STRAND_POINTS = 10;
/** Lower than a bare spiral would use: the braid swing below is what supplies
 * the winding, so the longitude term only needs to carry the strands most of
 * the way around, not add its own extra turns on top. */
const STRAND_WRAPS = 1.1;
const STRAND_ROTATE_SPEED = 0.3;
const STRAND_TILT = 0.5;
const STRAND_DOT_BASE_RADIUS = 1.6;
const STRAND_STROKE_BASE_WIDTH = 1.4;
/** How many times a strand swings past its neighbours along its own pole-to-
 * pole length -- enough that a still frame always lands inside more than one
 * crossing, not so many the braid blurs into texture. */
const STRAND_BRAID_CYCLES = 2.5;
/** A constant 120-degree offset alone keeps the three strands in the same
 * relative order the whole way, which reads as one thick spiral rather than
 * three distinct ones. Two strands only visibly swap places, i.e. actually
 * cross, once the swing below overtakes half their 120-degree separation;
 * this sits comfortably past that so every pair of strands crosses, not just
 * wobbles toward each other. */
const STRAND_BRAID_SWING = 1.3;

const strandBaseAngle = (strand: number): number => (strand / STRAND_COUNT) * Math.PI * 2;

/**
 * The `pointIndex`-th of `pointsPerStrand` points of `strand`, spiralling
 * from the top of the sphere to the bottom. Each strand's longitude oscillates around its own
 * 120-degree slot (the braid swing) on top of the shared spiral term, so
 * strands actually change places rather than staying a fixed distance apart;
 * folding `t` into the shared longitude term spins the whole braid rigidly,
 * which is what keeps every point exactly on the sphere at every instant.
 */
const strandPoint = (
  strand: number,
  pointIndex: number,
  pointsPerStrand: number,
  sphereRadius: number,
  t: number
): Point3 => {
  const u = pointIndex / (pointsPerStrand - 1);
  const phi = u * Math.PI - Math.PI / 2;
  const y = sphereRadius * Math.sin(phi);
  const ringRadius = sphereRadius * Math.cos(phi);
  const base = strandBaseAngle(strand);
  const swing = STRAND_BRAID_SWING * Math.sin(u * STRAND_BRAID_CYCLES * Math.PI * 2 + base);
  const theta = u * STRAND_WRAPS * Math.PI * 2 + base + swing + t * STRAND_ROTATE_SPEED;
  const spun: Point3 = { x: ringRadius * Math.cos(theta), y, z: ringRadius * Math.sin(theta) };
  return rotateX(spun, STRAND_TILT);
};

/** Three strands wrapped around a sphere, crossing as they spiral from top to bottom. */
export const weaving: ModeFn = (t, ctx): Frame => {
  const { sizing, originPx, sphereRadius } = sphereGeometry(ctx);
  const pointsPerStrand = Math.max(MIN_STRAND_POINTS, sizing.count(STRAND_POINTS_BASE_COUNT));

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
      radius: sizing.radius(STRAND_DOT_BASE_RADIUS),
      ink: clamp01(1 - p.depth * 0.8 + strand * 0.08),
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
        width: sizing.radius(STRAND_STROKE_BASE_WIDTH),
        ink: clamp01(1 - depth * 0.75 + strand * 0.06),
        alpha: 0.6 + depth * 0.35
      };
    })
  );

  return { dots, strokes };
};
