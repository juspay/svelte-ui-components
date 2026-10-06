<script lang="ts">
  import type { CheckListItemProperties } from './properties';
  import Checkbox from '../Checkbox/Checkbox.svelte';

  let {
    text,
    checked = $bindable(false),
    disabled = false,
    checkboxLabel,
    testId,
    onclick,
    classes
  }: CheckListItemProperties = $props();

  /* The box (`role="checkbox"`) is what assistive technology reads, and the label the row shows is a
     sibling of it, not inside <Checkbox> -- so nothing tied the two together and every item exposed an
     unnamed control. `aria-labelledby` points the box at the label wrapper below, so the announced name
     is exactly what is on screen: the plain `text`, or everything a `checkboxLabel` snippet renders
     ("Required business details Required"), which `text` alone would not carry. The id lives in the
     component's own tree, so it resolves inside the shadow root `<sui-check-list-item>` renders into. */
  const uid = $props.id();
  const labelId = `check-list-item-label-${uid}`;
  const checkboxAttributes = { 'aria-labelledby': labelId };

  function handleClick(value: boolean): void {
    checked = value;
    onclick?.(checked);
  }
</script>

<div class="container {classes ?? ''}" class:disabled data-pw={testId} testID={testId}>
  <div class="checkbox-wrapper">
    <!-- `ariaLabel` is the fallback name: it applies only if the label wrapper resolves to nothing
         (an empty snippet), because `aria-labelledby` outranks it whenever it yields text. -->
    <Checkbox
      text=""
      ariaLabel={text}
      attributes={checkboxAttributes}
      bind:checked
      {disabled}
      onclick={handleClick}
      {...typeof testId === 'string' ? { testId: `${testId}-checkbox` } : {}}
    />
  </div>
  <span class="check-list-item-label" id={labelId}>
    {#if typeof checkboxLabel === 'function'}
      {@render checkboxLabel()}
    {:else}
      <span class="text" class:checked>{text}</span>
    {/if}
  </span>
</div>

<style>
  .container {
    display: var(--check-list-item-display, flex);
    align-items: var(--check-list-item-align-items, center);
    width: var(--check-list-item-width, 100%);
    padding: var(--check-list-item-padding);
    gap: var(--check-list-item-gap, 8px);
  }

  .container.disabled {
    cursor: not-allowed;
  }

  .checkbox-wrapper {
    flex-shrink: 0;
  }

  /* Names the checkbox but adds no box of its own: the text or snippet inside stays a direct flex item
     of .container, so layout, gap and every --check-list-item-* token behave as before. */
  .check-list-item-label {
    display: contents;
  }

  .container.disabled .checkbox-wrapper {
    --checkbox-disabled-opacity: var(--check-list-item-disabled-opacity, 0.4);
  }

  .text {
    font-size: var(--check-list-item-text-size, 14px);
    color: var(--check-list-item-text-color, inherit);
  }

  .text.checked {
    color: var(--check-list-item-checked-text-color, inherit);
    font-weight: var(--check-list-item-checked-font-weight, inherit);
  }
</style>
