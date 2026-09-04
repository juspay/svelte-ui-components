<script lang="ts">
  import Toggle from '$lib/Toggle/Toggle.svelte';

  let toggleChecked = $state(false);
  // Event-casing phase 1: the same event under its corrected spelling.
  let aliasChecked = $state(false);
  // Label association fixtures: the built-in text, a consumer's own <label for>, and
  // a switch named only for assistive technology.
  let textLabelChecked = $state(false);
  let externalLabelChecked = $state(false);
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>Toggle</h1>
</div>

<div
  class="demo-row"
  style="--toggle-text-order: 1; --toggle-switch-width: 40px; --toggle-switch-height: 20px; --toggle-ball-height: 18px; --toggle-ball-width: 18px;"
>
  <Toggle text="Dark mode" checked={toggleChecked} onclick={(val) => (toggleChecked = val)} />
  <span class="state-display">{toggleChecked ? 'ON' : 'OFF'}</span>
</div>

<div class="demo-row">
  <Toggle
    text="Corrected spelling"
    checked={aliasChecked}
    onClick={(val) => (aliasChecked = val)}
    testId="toggle-alias"
  />
  <span class="state-display" data-pw="toggle-alias-state">{aliasChecked ? 'ON' : 'OFF'}</span>
</div>

<div class="demo-row">
  <Toggle
    text="Built-in text label"
    checked={textLabelChecked}
    onClick={(val) => (textLabelChecked = val)}
    testId="toggle-text-label"
  />
  <span class="state-display" data-pw="toggle-text-label-state"
    >{textLabelChecked ? 'ON' : 'OFF'}</span
  >
</div>

<div class="demo-row">
  <label for="toggle-external-label-input" data-pw="toggle-external-label">Consumer label</label>
  <Toggle
    id="toggle-external-label-input"
    checked={externalLabelChecked}
    onClick={(val) => (externalLabelChecked = val)}
    testId="toggle-external-label-switch"
  />
  <span class="state-display" data-pw="toggle-external-label-state"
    >{externalLabelChecked ? 'ON' : 'OFF'}</span
  >
</div>

<div class="demo-row">
  <Toggle ariaLabel="Silent switch" testId="toggle-aria-label" />
</div>

<div class="demo-row">
  <span id="toggle-shared-label">Order notifications</span>
  <Toggle ariaLabelledby="toggle-shared-label" testId="toggle-labelledby" />
</div>

<div class="demo-row">
  <Toggle text="Disabled setting" disabled testId="toggle-disabled-label" />
</div>

{#each ['', '   '] as inputId, index (inputId)}
  <div class="demo-row">
    <Toggle id={inputId} text={`Blank id setting ${index}`} testId={`toggle-blank-id-${index}`} />
  </div>
{/each}
