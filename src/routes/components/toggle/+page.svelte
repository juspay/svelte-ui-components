<script lang="ts">
  import Toggle from '$lib/Toggle/Toggle.svelte';

  let toggleChecked = $state(false);
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
