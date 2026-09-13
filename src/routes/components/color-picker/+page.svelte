<script lang="ts">
  import ColorPicker from '$lib/ColorPicker/ColorPicker.svelte';

  let color = $state('#2196f3');
  let describedColor = $state('#2196f3');
  let infoOnlyColor = $state('#4caf50');
  let plainColor = $state('#ff9800');
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

<h2>Validity messaging</h2>
<p>
  <code>errorMessage</code> and <code>infoMessage</code> describe the group holding the swatch and
  the hex field, and set <code>aria-invalid</code> only while an error is showing.
</p>
<div
  class="demo-row"
  data-pw="colorpicker-field-contract"
  style="flex-direction: column; align-items: start;"
>
  <ColorPicker
    value={describedColor}
    label="Brand colour"
    errorMessage="Not enough contrast on white."
    infoMessage="Used for buttons and links."
    testId="colorpicker-described"
  />
  <ColorPicker
    value={infoOnlyColor}
    label="Accent"
    infoMessage="Used for buttons and links."
    testId="colorpicker-info-only"
  />
  <ColorPicker value={plainColor} label="Plain" testId="colorpicker-undescribed" />
</div>
