<script lang="ts">
  import Status from '$lib/Status/Status.svelte';
  import LottiePlayer from '$lib/LottiePlayer/LottiePlayer.svelte';

  // Minimal valid Lottie document (zero layers) — enough to exercise the player
  // without depending on a real animation asset.
  // A description the caller does not control — the shape of anything that
  // arrives from an API. `statusDescription` interpolates with {@html}, so the
  // markup in this string is parsed as markup; `descriptionSnippet` escapes it.
  const untrustedDescription = 'Install failed <span data-pw="injected-markup">injected</span>';

  const minimalAnimation = {
    v: '5.5.7',
    fr: 30,
    ip: 0,
    op: 30,
    w: 100,
    h: 100,
    nm: 'minimal',
    ddd: 0,
    assets: [],
    layers: []
  };
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>Status</h1>
</div>

<div class="demo-row">
  <div data-pw="status-default-icon">
    <Status
      statusIcon="https://picsum.photos/48/48?random=20"
      statusText="Payment Successful"
      statusDescription="Your order has been confirmed"
    />
  </div>

  <div data-pw="status-icon-slot">
    <Status statusText="Processing" statusDescription="Hang tight…">
      {#snippet icon()}
        <div style="width: 48px; height: 48px;" data-pw="status-icon-slot-lottie">
          <LottiePlayer animationData={minimalAnimation} testId="status-lottie" />
        </div>
      {/snippet}
    </Status>
  </div>
  <div data-pw="status-description-html">
    <Status statusText="String prop" statusDescription={untrustedDescription} />
  </div>

  <div data-pw="status-description-snippet">
    <Status statusText="Snippet" statusDescription={untrustedDescription}>
      {#snippet descriptionSnippet()}{untrustedDescription}{/snippet}
    </Status>
  </div>
  <div
    data-pw="status-inline"
    style="--status-min-height: auto; --status-panel-background: transparent; --status-panel-backdrop-filter: none;"
  >
    <Status statusText="Inline" statusDescription="Embedded in a page, not a full screen." />
  </div>
  <div data-pw="status-children">
    <Status statusText="With action" statusDescription="Something needs your attention.">
      <div data-pw="status-children-content">Action area</div>
    </Status>
  </div>
</div>
