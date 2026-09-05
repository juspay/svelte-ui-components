<script lang="ts">
  import StatCard from '$lib/StatCard/StatCard.svelte';
  import ProportionBar from '$lib/ProportionBar/ProportionBar.svelte';

  let checkboxChecked = $state(false);
  let headerlessChecked = $state(false);
  let clickableChecked = $state(false);
  let cardClicks = $state(0);

  const checkoutRows = [
    {
      testId: 'checkout-row-0',
      heading: 'Gross Revenue',
      value: '₹12.4Cr',
      change: 8.2,
      tooltip: { text: 'Total revenue before returns and cancellations', position: 'top' as const }
    },
    {
      testId: 'checkout-row-1',
      heading: 'Net Revenue',
      value: '₹10.9Cr',
      change: 5.7,
      additionalContent: 'after RTO'
    },
    {
      testId: 'checkout-row-2',
      heading: 'RTO Rate',
      value: '12.1%',
      change: -2.3,
      invertChangeColors: true,
      tooltip: { text: 'Return to Origin rate — lower is better' }
    }
  ];

  const rowsWithPerRowSubtitle = [
    {
      testId: 'per-row-subtitle-row-0',
      heading: 'Gross Revenue',
      value: '₹12.4Cr',
      change: 8.2,
      subtitle: 'Today vs Yesterday'
    },
    {
      testId: 'per-row-subtitle-row-1',
      heading: 'Net Revenue',
      value: '₹10.9Cr',
      change: 5.7,
      subtitle: 'This Week vs Last Week'
    }
  ];

  const rowOrderRows = [
    {
      testId: 'row-order-reordered-row',
      heading: 'Gross Revenue',
      value: '₹12.4Cr',
      change: 8.2,
      subtitle: 'Today vs Yesterday'
    },
    {
      testId: 'row-order-default-row',
      heading: 'Net Revenue',
      value: '₹10.9Cr',
      change: 5.7,
      subtitle: 'This Week vs Last Week'
    }
  ];

  const rowTypographyRows = [
    {
      testId: 'value-typography-primary-row',
      heading: 'Primary KPI',
      value: '₹1.23Cr',
      change: 8.2
    },
    {
      testId: 'value-typography-secondary-row',
      heading: 'Secondary Metric',
      value: '₹340k',
      change: 3.4
    },
    {
      testId: 'value-typography-default-row',
      heading: 'Untouched Row',
      value: '₹98k',
      change: -1.1
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
    oncheckboxchange={(checked) => {
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
    oncheckboxchange={(checked) => {
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
    oncheckboxchange={(checked) => {
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

<h3>Multi-Row With Per-Row Subtitles</h3>
<p class="intro" style="margin-bottom: 12px;">
  Each row can carry its own comparison-period label, independent of the card-level
  <code>subtitle</code> — e.g. when different rows compare against different baselines.
</p>
<div class="demo-row">
  <StatCard title="Revenue Overview" rows={rowsWithPerRowSubtitle} testId="per-row-subtitle" />
</div>

<h3>Row Additional Content Stays Inline By Default</h3>
<p class="intro" style="margin-bottom: 12px;">
  By default, <code>additionalContent</code> renders inline alongside the value/delta, wrapping only if
  it does not fit — e.g. a short unit suffix like the ones this card renders.
</p>
<div class="demo-row" style="max-width: 900px;">
  <StatCard
    title="Success Rate"
    rows={[
      {
        testId: 'inline-additional-row',
        value: '--',
        additionalContent: '%'
      }
    ]}
    testId="inline-additional"
  />
</div>

<h3>Row Additional Content Forces Its Own Line (additionalContentBreak)</h3>
<p class="intro" style="margin-bottom: 12px;">
  Setting <code>additionalContentBreak</code> forces <code>additionalContent</code> onto its own line
  below the value/delta, even with plenty of horizontal room to fit inline.
</p>
<div class="demo-row" style="max-width: 900px;">
  <StatCard
    title="Wide Row"
    rows={[
      {
        testId: 'wide-additional-row',
        heading: 'Revenue',
        value: '₹12.4Cr',
        change: 8.2,
        additionalContent: 'short',
        additionalContentBreak: true
      }
    ]}
    testId="wide-additional"
  />
</div>

<h3>Row Value Tint (valueVariant)</h3>
<div class="demo-row">
  <StatCard
    title="Order Health"
    rows={[
      {
        testId: 'value-tint-success-row',
        heading: 'Delivered',
        value: '98.4%',
        valueVariant: 'success'
      },
      {
        testId: 'value-tint-warning-row',
        heading: 'RTO Risk',
        value: '12.1%',
        valueVariant: 'warning'
      }
    ]}
    testId="value-tint"
  />
</div>

<h3>Row Value & Heading Typography Override</h3>
<p class="intro" style="margin-bottom: 12px;">
  <code>--statcard-row-value-font-size</code>/<code>--statcard-row-value-font-weight</code> and
  <code>--statcard-row-heading-font-size</code>/<code>--statcard-row-heading-font-weight</code> let
  a single row's value and heading render at a size/weight that differs from the card-level default
  and from its sibling rows — scoped via the row's own <code>testId</code>. The third row sets no
  override and keeps today's shared card-level typography.
</p>
<div class="demo-row">
  <StatCard title="Mixed Weight Rows" rows={rowTypographyRows} testId="value-typography" />
</div>

<h3>Row Order Override (title → subtitle → value)</h3>
<p class="intro" style="margin-bottom: 12px;">
  A row's heading, value line, and subtitle render in that markup order by default.
  <code>--statcard-row-heading-order</code>, <code>--statcard-row-subtitle-order</code>, and
  <code>--statcard-row-value-line-order</code> let a single row rearrange its own sub-elements —
  e.g. title → subtitle → value — scoped via the row's own <code>testId</code>, mirroring the
  card-level <code>--statcard-header-order</code>/<code>--statcard-subtitle-order</code>/
  <code>--statcard-value-row-order</code> pattern. The second row sets no override and keeps today's default
  heading → value → subtitle order.
</p>
<div class="demo-row">
  <StatCard title="Reordered Rows" rows={rowOrderRows} testId="row-order" />
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

  /* Row Value & Heading Typography Override demo: scoped per-row via the
     row's own testId (rendered as data-pw on .statcard-row). The third row
     (value-typography-default-row) intentionally has no matching selector
     here, so it keeps the card-level default typography. */
  :global([data-pw='value-typography-primary-row']) {
    --statcard-row-value-font-size: 20px;
    --statcard-row-value-font-weight: 700;
    --statcard-row-heading-font-size: 18px;
  }

  :global([data-pw='value-typography-secondary-row']) {
    --statcard-row-value-font-size: 30px;
    --statcard-row-value-font-weight: 600;
  }

  /* Row Order Override demo: scoped per-row via the row's own testId. Moves
     the subtitle above the value line for a title -> subtitle -> value
     reading order (heading stays at its default order 0). The second row
     (row-order-default-row) sets no matching selector, so it keeps today's
     default heading -> value -> subtitle markup order. */
  :global([data-pw='row-order-reordered-row']) {
    --statcard-row-subtitle-order: 1;
    --statcard-row-value-line-order: 2;
  }
</style>
