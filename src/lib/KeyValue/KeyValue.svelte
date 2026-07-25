<script lang="ts">
  import type { KeyValueProperties, KeyValueItem } from './properties';

  let {
    items,
    columns = 2,
    layout = 'vertical',
    size = 'md',
    hideEmpty = true,
    emptyText = '—',
    valueSnippet,
    labelSnippet,
    testId,
    classes = ''
  }: KeyValueProperties = $props();

  const isEmptyValue = (value: KeyValueItem['value']): boolean =>
    value == null || (typeof value === 'string' && value.trim() === '');

  let visibleItems = $derived(
    hideEmpty ? items.filter((item) => !isEmptyValue(item.value)) : items
  );

  const displayValue = (item: KeyValueItem): string =>
    isEmptyValue(item.value) ? emptyText : String(item.value);
</script>

<dl
  class="key-value key-value--{layout} key-value--{size} {classes}"
  style="--keyvalue-columns: {columns};"
  data-pw={testId}
  testID={testId}
>
  {#each visibleItems as item, index (item.label + '-' + index)}
    <div class="key-value-item" data-pw={item.testId} testID={item.testId}>
      <dt class="key-value-label">
        {#if labelSnippet}
          {@render labelSnippet(item, index)}
        {:else}
          {item.label}
        {/if}
      </dt>
      <dd class="key-value-value">
        {#if valueSnippet}
          {@render valueSnippet(item, index)}
        {:else}
          {displayValue(item)}
        {/if}
      </dd>
    </div>
  {/each}
</dl>

<style>
  .key-value {
    display: grid;
    grid-template-columns: repeat(var(--keyvalue-columns, 2), minmax(0, 1fr));
    column-gap: var(--keyvalue-column-gap, 32px);
    row-gap: var(--keyvalue-row-gap, 16px);
    margin: 0;
    width: 100%;
    /* Size-preset defaults (overridable by --keyvalue-label-size / --keyvalue-value-size).
       The value sits 2px below the label, so the key always reads as the heavier, larger element. */
    --_kv-label-size: 16px;
    --_kv-value-size: 14px;
  }

  .key-value--sm {
    --_kv-label-size: 14px;
    --_kv-value-size: 12px;
  }

  .key-value--md {
    --_kv-label-size: 16px;
    --_kv-value-size: 14px;
  }

  .key-value--lg {
    --_kv-label-size: 18px;
    --_kv-value-size: 16px;
  }

  .key-value-item {
    display: flex;
    min-width: 0;
  }

  .key-value--vertical .key-value-item {
    flex-direction: column;
    gap: var(--keyvalue-pair-gap, 4px);
  }

  .key-value--horizontal .key-value-item {
    flex-direction: row;
    align-items: baseline;
    gap: var(--keyvalue-pair-gap, 12px);
  }

  .key-value-label {
    margin: 0;
    color: var(--keyvalue-label-color, #1a1a1a);
    font-size: var(--keyvalue-label-size, var(--_kv-label-size, 13px));
    font-weight: var(--keyvalue-label-weight, 600);
    line-height: var(--keyvalue-label-line-height, 1.4);
  }

  .key-value--horizontal .key-value-label {
    flex: 0 0 var(--keyvalue-label-width, 140px);
  }

  .key-value-value {
    margin: 0;
    color: var(--keyvalue-value-color, #555);
    font-size: var(--keyvalue-value-size, var(--_kv-value-size, 16px));
    font-weight: var(--keyvalue-value-weight, 400);
    line-height: var(--keyvalue-value-line-height, 1.4);
    overflow-wrap: anywhere;
  }

  .key-value--horizontal .key-value-value {
    flex: 1 1 auto;
    min-width: 0;
  }

  @media (max-width: 600px) {
    .key-value {
      grid-template-columns: 1fr;
    }
  }
</style>
