<svelte:options
  customElement={{
    tag: 'sui-book',
    shadow: 'open',
    props: {
      pages: { type: 'Object' },
      currentPage: { type: 'Number', reflect: true, attribute: 'current-page' },
      transition: { type: 'String', reflect: true },
      showNavigation: { type: 'Boolean', reflect: true, attribute: 'show-navigation' },
      showPageIndicator: { type: 'Boolean', reflect: true, attribute: 'show-page-indicator' },
      enableSwipe: { type: 'Boolean', reflect: true, attribute: 'enable-swipe' },
      testId: { type: 'String', attribute: 'test-id' },
      previousIcon: { type: 'Object' },
      nextIcon: { type: 'Object' },
      classes: { type: 'String' },
      onpagechange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Book from '$lib/Book/Book.svelte';
  // Mirrors Book.svelte's own previousIcon/nextIcon defaults.
  import chevronLeftLgSvg from '$lib/assets/chevron-left-lg.svg?raw';
  import chevronRightLgSvg from '$lib/assets/chevron-right-lg.svg?raw';
  let props = $props();
</script>

<Book {...props}>
  {#snippet previousIcon()}
    <!--
      A snippet declared here is always a function, so Book.svelte's own
      `{#if typeof previousIcon === 'function'} ... {:else}{@html chevronLeftLgSvg}{/if}`
      would always take the true branch and never show its default chevron. Native
      slot fallback content renders exactly when the host assigns nothing, restoring it.
    -->
    <slot name="previous-icon">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html chevronLeftLgSvg}
    </slot>
  {/snippet}
  {#snippet nextIcon()}
    <slot name="next-icon">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html chevronRightLgSvg}
    </slot>
  {/snippet}
</Book>
