<script lang="ts">
  import BarChart from '$lib/BarChart/BarChart.svelte';

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
</script>

<div class="page-header">
  <span class="category-badge">Data Visualization</span>
  <h1>BarChart</h1>
</div>

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
