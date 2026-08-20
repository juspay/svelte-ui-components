<svelte:options
  customElement={{
    tag: 'sui-chat-bubble',
    shadow: 'open',
    props: {
      open: { type: 'Boolean', reflect: true },
      position: { type: 'String', reflect: true },
      label: { type: 'String', reflect: true },
      closeLabel: { type: 'String', attribute: 'close-label' },
      icon: { type: 'Object' },
      openIcon: { type: 'Object' },
      children: { type: 'Object' },
      draggable: { type: 'Boolean', reflect: true },
      dragMode: { type: 'String', attribute: 'drag-mode' },
      dragX: { type: 'Number', attribute: 'drag-x' },
      dragY: { type: 'Number', attribute: 'drag-y' },
      resizable: { type: 'Boolean', reflect: true },
      panelWidth: { type: 'Number', attribute: 'panel-width' },
      panelHeight: { type: 'Number', attribute: 'panel-height' },
      minPanelWidth: { type: 'Number', attribute: 'min-panel-width' },
      minPanelHeight: { type: 'Number', attribute: 'min-panel-height' },
      expanded: { type: 'Boolean', reflect: true },
      expandedPanelWidth: { type: 'Number', attribute: 'expanded-panel-width' },
      expandedPanelHeight: { type: 'Number', attribute: 'expanded-panel-height' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onopen: { type: 'Object' },
      onclose: { type: 'Object' },
      ontoggle: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ChatBubble from '$lib/ChatBubble/ChatBubble.svelte';
  let props = $props();
</script>

<ChatBubble {...props} />
