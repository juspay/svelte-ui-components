<script lang="ts">
  import LineChart from '$lib/LineChart/LineChart.svelte';
  import type { ChartHighlightAPI } from '$lib/_chart/highlight';

  const monthLabels = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  const singleSeries = [
    {
      name: 'Revenue',
      data: [
        { x: 1, y: 30 },
        { x: 2, y: 45 },
        { x: 3, y: 38 },
        { x: 4, y: 52 },
        { x: 5, y: 48 },
        { x: 6, y: 61 },
        { x: 7, y: 55 },
        { x: 8, y: 72 },
        { x: 9, y: 68 },
        { x: 10, y: 80 },
        { x: 11, y: 75 },
        { x: 12, y: 90 }
      ]
    }
  ];

  const multiSeries = [
    {
      name: 'Product A',
      data: [
        { x: 1, y: 20 },
        { x: 2, y: 35 },
        { x: 3, y: 28 },
        { x: 4, y: 42 },
        { x: 5, y: 38 },
        { x: 6, y: 50 }
      ]
    },
    {
      name: 'Product B',
      data: [
        { x: 1, y: 10 },
        { x: 2, y: 25 },
        { x: 3, y: 40 },
        { x: 4, y: 30 },
        { x: 5, y: 45 },
        { x: 6, y: 55 }
      ]
    },
    {
      name: 'Product C',
      data: [
        { x: 1, y: 5 },
        { x: 2, y: 15 },
        { x: 3, y: 12 },
        { x: 4, y: 22 },
        { x: 5, y: 18 },
        { x: 6, y: 28 }
      ]
    }
  ];

  // ── Highlight hook demo ────────────────────────────────────────

  let highlightApi: ChartHighlightAPI | null = $state(null);
  let activeHighlightIndex = $state<number | null>(null);

  const onChartReady = (api: ChartHighlightAPI): void => {
    highlightApi = api;
  };

  const setHighlight = (index: number | null): void => {
    activeHighlightIndex = index;
    highlightApi?.highlight(index);
  };

  // ── xAxisCategories demo ───────────────────────────────────────

  const weekSeries = [
    {
      name: 'Sessions',
      data: [
        { x: 1, y: 1200 },
        { x: 2, y: 980 },
        { x: 3, y: 1450 },
        { x: 4, y: 1700 },
        { x: 5, y: 1350 },
        { x: 6, y: 900 },
        { x: 7, y: 750 }
      ]
    }
  ];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // ── showArea demo ──────────────────────────────────────────────

  const areaSeries = [
    {
      name: 'Conversions',
      color: '#6366f1',
      data: [
        { x: 1, y: 14 },
        { x: 2, y: 22 },
        { x: 3, y: 18 },
        { x: 4, y: 31 },
        { x: 5, y: 27 },
        { x: 6, y: 40 }
      ]
    }
  ];
</script>

<div class="page-header">
  <span class="category-badge">Data Visualization</span>
  <h1>LineChart</h1>
</div>

<p>
  A responsive SVG line chart for visualizing trends over continuous data. Supports multiple series,
  five curve interpolations, gradient fill, categorical x-axis labels, filled area with custom
  gradient, and an imperative highlight API for external orchestration.
</p>

<h3>Single Series</h3>
<div class="demo-row">
  <LineChart series={singleSeries} />
</div>

<h3>Multi-Series with Legend</h3>
<div class="demo-row">
  <LineChart series={multiSeries} showLegend />
</div>

<h3>Linear Curve (no smoothing)</h3>
<div class="demo-row">
  <LineChart series={singleSeries} curve="linear" />
</div>

<h3>Step Curve</h3>
<div class="demo-row">
  <LineChart series={singleSeries} curve="step" />
</div>

<h3>xAxisCategories — month labels</h3>
<p>
  Pass string category labels via <code>xAxisCategories</code>. The labels are mapped by index to
  the numeric x values used in the data (x=1 → index 0, x=2 → index 1, …).
</p>
<div class="demo-row">
  <LineChart series={singleSeries} xAxisCategories={monthLabels} />
</div>

<h3>xAxisCategories — weekday labels</h3>
<div class="demo-row">
  <LineChart series={weekSeries} xAxisCategories={dayLabels} showDots />
</div>

<h3>showArea — default gradient (series colour)</h3>
<p>
  Set <code>showArea</code> to fill the area under the line with a vertical gradient derived from the
  series colour.
</p>
<div class="demo-row">
  <LineChart series={areaSeries} showArea />
</div>

<h3>showArea + areaGradient — custom colours</h3>
<p>
  Provide <code>areaGradient</code> with <code>from</code> and <code>to</code> colour stops to use a fully
  custom vertical gradient fill.
</p>
<div class="demo-row">
  <LineChart
    series={areaSeries}
    showArea
    areaGradient={{ from: 'rgba(99,102,241,0.5)', to: 'rgba(99,102,241,0)' }}
  />
</div>

<h3>showArea + xAxisCategories</h3>
<div class="demo-row">
  <LineChart
    series={areaSeries}
    showArea
    areaGradient={{ from: 'rgba(99,102,241,0.4)', to: 'rgba(99,102,241,0)' }}
    xAxisCategories={['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6']}
  />
</div>

<h3>Highlight Hook — onChartReady + imperative API</h3>
<p>
  Use <code>onChartReady</code> to receive a <code>ChartHighlightAPI</code> with a
  <code>highlight(index)</code> method. The buttons below drive the chart externally, simulating a voice-narration
  or step-through orchestrator.
</p>
<div class="demo-row">
  <LineChart series={singleSeries} xAxisCategories={monthLabels} {onChartReady} showDots />
</div>
<div class="highlight-controls">
  {#each monthLabels as label, i (i)}
    <button
      class="highlight-btn"
      class:active={activeHighlightIndex === i}
      onclick={() => setHighlight(activeHighlightIndex === i ? null : i)}
    >
      {label}
    </button>
  {/each}
  <button class="highlight-btn clear-btn" onclick={() => setHighlight(null)}>Clear</button>
</div>

<h3>highlightedIndex — declarative prop</h3>
<p>
  Use the <code>highlightedIndex</code> prop to highlight a point declaratively (no callback needed).
  The chart dims all other points and draws the crosshair at the highlighted index.
</p>
<div class="demo-row">
  <LineChart series={singleSeries} xAxisCategories={monthLabels} highlightedIndex={5} showDots />
</div>

<h3>Legacy gradientFill (backward-compatible)</h3>
<div class="demo-row">
  <LineChart series={singleSeries} gradientFill />
</div>

<style>
  .highlight-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
  .highlight-btn {
    padding: 4px 12px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background: #f9fafb;
    cursor: pointer;
    font-size: 13px;
  }
  .highlight-btn.active {
    background: #6366f1;
    color: #fff;
    border-color: #6366f1;
  }
  .clear-btn {
    margin-left: 8px;
    background: #fee2e2;
    border-color: #fca5a5;
    color: #b91c1c;
  }
</style>
