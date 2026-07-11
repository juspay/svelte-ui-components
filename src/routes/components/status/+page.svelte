<script lang="ts">
  import Status from '$lib/Status/Status.svelte';
  import LottiePlayer from '$lib/LottiePlayer/LottiePlayer.svelte';

  // Minimal valid Lottie document (zero layers) — enough to exercise the player
  // without depending on a real animation asset.
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
</div>
