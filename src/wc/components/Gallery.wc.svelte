<svelte:options
  customElement={{
    tag: 'sui-gallery',
    shadow: 'open',
    props: {
      images: { type: 'Object' },
      lightboxTransitionDuration: {
        type: 'Number',
        attribute: 'lightbox-transition-duration',
        reflect: true
      },
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
      onkeydown: { type: 'Object' },
      onimageclick: { type: 'Object' },
      oneditclick: { type: 'Object' },
      ondeleteclick: { type: 'Object' },
      onopen: { type: 'Object' },
      onclose: { type: 'Object' },
      onchange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Gallery from '$lib/Gallery/Gallery.svelte';
  let props = $props();
</script>

<Gallery {...props} />
