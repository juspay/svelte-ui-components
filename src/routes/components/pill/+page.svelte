<script lang="ts">
  import Pill from '$lib/Pill/Pill.svelte';
  import Button from '$lib/Button/Button.svelte';

  let pillItems = $state(['Svelte', 'React', 'Vue', 'Angular']);
</script>

<div class="page-header">
  <span class="category-badge">Buttons & Actions</span>
  <h1>Pill</h1>
</div>

<div class="demo-row">
  {#each pillItems as item (item)}
    <Pill
      text={item}
      dismissible
      ondismiss={() => (pillItems = pillItems.filter((p) => p !== item))}
    />
  {/each}
  {#if pillItems.length === 0}
    <Button
      text="Reset Pills"
      onclick={() => (pillItems = ['Svelte', 'React', 'Vue', 'Angular'])}
    />
  {/if}
</div>

<div class="demo-row">
  <Pill testId="pill-title" text="Hover for context" title="Pill tooltip" />
  <Pill testId="pill-without-title" text="No tooltip" />
</div>

<div class="demo-row">
  <Pill text="Verified">
    {#snippet leadingIcon()}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg
      >
    {/snippet}
  </Pill>

  <Pill text="TypeScript" classes="pill-info">
    {#snippet leadingIcon()}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        ><path
          d="M3 3h18v18H3V3zm10.71 14.29c.18.18.43.3.71.3a1 1 0 0 0 .71-1.71l-1-1H16a3 3 0 0 0 0-6h-1V8h-2v1h-1a3 3 0 0 0 0 6h.29l-1 1a1 1 0 0 0 1.42 1.42l1.71-1.72L13.7 17.3zM15 10a1 1 0 0 1 0 2h-2v-2h2zm-4 2a1 1 0 0 1 0-2h.17L10 11.17V12H11z"
        /></svg
      >
    {/snippet}
  </Pill>

  <Pill text="Error" classes="pill-error" dismissible>
    {#snippet leadingIcon()}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        ><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line
          x1="12"
          y1="16"
          x2="12.01"
          y2="16"
        /></svg
      >
    {/snippet}
  </Pill>
</div>

<div class="demo-row">
  <Pill text="Default line-height" testId="pill-line-height-default" />
  <Pill
    text="Custom line-height"
    classes="pill-relaxed-line-height"
    testId="pill-line-height-custom"
  />
</div>

<div class="demo-row" style="max-width: 140px;">
  <Pill text="Wrapping pill text demo" classes="pill-wrap" testId="pill-wrap-demo" />
</div>

<style>
  :global(.pill-info) {
    --pill-background: #d1ecf1;
    --pill-color: #0c5460;
    --pill-hover-background: #bee5eb;
  }

  :global(.pill-error) {
    --pill-background: #f8d7da;
    --pill-color: #721c24;
    --pill-hover-background: #f1b0b7;
  }

  /* --pill-line-height override demo: the pill's own line-height, not its wrapping row's. */
  :global(.pill-relaxed-line-height) {
    --pill-line-height: 1.4;
  }

  :global(.pill-wrap) {
    --pill-text-white-space: normal;
  }
</style>
