<script lang="ts">
  import Button from '$lib/Button/Button.svelte';

  let loadingDemo = $state(false);

  const runLoading = () => {
    loadingDemo = true;
    setTimeout(() => (loadingDemo = false), 1600);
  };
</script>

<div class="page-header">
  <span class="category-badge">Buttons & Actions</span>
  <h1>Button</h1>
</div>

<div class="btn-demos">
  <h3>Variants</h3>
  <div class="demo-row">
    <Button text="Primary" variant="primary" />
    <Button text="Secondary" variant="secondary" />
    <Button text="Ghost" variant="ghost" />
    <Button text="Destructive" variant="destructive" />
  </div>

  <h3>Sizes</h3>
  <div class="demo-row" style="align-items: center;">
    <Button text="Small" size="sm" />
    <Button text="Medium" size="md" />
    <Button text="Large" size="lg" />
  </div>

  <h3>Icon only</h3>
  <p>Pair <code>iconOnly</code> with <code>ariaLabel</code> for an accessible name.</p>
  <div class="demo-row" style="align-items: center;">
    <Button iconOnly ariaLabel="Add" variant="primary">
      {#snippet icon()}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <line x1="8" y1="3" x2="8" y2="13" />
          <line x1="3" y1="8" x2="13" y2="8" />
        </svg>
      {/snippet}
    </Button>
    <Button iconOnly ariaLabel="Edit" variant="secondary">
      {#snippet icon()}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      {/snippet}
    </Button>
    <Button iconOnly ariaLabel="Delete" variant="destructive">
      {#snippet icon()}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      {/snippet}
    </Button>
  </div>

  <h3>Full width</h3>
  <div class="demo-row" style="max-width: 360px; flex-direction: column;">
    <Button text="Full-width button" fullWidth variant="primary" />
  </div>

  <h3>Loading</h3>
  <p>The <code>loading</code> prop shows a spinner, sets <code>aria-busy</code>, and disables the button.</p>
  <div class="demo-row">
    <Button text={loadingDemo ? 'Saving…' : 'Save'} loading={loadingDemo} onclick={runLoading} />
  </div>

  <h3>Disabled</h3>
  <div class="demo-row">
    <Button text="Primary" variant="primary" disabled />
    <Button text="Secondary" variant="secondary" disabled />
    <Button text="Ghost" variant="ghost" disabled />
  </div>

  <h3>As a link (href)</h3>
  <p>With <code>href</code> the button renders as a styled <code>&lt;a&gt;</code>.</p>
  <div class="demo-row">
    <Button text="Open docs" href="https://svelte.dev" target="_blank" variant="secondary" />
  </div>
</div>
