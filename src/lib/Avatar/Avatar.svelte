<script lang="ts">
  import type { AvatarProperties } from './properties';
  import Img from '../Img/Img.svelte';

  let { src, alt, name, size = 'medium', testId, onclick, classes }: AvatarProperties = $props();

  let imageError = $state(false);

  let showImage = $derived(typeof src === 'string' && src.length > 0 && !imageError);

  let initials = $derived.by(() => {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return '';
    }
    const words = name.trim().split(/\s+/);
    if (words.length === 0) {
      return '';
    }
    const firstWord = words.at(0);
    const lastWord = words.at(-1);
    const first = typeof firstWord === 'string' && firstWord.length > 0 ? firstWord.charAt(0) : '';
    const last =
      words.length > 1 && typeof lastWord === 'string' && lastWord.length > 0
        ? lastWord.charAt(0)
        : '';
    return (first + last).toUpperCase();
  });

  function handleImageError(): void {
    imageError = true;
  }
</script>

{#snippet content()}
  {#if showImage && typeof src === 'string'}
    <span class="avatar-img-wrapper">
      <Img {src} {alt} onerror={handleImageError} />
    </span>
  {:else}
    <span class="avatar-initials">{initials}</span>
  {/if}
{/snippet}

{#if typeof onclick === 'function'}
  <button
    class="avatar avatar-{size} {classes ?? ''}"
    type="button"
    aria-label={alt}
    data-pw={testId}
    testID={testId}
    {onclick}
  >
    {@render content()}
  </button>
{:else}
  <div
    class="avatar avatar-{size} {classes ?? ''}"
    role="img"
    aria-label={alt}
    data-pw={testId}
    testID={testId}
  >
    {@render content()}
  </div>
{/if}

<style>
  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border-radius: var(--avatar-border-radius, 50%);
    border: var(--avatar-border, none);
    box-shadow: var(--avatar-box-shadow, none);
    cursor: var(--avatar-cursor, default);
    overflow: hidden;
    background-color: var(--avatar-background, #e0e0e0);
    font-family: inherit;
  }

  .avatar:hover {
    opacity: var(--avatar-hover-opacity, 1);
  }

  .avatar-small {
    width: var(--avatar-small-width, 32px);
    height: var(--avatar-small-height, 32px);
  }

  .avatar-medium {
    width: var(--avatar-medium-width, 40px);
    height: var(--avatar-medium-height, 40px);
  }

  .avatar-large {
    width: var(--avatar-large-width, 56px);
    height: var(--avatar-large-height, 56px);
  }

  .avatar-img-wrapper {
    display: contents;
    --image-width: 100%;
    --image-height: 100%;
    --image-object-fit: var(--avatar-object-fit, cover);
    --image-border-radius: 0px;
    --image-padding: 0px;
    --image-margin: 0px;
  }

  .avatar-initials {
    color: var(--avatar-text-color, #555555);
    font-weight: var(--avatar-font-weight, 600);
    font-family: var(--avatar-font-family, inherit);
    user-select: none;
  }

  .avatar-small .avatar-initials {
    font-size: var(--avatar-small-font-size, 12px);
  }

  .avatar-medium .avatar-initials {
    font-size: var(--avatar-medium-font-size, 14px);
  }

  .avatar-large .avatar-initials {
    font-size: var(--avatar-large-font-size, 20px);
  }
</style>
