<script lang="ts">
  import Sheet from './Sheet.svelte';
  import type { Snippet } from 'svelte';
  import type { ScrollContainer } from '../types';
  let { content, scrollContainer }: { content: Snippet; scrollContainer?: ScrollContainer } =
    $props();
  let open = $state(true);
  export function setOpen(next: boolean): void {
    open = next;
  }
</script>

<Sheet bind:open {content} {scrollContainer} testId="reversal-sheet" />
