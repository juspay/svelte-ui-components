<svelte:options
  customElement={{
    tag: 'sui-typewriter-text',
    shadow: 'open',
    props: {
      text: { type: 'String' },
      speed: { type: 'Number', reflect: true },
      isStreaming: { type: 'Boolean', attribute: 'is-streaming' },
      markdown: { type: 'Boolean' },
      markdownOptions: { type: 'Object', attribute: 'markdown-options' },
      renderText: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      variableDelay: { type: 'Object' },
      resolveDelay: { type: 'Object' },
      renderCharacter: { type: 'Object' },
      onprogress: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import TypewriterText from '$lib/TypewriterText/TypewriterText.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onprogress is this element's ONLY callback prop, and it collides with
  // HTMLElement's own onprogress accessor (inherited via the progress-related global
  // event handler content attributes) with no exception recorded for
  // 'sui-typewriter-text:onprogress' in ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS --
  // so dispatchEvents intentionally returns nothing for it. It stays callback-only:
  // `typewriterText.onprogress = fn` still runs `fn(progress)` exactly as before, but no
  // synthetic 'progress' event is ever dispatched. Called anyway, on every wrapper,
  // rather than special-cased away: proves the collision guard produces this no-op
  // instead of assuming it.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<TypewriterText {...props} {...dispatchers} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-typewriter-text-display, block);
  }
</style>
