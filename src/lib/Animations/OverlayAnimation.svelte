<script>
  import { fade } from 'svelte/transition';
</script>

<div out:fade={{ duration: 350 }}>
  <slot />
</div>
