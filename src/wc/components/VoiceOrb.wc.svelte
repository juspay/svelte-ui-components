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
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' },
      onfirstframe: { type: 'Object' },
      onlevel: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import VoiceOrb from '$lib/VoiceOrb/VoiceOrb.svelte';
  let props = $props();
</script>

<VoiceOrb {...props} />
