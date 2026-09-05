<svelte:options
  customElement={{
    tag: 'sui-draggable',
    shadow: 'open',
    props: {
      x: { type: 'Number', reflect: true },
      y: { type: 'Number', reflect: true },
      axis: { type: 'String' },
      handle: { type: 'String' },
      bounds: { type: 'String' },
      disabled: { type: 'Boolean', reflect: true },
      step: { type: 'Number' },
      dragLabel: { type: 'String', attribute: 'drag-label' },
      children: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onMoveStart: { type: 'Object' },
      onMove: { type: 'Object' },
      onMoveEnd: { type: 'Object' },
      onmovestart: { type: 'Object' },
      onmove: { type: 'Object' },
      onmoveend: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Draggable from '$lib/Draggable/Draggable.svelte';
  let props = $props();
</script>

<Draggable {...props} />
