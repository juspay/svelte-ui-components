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

<!-- `literal` opt-out: without it "Space"/"Tab" render as the typographic
     glyphs below (kept as the substituted fixture for regression coverage);
     with it, the word itself is the label — e.g. a "Hold SPACE" caption where
     the substituted ␣ symbol would read as a blank pill mid-sentence. -->
<div class="demo-section">
  <h2 class="demo-section-title">literal (opt out of symbol substitution)</h2>
  <div class="demo-row" style="align-items: center;">
    <KeyboardInput keys={['Space']} testId="keyboard-input-substituted-space" />
    <KeyboardInput keys={['Space']} literal testId="keyboard-input-literal-space" />
    <KeyboardInput keys={['Tab']} literal testId="keyboard-input-literal-tab" />
  </div>
</div>
