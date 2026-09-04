<script lang="ts">
  import Pill from '$lib/Pill/Pill.svelte';
  import Button from '$lib/Button/Button.svelte';

  let pillItems = $state(['Svelte', 'React', 'Vue', 'Angular']);
  let dismissCount = $state(0);
  let pillClickCount = $state(0);
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

<!-- Both variants are themed so the same consumer sheet exercises both the old
     primary dismiss button and the ghost dismiss button. -->
<section data-pw="pill-consumer-fixtures">
  <h2>Dismiss buttons under consumer themes</h2>
  <div class="demo-row">
    <Pill
      text="Interactive pill"
      dismissible
      testId="pill-interactive"
      onclick={() => (pillClickCount += 1)}
      onDismiss={() => (dismissCount += 1)}
    />
    <span data-pw="pill-click-count">{pillClickCount}</span>
  </div>
  <div class="demo-row app-theme-with-white-button-text" style="--pill-color: #123456;">
    <Pill testId="pill-dismiss-under-button-token" text="Element-level text token" dismissible />
  </div>
  <div class="demo-row app-theme-variant-scoped">
    <Pill
      testId="pill-dismiss-under-variant-rule"
      text="Shopify variant theme"
      dismissible
      onDismiss={() => (dismissCount += 1)}
    />
    <Pill
      testId="pill-dismiss-disabled"
      text="Disabled dismiss"
      dismissible
      disabled
      onDismiss={() => (dismissCount += 1)}
    />
    <Pill
      testId="pill-dismiss-custom-colour"
      text="Custom dismiss colours"
      classes="pill-custom-dismiss"
      dismissible
    />
    <span data-pw="pill-dismiss-count">{dismissCount}</span>
  </div>
  <div class="demo-row app-theme-variant-scoped">
    <Button variant="primary" text="Consumer primary" testId="pill-consumer-primary" />
    <Button variant="ghost" text="Consumer ghost" testId="pill-consumer-ghost" />
  </div>
</section>

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

  :global(.app-theme-with-white-button-text .button-container) {
    --button-text-color: #ffffff;
  }

  .app-theme-variant-scoped {
    --pill-color: #1e1e1e;
    --pill-background: #f1f1f1;
    --pill-hover-background: #e8e8e8;
    --pill-dismiss-color: var(--pill-color);
  }

  /* Lighthouse shopify.css's variant/disabled rules, scoped to this demo and
     with semantic colour tokens resolved. Keep both variants in the fixture. */
  :global(.app-theme-variant-scoped .button-container.variant-primary:not([class*='global-btn'])) {
    --consumer-variant: primary;
    --button-color: #303030;
    --button-text-color: #ffffff;
    --button-hover-color: #1a1a1a;
    --button-hover-text-color: #ffffff;
    --button-hover-border: 1px solid #1a1a1a;
    --button-active-background: #1a1a1a;
  }

  :global(.app-theme-variant-scoped .button-container.variant-ghost:not([class*='global-btn'])) {
    --consumer-variant: ghost;
    --button-color: transparent;
    --button-text-color: #1e1e1e;
    --button-border: none;
    --button-hover-color: #f1f1f1;
    --button-hover-text-color: #1e1e1e;
    --button-active-background: #e8e8e8;
  }

  :global(.app-theme-variant-scoped .button-container) {
    --disabled-text-color: #b5b5b5;
    --disabled-background-color: #f1f1f1;
    --disabled-opacity: 1;
    --disabled-border: 1px solid #e3e3e3;
    --button-focus-visible-box-shadow: 0 0 0 2px #005bd3;
  }

  :global(.app-theme-variant-scoped .button-container .button-el:disabled) {
    --button-text-color: #b5b5b5;
    --button-hover-text-color: #b5b5b5;
    --disabled-text-color: #b5b5b5;
    --disabled-background-color: #f1f1f1;
    color: #b5b5b5;
  }

  :global(.pill-custom-dismiss) {
    --pill-dismiss-color: #123456;
    --pill-dismiss-hover-color: #654321;
  }
</style>
