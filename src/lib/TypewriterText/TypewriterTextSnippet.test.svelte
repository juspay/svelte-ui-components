<script lang="ts">
  import TypewriterText from './TypewriterText.svelte';
  import type { TypewriterTextProperties } from './properties';

  let props: TypewriterTextProperties = $props();
</script>

<TypewriterText {...props}>
  {#snippet renderCharacter({ character, index })}
    <span data-character={index}>{character}</span>
  {/snippet}
</TypewriterText>
