<script lang="ts">
  import PieChart from '$lib/PieChart/PieChart.svelte';

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
