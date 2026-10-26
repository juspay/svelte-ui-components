<script lang="ts">
  import { Sheet, Modal } from '$lib';
  import { flushSync } from 'svelte';
  let open = $state(false);
  let mounted = $state(true);
  let covered = $state(false);
  let opener: HTMLButtonElement;
  let input: HTMLInputElement;
  let draft = $state('Retained owner draft');
  const focusTrace: string[] = [];
  const reverse = (mode: string): void => {
    flushSync(() => {
      open = false;
    });
    opener.focus();
    flushSync(() => {
      open = true;
      covered = mode === 'covered';
    });
    if (mode === 'inner') {
      input.focus();
      input.setSelectionRange(1, 5);
    }
    if (mode === 'close') {
      flushSync(() => {
        open = false;
      });
    }
    if (mode === 'unmount') {
      flushSync(() => {
        mounted = false;
      });
    }
  };
  Object.assign(window, {
    sheetReversalFixture: {
      reverse,
      read: () => ({
        open,
        mounted,
        covered,
        draft,
        active:
          document.activeElement?.getAttribute('data-focus-name') ??
          document.activeElement?.tagName,
        selection: [input?.selectionStart, input?.selectionEnd],
        focusTrace: [...focusTrace]
      })
    }
  });
</script>

<main>
  <h1>Sheet reopen guard fixture</h1>
  <button
    bind:this={opener}
    data-pw="reversal-add"
    data-focus-name="opener"
    onclick={() => {
      open = true;
    }}>Add</button
  >
  {#if mounted}
    <Sheet bind:open title="Retained Sheet" testId="reversal-sheet">
      {#snippet content()}<label
          >Draft<input
            bind:this={input}
            bind:value={draft}
            data-pw="reversal-input"
            data-focus-name="inner"
            onfocus={() => focusTrace.push('inner')}
          /></label
        >{/snippet}
    </Sheet>
  {/if}
  {#if covered}
    <Modal role="dialog" ariaLabel="Newer top layer">
      {#snippet content()}<button data-pw="newer-layer-input" data-focus-name="newer"
          >Newer layer control</button
        >{/snippet}
    </Modal>
  {/if}
</main>

<style>
  main {
    font: 16px system-ui;
    padding: 24px;
  }
  button,
  input {
    margin: 8px;
  }
</style>
