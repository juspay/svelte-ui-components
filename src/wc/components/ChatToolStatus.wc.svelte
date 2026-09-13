<svelte:options
  customElement={{
    tag: 'sui-chat-tool-status',
    shadow: 'open',
    props: {
      label: { type: 'String', reflect: true },
      icon: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import ChatToolStatus from '$lib/ChatToolStatus/ChatToolStatus.svelte';
  import Loader from '$lib/Loader/Loader.svelte';
  let props = $props();
</script>

<!--
  A property-assigned icon wins; the slot is the fallback, carrying ChatToolStatus's
  own `<Loader />` as ITS fallback so a consumer supplying neither still sees the
  spinner. The branch stays inside the body snippet so `<slot>` keeps its `$$props`
  scope. Mirroring a component rather than markup is safe here because every
  `--loader-*` value is set on `.indicator`, the span the component itself renders
  around this snippet, and custom properties inherit into whatever fills it.
-->
<ChatToolStatus {...props}>
  {#snippet icon()}
    {#if props.icon}{@render props.icon()}{:else}<slot name="icon"><Loader /></slot>{/if}
  {/snippet}
</ChatToolStatus>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-chat-tool-status-display, block);
  }
</style>
