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
      ondismiss={() => (pillItems = pillItems.filter((existingItem) => existingItem !== item))}
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

<h2>Status dot (consumer recipe via <code>::before</code>)</h2>
<p>
  Use the <code>classes</code> prop with a <code>::before</code> pseudo-element to add a leading
  status dot. Theme with <code>--pill-dot-size</code> and <code>--pill-dot-color</code>. The pill's
  <code>display: inline-flex; align-items: center; gap: var(--pill-gap)</code> makes the
  <code>::before</code> slot in as the first flex child automatically.
</p>

<div class="demo-row">
  <Pill text="Active" classes="demo-dot-active" />
  <Pill text="Inactive" classes="demo-dot-inactive" />
  <Pill text="Custom dot" classes="demo-dot-custom" />
  <Pill text="No dot (default)" />
</div>

<h2>Status dot — themed via CSS vars</h2>
<div class="demo-row">
  <Pill text="Success" classes="demo-dot-success" />
  <Pill text="Warning" classes="demo-dot-warning" />
  <Pill text="Error" classes="demo-dot-error" />
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

  h2 {
    margin-top: 32px;
  }

  /* Status dot recipe — reusable ::before pseudo-element */
  :global(.demo-dot-active::before),
  :global(.demo-dot-inactive::before),
  :global(.demo-dot-custom::before),
  :global(.demo-dot-success::before),
  :global(.demo-dot-warning::before),
  :global(.demo-dot-error::before) {
    content: '';
    display: block;
    flex-shrink: 0;
    width: var(--pill-dot-size, 6px);
    height: var(--pill-dot-size, 6px);
    border-radius: 50%;
    background-color: var(--pill-dot-color, currentColor);
  }

  :global(.demo-dot-active) {
    --pill-dot-color: #059669;
  }

  :global(.demo-dot-inactive) {
    --pill-dot-color: #9ca3af;
  }

  :global(.demo-dot-custom) {
    --pill-dot-size: 10px;
    --pill-dot-color: #8b5cf6;
  }

  :global(.demo-dot-success) {
    --pill-background: #d1fae5;
    --pill-color: #065f46;
    --pill-dot-color: #059669;
  }

  :global(.demo-dot-warning) {
    --pill-background: #fef3c7;
    --pill-color: #92400e;
    --pill-dot-color: #d97706;
  }

  :global(.demo-dot-error) {
    --pill-background: #fee2e2;
    --pill-color: #991b1b;
    --pill-dot-color: #dc2626;
  }
</style>
