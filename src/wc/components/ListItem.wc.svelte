<svelte:options
  customElement={{
    tag: 'sui-list-item',
    shadow: 'open',
    props: {
      leftImageUrl: { type: 'String', reflect: true },
      leftImageFallbackUrl: { type: 'String' },
      rightImageUrl: { type: 'String', reflect: true },
      label: { type: 'String', reflect: true },
      useAccordion: { type: 'Boolean' },
      rightContentText: { type: 'String', reflect: true },
      testId: { type: 'String' },
      topSectionTestId: { type: 'String' },
      rightImageTestId: { type: 'String' },
      leftImageTestId: { type: 'String' },
      centerTextTestId: { type: 'String' },
      showLoader: { type: 'Boolean', reflect: true },
      showRightContentLoader: { type: 'Boolean' },
      expand: { type: 'Boolean', reflect: true },
      preventFocus: { type: 'Boolean' },
      classes: { type: 'String' },
      onleftImageClick: { type: 'Object' },
      onrightImageClick: { type: 'Object' },
      oncenterTextClick: { type: 'Object' },
      onitemClick: { type: 'Object' },
      ontopSectionClick: { type: 'Object' },
      onkeydown: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ListItem from '$lib/ListItem/ListItem.svelte';
  let props = $props();
</script>

<ListItem {...props}>
  {#snippet leftContent()}
    <slot name="left-content"></slot>
  {/snippet}
  {#snippet centerContent()}
    <slot name="center-content"></slot>
  {/snippet}
  {#snippet rightContent()}
    <slot name="right-content"></slot>
  {/snippet}
  {#snippet bottomContent()}
    <slot name="bottom-content"></slot>
  {/snippet}
</ListItem>
