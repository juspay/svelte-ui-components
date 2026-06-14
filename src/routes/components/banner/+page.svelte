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

<div class="demo-row" style="flex-direction: column; max-width: 600px; gap: 12px;">
  <Banner text="Your cart was abandoned 2 hours ago.">
    {#snippet title()}
      <strong>Don't forget your items</strong>
    {/snippet}
  </Banner>

  <Banner text="We noticed unusual activity on your account.">
    {#snippet title()}
      <strong>Security alert</strong>
    {/snippet}
    {#snippet icon()}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><path
          d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg
      >
    {/snippet}
  </Banner>
</div>

<div class="demo-row" style="flex-direction: column; max-width: 600px; gap: 12px;">
  <div
    style="--banner-background: #fff0f0; --banner-color: #c0392b; --banner-border: 1px solid #e74c3c; --banner-border-radius: 6px; --banner-position: static; width: 100%;"
  >
    <Banner text="Payment failed. Please check your card details and try again." role="alert" />
  </div>

  <div
    style="--banner-background: #f0f7ff; --banner-color: #1a5276; --banner-border: 1px solid #5dade2; --banner-border-radius: 8px; --banner-position: static; width: 100%;"
  >
    <Banner text="Maintenance window scheduled for Sunday 2–4 AM UTC." role="status" dismissible />
  </div>
</div>
