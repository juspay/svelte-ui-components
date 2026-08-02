<script lang="ts">
  import ChipInput from '$lib/ChipInput/ChipInput.svelte';

  let productTags = $state(['sale', 'featured']);
  let blockedEmails = $state<string[]>([]);
  let themedTags = $state(['urgent']);
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>ChipInput</h1>
</div>

<div class="demo-row" style="max-width: 400px;">
  <h3>Product tags</h3>
  <ChipInput bind:values={productTags} placeholder="Add tag…" testId="chip-input-tags" />
  <p>Values: {productTags.join(', ') || '(empty)'}</p>
</div>

<div class="demo-row" style="max-width: 400px;">
  <h3>Blocklist entry (with onadd/ondismiss)</h3>
  <ChipInput
    bind:values={blockedEmails}
    placeholder="e.g. name@example.com"
    onadd={(value) => console.log('added', value)}
    ondismiss={(value) => console.log('removed', value)}
  />
</div>

<div class="demo-row" style="max-width: 400px;">
  <h3>Disabled</h3>
  <ChipInput values={['locked', 'read-only']} disabled />
</div>

<div class="demo-row" style="max-width: 400px;">
  <h3>Themed</h3>
  <ChipInput bind:values={themedTags} classes="chip-input-accent" />
</div>

<style>
  :global(.chip-input-accent) {
    --chip-input-pill-background: #d1ecf1;
    --chip-input-pill-color: #0c5460;
    --chip-input-draft-focus-border: 1px solid #3b82f6;
  }
</style>
