<script lang="ts">
  import { onMount } from 'svelte';
  import Modal from '$lib/Modal/Modal.svelte';
  import Sheet from '$lib/Sheet/Sheet.svelte';
  import CommandMenu from '$lib/CommandMenu/CommandMenu.svelte';
  import type { ScrollContainer } from '$lib/types';

  let firstRoot: HTMLElement | null = $state(null);
  let secondRoot: HTMLElement | null = $state(null);
  let selected = $state('a');
  let modalOpen = $state(false);
  let sheetOpen = $state(false);
  let menuOpen = $state(false);
  const mode = new URLSearchParams(location.search).get('owner') ?? 'app';
  const scrollContainer: ScrollContainer = () =>
    mode === 'body'
      ? document.body
      : selected === 'a'
        ? firstRoot
        : selected === 'b'
          ? secondRoot
          : null;

  onMount(() => {
    const control = (event: Event) => {
      if (!(event instanceof CustomEvent) || typeof event.detail !== 'string') {
        return;
      }
      const action = event.detail;
      if (action === 'sheet-close') {
        sheetOpen = false;
      }
      if (action === 'menu-close') {
        menuOpen = false;
      }
      if (action === 'sheet-open-b') {
        selected = 'b';
        sheetOpen = true;
      }
      if (action === 'menu-open-b') {
        selected = 'b';
        menuOpen = true;
      }
      if (action === 'sheet-open-null' || action === 'menu-open-null') {
        selected = 'none';
        if (action === 'sheet-open-null') {
          sheetOpen = true;
        } else {
          menuOpen = true;
        }
      }
      if (action === 'close-all') {
        modalOpen = false;
        sheetOpen = false;
        menuOpen = false;
      }
    };
    window.addEventListener('overlay-fixture-control', control);
    document.documentElement.dataset.fixtureReady = 'true';
    return () => window.removeEventListener('overlay-fixture-control', control);
  });
</script>

<div class="owned-root" bind:this={firstRoot} data-pw="owner-a">
  <button data-pw="open-modal" onclick={() => (modalOpen = true)}>Open Modal</button>
  <button data-pw="open-sheet" onclick={() => (sheetOpen = true)}>Open Sheet</button>
  <button data-pw="open-menu" onclick={() => (menuOpen = true)}>Open CommandMenu</button>
  <div class="app-spacer">App scroll content</div>
</div>
<div class="second-root" bind:this={secondRoot} data-pw="owner-b">Second scroll owner</div>

{#if modalOpen}
  <Modal
    {scrollContainer}
    usePortal
    role="dialog"
    ariaLabel="Owned Modal"
    testId="owned-modal"
    ondismiss={() => (modalOpen = false)}
  >
    {#snippet content()}
      <button data-pw="close-modal" onclick={() => (modalOpen = false)}>Close Modal</button>
      <button data-pw="nested-sheet" onclick={() => (sheetOpen = true)}>Open nested Sheet</button>
    {/snippet}
  </Modal>
{/if}
<Sheet
  bind:open={sheetOpen}
  {scrollContainer}
  title="Owned Sheet"
  testId="owned-sheet"
  onclose={() => (sheetOpen = false)}
>
  {#snippet content()}
    <button data-pw="close-sheet" onclick={() => (sheetOpen = false)}>Close Sheet</button>
  {/snippet}
</Sheet>
<CommandMenu
  bind:open={menuOpen}
  {scrollContainer}
  enableHotkey={false}
  testId="owned-menu"
  items={[{ value: 'close', label: 'Close CommandMenu' }]}
/>

<style>
  .owned-root {
    height: 330px;
    overflow: auto;
    background: #eff6ff;
    color: #172554;
  }
  .second-root {
    height: 90px;
    overflow: scroll;
  }
  .app-spacer {
    height: 1100px;
    padding: 12px;
  }
</style>
