<script lang="ts">
  import ColorPicker from '$lib/ColorPicker/ColorPicker.svelte';

  let color = $state('#2196f3');
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>Color Picker</h1>
</div>

<div class="demo-row" style="max-width: 400px;">
  <h3>With editable hex input</h3>
  <ColorPicker bind:value={color} label="Brand color" showValue />
</div>

<div class="demo-row" style="max-width: 400px;">
  <h3>Swatch only</h3>
  <ColorPicker bind:value={color} />
</div>

<div class="demo-row" style="max-width: 400px;">
  <h3>Disabled</h3>
  <ColorPicker value="#ff5722" label="Locked color" disabled showValue />
</div>
