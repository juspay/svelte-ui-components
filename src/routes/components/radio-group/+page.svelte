<script lang="ts">
  import RadioGroup from '$lib/RadioGroup/RadioGroup.svelte';

  let selectedPayment = $state('upi');
  let selectedPeriod = $state('monthly');
  let selectedPlan = $state('pro');
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>RadioGroup</h1>
</div>

<!-- Default vertical list -->
<h2>Default (vertical list)</h2>
<div class="demo-row">
  <RadioGroup
    name="payment-method"
    bind:value={selectedPayment}
    ariaLabel="Payment method"
    options={[
      { value: 'upi', label: 'UPI' },
      { value: 'card', label: 'Card' },
      { value: 'netbanking', label: 'Net Banking', subtitle: 'All major banks supported' },
      { value: 'cod', label: 'Cash on Delivery', disabled: true }
    ]}
  />
</div>
<p class="state-display">Selected: {selectedPayment}</p>

<!-- Segmented control via consumer CSS -->
<h2>Segmented control (consumer CSS)</h2>
<p class="state-display">
  Row layout + pill styling applied via <code>classes="segmented-group"</code> and the CSS below.
</p>
<div class="demo-row">
  <RadioGroup
    name="billing-period"
    bind:value={selectedPeriod}
    ariaLabel="Billing period"
    classes="segmented-group"
    options={[
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'annual', label: 'Annual' }
    ]}
  />
</div>
<p class="state-display">Selected: {selectedPeriod}</p>

<!-- Segmented with subtitles -->
<h2>Segmented with subtitles</h2>
<div class="demo-row">
  <RadioGroup
    name="plan"
    bind:value={selectedPlan}
    ariaLabel="Pricing plan"
    classes="segmented-group segmented-wide"
    options={[
      { value: 'starter', label: 'Starter', subtitle: 'Free forever' },
      { value: 'pro', label: 'Pro', subtitle: '$12/mo' },
      { value: 'enterprise', label: 'Enterprise', subtitle: 'Contact sales' }
    ]}
  />
</div>
<p class="state-display">Selected: {selectedPlan}</p>

<!-- Group-level disabled -->
<h2>Group-level disabled</h2>
<div class="demo-row">
  <RadioGroup
    name="disabled-group"
    value="b"
    ariaLabel="Disabled group"
    disabled
    options={[
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B' },
      { value: 'c', label: 'Option C' }
    ]}
  />
</div>

<style>
  h2 {
    margin: 24px 0 8px;
    color: var(--doc-text-heading);
  }

  code {
    font-family: ui-monospace, monospace;
    background: var(--doc-code-bg);
    color: var(--doc-code-color);
    padding: 1px 4px;
    border-radius: 3px;
  }

  /*
   * Segmented control variant — applied via classes="segmented-group"
   * Overrides RadioGroup CSS variables and styles the item wrappers.
   */
  :global(.segmented-group) {
    --radio-group-direction: row;
    --radio-group-gap: 4px;
    --radio-group-padding: 4px;
    --radio-group-background: #f0f0f0;
    --radio-group-radius: 10px;
  }

  :global(.segmented-group .radio-group-item) {
    flex: 1;
  }

  /*
   * Hide the indicator dot and use the whole item as the toggle surface.
   * The Radio label becomes a styled pill button.
   */
  :global(.segmented-group .radio-container) {
    --radio-container-display: flex;
    width: 100%;
    justify-content: center;
    padding: 6px 12px;
    border-radius: 7px;
    background: transparent;
    transition: background 0.15s;
  }

  :global(.segmented-group .radio-container:has(.radio-input:focus-visible)) {
    outline: 2px solid #2196f3;
    outline-offset: 2px;
  }

  :global(.segmented-group .radio-indicator) {
    display: none;
  }

  :global(.segmented-group .radio-container.disabled) {
    opacity: 0.45;
  }

  /* Selected pill */
  :global(.segmented-group .radio-container:has(.radio-input:checked)) {
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }

  /* Hover on unselected */
  :global(.segmented-group .radio-container:not(.disabled):not(:has(.radio-input:checked)):hover) {
    background: rgba(0, 0, 0, 0.06);
  }

  /* Wide variant adds more horizontal padding */
  :global(.segmented-wide .radio-container) {
    flex-direction: column;
    gap: 2px;
  }
</style>
