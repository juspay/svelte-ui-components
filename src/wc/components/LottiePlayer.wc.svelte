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
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import LottiePlayer from '$lib/LottiePlayer/LottiePlayer.svelte';
  let props = $props();

  const host = $host<HTMLElement>();

  function handleComplete(): void {
    host.dispatchEvent(new CustomEvent('complete', { bubbles: true, composed: true }));
  }

  function handleError(): void {
    host.dispatchEvent(new CustomEvent('error', { bubbles: true, composed: true }));
  }
</script>

<LottiePlayer {...props} oncomplete={handleComplete} onerror={handleError} />
