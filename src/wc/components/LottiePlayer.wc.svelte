<svelte:options
  customElement={{
    tag: 'sui-lottie-player',
    shadow: 'open',
    props: {
      src: { type: 'String', reflect: true },
      animationData: { type: 'Object' },
      autoplay: { type: 'Boolean', reflect: true },
      loop: { type: 'Boolean', reflect: true },
      speed: { type: 'Number', reflect: true },
      renderer: { type: 'String', reflect: true },
      ariaHidden: { type: 'Boolean', reflect: true, attribute: 'aria-hidden' },
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' },
      oncomplete: { type: 'Object' },
      onerror: { type: 'Object' },
      onComplete: { type: 'Object' },
      onError: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import LottiePlayer from '$lib/LottiePlayer/LottiePlayer.svelte';
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's name
  // minus its `$` with the rune itself (sveltejs/svelte#13715, same class as `state` vs
  // `$state`), reporting `$host` as used before its declaration.
  const hostEl = $host();

  // These handlers sit after {...props}, so they are the only ones the child can
  // call. Declaring `oncomplete`/`onerror` made them assignable without making
  // them reachable — forwarding here is what closes that gap, and the DOM event
  // still fires for addEventListener consumers.
  function handleComplete(): void {
    props.oncomplete?.();
    hostEl.dispatchEvent(new CustomEvent('complete', { bubbles: true, composed: true }));
  }

  function handleError(): void {
    props.onerror?.();
    hostEl.dispatchEvent(new CustomEvent('error', { bubbles: true, composed: true }));
  }
</script>

<LottiePlayer {...props} oncomplete={handleComplete} onerror={handleError} />
