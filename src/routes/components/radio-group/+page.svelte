<script lang="ts">
  import RadioGroup from '$lib/RadioGroup/RadioGroup.svelte';
  import type { RadioGroupItem } from '$lib/RadioGroup/properties';

  const paymentItems: RadioGroupItem[] = [
    { label: 'UPI', value: 'upi' },
    { label: 'Card', value: 'card' },
    { label: 'Net Banking', value: 'netbanking' },
    { label: 'Wallet', value: 'wallet', disabled: true }
  ];

  const rangeItems: RadioGroupItem[] = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' }
  ];

  const planItems: RadioGroupItem[] = [
    { label: 'Starter', value: 'starter', subtitle: 'Up to 100 orders' },
    { label: 'Growth', value: 'growth', subtitle: 'Up to 1,000 orders' },
    { label: 'Scale', value: 'scale', subtitle: 'Unlimited' }
  ];

  let payment = $state('upi');
  let horizontal = $state('card');
  let range = $state('week');
  let plan = $state('growth');
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>RadioGroup</h1>
</div>

<p class="component-description">
  Declarative radio group built on the <code>Radio</code> primitive. Pass an
  <code>items</code> array and bind <code>selectedValue</code>. Use <code>variant="segmented"</code>
  for a pill/toggle control.
</p>

<h3>Vertical (default)</h3>
<RadioGroup
  name="payment"
  items={paymentItems}
  bind:selectedValue={payment}
  testId="demo-payment"
/>
<p class="state-display">Selected: {payment}</p>

<h3>Horizontal</h3>
<RadioGroup
  name="payment-h"
  items={paymentItems}
  bind:selectedValue={horizontal}
  direction="horizontal"
/>
<p class="state-display">Selected: {horizontal}</p>

<h3>Segmented</h3>
<RadioGroup name="range" items={rangeItems} bind:selectedValue={range} variant="segmented" />
<p class="state-display">Selected: {range}</p>

<h3>Segmented with subtitles</h3>
<RadioGroup name="plan" items={planItems} bind:selectedValue={plan} variant="segmented" />
<p class="state-display">Selected: {plan}</p>

<h3>Disabled</h3>
<RadioGroup name="payment-d" items={paymentItems} bind:selectedValue={payment} disabled />

<style>
  h3 {
    margin: 24px 0 8px;
  }

  .state-display {
    margin-top: 8px;
    font-family: monospace;
    opacity: 0.7;
  }
</style>
