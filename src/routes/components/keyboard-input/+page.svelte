<script lang="ts">
  import KeyboardInput from '$lib/KeyboardInput/KeyboardInput.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Buttons & Actions</span>
  <h1>KeyboardInput</h1>
</div>

<div class="demo-row" style="align-items: center;">
  <KeyboardInput keys={['Ctrl', 'K']} />
  <div style="--keyboard-input-font-size: 15px;">
    <KeyboardInput keys={['Cmd', 'Shift', 'P']} />
  </div>
  <div style="--keyboard-input-font-size: 11px;">
    <KeyboardInput keys="Esc" />
  </div>
</div>
