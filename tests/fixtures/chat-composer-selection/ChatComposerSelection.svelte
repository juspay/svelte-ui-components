<script lang="ts">
  import { onMount } from 'svelte';
  import ChatComposer from '$lib/ChatComposer/ChatComposer.svelte';

  const mentions = [{ name: '@refunds', description: 'Refund questions' }];

  onMount(() => {
    document.documentElement.dataset.fixtureReady = 'true';
  });
</script>

<div class="ccs-grid">
  <div class="ccs-host" data-pw="ccs-mentions">
    <ChatComposer value="hello world" slashCommands={mentions} inlineTriggers={['@']} />
  </div>
  <div class="ccs-host ccs-token" data-pw="ccs-token">
    <ChatComposer value="hello world" slashCommands={mentions} inlineTriggers={['@']} />
  </div>
</div>

<style>
  .ccs-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .ccs-host {
    width: 360px;
  }

  .ccs-token {
    --chat-composer-selection-background: rgb(254, 240, 138);
  }
</style>
