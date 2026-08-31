<svelte:options
  customElement={{
    tag: 'sui-list-item',
    shadow: 'open',
    props: {
      leftImageUrl: { type: 'String', reflect: true, attribute: 'left-image-url' },
      leftImageFallbackUrl: { type: 'String', attribute: 'left-image-fallback-url' },
      rightImageUrl: { type: 'String', reflect: true, attribute: 'right-image-url' },
      label: { type: 'String', reflect: true },
      useAccordion: { type: 'Boolean', attribute: 'use-accordion' },
      rightContentText: { type: 'String', reflect: true, attribute: 'right-content-text' },
      testId: { type: 'String', attribute: 'test-id' },
      topSectionTestId: { type: 'String', attribute: 'top-section-test-id' },
      rightImageTestId: { type: 'String', attribute: 'right-image-test-id' },
      leftImageTestId: { type: 'String', attribute: 'left-image-test-id' },
      centerTextTestId: { type: 'String', attribute: 'center-text-test-id' },
      showLoader: { type: 'Boolean', reflect: true, attribute: 'show-loader' },
      showRightContentLoader: { type: 'Boolean', attribute: 'show-right-content-loader' },
      expand: { type: 'Boolean', reflect: true },
      preventFocus: { type: 'Boolean', attribute: 'prevent-focus' },
      suppressRoleAndTabindex: { type: 'Boolean', attribute: 'suppress-role-and-tabindex' },
      transformSvg: { type: 'Object' },
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
