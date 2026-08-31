<svelte:options
  customElement={{
    tag: 'sui-gallery',
    shadow: 'open',
    props: {
      images: { type: 'Object' },
      view: { type: 'String' },
      open: { type: 'Boolean', reflect: true },
      activeIndex: { type: 'Number', attribute: 'active-index', reflect: true },
      enableLightbox: { type: 'Boolean', attribute: 'enable-lightbox' },
      loop: { type: 'Boolean' },
      showCounter: { type: 'Boolean', attribute: 'show-counter' },
      showCaption: { type: 'Boolean', attribute: 'show-caption' },
      previousIcon: { type: 'Object' },
      nextIcon: { type: 'Object' },
      closeIcon: { type: 'Object' },
      editIcon: { type: 'Object' },
      deleteIcon: { type: 'Object' },
      itemFooter: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onImageClick: { type: 'Object' },
      onEditClick: { type: 'Object' },
      onDeleteClick: { type: 'Object' },
      onOpen: { type: 'Object' },
      onDismiss: { type: 'Object' },
      onIndexChange: { type: 'Object' },
      onkeydown: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Gallery from '$lib/Gallery/Gallery.svelte';
  let props = $props();
</script>

<Gallery {...props} />
