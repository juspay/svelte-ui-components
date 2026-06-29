<script lang="ts">
  import StatCard from '$lib/StatCard/StatCard.svelte';
  import ProportionBar from '$lib/ProportionBar/ProportionBar.svelte';

  let checkboxChecked = $state(false);
  let headerlessChecked = $state(false);
  let clickableChecked = $state(false);
  let cardClicks = $state(0);

  const checkoutRows = [
    {
      heading: 'Gross Revenue',
      value: '₹12.4Cr',
      change: 8.2,
      tooltip: { text: 'Total revenue before returns and cancellations', position: 'top' as const }
    },
    {
      heading: 'Net Revenue',
      value: '₹10.9Cr',
      change: 5.7,
      additionalContent: 'after RTO'
    },
    {
      heading: 'RTO Rate',
      value: '12.1%',
      change: -2.3,
      invertChangeColors: true,
      tooltip: { text: 'Return to Origin rate — lower is better' }
    }
  ];

  const conversionRow = [
    {
      heading: 'Checkout Conversion',
      value: '68.4%',
      change: 3.1,
      breakdownHeading: 'By Device',
      breakdown: [
        { label: 'Mobile', value: '71.2%', change: 4.0 },
        { label: 'Desktop', value: '63.8%', change: 1.5 },
        { label: 'Tablet', value: '58.1%', change: -0.8, invertChangeColors: false }
      ]
    }
  ];

  const paymentSegments = [
    { label: 'UPI', value: 4820 },
    { label: 'Cards', value: 2150 },
    { label: 'Wallets', value: 870 }
  ];
</script>

<div class="page-header">
  <span class="category-badge">Data Visualization</span>
  <h1>StatCard</h1>
</div>

<p class="intro">
  A flexible metric card for displaying KPIs. Supports a single value with a delta badge, or
  multiple metric rows with per-row headings, tooltips, deltas, and breakdown grids. Additional
  header slots allow tooltips, checkboxes, and custom right-aligned content.
</p>

<h3>Basic — Value + Delta</h3>
<div class="demo-row" style="align-items: stretch;">
  <StatCard title="Total Orders" value="8,610" delta="+12.5%" testId="basic-positive" />
  <StatCard title="RTO Rate" value="11.8%" delta="-2.3%" testId="basic-negative" />
  <StatCard title="Avg Order Value" value="₹1,240" delta="0%" testId="basic-neutral" />
</div>

<h3>With Subtitle</h3>
<div class="demo-row">
  <StatCard
    title="Checkout Conversion"
    value="68.4%"
    delta="+3.1%"
    subtitle="vs last 30 days"
    testId="with-subtitle"
  />
</div>

<h3>With Title Tooltip</h3>
<div class="demo-row">
  <StatCard
    title="Net Revenue"
    value="₹10.9Cr"
    delta="+5.7%"
    tooltip={{ text: 'Revenue after returns, cancellations, and RTO deductions', position: 'top' }}
    testId="with-tooltip"
  />
</div>

<h3>With Header Checkbox</h3>
<div class="demo-row">
  <StatCard
    title="Include Returns"
    value={checkboxChecked ? '₹12.4Cr' : '₹10.9Cr'}
    delta={checkboxChecked ? '+8.2%' : '+5.7%'}
    checkbox={{ text: 'With returns', checked: checkboxChecked }}
    onCheckboxChange={(checked) => {
      checkboxChecked = checked;
    }}
    testId="with-checkbox"
  />
</div>

<h3>Header Without Title</h3>
<p class="intro" style="margin-bottom: 12px;">
  A checkbox-only header renders even when no title is set.
</p>
<div class="demo-row">
  <StatCard
    value="₹10.9Cr"
    delta="+5.7%"
    checkbox={{ text: 'Include returns', checked: headerlessChecked }}
    onCheckboxChange={(checked) => {
      headerlessChecked = checked;
    }}
    testId="headerless-card"
  />
</div>

<h3>Clickable Card With Checkbox</h3>
<p class="intro" style="margin-bottom: 12px;">
  Toggling the checkbox does not trigger the card's click action. Card clicks: {cardClicks}
</p>
<div class="demo-row">
  <StatCard
    title="View Report"
    value="68.4%"
    delta="+3.1%"
    checkbox={{ text: 'Live data', checked: clickableChecked }}
    onCheckboxChange={(checked) => {
      clickableChecked = checked;
    }}
    onclick={() => {
      cardClicks += 1;
    }}
    testId="clickable-checkbox-card"
  />
  <span data-pw="card-click-count">{cardClicks}</span>
</div>

<h3>Multi-Row — Revenue Breakdown</h3>
<div class="demo-row">
  <StatCard title="Revenue Overview" rows={checkoutRows} testId="multi-row" />
</div>

<h3>Horizontal Rows (sections side by side)</h3>
<div class="demo-row">
  <StatCard
    title="Revenue Overview"
    rows={checkoutRows}
    rowsDirection="row"
    testId="horizontal-rows"
  />
</div>

<h3>Multi-Row with Breakdown Grid</h3>
<div class="demo-row">
  <StatCard title="Conversion Metrics" rows={conversionRow} testId="with-breakdown" />
</div>

<h3>Multi-Row With Subtitle</h3>
<p class="intro" style="margin-bottom: 12px;">
  The subtitle (e.g. a date-comparison label) renders below the metric rows. It must not be
  suppressed when <code>rows</code> are present.
</p>
<div class="demo-row">
  <StatCard
    title="Revenue Overview"
    rows={checkoutRows}
    subtitle="Today vs Yesterday"
    testId="rows-with-subtitle"
  />
</div>

<h3>With Custom Children (ProportionBar)</h3>
<div class="demo-row">
  <StatCard title="Payment Methods" value="8,610 orders" testId="with-children">
    <ProportionBar segments={paymentSegments} trackHeight="8px" />
  </StatCard>
</div>

<h3>Interactive (clickable)</h3>
<div class="demo-row">
  <StatCard
    title="View Report"
    value="68.4%"
    delta="+3.1%"
    onclick={() => alert('Card clicked!')}
    testId="interactive-card"
  />
</div>

<h3>With Footer Snippet</h3>
<div class="demo-row">
  <StatCard title="Total Orders" value="8,610" delta="+12.5%" testId="with-footer">
    {#snippet footer()}
      <div style="font-size: 12px; color: #6b7280;">Updated 5 minutes ago</div>
    {/snippet}
  </StatCard>
</div>

<style>
  .intro {
    color: var(--doc-text-secondary);
    margin-bottom: 24px;
    max-width: 640px;
  }
</style>
