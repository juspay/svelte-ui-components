import type { Snippet } from 'svelte';

export type SankeyNode = {
  id: string;
  label?: string;
  color?: string;
};

export type SankeyLink = {
  source: string;
  target: string;
  value: number;
  color?: string;
};

/**
 * Context passed to the `tooltipSnippet` prop on each hover event.
 *
 * The `'link'` branch gained three new optional fields (`sourceLabel`, `targetLabel`,
 * `percentage`) in this release. They are always populated by the chart — the fields are
 * typed optional so that existing consumer code that typed a variable explicitly as
 * `{ type: 'link'; link: SankeyLink }` continues to compile without changes.
 */
export type SankeyTooltipContext =
  | { type: 'node'; node: SankeyNode; value: number }
  | {
      type: 'link';
      link: SankeyLink;
      /** Human-readable label of the source node (falls back to node id when label is undefined). Always present at runtime. */
      sourceLabel?: string;
      /** Human-readable label of the target node (falls back to node id when label is undefined). Always present at runtime. */
      targetLabel?: string;
      /** link.value as a percentage of the source node's total outgoing value (0–100, rounded to 2 dp). Always present at runtime. */
      percentage?: number;
    };

export type SankeyChartProperties = MandatorySankeyChartProperties &
  OptionalSankeyChartProperties &
  SankeyChartEventProperties;

export type MandatorySankeyChartProperties = {
  nodes: SankeyNode[];
  links: SankeyLink[];
};

export type OptionalSankeyChartProperties = {
  nodeWidth?: number;
  nodePadding?: number;
  iterations?: number;
  /**
   * Corner radius on each node rect in pixels. Defaults to
   * `DEFAULT_CHART_CORNER_RADIUS` (4), mirroring the design system's base
   * `--radius` token. SVG `rx`/`ry` cannot read CSS `var()`, so pass this
   * prop explicitly to track a changed `--radius` at runtime.
   */
  radius?: number;
  showValues?: boolean;
  showLabels?: boolean;
  aspectRatio?: number;
  maxHeight?: number;
  valueFormat?: (value: number) => string;
  tooltipSnippet?: Snippet<[SankeyTooltipContext]>;
  empty?: Snippet;
  testId?: string;
  classes?: string;
  /** Labels rendered above each column, indexed by column position (0-based). */
  columnLabels?: string[];
  /**
   * Called for each node and also for link strokes (links inherit the resolved source-node
   * colour). Return a CSS colour string to override the default palette, or `null` to fall
   * through to the default palette colour.
   */
  nodeColorResolver?: (id: string, label: string | null) => string | null;
  /**
   * Minimum rendered thickness (px) for any link or node bar. Tiny flows that would otherwise
   * collapse to sub-pixel widths remain at this thickness so they stay visually discoverable.
   * Defaults to `1`. Lighthouse uses `2` for dense payment-flow diagrams.
   */
  minLinkWidth?: number;
  /**
   * Horizontal offset in pixels applied to every node data-label, relative to the default
   * position (left of first-column nodes, right of all other nodes). Positive values push
   * the label further away from the node; negative values pull it closer. Lighthouse uses
   * `30` to create breathing room between the node bar and its label.
   */
  dataLabelOffsetX?: number;
  /**
   * When `true`, hovering a node does **not** dim unrelated nodes — all nodes and links
   * remain at full opacity. Useful for dense diagrams where the dimming effect makes it hard
   * to read the overall structure. Defaults to `false` (standard dim-on-hover behaviour).
   */
  disableDimOnHover?: boolean;
  /**
   * Which side of a first-column node its label renders on. `'left'` (default) anchors the
   * label into a reserved left gutter outside the diagram. `'right'` renders it like every
   * other column — to the right of the bar, over the outgoing ribbons (pair with the
   * `--sankey-label-halo-*` tokens for legibility); no left gutter is reserved, so the
   * diagram gains that width.
   */
  firstColumnLabelSide?: 'left' | 'right';
};

export type SankeyChartEventProperties = {
  onnodeclick?: (event: { node: SankeyNode }) => void;
  onlinkclick?: (event: { link: SankeyLink }) => void;
  onnodehover?: (event: { node: SankeyNode } | null) => void;
  onlinkhover?: (event: { link: SankeyLink } | null) => void;
};
