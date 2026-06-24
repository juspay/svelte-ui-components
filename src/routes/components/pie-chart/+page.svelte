<script lang="ts">
  import PieChart from '$lib/PieChart/PieChart.svelte';
  import type { ChartHighlightAPI } from '$lib/_chart/highlight';

  const marketShare = [
    { label: 'Chrome', value: 65 },
    { label: 'Safari', value: 19 },
    { label: 'Firefox', value: 8 },
    { label: 'Edge', value: 5 },
    { label: 'Other', value: 3 }
  ];

  const expenses = [
    { label: 'Rent', value: 1200, color: '#4e79a7' },
    { label: 'Food', value: 600, color: '#f28e2b' },
    { label: 'Transport', value: 300, color: '#e15759' },
    { label: 'Utilities', value: 200, color: '#76b7b2' },
    { label: 'Entertainment', value: 150, color: '#59a14f' }
  ];

  // ── Highlight hook demo ────────────────────────────────────────
  let chartApi: ChartHighlightAPI | null = $state(null);
  let highlightedSlice = $state<number | null>(null);

  const handleChartReady = (api: ChartHighlightAPI) => {
    chartApi = api;
  };

  const highlightSlice = (index: number | null) => {
    highlightedSlice = index;
  };
</script>

<div class="page-header">
  <span class="category-badge">Data Visualization</span>
  <h1>PieChart</h1>
</div>

<h3>Basic Pie</h3>
<div class="demo-row" style="max-width: 400px;">
  <PieChart data={marketShare} />
</div>

<h3>Donut Chart</h3>
<div class="demo-row" style="max-width: 400px;">
  <PieChart data={marketShare} innerRadius={0.6} />
</div>

<h3>With Labels</h3>
<div class="demo-row" style="max-width: 500px;">
  <PieChart data={expenses} showLabels showValues labelPosition="outside" />
</div>

<h3>With Legend</h3>
<div class="demo-row" style="max-width: 400px;">
  <PieChart data={expenses} innerRadius={0.5} showLegend />
</div>

<h3>Delta Badge — positive change</h3>
<div class="demo-row" style="max-width: 400px;">
  <PieChart data={marketShare} innerRadius={0.6} changePercentage={12.5} />
</div>

<h3>Delta Badge — negative change (inverted colors for lower-is-better metric)</h3>
<div class="demo-row" style="max-width: 400px;">
  <PieChart data={expenses} changePercentage={-8.3} changeInvertColors />
</div>

<h3>Highlight Hook — declarative (highlightedIndex prop)</h3>
<div class="demo-row" style="max-width: 400px;">
  <div class="demo-controls">
    {#each marketShare as slice, i (i)}
      <button
        class="demo-btn"
        class:active={highlightedSlice === i}
        onclick={() => highlightSlice(highlightedSlice === i ? null : i)}
      >
        {slice.label}
      </button>
    {/each}
    <button class="demo-btn" onclick={() => highlightSlice(null)}>Clear</button>
  </div>
  <PieChart data={marketShare} innerRadius={0.55} highlightedIndex={highlightedSlice} />
</div>

<h3>Highlight Hook — imperative (onChartReady API)</h3>
<div class="demo-row" style="max-width: 400px;">
  <div class="demo-controls">
    {#each marketShare as slice, i (i)}
      <button class="demo-btn" onclick={() => chartApi?.highlight(i)}>
        {slice.label}
      </button>
    {/each}
    <button class="demo-btn" onclick={() => chartApi?.highlight(null)}>Clear</button>
  </div>
  <PieChart data={marketShare} innerRadius={0.55} onChartReady={handleChartReady} />
</div>

<h3>Delta Badge + Highlight combined</h3>
<div class="demo-row" style="max-width: 400px;">
  <PieChart
    data={expenses}
    innerRadius={0.6}
    showLegend
    legendShowValues
    changePercentage={5.2}
    highlightedIndex={0}
  />
</div>

<style>
  .demo-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  .demo-btn {
    padding: 4px 10px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background: #f9fafb;
    cursor: pointer;
    font-size: 13px;
  }
  .demo-btn.active {
    background: #3b82f6;
    color: #fff;
    border-color: #3b82f6;
  }
</style>
