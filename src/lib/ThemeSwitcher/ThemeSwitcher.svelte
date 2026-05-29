<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import type { ThemeSwitcherOption, ThemeSwitcherProperties } from './properties';
  import { getStorageItem, setStorageItem } from '$lib/utils';
  import sunSvg from '$lib/assets/sun.svg?raw';
  import moonSvg from '$lib/assets/moon.svg?raw';
  import monitorSvg from '$lib/assets/monitor.svg?raw';
  import paletteSvg from '$lib/assets/palette.svg?raw';

  const DEFAULT_OPTIONS: ThemeSwitcherOption[] = [
    { value: 'light', label: 'Light theme' },
    { value: 'dark', label: 'Dark theme' },
    { value: 'system', label: 'System theme' }
  ];

  const KNOWN_ICONS: Record<string, string> = {
    light: sunSvg,
    dark: moonSvg,
    system: monitorSvg
  };

  const getDefaultIcon = (iconValue: string): string => {
    return KNOWN_ICONS[iconValue] ?? paletteSvg;
  };

  let {
    options = DEFAULT_OPTIONS,
    value,
    mode,
    storageKey = 'theme-preference',
    testId,
    classes,
    collapsible = false,
    autoHideDelay = 3000,
    onchange
  }: ThemeSwitcherProperties = $props();

  let currentValue: string = $state(value ?? 'system');
  let systemPreference: string = $state('light');
  let expanded: boolean = $state(false);
  let autoHideTimer: ReturnType<typeof setTimeout> | null = null;

  let hasSystemOption = $derived(options.some((option) => option.value === 'system'));
  let effectiveMode = $derived(mode ?? (options.length <= 2 ? 'toggle' : 'segment'));
  let currentIndex = $derived(options.findIndex((option) => option.value === currentValue));

  let segmentButtons: HTMLButtonElement[] = $state([]);
  let indicatorLeft: number = $state(0);
  let indicatorWidth: number = $state(0);

  const clearAutoHideTimer = (): void => {
    if (autoHideTimer !== null) {
      clearTimeout(autoHideTimer);
      autoHideTimer = null;
    }
  };

  const scheduleAutoHide = (): void => {
    if (!collapsible || autoHideDelay <= 0) {
      return;
    }
    clearAutoHideTimer();
    autoHideTimer = setTimeout(() => {
      expanded = false;
      autoHideTimer = null;
    }, autoHideDelay);
  };

  const updateIndicator = (): void => {
    const btn = segmentButtons.at(currentIndex);
    if (btn instanceof HTMLButtonElement) {
      indicatorLeft = btn.offsetLeft;
      indicatorWidth = btn.offsetWidth;
    }
  };

  const applyValue = (newValue: string): void => {
    currentValue = newValue;
    if (typeof storageKey === 'string' && storageKey.length > 0) {
      setStorageItem(storageKey, newValue);
    }
    const resolved = newValue === 'system' ? systemPreference : newValue;
    onchange?.(newValue, resolved);
    tick().then(updateIndicator);
    if (collapsible) {
      scheduleAutoHide();
    }
  };

  const handleToggle = (): void => {
    const nextIndex = (currentIndex + 1) % options.length;
    const nextOption = options.at(nextIndex);
    if (typeof nextOption === 'object' && nextOption !== null) {
      applyValue(nextOption.value);
    }
  };

  const handleCollapsibleToggle = (): void => {
    expanded = !expanded;
    if (expanded) {
      scheduleAutoHide();
      tick().then(updateIndicator);
    } else {
      clearAutoHideTimer();
    }
  };

  const resetAutoHide = (): void => {
    if (collapsible && expanded) {
      scheduleAutoHide();
    }
  };

  onMount(() => {
    systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    if (typeof storageKey === 'string' && storageKey.length > 0) {
      const stored = getStorageItem(storageKey);
      if (
        typeof stored === 'string' &&
        stored.length > 0 &&
        options.some((option) => option.value === stored)
      ) {
        currentValue = stored;
      }
    }

    if (typeof value === 'string' && value !== '') {
      currentValue = value;
    }

    onchange?.(currentValue, currentValue === 'system' ? systemPreference : currentValue);
    tick().then(updateIndicator);

    if (hasSystemOption) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (mediaQueryEvent: MediaQueryListEvent) => {
        systemPreference = mediaQueryEvent.matches ? 'dark' : 'light';
        if (currentValue === 'system') {
          onchange?.(currentValue, systemPreference);
        }
      };
      mediaQuery.addEventListener('change', handler);
      return () => {
        mediaQuery.removeEventListener('change', handler);
      };
    }
  });

  onDestroy(() => {
    clearAutoHideTimer();
  });
</script>

{#if collapsible}
  <div
    class="collapsible-switcher {classes ?? ''}"
    data-pw={typeof testId === 'string' ? testId : null}
    role="group"
    aria-label="Theme switcher"
  >
    <button
      class="collapsible-trigger"
      onclick={handleCollapsibleToggle}
      aria-label={expanded ? 'Collapse theme options' : 'Expand theme options'}
      aria-expanded={expanded}
    >
      {#each options as option, optionIndex (option.value)}
        <span class="icon" class:active={optionIndex === currentIndex}>
          {#if typeof option.icon === 'function'}
            {@render option.icon()}
          {:else}
            <!-- eslint-disable svelte/no-at-html-tags -->
            {@html getDefaultIcon(option.value)}
          {/if}
        </span>
      {/each}
    </button>

    {#if expanded}
      {#if effectiveMode === 'toggle'}
        <button
          class="collapsible-option-button"
          onclick={() => {
            handleToggle();
            resetAutoHide();
          }}
          aria-label="Switch theme"
        >
          {#each options as option, optionIndex (option.value)}
            <span class="icon" class:active={optionIndex === currentIndex}>
              {#if typeof option.icon === 'function'}
                {@render option.icon()}
              {:else}
                <!-- eslint-disable svelte/no-at-html-tags -->
                {@html getDefaultIcon(option.value)}
              {/if}
            </span>
          {/each}
        </button>
      {:else}
        <div
          class="segment-control collapsible-segment"
          role="none"
          onmouseenter={resetAutoHide}
          onfocus={resetAutoHide}
        >
          <div
            class="segment-indicator"
            style="left: {indicatorLeft}px; width: {indicatorWidth}px;"
          ></div>
          {#each options as option, optionIndex (option.value)}
            <button
              bind:this={segmentButtons[optionIndex]}
              class="segment-button"
              class:selected={currentValue === option.value}
              onclick={() => applyValue(option.value)}
              aria-label={option.label ?? option.value}
            >
              <span class="icon">
                {#if typeof option.icon === 'function'}
                  {@render option.icon()}
                {:else}
                  <!-- eslint-disable svelte/no-at-html-tags -->
                  {@html getDefaultIcon(option.value)}
                {/if}
              </span>
            </button>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
{:else if effectiveMode === 'toggle'}
  <button
    class="toggle-button {classes ?? ''}"
    onclick={handleToggle}
    aria-label="Switch theme"
    data-pw={typeof testId === 'string' ? testId : null}
  >
    {#each options as option, optionIndex (option.value)}
      <span class="icon" class:active={optionIndex === currentIndex}>
        {#if typeof option.icon === 'function'}
          {@render option.icon()}
        {:else}
          <!-- eslint-disable svelte/no-at-html-tags -->
          {@html getDefaultIcon(option.value)}
        {/if}
      </span>
    {/each}
  </button>
{:else}
  <div class="segment-control {classes ?? ''}" data-pw={typeof testId === 'string' ? testId : null}>
    <div
      class="segment-indicator"
      style="left: {indicatorLeft}px; width: {indicatorWidth}px;"
    ></div>
    {#each options as option, optionIndex (option.value)}
      <button
        bind:this={segmentButtons[optionIndex]}
        class="segment-button"
        class:selected={currentValue === option.value}
        onclick={() => applyValue(option.value)}
        aria-label={option.label ?? option.value}
      >
        <span class="icon">
          {#if typeof option.icon === 'function'}
            {@render option.icon()}
          {:else}
            <!-- eslint-disable svelte/no-at-html-tags -->
            {@html getDefaultIcon(option.value)}
          {/if}
        </span>
      </button>
    {/each}
  </div>
{/if}

<style>
  .toggle-button {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--theme-switcher-size, 36px);
    height: var(--theme-switcher-size, 36px);
    padding: 0;
    border: none;
    border-radius: var(--theme-switcher-border-radius, 8px);
    background-color: var(--theme-switcher-bg, transparent);
    cursor: pointer;
    color: var(--theme-switcher-icon-color, #374151);
    transition: background-color var(--theme-switcher-transition-duration, 0.3s);
    font-family: inherit;
  }

  .toggle-button:hover {
    background-color: var(--theme-switcher-bg-hover, #f3f4f6);
  }

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--theme-switcher-icon-size, 18px);
    height: var(--theme-switcher-icon-size, 18px);
    transition:
      opacity var(--theme-switcher-transition-duration, 0.3s),
      transform var(--theme-switcher-transition-duration, 0.3s);
  }

  .icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  .toggle-button .icon {
    position: absolute;
  }

  .toggle-button .icon:not(.active) {
    opacity: 0;
    transform: scale(0.5) rotate(90deg);
  }

  .toggle-button .icon.active {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }

  .segment-control {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--theme-switcher-segment-gap, 2px);
    padding: var(--theme-switcher-segment-padding, 4px);
    background-color: var(--theme-switcher-segment-bg, #f3f4f6);
    border-radius: var(--theme-switcher-border-radius, 8px);
  }

  .segment-indicator {
    position: absolute;
    top: var(--theme-switcher-segment-padding, 4px);
    bottom: var(--theme-switcher-segment-padding, 4px);
    border-radius: var(--theme-switcher-segment-border-radius, 6px);
    background-color: var(--theme-switcher-segment-active-bg, #ffffff);
    box-shadow: var(--theme-switcher-segment-shadow, 0 1px 2px rgba(0, 0, 0, 0.1));
    transition:
      left var(--theme-switcher-transition-duration, 0.3s),
      width var(--theme-switcher-transition-duration, 0.3s);
    z-index: 0;
  }

  .segment-button {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--theme-switcher-segment-button-padding, 6px 10px);
    border: none;
    border-radius: var(--theme-switcher-segment-border-radius, 6px);
    background: transparent;
    cursor: pointer;
    color: var(--theme-switcher-icon-color, #374151);
    transition: color var(--theme-switcher-transition-duration, 0.3s);
    font-family: inherit;
  }

  .segment-button.selected {
    color: var(--theme-switcher-icon-color-active, #1f2937);
  }

  /* Collapsible wrapper */
  .collapsible-switcher {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--theme-switcher-collapsible-gap, 4px);
  }

  .collapsible-trigger {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--theme-switcher-size, 36px);
    height: var(--theme-switcher-size, 36px);
    padding: 0;
    border: none;
    border-radius: var(--theme-switcher-border-radius, 8px);
    background-color: var(--theme-switcher-bg, transparent);
    cursor: pointer;
    color: var(--theme-switcher-icon-color, #374151);
    transition: background-color var(--theme-switcher-transition-duration, 0.3s);
    font-family: inherit;
  }

  .collapsible-trigger:hover {
    background-color: var(--theme-switcher-bg-hover, #f3f4f6);
  }

  .collapsible-trigger .icon {
    position: absolute;
  }

  .collapsible-trigger .icon:not(.active) {
    opacity: 0;
    transform: scale(0.5) rotate(90deg);
  }

  .collapsible-trigger .icon.active {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }

  .collapsible-option-button {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--theme-switcher-size, 36px);
    height: var(--theme-switcher-size, 36px);
    padding: 0;
    border: none;
    border-radius: var(--theme-switcher-border-radius, 8px);
    background-color: var(--theme-switcher-bg, transparent);
    cursor: pointer;
    color: var(--theme-switcher-icon-color, #374151);
    transition: background-color var(--theme-switcher-transition-duration, 0.3s);
    font-family: inherit;
  }

  .collapsible-option-button:hover {
    background-color: var(--theme-switcher-bg-hover, #f3f4f6);
  }

  .collapsible-option-button .icon {
    position: absolute;
  }

  .collapsible-option-button .icon:not(.active) {
    opacity: 0;
    transform: scale(0.5) rotate(90deg);
  }

  .collapsible-option-button .icon.active {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }

  .collapsible-segment {
    animation: collapsible-expand-in var(--theme-switcher-transition-duration, 0.3s) ease;
  }

  @keyframes collapsible-expand-in {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
