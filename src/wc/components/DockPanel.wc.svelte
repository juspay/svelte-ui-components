<svelte:options
  customElement={{
    tag: 'sui-dock-panel',
    shadow: 'open',
    props: {
      state: { type: 'String', reflect: true },
      width: { type: 'Number', reflect: true },
      minWidth: { type: 'Number', attribute: 'min-width' },
      maxWidth: { type: 'Number', attribute: 'max-width' },
      reservedWidth: { type: 'Number', reflect: true, attribute: 'reserved-width' },
      label: { type: 'String' },
      resizeLabel: { type: 'String', attribute: 'resize-label' },
      header: { type: 'Object' },
      body: { type: 'Object' },
      footer: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onstatechange: { type: 'Object' },
      onwidthchange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import { createRawSnippet, onMount } from 'svelte';
  import DockPanel from '$lib/DockPanel/DockPanel.svelte';
  import type { DockPanelControls, DockPanelProperties } from '$lib/DockPanel/properties';
  import { dispatchEvents } from '../dispatch';

  let {
    state: panelState = $bindable('closed'),
    width = $bindable(380),
    reservedWidth = $bindable(0),
    ...props
  }: DockPanelProperties = $props();
  const hostEl = $host();
  let hasHeaderSlot = $state(false);
  let hasFooterSlot = $state(false);
  onMount(() => {
    const updateSlots = (): void => {
      hasHeaderSlot = Array.from(hostEl.children).some(
        (child) => child.getAttribute('slot') === 'header'
      );
      hasFooterSlot = Array.from(hostEl.children).some(
        (child) => child.getAttribute('slot') === 'footer'
      );
    };
    updateSlots();
    const observer = new MutationObserver(updateSlots);
    observer.observe(hostEl, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['slot']
    });
    return () => observer.disconnect();
  });
  const dispatchers = $derived(dispatchEvents(hostEl, props));
  // Top-level snippet slots compile as Svelte slots; raw snippets create native
  // slots while keeping the DockPanel instance mounted during light-DOM updates.
  const headerSlot = createRawSnippet<[DockPanelControls]>(() => ({
    render: () => '<slot name="header"></slot>'
  }));
  const footerSlot = createRawSnippet(() => ({ render: () => '<slot name="footer"></slot>' }));
  const bodySlot = createRawSnippet(() => ({
    render: () => '<slot name="body"><slot></slot></slot>'
  }));
</script>

<DockPanel
  {...props}
  {...dispatchers}
  bind:state={panelState}
  bind:width
  bind:reservedWidth
  header={hasHeaderSlot ? headerSlot : props.header}
  body={typeof props.body === 'function' ? props.body : bodySlot}
  footer={hasFooterSlot ? footerSlot : props.footer}
/>

<style>
  :host {
    display: var(--sui-dock-panel-display, block);
  }
</style>
