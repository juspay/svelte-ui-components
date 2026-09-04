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
      onkeydown: { type: 'Object' },
      leftContent: { type: 'Object' },
      centerContent: { type: 'Object' },
      rightContent: { type: 'Object' },
      bottomContent: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ListItem from '$lib/ListItem/ListItem.svelte';
  let props = $props();
</script>

<!-- A property-assigned snippet wins; the slot is the fallback. The branch stays
     inside the body snippet so `<slot>` keeps its `$$props` scope. -->
<ListItem {...props}>
  {#snippet leftContent()}
    {#if props.leftContent}{@render props.leftContent()}{:else}<slot name="left-content"
      ></slot>{/if}
  {/snippet}
  {#snippet centerContent()}
    {#if props.centerContent}{@render props.centerContent()}{:else}<slot name="center-content"
      ></slot>{/if}
  {/snippet}
  {#snippet rightContent()}
    {#if props.rightContent}{@render props.rightContent()}{:else}<slot name="right-content"
      ></slot>{/if}
  {/snippet}
  {#snippet bottomContent()}
    {#if props.bottomContent}{@render props.bottomContent()}{:else}<slot name="bottom-content"
      ></slot>{/if}
  {/snippet}
</ListItem>
