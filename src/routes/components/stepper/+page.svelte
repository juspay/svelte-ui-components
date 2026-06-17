<script lang="ts">
  import Stepper from '$lib/Stepper/Stepper.svelte';

  let currentStep = $state(1);
  let currentVerticalStep = $state(1);
</script>

<div class="page-header">
  <span class="category-badge">Navigation</span>
  <h1>Stepper</h1>
</div>

<div class="demo-row" style="max-width: 600px;">
  <h2 class="txt-heading-md">Horizontal (click a step)</h2>
  <Stepper
    steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }, { label: 'Confirm' }]}
    currentStepIndex={currentStep}
    onstepclick={(event) => (currentStep = event.selectedIndex - 1)}
  />
</div>

<div class="demo-row" style="max-width: 600px; margin-top: 32px;">
  <h2 class="txt-heading-md">Vertical (click a step)</h2>
  <Stepper
    orientation="vertical"
    steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }, { label: 'Confirm' }]}
    currentStepIndex={currentVerticalStep}
    onstepclick={(event) => (currentVerticalStep = event.selectedIndex - 1)}
  />
</div>

<div class="demo-row" style="max-width: 600px; margin-top: 32px;">
  <h2 class="txt-heading-md">Per-step explicit status</h2>
  <Stepper
    steps={[
      { label: 'Cart', status: 'completed' },
      { label: 'Shipping', status: 'in-progress' },
      { label: 'Payment', status: 'active' },
      { label: 'Confirm', status: 'failure' },
      { label: 'Done', status: 'pending' }
    ]}
    currentStepIndex={1}
  />
</div>

<div class="demo-row" style="max-width: 600px; margin-top: 32px;">
  <h2 class="txt-heading-md">Badge snippets</h2>
  <Stepper
    steps={[
      {
        label: 'Cart',
        status: 'completed',
        badge: cartBadge
      },
      {
        label: 'Shipping',
        status: 'active',
        badge: shippingBadge
      },
      { label: 'Payment', status: 'pending' }
    ]}
    currentStepIndex={1}
  />
</div>

{#snippet cartBadge()}
  <span style="background:#24aa5a;color:#fff;border-radius:8px;padding:1px 6px;font-size:10px;">
    Done
  </span>
{/snippet}

{#snippet shippingBadge()}
  <span style="background:#f59e0b;color:#fff;border-radius:8px;padding:1px 6px;font-size:10px;">
    ETA 2d
  </span>
{/snippet}
