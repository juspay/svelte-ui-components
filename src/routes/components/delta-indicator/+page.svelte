<script lang="ts">
  import DeltaIndicator from '$lib/DeltaIndicator/DeltaIndicator.svelte';

  const currencyFormat = (input: number): string => {
    const sign = input >= 0 ? '+' : '-';
    return `${sign}$${Math.abs(input).toFixed(2)}`;
  };

  const bpsFormat = (input: number): string => `${input > 0 ? '+' : ''}${input.toFixed(1)} bps`;
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>DeltaIndicator</h1>
</div>

<p class="intro">
  A compact inline indicator that conveys change direction and magnitude using a directional arrow
  and formatted text. Positive values render in green, negative in red, and values within the
  neutral threshold in muted gray.
</p>

<h3>Positive / Negative / Neutral</h3>
<div class="demo-row">
  <DeltaIndicator value={12.5} testId="positive-example" />
  <DeltaIndicator value={-7.3} testId="negative-example" />
  <DeltaIndicator value={0} testId="neutral-zero" />
  <DeltaIndicator value={0.4} neutralThreshold={0.5} testId="neutral-threshold" />
</div>

<h3>Inverted Colors (lower-is-better metrics)</h3>
<p class="state-display">e.g. bounce rate, RTO — a decrease is good, an increase is bad</p>
<div class="demo-row">
  <DeltaIndicator value={-5.2} invertColors testId="inverted-negative" />
  <DeltaIndicator value={3.8} invertColors testId="inverted-positive" />
  <DeltaIndicator value={0} invertColors testId="inverted-neutral" />
</div>

<h3>Hide Arrow</h3>
<div class="demo-row">
  <DeltaIndicator value={18} hideArrow testId="no-arrow-positive" />
  <DeltaIndicator value={-4.5} hideArrow testId="no-arrow-negative" />
  <DeltaIndicator value={0} hideArrow testId="no-arrow-neutral" />
</div>

<h3>Custom Format — Currency Delta</h3>
<div class="demo-row">
  <DeltaIndicator value={42.5} format={currencyFormat} testId="currency-positive" />
  <DeltaIndicator value={-18.75} format={currencyFormat} testId="currency-negative" />
</div>

<h3>Custom Format — Basis Points</h3>
<div class="demo-row">
  <DeltaIndicator value={25} format={bpsFormat} testId="bps-positive" />
  <DeltaIndicator value={-10} format={bpsFormat} testId="bps-negative" />
</div>

<h3>CSS Variable Theming</h3>
<div class="demo-row">
  <div class="themed-container">
    <DeltaIndicator value={9.1} classes="delta-large" testId="themed-large" />
    <DeltaIndicator value={-3.4} classes="delta-large" testId="themed-large-neg" />
  </div>
</div>

<style>
  .intro {
    color: var(--doc-text-secondary);
    margin-bottom: 24px;
    max-width: 640px;
  }

  .themed-container {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  :global(.delta-large) {
    --delta-indicator-font-size: 18px;
    --delta-indicator-arrow-size: 14px;
    --delta-indicator-gap: 5px;
    --delta-indicator-positive-color: #0d7f58;
    --delta-indicator-negative-color: #c7373b;
  }
</style>
