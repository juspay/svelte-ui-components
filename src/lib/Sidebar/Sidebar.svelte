<script lang="ts">
  import ListItem from '$lib/ListItem/ListItem.svelte';
  import { defaultSidebarProperties, type SidebarProperties } from './properties';
  import { defaultListItemProperties } from '$lib/ListItem/properties';
  import { createEventDispatcher } from 'svelte';

  export let properties: SidebarProperties = defaultSidebarProperties;

  let selectedItem: string | null = null;
  let sliderTop = 0;
  const dispatch = createEventDispatcher();

  function selectItem(label: string | null) {
    selectedItem = label;
    const selectedIndex = properties?.items?.findIndex((item) => item.label === selectedItem);
    sliderTop = (selectedIndex ?? 0) * 75.5;
  }

  function selectItemOfSidebar(): void {
    dispatch('selectItem');
  }
</script>

{#if properties.items}
  <div class="container" role="presentation">
    <div class="slider" style="top: {sliderTop}px;" />
    {#each properties.items as item}
      <div
        class="instrument-container"
        on:click={selectItemOfSidebar}
        on:keydown
        role="button"
        tabindex="0"
      >
        <ListItem
          properties={{
            ...defaultListItemProperties,
            leftImageUrl: item.icon
          }}
          on:itemClick={() => selectItem(item.label)}
        >
          <div class="center-content" slot="centerContent">
            <div
              class="label"
              style={selectedItem === item.label ? 'font-weight: bold' : 'font-weight: 300'}
            >
              {item.label}
            </div>
          </div>
        </ListItem>
      </div>
    {/each}
  </div>
{/if}

<style>
  .container {
    overflow-y: auto;
    position: relative;
    height: var(--sidebar-height, 377.5px);
    width: var(--sidebar-width, 177px);
    overflow-y: hidden;
    overflow-x: hidden;
  }

  .container:hover {
    overflow-y: auto;
  }
  .container::-webkit-scrollbar {
    width: var(--scrollbar-width, 6px);
    height: var(--scrollbar-height, 21px);
  }

  .container::-webkit-scrollbar-thumb {
    background: var(--scrollbar-background, #d2d8e2);
    border-radius: var(--scrollbar-radius, 100px);
  }

  .instrument-container {
    --list-item-background: white;
    --list-item-box-width: 177px;
    --list-item-box-height: 54px;
    --list-item-left-image-height: 24px;
    --list-item-left-image-width: 24px;
    --list-item-left-image-padding: 15px 13px 15px 16px;
    --list-item-position: relative;
  }

  .instrument-container:hover {
    --list-item-background: #8094a70f;
  }

  .instrument-container:not(:last-child) {
    --list-item-margin-bottom: 18px;
  }
  .center-content {
    padding: 18px 0px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .label {
    color: var(--sidebar-label-color, #2f3841);
    font-size: var(--sidebar-font-size, 14px);
  }

  .slider {
    background: linear-gradient(to right, #7a9bbc 4px, #8094a71a 4px);
    height: var(--slider-height, 54px);
    position: var(--slider-position, absolute);
    width: var(--slider-width, 177px);
    z-index: 1;
    transition: top 0.4s ease-in-out;
  }
</style>
