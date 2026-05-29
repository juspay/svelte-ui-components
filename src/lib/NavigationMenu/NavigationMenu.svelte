<script lang="ts">
  import type { NavigationMenuProperties } from './properties';

  let {
    items,
    selectedId,
    testId,
    classes,
    ariaLabel = 'Navigation',
    onselect
  }: NavigationMenuProperties = $props();
</script>

<nav class="navigation-menu {classes ?? ''}" aria-label={ariaLabel} data-pw={testId}>
  <ul class="navigation-menu-list" role="list">
    {#each items as item (item.id)}
      <li class="navigation-menu-list-item">
        <button
          class="navigation-menu-item"
          class:navigation-menu-item-selected={item.id === selectedId}
          data-pw={item.id}
          disabled={item.disabled}
          aria-current={item.id === selectedId ? 'page' : null}
          onclick={() => onselect?.(item.id)}
        >
          {#if item.icon}
            <img class="navigation-menu-item-icon" src={item.icon} alt="" aria-hidden="true" />
          {/if}
          <span class="navigation-menu-item-label">{item.label}</span>
          {#if item.statusDot}
            <span class="navigation-menu-dot" aria-hidden="true"></span>
          {/if}
        </button>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .navigation-menu {
    width: var(--navigation-menu-width, 240px);
    padding: var(--navigation-menu-padding, 8px);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  .navigation-menu-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--navigation-menu-gap, 2px);
    overflow-y: auto;
  }

  .navigation-menu-list-item {
    display: contents;
  }

  .navigation-menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: var(--navigation-menu-item-padding, 8px 12px);
    border-radius: var(--navigation-menu-item-radius, 8px);
    border: none;
    background: transparent;
    color: var(--navigation-menu-item-color, inherit);
    cursor: pointer;
    text-align: left;
    box-sizing: border-box;
  }

  .navigation-menu-item:hover:not(:disabled) {
    background-color: var(--navigation-menu-item-hover-background, rgba(0, 0, 0, 0.06));
  }

  .navigation-menu-item:focus-visible {
    outline: 2px solid var(--navigation-menu-item-selected-background, currentColor);
    outline-offset: 2px;
  }

  .navigation-menu-item-selected {
    background-color: var(--navigation-menu-item-selected-background, rgba(0, 0, 0, 0.1));
    color: var(--navigation-menu-item-selected-color, inherit);
  }

  .navigation-menu-item:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .navigation-menu-item-icon {
    width: var(--navigation-menu-item-icon-size, 20px);
    height: var(--navigation-menu-item-icon-size, 20px);
    flex-shrink: 0;
    object-fit: contain;
  }

  .navigation-menu-item-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .navigation-menu-dot {
    flex-shrink: 0;
    width: var(--navigation-menu-dot-size, 8px);
    height: var(--navigation-menu-dot-size, 8px);
    border-radius: 50%;
    background-color: var(--navigation-menu-dot-color, #22c55e);
  }
</style>
