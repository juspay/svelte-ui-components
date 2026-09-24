<svelte:options
  customElement={{
    tag: 'sui-thinking-orb',
    shadow: 'open',
    props: {
      state: { type: 'String' },
      size: { type: 'Number' },
      speed: { type: 'Number' },
      paused: { type: 'Boolean' },
      color: { type: 'Object' },
      dots: { type: 'Number' },
      dotSize: { type: 'Number', attribute: 'dot-size' },
      gravity: { type: 'Object' },
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' },
      orbAriaLabel: { type: 'String', attribute: 'aria-label' },
      onfirstframe: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ThinkingOrb from '$lib/ThinkingOrb/ThinkingOrb.svelte';
  import type { ThinkingOrbProperties } from '$lib/ThinkingOrb/properties';
  import { dispatchEvents } from '../dispatch';
  // Renamed from `ariaLabel`, which every HTMLElement already defines: a prop of
  // that name would shadow the platform's own aria reflection. The host's
  // `aria-label` attribute still maps to it, and is forwarded to the canvas.
  let {
    orbAriaLabel,
    ...props
  }: Omit<ThinkingOrbProperties, 'ariaLabel'> & {
    orbAriaLabel?: ThinkingOrbProperties['ariaLabel'];
  } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onfirstframe takes no arguments and does not collide with any HTMLElement
  // handler, so it dispatches a bare-named CustomEvent for a consumer who only
  // calls addEventListener -- 'firstframe', no detail -- unconditionally, the
  // same shape as VoiceOrb.wc.svelte's own onfirstframe.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<ThinkingOrb {...props} {...dispatchers} ariaLabel={orbAriaLabel} />

<style>
  /* A custom element defaults to `display: inline`; ThinkingOrb.svelte's root
     canvas is sized in inline styles (width/height: size px), which works
     either way, but every other wrapper in this repo sets this for
     consistency and to give a consumer a token to override without reaching
     into the shadow root. */
  :host {
    display: var(--sui-thinking-orb-display, block);
  }
</style>
