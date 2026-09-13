<script lang="ts">
  import type { SeparatorProperties } from './properties';

  let {
    orientation = 'horizontal',
    decorative = true,
    testId,
    classes
  }: SeparatorProperties = $props();

  const isVertical = $derived(orientation === 'vertical');
</script>

<!--
  Only a *meaningful* separator belongs in the accessibility tree (design
  principle #4: a11y reasoned about per-state, not bolted on). A decorative
  rule between unrelated content has no `role` at all and is `aria-hidden`, so
  it is skipped entirely rather than read as an empty, nameless landmark. A
  non-decorative one takes `role="separator"` -- `aria-orientation` is only
  set for `vertical`, matching Tabs' convention elsewhere in this library,
  since the ARIA default for the separator role is already `horizontal`.
-->
<div
  class="separator {classes ?? ''}"
  class:vertical={isVertical}
  data-orientation={orientation}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
  role={decorative ? null : 'separator'}
  aria-orientation={!decorative && isVertical ? 'vertical' : null}
  aria-hidden={decorative ? 'true' : null}
></div>

<style>
  .separator {
    flex-shrink: 0;
    border: none;
    width: var(--separator-length, 100%);
    height: var(--separator-thickness, 1px);
    background: var(--separator-background, #e0e0e0);
    margin: var(--separator-margin, 0);
  }

  .separator.vertical {
    width: var(--separator-thickness, 1px);
    height: var(--separator-length, 100%);
  }
</style>
