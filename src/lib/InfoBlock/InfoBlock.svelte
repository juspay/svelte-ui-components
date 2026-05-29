<script lang="ts">
  import type { InfoBlockProperties } from './properties';

  let { items, testId, classes }: InfoBlockProperties = $props();
</script>

<dl class="info-block {classes ?? ''}" data-pw={typeof testId === 'string' ? testId : null}>
  {#each Object.entries(items) as [key, value] (key)}
    <div class="info-block-item">
      <dt class="info-block-key">{key}</dt>
      <dd class="info-block-value">{value}</dd>
    </div>
  {/each}
</dl>

<style>
  .info-block {
    display: flex;
    flex-direction: column;
    gap: var(--info-block-gap, 8px);
    padding: var(--info-block-padding, 0);
    margin: 0;
  }

  .info-block-item {
    display: flex;
    justify-content: var(--info-block-item-justify-content, space-between);
  }

  .info-block-key {
    margin: 0;
    color: var(--info-block-key-color, inherit);
    font-weight: var(--info-block-key-font-weight, 500);
  }

  .info-block-value {
    margin: 0;
    color: var(--info-block-value-color, inherit);
    font-weight: var(--info-block-value-font-weight, 400);
    text-align: var(--info-block-value-text-align, right);
  }
</style>
