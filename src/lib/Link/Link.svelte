<script lang="ts">
  import type { LinkProperties } from './properties';

  let {
    href,
    target,
    rel,
    classes,
    testId,
    nativeAttrs,
    children,
    onclick,
    onkeydown,
    element = $bindable()
  }: LinkProperties = $props();
  const resolvedRel = $derived(
    rel ?? (target?.toLowerCase() === '_blank' ? 'noopener noreferrer' : null)
  );
</script>

<a
  {...nativeAttrs}
  bind:this={element}
  {href}
  {target}
  rel={resolvedRel}
  class={classes ?? ''}
  data-pw={testId}
  {onclick}
  {onkeydown}
>
  {@render children?.()}
</a>
