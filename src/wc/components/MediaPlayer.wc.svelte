<svelte:options
  customElement={{
    tag: 'sui-media-player',
    shadow: 'open',
    props: {
      src: { type: 'String' },
      type: { type: 'String' },
      alt: { type: 'String' },
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
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onplay: { type: 'Object' },
      onpause: { type: 'Object' },
      onvolumechange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import MediaPlayer from '$lib/MediaPlayer/MediaPlayer.svelte';
  let props = $props();
</script>

<MediaPlayer {...props} />
