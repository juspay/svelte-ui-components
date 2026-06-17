<!--
  @internal
  Helper component that renders a Svelte snippet into an imperatively-created DOM element via
  mount(). Used by Tooltip's portal mode to project rich `content` snippets into a bubble
  that lives on document.body outside the normal component tree. Not intended for direct
  consumer use.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let { snippet }: { snippet: Snippet } = $props();
</script>

{@render snippet()}
