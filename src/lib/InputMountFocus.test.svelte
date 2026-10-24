<script lang="ts">
  import Input from './Input/Input.svelte';
  let { native = false }: { native?: boolean } = $props();
  // eslint-disable-next-line no-restricted-syntax -- Reproduce an initially unbound consumer reference.
  let field: ReturnType<typeof Input> | undefined = $state();
  // eslint-disable-next-line no-restricted-syntax -- Reproduce the consumer's mount-time imperative focus.
  $effect(() => {
    field?.focus();
  });
</script>

<Input bind:this={field} {native} label="Recipient" value="" />
