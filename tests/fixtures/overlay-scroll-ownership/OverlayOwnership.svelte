<script lang="ts">
  import Modal from '$lib/Modal/Modal.svelte';
  import Sheet from '$lib/Sheet/Sheet.svelte';
  import CommandMenu from '$lib/CommandMenu/CommandMenu.svelte';
  let root: HTMLDivElement | null = $state(null);
  let modal = $state(false);
  let sheet = $state(false);
  let menu = $state(false);
  let mounted = $state(true);
  const params = new URLSearchParams(location.search);
  const scoped = params.get('standalone') !== '1';
  const nullOwner = params.get('null') === '1';
  const ownership = scoped ? { scrollContainer: () => (nullOwner ? null : root) } : {};
</script>

<div class="host-spacer">Host page scroll control</div>
<div
  class="scroll-root"
  bind:this={root}
  data-pw="scroll-root"
  style="overflow: auto !important; --modal-content-background-color: rgb(240, 235, 230)"
>
  <button data-pw="open-modal" onclick={() => (modal = true)}>Open modal</button>
  <button data-pw="open-sheet" onclick={() => (sheet = true)}>Open sheet</button>
  <button data-pw="open-menu" onclick={() => (menu = true)}>Open menu</button>
  {#if mounted}
    {#if modal}
      <Modal
        {...ownership}
        role="dialog"
        ariaLabel="Owned modal"
        enableTransition={false}
        onclose={() => (modal = false)}
        ondismiss={() => (modal = false)}
      >
        {#snippet content()}
          <button data-pw="nested-sheet" onclick={() => (sheet = true)}>Open nested sheet</button>
          <button data-pw="close-modal" onclick={() => (modal = false)}>Close modal</button>
        {/snippet}
      </Modal>
    {/if}
    <Sheet {...ownership} bind:open={sheet} title="Owned sheet" testId="owned-sheet">
      {#snippet content()}
        <button data-pw="nested-menu" onclick={() => (menu = true)}>Open nested menu</button>
        <button data-pw="close-sheet" onclick={() => (sheet = false)}>Close sheet</button>
        <button data-pw="force-unmount" onclick={() => (mounted = false)}
          >Unmount all overlays</button
        >
      {/snippet}
    </Sheet>
    <CommandMenu
      {...ownership}
      bind:open={menu}
      items={[{ label: 'Unmount all', value: 'unmount' }]}
      onselect={() => (mounted = false)}
      ariaLabel="Owned menu"
    />
  {/if}
  <div class="owned-content" data-pw="owned-content">Owned scroll content</div>
</div>
<div class="host-spacer">Host page scroll control below</div>

<style>
  .scroll-root {
    width: 360px;
    height: 250px;
    margin: 20px;
    --sheet-transition-duration: 0ms;
  }
  .owned-content {
    height: 1800px;
    background: linear-gradient(white, lightblue);
  }
  .host-spacer {
    height: 500px;
  }
</style>
