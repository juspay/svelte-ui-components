<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
    testId?: string;
  };

  let { children, testId }: Props = $props();
</script>

<div out:fade={{ duration: 350 }} data-pw={typeof testId === 'string' ? testId : null}>
  {@render children?.()}
</div>
