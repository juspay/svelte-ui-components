<svelte:options
  customElement={{
    tag: 'sui-slider',
    shadow: 'open',
    extend: formAssociated({}),
    props: {
      errorMessage: { type: 'String', attribute: 'error-message' },
      infoMessage: { type: 'String', attribute: 'info-message' },
      invalid: { type: 'Boolean', reflect: true },
      value: { type: 'Number', reflect: true },
      min: { type: 'Number', reflect: true },
      max: { type: 'Number', reflect: true },
      step: { type: 'Number', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      showValue: { type: 'Boolean', reflect: true, attribute: 'show-value' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      sliderAriaLabel: { type: 'String', attribute: 'aria-label' },
      sliderAriaLabelledby: { type: 'String', attribute: 'aria-labelledby' },
      name: { type: 'String', reflect: true },
      form: { type: 'String', reflect: true },
      sliderAriaValueText: { type: 'String', attribute: 'aria-valuetext' },
      oninput: { type: 'Object' },
      onchange: { type: 'Object' },
      labelFormatter: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import { formAssociated } from '../form-associated';
  import Slider from '$lib/Slider/Slider.svelte';
  import type { SliderProperties } from '$lib/Slider/properties';
  import { dispatchEvents } from '../dispatch';
  // The element renames `ariaLabel`/`ariaLabelledby` because ARIAMixin already
  // defines both on every HTMLElement, and declaring them here would replace the
  // platform's accessors — the collision `190800b` renamed 24 other props to
  // avoid. The attributes are unchanged: `<sui-slider aria-label="Volume">`
  // works, and only the JavaScript property name differs.
  let {
    sliderAriaLabel,
    sliderAriaLabelledby,
    sliderAriaValueText,
    ...props
  }: Omit<SliderProperties, 'ariaLabel' | 'ariaLabelledby' | 'ariaValueText'> & {
    sliderAriaLabel?: SliderProperties['ariaLabel'];
    sliderAriaLabelledby?: SliderProperties['ariaLabelledby'];
    sliderAriaValueText?: SliderProperties['ariaValueText'];
  } = $props();

  // See the comment on `hostEl` in LottiePlayer.wc.svelte for why it is not
  // named `host`.
  const hostEl = $host();

  // Slider's only callback props are oninput and onchange, and BOTH
  // collide with HTMLElement's own accessors of the same name -- so
  // dispatchEvents returns no dispatcher for either, and neither one ever
  // dispatches a DOM event. Wired anyway, and called unconditionally like
  // every other wrapper, so the collision guard's no-op is proven rather than
  // assumed -- Slider is a formAssociated subclass (see dispatch.ts's own note
  // on why a form control's declared accessors live one prototype level
  // further up than a plain wrapper's), which is exactly the shape where a
  // test could otherwise pass while testing nothing.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));

  // `aria-labelledby` cannot be forwarded to the inner input the way
  // `aria-label` can. The input lives in this element's shadow root, and ARIA
  // ID references do not cross a shadow boundary — so an id naming an element
  // in the consumer's document resolves to nothing and the slider ends up with
  // no accessible name at all. Passing the id straight through therefore looks
  // wired and does nothing, which is the exact failure the wc-parity suite
  // exists to catch.
  //
  // The platform's own answer (`referenceTarget`) is still a proposal, so this
  // resolves the reference here, on the host's root, and forwards the text as
  // `aria-label` — a string, which crosses the boundary fine. The tradeoff is
  // that the name is copied rather than bound: later edits to the label
  // element's text do not propagate. `aria-label` still wins when both are set,
  // matching Slider.svelte and the platform.
  function resolveLabel(ids: SliderProperties['ariaLabelledby']): SliderProperties['ariaLabel'] {
    if (typeof ids !== 'string' || ids.trim() === '') {
      return;
    }
    const root = hostEl.getRootNode();
    if (!(root instanceof Document) && !(root instanceof ShadowRoot)) {
      return;
    }
    const text = ids
      .trim()
      .split(/\s+/)
      .map((id) => root.getElementById(id)?.textContent?.trim() ?? '')
      .filter((part) => part !== '')
      .join(' ');
    if (text === '') {
      return;
    }
    return text;
  }

  let referencedLabel: SliderProperties['ariaLabel'] = $state();

  // An effect rather than $derived: the referenced element is looked up in the
  // consumer's DOM, which is not reactive state, and the lookup needs this
  // element to be in a document before there is a root to search.
  $effect(() => {
    referencedLabel = resolveLabel(sliderAriaLabelledby);
  });
</script>

<!-- `ariaLabelledby` is still forwarded so the prop stays reachable, but it is
     the fallback rather than the mechanism: Slider.svelte drops aria-labelledby
     whenever aria-label is a string, so the resolved name above wins and the raw
     id is only emitted when the reference resolved to nothing — where it is
     inert either way. -->
<Slider
  {...props}
  {...dispatchers}
  ariaLabel={sliderAriaLabel ?? referencedLabel}
  ariaLabelledby={sliderAriaLabelledby}
  ariaValueText={sliderAriaValueText}
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
    display: var(--sui-slider-display, block);
  }
</style>
