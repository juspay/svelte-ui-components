<svelte:options
  customElement={{
    tag: 'sui-media-player',
    shadow: 'open',
    props: {
      src: { type: 'String' },
      type: { type: 'String' },
      alt: { type: 'String' },
      mediaAriaLabel: { type: 'String', reflect: true, attribute: 'aria-label' },
      autoplay: { type: 'Boolean' },
      loop: { type: 'Boolean' },
      controls: { type: 'Boolean' },
      fallback: { type: 'String' },
      playing: { type: 'Boolean', reflect: true },
      muted: { type: 'Boolean', reflect: true },
      playIcon: { type: 'Object' },
      pauseIcon: { type: 'Object' },
      muteIcon: { type: 'Object' },
      unmuteIcon: { type: 'Object' },
      captionsSrc: { type: 'String', attribute: 'captions-src' },
      captionsLabel: { type: 'String', attribute: 'captions-label' },
      captionsSrcLang: { type: 'String', attribute: 'captions-src-lang' },
      captionsButton: { type: 'Boolean', attribute: 'captions-button' },
      captionsVisible: { type: 'Boolean', reflect: true, attribute: 'captions-visible' },
      captionsIcon: { type: 'Object' },
      captionsOnIcon: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      seekBar: { type: 'Boolean', attribute: 'seek-bar' },
      timeDisplay: { type: 'Boolean', attribute: 'time-display' },
      fullscreenButton: { type: 'Boolean', attribute: 'fullscreen-button' },
      fullscreenIcon: { type: 'Object' },
      exitFullscreenIcon: { type: 'Object' },
      currentTime: { type: 'Number', attribute: 'current-time' },
      duration: { type: 'Number' },
      onplay: { type: 'Object' },
      onpause: { type: 'Object' },
      onvolumechange: { type: 'Object' },
      oncaptionschange: { type: 'Object' },
      onseek: { type: 'Object' },
      ontimeupdate: { type: 'Object' },
      onfullscreenchange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import MediaPlayer from '$lib/MediaPlayer/MediaPlayer.svelte';
  import type { MediaPlayerProperties } from '$lib/MediaPlayer/properties';
  import playSvg from '$lib/assets/play.svg?raw';
  import pauseSvg from '$lib/assets/pause.svg?raw';
  import volumeSvg from '$lib/assets/volume.svg?raw';
  import muteSvg from '$lib/assets/mute.svg?raw';
  import fullscreenSvg from '$lib/assets/fullscreen.svg?raw';
  import exitFullscreenSvg from '$lib/assets/exit-fullscreen.svg?raw';
  import captionsSvg from '$lib/assets/captions.svg?raw';
  import captionsOnSvg from '$lib/assets/captions-on.svg?raw';
  import { dispatchEvents } from '../dispatch';

  // Destructured, unlike the rest of the props, because the element can only reflect and read
  // back a prop it has an accessor for: `$props()` bound whole exposes none, which is why
  // `muted` stays unset on the element after the viewer's own mute click. `captionsVisible` is
  // bound so that `captions-visible` and `el.captionsVisible` follow the viewer's choice, and so a
  // later host write is never swallowed by a stale copy that still reads the old value.
  // Avoid replacing HTMLElement.ariaLabel; the public attribute stays aria-label.
  let {
    captionsVisible = $bindable(false),
    mediaAriaLabel,
    ...props
  }: Omit<MediaPlayerProperties, 'ariaLabel'> & {
    mediaAriaLabel?: MediaPlayerProperties['ariaLabel'];
  } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onplay/onpause/onvolumechange/ontimeupdate/onfullscreenchange all collide
  // with native HTMLElement accessors (HOST_EVENT_HANDLER_PROPS), so dispatchEvents
  // returns nothing for them -- they stay callback-only. onseek does not collide
  // (the platform only has onseeking/onseeked, never a bare onseek), so it
  // dispatches 'seek' with detail: currentTime for a consumer who only calls
  // addEventListener; oncaptionschange is the same shape (no native `oncaptionschange`),
  // so it dispatches 'captionschange' with detail: the new visibility. The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<!--
  A property-assigned icon wins; the slot is the fallback; the slot carries
  MediaPlayer's own glyph as ITS fallback, so a consumer supplying neither still
  sees the built-in control. The branch stays inside the body snippet so `<slot>`
  keeps its `$$props` scope.

  Each of the six renders at most once per instance -- play/pause, mute/unmute and
  enter/exit fullscreen are mutually exclusive branches. That is what makes a named
  slot expressible here: Svelte appends one `<slot>` element per render site, and
  the DOM assigns light-DOM children to the FIRST matching slot only, so a snippet
  the component renders repeatedly would leave every site after the first empty --
  not defaulted, empty.
-->
<MediaPlayer {...props} {...dispatchers} ariaLabel={mediaAriaLabel} bind:captionsVisible>
  {#snippet playIcon()}
    {#if props.playIcon}{@render props.playIcon()}{:else}<slot name="play-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html playSvg}
      </slot>{/if}
  {/snippet}
  {#snippet pauseIcon()}
    {#if props.pauseIcon}{@render props.pauseIcon()}{:else}<slot name="pause-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html pauseSvg}
      </slot>{/if}
  {/snippet}
  {#snippet muteIcon()}
    {#if props.muteIcon}{@render props.muteIcon()}{:else}<slot name="mute-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html muteSvg}
      </slot>{/if}
  {/snippet}
  {#snippet unmuteIcon()}
    {#if props.unmuteIcon}{@render props.unmuteIcon()}{:else}<slot name="unmute-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html volumeSvg}
      </slot>{/if}
  {/snippet}
  {#snippet captionsIcon()}
    {#if props.captionsIcon}{@render props.captionsIcon()}{:else}<slot name="captions-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html captionsSvg}
      </slot>{/if}
  {/snippet}
  {#snippet captionsOnIcon()}
    {#if props.captionsOnIcon}{@render props.captionsOnIcon()}{:else}<slot name="captions-on-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html captionsOnSvg}
      </slot>{/if}
  {/snippet}
  {#snippet fullscreenIcon()}
    {#if props.fullscreenIcon}{@render props.fullscreenIcon()}{:else}<slot name="fullscreen-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html fullscreenSvg}
      </slot>{/if}
  {/snippet}
  {#snippet exitFullscreenIcon()}
    {#if props.exitFullscreenIcon}{@render props.exitFullscreenIcon()}{:else}<slot
        name="exit-fullscreen-icon"
      >
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html exitFullscreenSvg}
      </slot>{/if}
  {/snippet}
</MediaPlayer>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-media-player-display, block);
  }
</style>
