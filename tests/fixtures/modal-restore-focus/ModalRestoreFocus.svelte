<script lang="ts">
  import { Modal } from '$lib';
  import { onMount } from 'svelte';
  import type { ModalProperties } from '$lib/Modal/properties';
  let opener: HTMLButtonElement;
  let target: HTMLButtonElement;
  let replacement: HTMLButtonElement;
  let late: HTMLButtonElement | null = null;
  let show = $state(false);
  let showTarget = $state(true);
  let showLate = $state(false);
  let presentation = $state(0);
  let option: ModalProperties['restoreFocusTo'] = $state.raw();
  let props: Partial<ModalProperties> = $state.raw({});
  let mode = 'default';
  let generation = 0;
  const trace: { type: string; detail?: string; overflow?: string; at: number }[] = [];
  const event = (type: string, detail = '') => trace.push({ type, detail, at: performance.now() });
  const makeResolver = (kind: string, owned: number) => () => {
    trace.push({
      type: 'resolve',
      detail: kind,
      overflow: document.body.style.overflow,
      at: performance.now()
    });
    if (kind === 'throw') {
      throw new Error('Owner was withdrawn');
    }
    if (kind === 'null' || kind === 'getter-null' || (kind === 'fenced' && generation !== owned)) {
      return null;
    }
    return kind === 'late' ? late : kind === 'replacement' ? replacement : target;
  };
  const open = (next: string) => {
    mode = next;
    generation += 1;
    presentation = generation;
    event('open', mode);
    option = next === 'element' ? target : next === 'null' ? null : makeResolver(next, generation);
    props = next === 'default' ? {} : { restoreFocusTo: option };
    show = true;
  };
  const close = () => {
    event('intent');
    show = false;
  };
  onMount(() => {
    const focus = (eventObject: FocusEvent) => {
      const element = eventObject.composedPath()[0];
      if (element instanceof HTMLElement) {
        event('focus', element.getAttribute('data-focus-name') ?? element.tagName);
      }
    };
    const transition = (eventObject: Event) => event(eventObject.type);
    document.addEventListener('focusin', focus, true);
    document.addEventListener('outrostart', transition, true);
    document.addEventListener('outroend', transition, true);
    return () => {
      document.removeEventListener('focusin', focus, true);
      document.removeEventListener('outrostart', transition, true);
      document.removeEventListener('outroend', transition, true);
    };
  });
  Object.assign(window, {
    modalRestoreFixture: {
      open(next: string) {
        opener.focus();
        open(next);
      },
      close,
      replaceOption() {
        props = { restoreFocusTo: makeResolver('replacement', generation) };
      },
      withdraw() {
        generation += 1;
      },
      removeTarget() {
        showTarget = false;
      },
      addLate() {
        showLate = true;
      },
      read() {
        return {
          trace: [...trace],
          resolves: trace.filter((x) => x.type === 'resolve').length,
          active:
            document.activeElement?.getAttribute('data-focus-name') ??
            document.activeElement?.tagName,
          overflow: document.body.style.overflow,
          mode
        };
      }
    }
  });
</script>

<main>
  <h1>Modal focus return owner fixture</h1>
  <button bind:this={opener} data-focus-name="opener" onclick={() => open('default')}
    >Original opener</button
  >
  {#if showTarget}<button bind:this={target} data-focus-name="target">Return target</button>{/if}
  {#if showLate}<button bind:this={late} data-focus-name="late">Late target</button>{/if}
  <button bind:this={replacement} data-focus-name="replacement">Replacement target</button>
  {#key presentation}
    {#if show}
      <Modal
        {...props}
        containFocus={true}
        role="dialog"
        ariaLabel="Focus return owner"
        debounceTime={0}
        onoverlayclick={close}
      >
        {#snippet content()}<p>Controlled owner content</p>
          <button data-focus-name="close" onclick={close}>Close presentation</button>{/snippet}
      </Modal>
    {/if}
  {/key}
</main>

<style>
  main {
    font: 16px system-ui;
    padding: 32px;
  }
  button {
    margin: 8px;
    padding: 8px;
  }
  h1 {
    font-size: 24px;
  }
</style>
