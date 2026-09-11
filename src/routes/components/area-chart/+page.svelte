<script lang="ts">
  import AreaChart from '$lib/AreaChart/AreaChart.svelte';

  const singleSeries = [
    {
      name: 'Traffic',
      data: [
        { x: 1, y: 120 },
        { x: 2, y: 180 },
        { x: 3, y: 150 },
        { x: 4, y: 220 },
        { x: 5, y: 200 },
        { x: 6, y: 280 },
        { x: 7, y: 260 },
        { x: 8, y: 310 }
      ]
    }
  ];

  const stackedSeries = [
    {
      name: 'Direct',
      data: [
        { x: 1, y: 40 },
        { x: 2, y: 50 },
        { x: 3, y: 45 },
        { x: 4, y: 60 },
        { x: 5, y: 55 },
        { x: 6, y: 70 }
      ]
    },
    {
      name: 'Organic',
      data: [
        { x: 1, y: 30 },
        { x: 2, y: 40 },
        { x: 3, y: 35 },
        { x: 4, y: 45 },
        { x: 5, y: 50 },
        { x: 6, y: 55 }
      ]
    },
    {
      name: 'Referral',
      data: [
        { x: 1, y: 20 },
        { x: 2, y: 25 },
        { x: 3, y: 22 },
        { x: 4, y: 30 },
        { x: 5, y: 28 },
        { x: 6, y: 35 }
      ]
    }
  ];
</script>

<div class="page-header">
  <span class="category-badge">Data Visualization</span>
  <h1>AreaChart</h1>
</div>

<h3>Basic Area</h3>
<div class="demo-row">
  <AreaChart series={singleSeries} />
</div>

<h3>With Dots</h3>
<div class="demo-row">
  <AreaChart series={singleSeries} showDots />
</div>

<h3>Stacked Area</h3>
<div class="demo-row">
  <AreaChart series={stackedSeries} stacked showLegend />
</div>

<h3>Higher Fill Opacity</h3>
<div class="demo-row">
  <AreaChart series={singleSeries} fillOpacity={0.6} />
</div>

<h3>Legend aggregates (<code>aggregate</code> + <code>aggregateFormat</code>)</h3>
<p>
  Aggregates are always per-series, even when <code>stacked</code> — the legend total for "Direct" below
  is the sum of its own six points, never the per-category stack total.
</p>
<div class="demo-row">
  <AreaChart
    series={[
      { ...stackedSeries[0], aggregate: 'sum', aggregateFormat: (v) => `${v} visits` },
      { ...stackedSeries[1], aggregate: 'average' },
      stackedSeries[2]
    ]}
    stacked
    showLegend
    testId="area-legend-aggregate-chart"
  />
</div>
