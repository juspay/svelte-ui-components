<script lang="ts">
  import LabelPlate from '$lib/_chart/LabelPlate.svelte';
</script>

<main>
  <h1>Compiled chart label plate</h1>
  <svg width="600" height="160" viewBox="0 0 600 160" aria-label="Chart label sample">
    <LabelPlate>
      <text class="sample-label" x="40" y="80">Checkout started</text>
    </LabelPlate>
  </svg>
</main>

<style>
  :global(body) {
    margin: 24px;
    color: #333;
    background: #fff;
    font:
      16px Arial,
      sans-serif;
  }

  :global([data-theme='dark'] body) {
    color: #e5e7eb;
    background: #111827;
  }

  .sample-label {
    fill: var(--sankey-label-color, #333);
    font:
      20px Arial,
      sans-serif;
  }
</style>
