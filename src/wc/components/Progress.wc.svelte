<svelte:options
  customElement={{
    tag: 'sui-progress',
    shadow: 'open',
    props: {
      value: { type: 'Number', reflect: true },
      max: { type: 'Number', reflect: true },
      showLabel: { type: 'Boolean', reflect: true, attribute: 'show-label' },
      animateValue: { type: 'Boolean', reflect: true, attribute: 'animate-value' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      leadingLabel: { type: 'Object' },
      headerStart: { type: 'Object' },
      headerEnd: { type: 'Object' },
      note: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Progress from '$lib/Progress/Progress.svelte';
  import type { ProgressProperties } from '$lib/Progress/properties';

  let props: ProgressProperties = $props();
  // Each of these gates a wrapper row in Progress.svelte. Supplying the snippet
  // when the slot is empty would add that row to every <sui-progress>.
  const hasLeadingLabelSlot = $host().querySelector('[slot="leading-label"]') !== null;
  const hasHeaderStartSlot = $host().querySelector('[slot="header-start"]') !== null;
  const hasHeaderEndSlot = $host().querySelector('[slot="header-end"]') !== null;
  const hasNoteSlot = $host().querySelector('[slot="note"]') !== null;
</script>

<!--
  Each snippet reads props.* so it stays in component scope. A bare top-level
  slot snippet is hoisted and then throws `$$props is not defined` when it renders.
-->
{#snippet leadingLabelImpl()}
  {#if props.leadingLabel}{@render props.leadingLabel()}{:else}<slot name="leading-label"
    ></slot>{/if}
{/snippet}
{#snippet headerStartImpl()}
  {#if props.headerStart}{@render props.headerStart()}{:else}<slot name="header-start"></slot>{/if}
{/snippet}
{#snippet headerEndImpl()}
  {#if props.headerEnd}{@render props.headerEnd()}{:else}<slot name="header-end"></slot>{/if}
{/snippet}
{#snippet noteImpl()}
  {#if props.note}{@render props.note()}{:else}<slot name="note"></slot>{/if}
{/snippet}

<Progress
  {...props}
  leadingLabel={hasLeadingLabelSlot ? leadingLabelImpl : props.leadingLabel}
  headerStart={hasHeaderStartSlot ? headerStartImpl : props.headerStart}
  headerEnd={hasHeaderEndSlot ? headerEndImpl : props.headerEnd}
  note={hasNoteSlot ? noteImpl : props.note}
/>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-progress-display, block);
  }
</style>
