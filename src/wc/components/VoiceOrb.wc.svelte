<svelte:options
  customElement={{
    tag: 'sui-voice-orb',
    shadow: 'open',
    props: {
      variant: { type: 'String' },
      speedMultiplier: { type: 'Number', attribute: 'speed-multiplier' },
      seed: { type: 'String' },
      height: { type: 'Number' },
      particleCount: { type: 'Number', attribute: 'particle-count' },
      radius: { type: 'Number' },
      interactive: { type: 'Boolean' },
      repelRadius: { type: 'Number', attribute: 'repel-radius' },
      analyser: { type: 'Object' },
      sensitivity: { type: 'Number' },
      persistKey: { type: 'String', attribute: 'persist-key' },
      statusLabels: { type: 'Object', attribute: 'status-labels' },
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' },
      onfirstframe: { type: 'Object' },
      onlevel: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import VoiceOrb from '$lib/VoiceOrb/VoiceOrb.svelte';
  import { dispatchEvents } from '../dispatch';
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // Neither onfirstframe nor onlevel collides with an HTMLElement handler, so
  // both dispatch a bare-named CustomEvent for a consumer who only calls
  // addEventListener -- 'firstframe' with no detail (a 0-argument callback), 'level'
  // with the reported level as its detail. Neither is presence-gated: VoiceOrb calls
  // them as `onlevel?.(...)` / `onfirstframe?.()` and renders the same either way, so
  // no entry belongs in presence-gated-callbacks.ts and the dispatchers are
  // unconditional.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<VoiceOrb {...props} {...dispatchers} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite width
     for a percentage to resolve against -- and VoiceOrb's own root sizes itself
     with `width: 100%`, so without this the canvas resolved against the wrong
     ancestor and its size depended on the consumer's surrounding markup. The
     value matches that root (block-level), and is a token so a consumer can
     change it without reaching inside the shadow root, which a stylesheet
     cannot do. Same shape as every other wrapper -- this element was the one
     that arrived from release without it. */
  :host {
    display: var(--sui-voice-orb-display, block);
  }
</style>
