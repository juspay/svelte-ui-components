<script lang="ts">
  import ProportionBar from '$lib/ProportionBar/ProportionBar.svelte';

  const paymentMethodSegments = [
    { label: 'UPI', value: 4820 },
    { label: 'Cards', value: 2150 },
    { label: 'Wallets', value: 870 },
    { label: 'NetBanking', value: 560 },
    { label: 'COD', value: 210 }
  ];

  const orderStatusSegments = [
    { label: 'Delivered', value: 7200, color: '#22c55e' },
    { label: 'In Transit', value: 1800, color: '#f59e0b' },
    { label: 'Cancelled', value: 540, color: '#ef4444' },
    { label: 'RTO', value: 260, color: '#8b5cf6' }
  ];

  const currencyFormat = (absoluteValue: number, percent: number): string =>
    `₹${(absoluteValue / 100).toFixed(1)}L (${Math.round(percent)}%)`;

  const revenueSegments = [
    { label: 'Breeze Checkout', value: 6800 },
    { label: 'Direct', value: 2400 },
    { label: 'Marketplace', value: 800 }
  ];

  // Negative and non-finite values are sanitized to zero so the rendered widths
  // always stay within 0–100%.
  const robustSegments = [
    { label: 'Valid A', value: 600 },
    { label: 'Negative (ignored)', value: -200 },
    { label: 'Valid B', value: 400 },
    { label: 'NaN (ignored)', value: Number.NaN }
  ];
</script>

<div class="page-header">
  <span class="category-badge">Data Visualization</span>
  <h1>ProportionBar</h1>
</div>

<p class="intro">
  A horizontal bar that visualises how a total is distributed across segments. Renders an SVG track
  with proportional coloured bands and an optional legend listing each segment with its label and
  formatted value.
</p>

<h3>Payment Methods Distribution</h3>
<div class="demo-row" style="flex-direction: column; align-items: stretch; max-width: 480px;">
  <ProportionBar segments={paymentMethodSegments} testId="payment-methods-bar" />
</div>

<h3>Order Status Breakdown (custom colors)</h3>
<div class="demo-row" style="flex-direction: column; align-items: stretch; max-width: 480px;">
  <ProportionBar segments={orderStatusSegments} testId="order-status-bar" />
</div>

<h3>Revenue Channels — Custom Format & Track Height</h3>
<p class="state-display">Formatted as lakhs; track height set to 14px</p>
<div class="demo-row" style="flex-direction: column; align-items: stretch; max-width: 480px;">
  <ProportionBar
    segments={revenueSegments}
    valueFormat={currencyFormat}
    trackHeight="14px"
    testId="revenue-bar"
  />
</div>

<h3>No Legend</h3>
<p class="state-display">
  With the legend hidden, the SVG carries the full breakdown as its accessible name.
</p>
<div class="demo-row" style="max-width: 480px;">
  <ProportionBar segments={paymentMethodSegments} showLegend={false} testId="no-legend-bar" />
</div>

<h3>Handles Invalid Values</h3>
<p class="state-display">Negative and non-finite segment values are ignored (treated as zero).</p>
<div class="demo-row" style="flex-direction: column; align-items: stretch; max-width: 480px;">
  <ProportionBar segments={robustSegments} testId="robust-bar" />
</div>

<h3>CSS Variable Theming</h3>
<div
  class="demo-row themed-demo"
  style="flex-direction: column; align-items: stretch; max-width: 480px;"
>
  <ProportionBar
    segments={orderStatusSegments}
    trackHeight="6px"
    classes="proportion-themed"
    testId="themed-bar"
  />
</div>

<style>
  .intro {
    color: var(--doc-text-secondary);
    margin-bottom: 24px;
    max-width: 640px;
  }

  .themed-demo {
    --proportion-bar-legend-label-color: var(--doc-text-primary);
    --proportion-bar-legend-value-color: var(--doc-text-heading);
    --proportion-bar-track-border-radius: 2px;
  }
</style>
