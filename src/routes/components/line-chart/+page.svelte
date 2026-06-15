<script lang="ts">
  import LineChart from '$lib/LineChart/LineChart.svelte';

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
</script>

<div class="page-header">
  <span class="category-badge">Data Visualization</span>
  <h1>LineChart</h1>
</div>

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
