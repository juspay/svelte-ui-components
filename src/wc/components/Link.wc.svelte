<svelte:options
  customElement={{
    tag: 'sui-link',
    shadow: 'open',
    props: {
      onlinkkeydown: { type: 'Object' },
      onlinkclick: { type: 'Object' },
      element: { type: 'Object' },
      href: { type: 'String' },
      target: { type: 'String' },
      rel: { type: 'String' },
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' },
      nativeAttrs: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Link from '$lib/Link/Link.svelte';
  import type { LinkProperties } from '$lib/Link/properties';
  import { dispatchEvents } from '../dispatch';
  let {
    element = $bindable<HTMLAnchorElement | null>(null),
    ...props
  }: LinkProperties & {
    onlinkclick?: LinkProperties['onclick'];
    onlinkkeydown?: LinkProperties['onkeydown'];
  } = $props();
  const hostEl = $host();
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
  const onlinkclick = $derived(dispatchers.onlinkclick ?? props.onlinkclick);
  const onlinkkeydown = $derived(dispatchers.onlinkkeydown ?? props.onlinkkeydown);
</script>

<Link onkeydown={onlinkkeydown} onclick={onlinkclick} bind:element {...props} {...dispatchers}>
  <slot></slot>
</Link>

<style>
  :host {
    display: var(--sui-link-display, inline-block);
  }
</style>
