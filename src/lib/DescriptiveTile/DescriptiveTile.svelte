<script lang="ts">
  import type { DescriptiveTileProperties } from './properties';

  let {
    image,
    alt,
    label,
    selected = false,
    disabled = false,
    testId,
    classes,
    bottom,
    onclick
  }: DescriptiveTileProperties = $props();

  const isInteractive = $derived(!!onclick);

  const handleKeydown = (event: KeyboardEvent) => {
    if (disabled || !onclick) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onclick(new MouseEvent('click'));
    }
  };

  const handleClick = (event: MouseEvent) => {
    if (disabled || !onclick) {
      return;
    }
    onclick(event);
  };
</script>

{#if isInteractive}
  <div
    class="descriptive-tile {classes ?? ''}"
    class:descriptive-tile-selected={selected}
    class:descriptive-tile-disabled={disabled}
    role="button"
    tabindex={disabled ? -1 : 0}
    data-pw={testId}
    onclick={handleClick}
    onkeydown={handleKeydown}
  >
    <div class="descriptive-tile-preview">
      {#if image}
        <img src={image} alt={alt ?? ''} />
      {/if}
    </div>
    <div class="descriptive-tile-label">{label ?? ''}</div>
    {#if bottom}
      <div class="descriptive-tile-bottom">
        {@render bottom()}
      </div>
    {/if}
  </div>
{:else}
  <div
    class="descriptive-tile {classes ?? ''}"
    class:descriptive-tile-selected={selected}
    class:descriptive-tile-disabled={disabled}
    data-pw={testId}
  >
    <div class="descriptive-tile-preview">
      {#if image}
        <img src={image} alt={alt ?? ''} />
      {/if}
    </div>
    <div class="descriptive-tile-label">{label ?? ''}</div>
    {#if bottom}
      <div class="descriptive-tile-bottom">
        {@render bottom()}
      </div>
    {/if}
  </div>
{/if}

<style>
  .descriptive-tile {
    display: flex;
    flex-direction: column;
    gap: var(--descriptive-tile-gap, 8px);
    padding: var(--descriptive-tile-padding, 12px);
    border-radius: var(--descriptive-tile-radius, 8px);
    border: var(--descriptive-tile-border, 1px solid transparent);
    cursor: default;
    box-sizing: border-box;
  }

  .descriptive-tile[role='button'] {
    cursor: pointer;
  }

  .descriptive-tile[role='button']:focus-visible {
    outline: 2px solid var(--descriptive-tile-selected-border, #0070f3);
    outline-offset: 2px;
  }

  .descriptive-tile-selected {
    border: var(--descriptive-tile-selected-border, 1px solid #0070f3);
  }

  .descriptive-tile-disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  .descriptive-tile-preview {
    border-radius: var(--descriptive-tile-preview-radius, 6px);
    aspect-ratio: var(--descriptive-tile-preview-aspect, 16 / 9);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .descriptive-tile-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .descriptive-tile-label {
    color: var(--descriptive-tile-label-color, inherit);
    font-weight: var(--descriptive-tile-label-font-weight, inherit);
  }

  .descriptive-tile-bottom {
    display: flex;
    flex-direction: column;
  }
</style>
