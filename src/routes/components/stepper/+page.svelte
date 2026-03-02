<script lang="ts">
  import Stepper from '$lib/Stepper/Stepper.svelte';

  let currentStep = $state(1);
</script>

<div class="page-header">
  <span class="category-badge">Navigation</span>
  <h1>Stepper</h1>
</div>

<div class="demo-row" style="max-width: 600px;">
  <Stepper
    steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }, { label: 'Confirm' }]}
    currentStepIndex={currentStep}
    onhandleStepClick={(e) => (currentStep = e.selectedIndex)}
  />
</div>
