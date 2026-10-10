<script lang="ts">
  import SankeyChart from '$lib/SankeyChart/SankeyChart.svelte';

  const nodes = [
    { id: 'source-a', label: 'Source A' },
    { id: 'source-b', label: 'Source B' },
    { id: 'process-1', label: 'Process 1' },
    { id: 'process-2', label: 'Process 2' },
    { id: 'output', label: 'Output' }
  ];

  const links = [
    { source: 'source-a', target: 'process-1', value: 40 },
    { source: 'source-a', target: 'process-2', value: 20 },
    { source: 'source-b', target: 'process-1', value: 30 },
    { source: 'source-b', target: 'process-2', value: 10 },
    { source: 'process-1', target: 'output', value: 70 },
    { source: 'process-2', target: 'output', value: 30 }
  ];
</script>

<main>
  <h1>Sankey header label plates</h1>
  <!-- No first-column gutter and no margin: the first header is clamped to the left edge. -->
  <div class="host">
    <SankeyChart
      ariaLabel="Flow whose first column header is clamped to the left edge"
      {nodes}
      {links}
      columnLabels={['Start', 'Process', 'Output']}
      firstColumnLabelSide="right"
      marginX={0}
      testId="sankey-plate-left-clamp"
    />
  </div>
  <!-- No last-column gutter, default margin: the long last header is clamped to the right edge. -->
  <div class="host">
    <SankeyChart
      ariaLabel="Flow whose last column header is clamped to the right edge"
      {nodes}
      {links}
      columnLabels={['Source', 'Process', 'Order Status Confirmation Pending']}
      lastColumnLabelSide="left"
      testId="sankey-plate-right-clamp"
    />
  </div>
</main>

<style>
  :global(body) {
    margin: 24px;
    color: #333;
    background: #fff;
    font:
      16px Arial,
      sans-serif;
  }

  .host {
    box-sizing: border-box;
    width: 640px;
    margin-bottom: 24px;
  }
</style>
