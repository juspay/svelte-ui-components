<script lang="ts">
  import { Modal } from '$lib';
  let { resolve }: { resolve: () => HTMLElement | null } = $props();
</script>

<Modal restoreFocusTo={resolve}>
  {#snippet content()}<p>Server-rendered Modal content</p>{/snippet}
</Modal>
