<svelte:options
  customElement={{
    tag: 'sui-typewriter-text',
    shadow: 'open',
    props: {
      text: { type: 'String' },
      speed: { type: 'Number', reflect: true },
      isStreaming: { type: 'Boolean', attribute: 'is-streaming' },
      renderText: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import TypewriterText from '$lib/TypewriterText/TypewriterText.svelte';
  let props = $props();
</script>

<TypewriterText {...props} />
