<script lang="ts">
  import Stepper from '$lib/Stepper/Stepper.svelte';
  import Step from '$lib/Stepper/Step.svelte';

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
    testId="stepper-horizontal"
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

<div class="demo-row" style="max-width: 600px; margin-top: 32px;">
  <h2 class="txt-heading-md">Informational (no click handler, suppressed semantics)</h2>
  <Stepper
    testId="stepper-informational"
    steps={[
      { label: 'Cart', status: 'completed' },
      { label: 'Shipping', status: 'active' },
      { label: 'Payment', status: 'pending' }
    ]}
    currentStepIndex={1}
    suppressRoleAndTabindex
  />
</div>

<div class="demo-row" style="max-width: 600px; margin-top: 32px;">
  <h2 class="txt-heading-md">Explicit per-step test IDs</h2>
  <Stepper
    steps={[
      { label: 'Cart', testId: 'abandoned-checkouts-recovery-strip-step-1' },
      { label: 'Shipping', testId: 'abandoned-checkouts-recovery-strip-step-2' },
      { label: 'Payment', testId: 'abandoned-checkouts-recovery-strip-step-3' }
    ]}
    currentStepIndex={0}
  />
</div>

<div class="demo-row" style="max-width: 600px; margin-top: 32px;" id="no-testid-demo">
  <h2 class="txt-heading-md">No test ID anywhere (no data-pw emitted)</h2>
  <Stepper steps={[{ label: 'Cart' }, { label: 'Shipping' }]} currentStepIndex={0} />
</div>

<div class="demo-row" style="max-width: 220px; margin-top: 32px;">
  <h2 class="txt-heading-md">Wrap — off (default; a narrow rail clips instead of stacking)</h2>
  <Stepper
    testId="stepper-wrap-off"
    steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }]}
    currentStepIndex={1}
  />
</div>

<div
  class="demo-row"
  style="max-width: 220px; margin-top: 32px; --container-flex-wrap: wrap; --step-container-flex: 1 1 100%;"
>
  <h2 class="txt-heading-md">Wrap — on (stacks one step per row on the same narrow rail)</h2>
  <Stepper
    testId="stepper-wrap-on"
    steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }]}
    currentStepIndex={1}
  />
</div>

<div class="demo-row" style="max-width: 600px; margin-top: 32px;">
  <h2 class="txt-heading-md">Separator growth — off (default; fixed-width hairlines)</h2>
  <Stepper
    testId="stepper-separator-growth-off"
    steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }]}
    currentStepIndex={1}
  />
</div>

<div
  class="demo-row"
  style="max-width: 600px; margin-top: 32px; --step-container-flex: 1 1 0%; --step-flex-grow: 1; --stepper-separator-flex-grow: 1;"
>
  <h2 class="txt-heading-md">Separator growth — on (hairlines stretch to fill the card)</h2>
  <Stepper
    testId="stepper-separator-growth-on"
    classes="stepper-growth-demo"
    steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }]}
    currentStepIndex={1}
  />
</div>

<div class="demo-row" style="max-width: 600px; margin-top: 32px;" data-pw="checkout-rail-default">
  <h2 class="txt-heading-md">Container test-id opt-out — off (default)</h2>
  <p style="margin: 0 0 12px;">
    The wrapping element and the Stepper both pass <code>checkout-rail-default</code> — this is the collision
    the opt-out exists to avoid, kept here (intentionally) to prove the default is unchanged.
  </p>
  <Stepper
    testId="checkout-rail-default"
    steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }]}
    currentStepIndex={1}
  />
</div>

<div class="demo-row" style="max-width: 600px; margin-top: 32px;">
  <h2 class="txt-heading-md">Themed border per status (--step-index-container-*-border)</h2>
  <p style="margin: 0 0 12px;">
    Each status gets its own <code>--step-index-container-&lt;status&gt;-border</code> hook. No
    status carries a border by default — the ring below is entirely opt-in via
    <code>classes</code> on the Stepper.
  </p>
  <Stepper
    testId="stepper-themed-border"
    classes="stepper-themed-border-demo"
    steps={[
      { label: 'Cart', status: 'completed' },
      { label: 'Shipping', status: 'active' },
      { label: 'Payment', status: 'failure' }
    ]}
    currentStepIndex={0}
  />
</div>

<div class="demo-row" style="max-width: 600px; margin-top: 32px;">
  <h2 class="txt-heading-md">Semibold step label (--step-text-font-weight)</h2>
  <Stepper
    testId="stepper-semibold-label"
    classes="stepper-semibold-label-demo"
    steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }]}
    currentStepIndex={1}
  />
</div>

<div class="demo-row" style="max-width: 600px; margin-top: 32px;">
  <h2 class="txt-heading-md">Muted status — a smaller, subtly-tinted marker</h2>
  <p style="margin: 0 0 12px;">
    <code>status: 'muted'</code> is additive — the completed/active steps beside it render exactly as
    any other Stepper.
  </p>
  <Stepper
    testId="stepper-muted"
    steps={[
      { label: 'Cart', status: 'completed' },
      { label: 'Shipping', status: 'active' },
      { label: 'Notes', status: 'pending' },
      { label: 'Gift note', status: 'muted' }
    ]}
    currentStepIndex={0}
  />
</div>

<div
  class="demo-row"
  style="max-width: 600px; margin-top: 32px;"
  data-pw="checkout-rail-suppressed"
>
  <h2 class="txt-heading-md">Container test-id opt-out — on</h2>
  <p style="margin: 0 0 12px;">
    The Stepper no longer renders <code>data-pw="checkout-rail-suppressed"</code> on its own
    container, so only the wrapping element matches it; each step still derives
    <code>checkout-rail-suppressed-step-&lt;n&gt;</code>.
  </p>
  <Stepper
    testId="checkout-rail-suppressed"
    suppressContainerTestId
    steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }]}
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

<h2>Bare Step — used on its own, outside a Stepper</h2>
<p>
  A Step rendered directly still shows its own status. Before, the per-status colours lived only in
  Stepper's wrapper, so every status outside a Stepper looked identical.
</p>
<div class="demo-row" data-pw="bare-step-demo">
  <Step stepIndex={1} label="Completed" status="completed" testId="bare-step-completed" />
  <Step stepIndex={2} label="Active" status="active" testId="bare-step-active" />
  <Step stepIndex={3} label="Pending" status="pending" testId="bare-step-pending" />
  <Step stepIndex={4} label="Muted" status="muted" testId="bare-step-muted" />
</div>

<style>
  /* .demo-row is itself a flex-wrap row, so a Stepper's container otherwise
     shrinks to its own content width — this gives it a row-filling width to
     grow into, matching a real card that stretches its own children. */
  :global(.stepper-growth-demo) {
    width: 100%;
  }

  :global(.stepper-themed-border-demo) {
    --step-index-container-completed-border: 2px solid #178a44;
    --step-index-container-active-border: 2px solid #1a232c;
    --step-index-container-failure-border: 2px solid #b71c1c;
  }

  :global(.stepper-semibold-label-demo) {
    --step-text-font-weight: 600;
  }
</style>
