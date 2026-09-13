<svelte:options
  customElement={{
    tag: 'sui-card',
    shadow: 'open',
    props: {
      cardTitle: { type: 'String', reflect: true, attribute: 'title' },
      description: { type: 'String', reflect: true },
      classes: { type: 'String' },
      stretch: { type: 'Boolean', reflect: true },
      scrollable: { type: 'Boolean', reflect: true },
      cssVars: { type: 'Object' },
      titleSnippet: { type: 'Object' },
      descriptionSnippet: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      onclick: { type: 'Object' },
      href: { type: 'String', attribute: 'href' },
      target: { type: 'String', attribute: 'target' },
      rel: { type: 'String', attribute: 'rel' },
      headerRight: { type: 'Object' },
      footer: { type: 'Object' },
      attrs: { type: 'Object' },
      as: { type: 'String', reflect: true, attribute: 'as' }
    }
  }}
/>

<script lang="ts">
  import Card from '$lib/Card/Card.svelte';
  import { dispatchEvents } from '../dispatch';
  let { cardTitle, ...props } = $props();

  // `$host()` is called inline rather than held in a `const host`: a `$`-prefixed
  // identifier is Svelte's store-subscription spelling, so a local named `host`
  // makes `$host` read as that store and svelte-check reports the initializer as
  // referencing itself.
  //
  // Each of these four gates a wrapper DOM element's very existence in Card.svelte
  // (the header row, its split-layout class, the header-right box, the footer
  // element) rather than just which content fills an existing box. Supplying every
  // snippet unconditionally would put an empty header/footer on every `<sui-card>`
  // that never slots one, so each is claimed only when the consumer really slotted
  // content -- which also leaves a JS-assigned property working when they did not.
  const hasTitleSnippetSlot = $host().querySelector('[slot="title-snippet"]') !== null;
  const hasDescriptionSnippetSlot = $host().querySelector('[slot="description-snippet"]') !== null;
  const hasHeaderRightSlot = $host().querySelector('[slot="header-right"]') !== null;
  const hasFooterSlot = $host().querySelector('[slot="footer"]') !== null;

  // Named hostEl, not host, and bound separately from the four inline $host() calls
  // above: this one exists only to hand dispatchEvents a host reference, and
  // consolidating it with those four would replace the literal `$host().querySelector(
  // '[slot="..."]')` shape a separate check (src/wc-content-slots.test.ts) reads
  // straight out of this file's source text.
  const hostEl = $host();

  // onclick is this element's ONLY callback prop, and it collides with
  // HTMLElement's own onclick accessor with no exception recorded for
  // 'sui-card:onclick' in ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS -- so
  // dispatchEvents intentionally returns nothing for it. It stays callback-only:
  // `card.onclick = fn` still runs `fn(event)` exactly as before, but no synthetic
  // 'click' is ever dispatched. Called anyway, rather than special-cased away: proves
  // the collision guard produces this no-op instead of assuming it.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<!--
  Four independently-guarded props, none of them a named child of <Card> -- each is
  passed as an ordinary attribute expression on the tag below instead. A `{#snippet}`
  declared at the top level of a template is hoisted to module scope only when its
  body references NOTHING from instance scope (verified against the compiled
  output); a bare, unconditional `<slot>` qualifies and gets hoisted, and the
  `$.slot(node, $$props, …)` inside it then throws `$$props is not defined` the
  moment it renders, which shows up as a silently empty shadow root rather than as a
  build error (see PieChart.wc.svelte, which branches instead to avoid exactly this).
  Each snippet below instead reads `props.X` -- the JS-assigned fallback -- inside an
  `{#if}`, which keeps all four in component scope without four (or with all four
  independent, sixteen) copies of the <Card> tag.
-->
{#snippet titleSnippetImpl()}
  {#if props.titleSnippet}{@render props.titleSnippet()}{:else}<slot name="title-snippet"
    ></slot>{/if}
{/snippet}
{#snippet descriptionSnippetImpl()}
  {#if props.descriptionSnippet}{@render props.descriptionSnippet()}{:else}<slot
      name="description-snippet"
    ></slot>{/if}
{/snippet}
{#snippet headerRightImpl()}
  {#if props.headerRight}{@render props.headerRight()}{:else}<slot name="header-right"></slot>{/if}
{/snippet}
{#snippet footerImpl()}
  {#if props.footer}{@render props.footer()}{:else}<slot name="footer"></slot>{/if}
{/snippet}

<Card
  {...props}
  {...dispatchers}
  title={cardTitle}
  titleSnippet={hasTitleSnippetSlot ? titleSnippetImpl : props.titleSnippet}
  descriptionSnippet={hasDescriptionSnippetSlot ? descriptionSnippetImpl : props.descriptionSnippet}
  headerRight={hasHeaderRightSlot ? headerRightImpl : props.headerRight}
  footer={hasFooterSlot ? footerImpl : props.footer}
>
  {#snippet children()}
    <slot></slot>
  {/snippet}
</Card>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-card-display, block);
  }
</style>
