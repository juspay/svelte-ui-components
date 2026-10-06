/**
 * Chart-level accessible naming shared by the seven chart families.
 *
 * A chart drawing needs a name of its own: a name on some wrapper elsewhere does
 * not name the `<svg>` inside it (axe still reports `svg-img-alt` on the
 * unnamed image), and a screen-reader user tabbing between data points has no
 * other way to learn which chart a point belongs to. The consumer's
 * `ariaLabel` always wins; this supplies the name only when none was given, so
 * an unlabelled chart is at least identifiable by what it plots.
 */

export type ChartKind = 'line' | 'area' | 'bar' | 'pie' | 'sankey' | 'dual-axis' | 'funnel';

const NOUN: Record<ChartKind, string> = {
  line: 'line chart',
  area: 'area chart',
  bar: 'bar chart',
  pie: 'pie chart',
  sankey: 'flow diagram',
  'dual-axis': 'dual-axis chart',
  funnel: 'funnel chart'
};

export type ChartNameParts = {
  yAxisLabel?: string;
  seriesNames?: readonly string[];
};

/**
 * Name used when the consumer passes no `ariaLabel`.
 *
 * `"{yAxisLabel} bar chart"` is the spelling BarChart has always put on its
 * wrapping region, so a chart that already had a named region keeps the same
 * words. Without a y-axis title, named series are listed (`"Line chart:
 * Revenue, Cost"`); with neither, only the kind of chart is known.
 */
export function defaultChartName(kind: ChartKind, parts: ChartNameParts): string {
  const noun = NOUN[kind];
  const yAxisLabel = typeof parts.yAxisLabel === 'string' ? parts.yAxisLabel.trim() : '';
  if (yAxisLabel !== '') {
    return `${yAxisLabel} ${noun}`;
  }
  const names = (parts.seriesNames ?? []).map((name) => name.trim()).filter((name) => name !== '');
  const title = noun.charAt(0).toUpperCase() + noun.slice(1);
  return names.length > 0 ? `${title}: ${names.join(', ')}` : title;
}

/**
 * The consumer's non-blank `ariaLabel`, else the derived fallback. `unknown`
 * because the prop is optional and an element attribute can hand over anything.
 */
export function resolveChartName(ariaLabel: unknown, fallback: string): string {
  return typeof ariaLabel === 'string' && ariaLabel.trim() !== '' ? ariaLabel : fallback;
}
