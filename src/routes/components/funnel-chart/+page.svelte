<script lang="ts">
  import FunnelChart from '$lib/FunnelChart/FunnelChart.svelte';
  import { formatNumber } from '$lib/_chart/format';

  const checkoutFunnel = [
    { category: 'Visit', value: 12000 },
    { category: 'Product View', value: 8400 },
    { category: 'Add to Cart', value: 4200 },
    { category: 'Checkout', value: 2100 },
    { category: 'Purchase', value: 980 }
  ];

  const conversionFunnel = [
    { category: 'Awareness', value: 50000 },
    { category: 'Interest', value: 32000 },
    { category: 'Consideration', value: 18000 },
    { category: 'Intent', value: 9500 },
    { category: 'Purchase', value: 4200 }
  ];

  const tealColors = ['#8EE3F6C2', '#8EE3F6', '#79E2E9', '#82DEE4', '#87E3D3'];

  const warmColors = ['#f28e2b', '#e15759', '#b07aa1', '#ff9da7', '#9c755f'];

  const manyStagesFunnel = [
    { category: 'Impressions on all channels', value: 120000 },
    { category: 'Qualified marketing leads', value: 64000 },
    { category: 'Sales accepted leads', value: 30000 },
    { category: 'Product demos scheduled', value: 14000 },
    { category: 'Proposals sent out', value: 6400 },
    { category: 'Contract negotiation', value: 2800 },
    { category: 'Verbal commitment', value: 900 },
    { category: 'Closed won', value: 240 }
  ];

  let lastClickedStage = $state<string | null>(null);
  let lastHoveredStage = $state<string | null>(null);
</script>

<div class="page-header">
  <span class="category-badge">Data Visualization</span>
  <h1>FunnelChart</h1>
</div>

<p>
  A horizontal funnel chart built entirely from pure SVG. Each stage bar height is proportional to
  its value relative to the maximum stage, with trapezoidal connectors showing the transition
  between stages.
</p>

<h3>Basic — E-commerce Checkout Funnel</h3>
<div class="demo-row">
  <FunnelChart data={checkoutFunnel} />
</div>

<h3>Custom Stage Colors</h3>
<div class="demo-row">
  <FunnelChart data={checkoutFunnel} stageColors={tealColors} connectorColor="#BDFFFB" />
</div>

<h3>Warm Palette</h3>
<div class="demo-row">
  <FunnelChart data={conversionFunnel} stageColors={warmColors} connectorColor="#f5cba7" />
</div>

<h3>Custom Value Format (show only value)</h3>
<div class="demo-row">
  <FunnelChart data={checkoutFunnel} valueFormat={(value) => formatNumber(value)} />
</div>

<h3>Without Value Labels</h3>
<div class="demo-row">
  <FunnelChart data={checkoutFunnel} showValueLabels={false} />
</div>

<h3>Wider Slope Connectors</h3>
<div class="demo-row">
  <FunnelChart data={checkoutFunnel} slopeWidth={24} />
</div>

<h3>No Hover Expansion</h3>
<div class="demo-row">
  <FunnelChart data={checkoutFunnel} onHoverExpand={0} />
</div>

<h3>Events</h3>
<div class="demo-row">
  <FunnelChart
    data={checkoutFunnel}
    onstageclick={({ stage }) => {
      lastClickedStage = stage.category;
    }}
    onstagehover={(event) => {
      lastHoveredStage = event?.stage.category ?? null;
    }}
  />
  {#if lastClickedStage}
    <p class="event-log">Last clicked: <strong>{lastClickedStage}</strong></p>
  {/if}
  {#if lastHoveredStage}
    <p class="event-log">Hovering: <strong>{lastHoveredStage}</strong></p>
  {/if}
</div>

<h3>Empty State</h3>
<div class="demo-row">
  <FunnelChart data={[]}>
    {#snippet empty()}
      <p>No funnel data available.</p>
    {/snippet}
  </FunnelChart>
</div>

<h3>Custom Aspect Ratio (4:3)</h3>
<div class="demo-row">
  <FunnelChart data={conversionFunnel} aspectRatio={4 / 3} />
</div>

<h3>Many Stages with Long Names</h3>
<div class="demo-row">
  <FunnelChart data={manyStagesFunnel} testId="funnel-many-stages-chart" />
</div>

<style>
  .event-log {
    margin-top: 8px;
    font-size: 13px;
    color: #555;
  }
</style>
