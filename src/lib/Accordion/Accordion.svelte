<script lang="ts">
  import type { Snippet } from 'svelte';

  const emptySnippet: Snippet = () => {};

  type AccordionProps = {
    expand: boolean;
    children: Snippet;
    onexpandchange: (e: { expand: boolean }) => void;
  };

  const defaultAccordionProps: AccordionProps = {
    expand: false,
    children: emptySnippet,
    onexpandchange: () => {}
  };

  const rawProps = $props();
  const accordionProps: AccordionProps = {
    ...defaultAccordionProps,
    ...rawProps
  };

  let accordionRef: HTMLElement;

  $effect.pre(() => {
    if (!accordionRef) return;

    if (accordionRef.style.transitionDuration === '0s') {
      accordionRef.style.transition = 'max-height 0.2s ease-out';
    }

    const scrollHeight = accordionRef.scrollHeight;

    accordionRef.style.maxHeight = accordionProps.expand ? `${scrollHeight}px` : '0';

    accordionProps.onexpandchange({ expand: accordionProps.expand });
  });
</script>

<div class="accordion" bind:this={accordionRef}>
  {accordionProps.children()}
</div>

<style>
  .accordion {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0s ease-in;
  }
</style>
