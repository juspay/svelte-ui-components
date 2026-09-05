<script lang="ts">
  import BarChart from '$lib/BarChart/BarChart.svelte';
  import type { ChartHighlightAPI } from '$lib/_chart/highlight';

  const monthlyRevenue = [
    { label: 'Jan', value: 4200 },
    { label: 'Feb', value: 3800 },
    { label: 'Mar', value: 5100 },
    { label: 'Apr', value: 4600 },
    { label: 'May', value: 5800 },
    { label: 'Jun', value: 6200 }
  ];

  const coloredData = [
    { label: 'Product A', value: 320, color: '#4e79a7' },
    { label: 'Product B', value: 580, color: '#f28e2b' },
    { label: 'Product C', value: 410, color: '#e15759' },
    { label: 'Product D', value: 290, color: '#76b7b2' }
  ];

  const horizontalData = [
    { label: 'Engineering', value: 42 },
    { label: 'Design', value: 18 },
    { label: 'Marketing', value: 24 },
    { label: 'Sales', value: 31 },
    { label: 'Support', value: 15 }
  ];

  // ── normaliseToFirstPoint demo ─────────────────────────────────

  const growthSeries = [
    {
      name: 'Revenue',
      data: [
        { label: 'Q1', value: 1000 },
        { label: 'Q2', value: 1400 },
        { label: 'Q3', value: 1250 },
        { label: 'Q4', value: 1800 }
      ]
    },
    {
      name: 'Users',
      data: [
        { label: 'Q1', value: 200 },
        { label: 'Q2', value: 340 },
        { label: 'Q3', value: 310 },
        { label: 'Q4', value: 520 }
      ]
    }
  ];

  // ── topN + overflowLabel demo ──────────────────────────────────

  const manyCategories = [
    { label: 'Electronics', value: 9400 },
    { label: 'Clothing', value: 7200 },
    { label: 'Home & Garden', value: 5800 },
    { label: 'Sports', value: 4100 },
    { label: 'Toys', value: 3300 },
    { label: 'Books', value: 2600 },
    { label: 'Beauty', value: 2100 },
    { label: 'Food', value: 1800 },
    { label: 'Automotive', value: 1400 },
    { label: 'Music', value: 900 }
  ];

  // ── hideBarGraphics demo ───────────────────────────────────────

  const labelOnlyData = [
    { label: 'Alpha', value: 75 },
    { label: 'Beta', value: 50 },
    { label: 'Gamma', value: 90 }
  ];

  // ── valueLabel demo ─────────────────────────────────────────────

  const funnelWithValueLabel = [
    { label: 'Visited', value: 5000, valueLabel: '5,000 visits' },
    { label: 'Signed up', value: 1200 },
    { label: 'Purchased', value: 340 },
    // An empty valueLabel is treated the same as an absent one — falls back to valueFormat(value).
    { label: 'Refunded', value: 28, valueLabel: '' }
  ];

  // ── onChartReady + declarative highlightedIndex demo ──────────

  let highlightApi: ChartHighlightAPI | null = $state(null);
  let declarativeHighlight = $state<number | null>(null);
  let apiHighlightStep = $state(0);

  const handleChartReady = (api: ChartHighlightAPI) => {
    highlightApi = api;
  };

  const cycleApiHighlight = () => {
    if (highlightApi === null) {
      return;
    }
    const categories = highlightApi.getCategories();
    const nextStep = (apiHighlightStep + 1) % (categories.length + 1);
    apiHighlightStep = nextStep;
    highlightApi.highlight(nextStep < categories.length ? nextStep : null);
  };
</script>

<div class="page-header">
  <span class="category-badge">Data Visualization</span>
  <h1>BarChart</h1>
</div>

<p class="intro">
  A responsive SVG bar chart for comparing categorical values. Supports vertical and horizontal
  orientations, single or multi-series data (grouped/stacked), value labels, custom fills, hover
  tooltips, and click events. New capabilities include declarative and imperative bar highlighting,
  first-point normalisation, top-N clipping with overflow aggregation, and a graphics-free
  legend/label-only mode.
</p>

<h3>Basic</h3>
<div class="demo-row">
  <BarChart data={monthlyRevenue} />
</div>

<h3>With Values</h3>
<div class="demo-row">
  <BarChart data={monthlyRevenue} showValues />
</div>

<h3>Custom Colors</h3>
<div class="demo-row">
  <BarChart data={coloredData} showValues />
</div>

<h3>Horizontal</h3>
<div class="demo-row">
  <BarChart data={horizontalData} orientation="horizontal" />
</div>

<h3>Highlight — Declarative (<code>highlightedIndex</code>)</h3>
<p>
  Clicking a button below sets <code>highlightedIndex</code> directly. The highlighted bar stays at
  full opacity while others dim. Set to <code>null</code> to clear.
</p>
<div class="demo-row">
  <div class="demo-controls">
    {#each monthlyRevenue as point, idx (idx)}
      <button
        class="demo-btn"
        class:active={declarativeHighlight === idx}
        onclick={() => {
          declarativeHighlight = declarativeHighlight === idx ? null : idx;
        }}
      >
        {point.label}
      </button>
    {/each}
    <button
      class="demo-btn"
      onclick={() => {
        declarativeHighlight = null;
      }}
    >
      Clear
    </button>
  </div>
  <BarChart data={monthlyRevenue} showValues highlightedIndex={declarativeHighlight} />
</div>

<h3>Highlight — Imperative (<code>onChartReady</code>)</h3>
<p>
  The chart fires <code>onChartReady</code> on mount with a <code>ChartHighlightAPI</code> handle.
  Call <code>api.highlight(index)</code> externally (e.g. from a voice narrator or a sibling component).
</p>
<div class="demo-row">
  <div class="demo-controls">
    <button class="demo-btn" onclick={cycleApiHighlight}>
      Cycle highlight (step {apiHighlightStep})
    </button>
  </div>
  <BarChart data={monthlyRevenue} onchartready={handleChartReady} />
</div>

<h3>Normalise to First Point (<code>normaliseToFirstPoint</code>)</h3>
<p>
  Each series' values are expressed as a percentage of its first data point (baseline = 100). This
  makes relative growth comparable across series with very different starting magnitudes.
</p>
<div class="demo-row">
  <BarChart series={growthSeries} groupMode="grouped" showLegend showValues normaliseToFirstPoint />
</div>

<h3>Top-N Clipping (<code>topN</code> + <code>overflowLabel</code>)</h3>
<p>
  Only the top 4 categories by value are shown individually. The remaining 6 are summed into a
  single bar labelled "Other".
</p>
<div class="demo-row">
  <BarChart data={manyCategories} topN={4} overflowLabel="Other" showValues />
</div>

<h3>Hide Bar Graphics (<code>hideBarGraphics</code>)</h3>
<p>
  Bar rectangles are not rendered. Axis labels, gridlines, and any legend remain visible. Useful for
  legend-only or label-only companion views.
</p>
<div class="demo-row">
  <BarChart data={labelOnlyData} hideBarGraphics showXAxis showYAxis showGridlines />
</div>

<h3>Per-bar value label override (<code>valueLabel</code>)</h3>
<p>
  A data point's non-empty <code>valueLabel</code> renders verbatim as its value label, overriding
  the default
  <code>valueFormat(value)</code>
  output for that bar only. Other bars — including any whose
  <code>valueLabel</code> is an empty string — keep going through the normal formatter.
</p>
<div class="demo-row">
  <BarChart data={funnelWithValueLabel} showValues testId="bar-value-label-chart" />
</div>

<h3>Labels near the axis max (outside → inside flip)</h3>
<div class="demo-row">
  <BarChart
    data={[
      { label: 'North', value: 9800 },
      { label: 'South', value: 4200 },
      { label: 'East', value: 10000 },
      { label: 'West', value: 150 }
    ]}
    yDomain={[0, 10000]}
    showValues={true}
    testId="bar-inside-flip-chart"
  />
</div>

<h3>Crowded categories (rotate → thin)</h3>
<div class="demo-row">
  <BarChart
    data={Array.from({ length: 18 }, (_, i) => ({
      label: `Category name ${i + 1}`,
      value: 100 + ((i * 37) % 400)
    }))}
    testId="bar-crowded-chart"
  />
</div>

<h3>Interactive legend (3 series × 4 categories)</h3>
<div class="demo-row">
  <BarChart
    series={[
      {
        name: 'Alpha',
        data: [
          { label: 'Q1', value: 120 },
          { label: 'Q2', value: 180 },
          { label: 'Q3', value: 140 },
          { label: 'Q4', value: 210 }
        ]
      },
      {
        name: 'Beta',
        data: [
          { label: 'Q1', value: 90 },
          { label: 'Q2', value: 130 },
          { label: 'Q3', value: 170 },
          { label: 'Q4', value: 110 }
        ]
      },
      {
        name: 'Gamma',
        data: [
          { label: 'Q1', value: 60 },
          { label: 'Q2', value: 80 },
          { label: 'Q3', value: 100 },
          { label: 'Q4', value: 95 }
        ]
      }
    ]}
    showLegend={true}
    interactiveLegend={true}
    testId="bar-legend-toggle-chart"
  />
</div>

<style>
  .intro {
    max-width: 680px;
    margin-bottom: 24px;
  }
  .demo-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  .demo-btn {
    padding: 6px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #f5f5f5;
    cursor: pointer;
  }
  .demo-btn.active {
    background: #3b82f6;
    color: #fff;
    border-color: #2563eb;
  }
</style>
