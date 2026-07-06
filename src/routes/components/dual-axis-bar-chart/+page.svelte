<script lang="ts">
  import DualAxisBarChart from '$lib/DualAxisBarChart/DualAxisBarChart.svelte';
  import type { DualAxisTooltipContext } from '$lib/DualAxisBarChart/properties';

  // ── Demo 1: Revenue (columns, left) + CTR (line, right) ────────

  const monthlyCategories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  const revenueCtrSeries = [
    {
      name: 'Revenue ($)',
      data: [42000, 38500, 51200, 46800, 58300, 62100],
      yAxisIndex: 0 as const,
      type: 'column' as const,
      color: '#4e79a7'
    },
    {
      name: 'CTR (%)',
      data: [3.2, 2.8, 4.1, 3.7, 4.8, 5.2],
      yAxisIndex: 1 as const,
      type: 'line' as const,
      color: '#f28e2b'
    }
  ];

  // ── Demo 2: Orders (columns, left) + Avg Order Value (columns, right) ──

  const ordersSeries = [
    {
      name: 'Orders',
      data: [120, 98, 143, 131, 165, 182],
      yAxisIndex: 0 as const,
      type: 'column' as const,
      color: '#59a14f'
    },
    {
      name: 'Avg Order Value ($)',
      data: [350, 393, 358, 357, 353, 341],
      yAxisIndex: 1 as const,
      type: 'column' as const,
      color: '#76b7b2'
    }
  ];

  // ── Demo 3: Three series — two columns + one line ───────────────

  const multiSeriesCategories = ['Q1', 'Q2', 'Q3', 'Q4'];

  const threeSeriesData = [
    {
      name: 'Gross Sales ($)',
      data: [120000, 145000, 138000, 172000],
      yAxisIndex: 0 as const,
      type: 'column' as const,
      color: '#4e79a7'
    },
    {
      name: 'Returns ($)',
      data: [8400, 10150, 9660, 12040],
      yAxisIndex: 0 as const,
      type: 'column' as const,
      color: '#e15759'
    },
    {
      name: 'Return Rate (%)',
      data: [7.0, 7.0, 7.0, 7.0],
      yAxisIndex: 1 as const,
      type: 'line' as const,
      color: '#edc948'
    }
  ];

  // ── Demo 4: Custom tooltip ──────────────────────────────────────

  const customTooltipCategories = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const customTooltipSeries = [
    {
      name: 'Sessions',
      data: [3200, 2800, 4100, 3700, 4900],
      yAxisIndex: 0 as const,
      type: 'column' as const,
      color: '#b07aa1'
    },
    {
      name: 'Bounce Rate (%)',
      data: [42, 38, 35, 40, 33],
      yAxisIndex: 1 as const,
      type: 'line' as const,
      color: '#ff9da7'
    }
  ];

  let lastClickedCategory = $state<string | null>(null);

  const handleBarClick = (event: { categoryIndex: number; context: DualAxisTooltipContext }) => {
    lastClickedCategory = event.context.category;
  };

  // ── Demo 6: Negative values + wide currency ticks ────────────────

  const negativeCategories = ['Q1', 'Q2', 'Q3', 'Q4'];

  const negativeSeries = [
    {
      name: 'Net Change (₹)',
      data: [420, -180, 260, -90],
      yAxisIndex: 0 as const,
      type: 'column' as const,
      color: '#e15759'
    },
    {
      name: 'Index',
      data: [12, 18, 9, 22],
      yAxisIndex: 1 as const,
      type: 'line' as const,
      color: '#4e79a7'
    }
  ];
</script>

<div class="page-header">
  <span class="category-badge">Data Visualization</span>
  <h1>DualAxisBarChart</h1>
</div>

<p class="page-intro">
  A pure-SVG dual-axis chart with two independent Y-axes (left and right) sharing one categorical
  X-axis. Each series independently declares its axis (<code>yAxisIndex: 0 | 1</code>) and render
  type (<code>'column'</code> or <code>'line'</code>). Ideal for comparing metrics at very different
  scales — e.g. absolute counts vs. percentages.
</p>

<!-- Demo 1: Revenue + CTR -->
<h3>Revenue (columns, left axis) + CTR (line, right axis)</h3>
<div class="demo-row">
  <DualAxisBarChart
    categories={monthlyCategories}
    series={revenueCtrSeries}
    leftAxis={{ title: 'Revenue ($)', color: '#4e79a7' }}
    rightAxis={{ title: 'CTR (%)', color: '#f28e2b', valueFormat: (v) => `${v.toFixed(1)}%` }}
    testId="demo-revenue-ctr"
  />
</div>

<!-- Demo 2: Two column series on different axes -->
<h3>Orders (left) + Avg Order Value (right) — two column series</h3>
<div class="demo-row">
  <DualAxisBarChart
    categories={monthlyCategories}
    series={ordersSeries}
    leftAxis={{ title: 'Orders' }}
    rightAxis={{ title: 'AOV ($)', valueFormat: (v) => `$${v.toFixed(0)}` }}
    showGridlines={true}
    testId="demo-orders-aov"
  />
</div>

<!-- Demo 3: Three series (two columns + one flat line) -->
<h3>Three series — Gross Sales + Returns (columns, left) + Return Rate (line, right)</h3>
<div class="demo-row">
  <DualAxisBarChart
    categories={multiSeriesCategories}
    series={threeSeriesData}
    leftAxis={{ title: 'Amount ($)' }}
    rightAxis={{ title: 'Rate (%)', valueFormat: (v) => `${v.toFixed(1)}%` }}
    barPadding={0.3}
    testId="demo-three-series"
  />
</div>

<!-- Demo 4: Custom tooltip + click handler -->
<h3>Custom tooltip + click handler</h3>
{#if lastClickedCategory !== null}
  <p class="click-feedback">Last clicked: <strong>{lastClickedCategory}</strong></p>
{/if}
<div class="demo-row">
  <DualAxisBarChart
    categories={customTooltipCategories}
    series={customTooltipSeries}
    leftAxis={{ title: 'Sessions' }}
    rightAxis={{ title: 'Bounce Rate (%)', valueFormat: (v) => `${v}%` }}
    onbarclick={handleBarClick}
    testId="demo-custom-tooltip"
  >
    {#snippet tooltipSnippet(ctx)}
      <div class="custom-tooltip">
        <div class="custom-tooltip-title">{ctx.category}</div>
        {#each ctx.points as point, ptIdx (ptIdx)}
          <div class="custom-tooltip-row">
            <span class="custom-tooltip-swatch" style="background: {point.color}"></span>
            <span class="custom-tooltip-label">{point.name}</span>
            <span class="custom-tooltip-value">
              {point.yAxisIndex === 1 ? `${point.value}%` : point.value.toLocaleString()}
            </span>
          </div>
        {/each}
      </div>
    {/snippet}
  </DualAxisBarChart>
</div>

<!-- Demo 5: No gridlines, no legend -->
<h3>No gridlines, no legend</h3>
<div class="demo-row">
  <DualAxisBarChart
    categories={monthlyCategories}
    series={revenueCtrSeries}
    leftAxis={{ title: 'Revenue' }}
    rightAxis={{ title: 'CTR %', valueFormat: (v) => `${v.toFixed(1)}%` }}
    showGridlines={false}
    showLegend={false}
    testId="demo-no-gridlines"
  />
</div>

<!-- Demo 6: Negative values + wide currency ticks -->
<h3>Negative Values + Wide Currency Ticks</h3>
<div class="demo-row">
  <DualAxisBarChart
    categories={negativeCategories}
    series={negativeSeries}
    leftAxis={{ valueFormat: (v) => '₹' + v.toLocaleString('en-IN') }}
    testId="dual-axis-negative-chart"
  />
</div>

<style>
  .page-intro {
    margin-bottom: 24px;
    color: #555;
    max-width: 680px;
  }

  .demo-row {
    margin-bottom: 40px;
    max-width: 800px;
  }

  .click-feedback {
    margin-bottom: 8px;
    font-size: 14px;
    color: #555;
  }

  .custom-tooltip {
    background: rgba(20, 20, 30, 0.93);
    color: #fff;
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 12px;
    min-width: 160px;
  }

  .custom-tooltip-title {
    font-weight: 600;
    margin-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    padding-bottom: 4px;
  }

  .custom-tooltip-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 0;
  }

  .custom-tooltip-swatch {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .custom-tooltip-label {
    opacity: 0.8;
    flex: 1;
  }

  .custom-tooltip-value {
    font-weight: 600;
    white-space: nowrap;
  }
</style>
