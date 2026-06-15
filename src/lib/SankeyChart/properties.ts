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

export type SankeyTooltipContext =
  | { type: 'node'; node: SankeyNode; value: number }
  | { type: 'link'; link: SankeyLink };

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
  showValues?: boolean;
  showLabels?: boolean;
  aspectRatio?: number;
  valueFormat?: (value: number) => string;
  tooltipSnippet?: Snippet<[SankeyTooltipContext]>;
  empty?: Snippet;
  testId?: string;
  classes?: string;
};

export type SankeyChartEventProperties = {
  onnodeclick?: (event: { node: SankeyNode }) => void;
  onlinkclick?: (event: { link: SankeyLink }) => void;
  onnodehover?: (event: { node: SankeyNode } | null) => void;
  onlinkhover?: (event: { link: SankeyLink } | null) => void;
};
