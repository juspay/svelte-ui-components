<script lang="ts">
  import Choicebox from '$lib/Choicebox/Choicebox.svelte';

  let radioSelection = $state(0);
  let checkA = $state(false);
  let checkB = $state(false);

  function selectRadio(index: number): void {
    radioSelection = index;
  }
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>Choicebox</h1>
</div>

<h3>Radio mode</h3>
<div class="demo-row">
  <Choicebox mode="radio" selected={radioSelection === 0} onclick={() => selectRadio(0)}>
    <span class="choice-title">Standard Shipping</span>
    <span class="choice-desc">3-5 business days</span>
  </Choicebox>
  <Choicebox mode="radio" selected={radioSelection === 1} onclick={() => selectRadio(1)}>
    <span class="choice-title">Express Shipping</span>
    <span class="choice-desc">1-2 business days</span>
  </Choicebox>
  <Choicebox mode="radio" disabled>
    <span class="choice-title">Overnight</span>
    <span class="choice-desc">Next business day</span>
  </Choicebox>
</div>

<h3>Checkbox mode</h3>
<div class="demo-row">
  <Choicebox mode="checkbox" bind:selected={checkA}>
    <span class="choice-title">Gift wrapping</span>
  </Choicebox>
  <Choicebox mode="checkbox" bind:selected={checkB}>
    <span class="choice-title">Include receipt</span>
  </Choicebox>
</div>

<h3>Themed indicator</h3>
<p class="demo-note">
  <code>--choicebox-indicator-*</code> variables theme the radio dot / checkmark box independently of
  the card itself.
</p>
<div class="demo-row themed-indicator">
  <Choicebox mode="radio" selected testId="choicebox-themed-indicator">
    <span class="choice-title">Themed indicator</span>
  </Choicebox>
</div>

<style>
  .choice-title {
    font-weight: 600;
    font-size: 16px;
  }

  .choice-desc {
    font-size: 14px;
    opacity: 0.6;
  }

  .demo-note {
    font-size: 13px;
    color: #6b7280;
  }

  .themed-indicator {
    --choicebox-indicator-selected-background: rgb(20, 130, 40);
    --choicebox-indicator-selected-border: 2px solid rgb(20, 130, 40);
    --choicebox-indicator-size: 28px;
  }
</style>
