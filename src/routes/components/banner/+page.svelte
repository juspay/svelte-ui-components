<script lang="ts">
  import Banner from '$lib/Banner/Banner.svelte';
  import Button from '$lib/Button/Button.svelte';

  let dismissVisible = $state(true);
</script>

<div class="page-header">
  <span class="category-badge">Feedback & Status</span>
  <h1>Banner</h1>
</div>

<div class="demo-row" style="flex-direction: column; max-width: 600px; gap: 12px;">
  <Banner text="This is an informational banner with a link." linkText="Learn more" />

  <Banner
    text="Dismissible banner."
    dismissible
    bind:visible={dismissVisible}
    ondismiss={() => console.log('dismissed')}
  />
  {#if !dismissVisible}
    <Button text="Reset" onclick={() => (dismissVisible = true)} />
  {/if}
</div>
