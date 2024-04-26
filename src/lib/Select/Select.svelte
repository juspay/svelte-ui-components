<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import type { SelectProperties } from './properties';
  import type { ButtonProperties } from '$lib/Button/properties';
  import Button from '$lib/Button/Button.svelte';

  let selectedElementDiv: HTMLDivElement | null = null;

  export let alt='';
  export let properties: SelectProperties = {
    placeholder: '',
    label: '',
    allItems: [],
    selectedItem: '',
    selectedItemLabel: null,
    showSelectedItemInDropdown: false,
    selectMultipleItems: false,
    iconPath:''
  };

  const applyButtonProps: ButtonProperties = {
    text: 'Apply',
    enable: true,
    showLoader: false,
    loaderType: null,
    type: 'submit'
  };

  const selectAllButtonProps: ButtonProperties = {
    text: 'Select All',
    enable: true,
    showLoader: false,
    loaderType: null,
    type: 'submit'
  };

  const clearAllButtonProps: ButtonProperties = {
    text: 'Clear All',
    enable: true,
    showLoader: false,
    loaderType: null,
    type: 'submit'
  };

  let isSelectOpen = false;
  const dispatch = createEventDispatcher();

  $: nonSelectedItems = properties.allItems.filter((item) =>
    properties.selectMultipleItems
      ? !properties.selectedItem.includes(item)
      : item !== properties.selectedItem
  );

  function selectItem(item: string) {
    if (
      properties.selectMultipleItems &&
      Array.isArray(properties.selectedItemLabel) &&
      Array.isArray(properties.selectedItem)
    ) {
      if (properties.selectedItem.includes(item)) {
        properties.selectedItem = properties.selectedItem.filter(
          (selectedItem) => selectedItem !== item
        );
        properties.selectedItemLabel = properties.selectedItemLabel.filter(
          (label) => label !== item
        );
      } else {
        properties.selectedItem = [...properties.selectedItem, item];
        properties.selectedItemLabel = [...properties.selectedItemLabel, item];
      }
    } else {
      properties.selectedItem = [item];
    }
    if (!properties.selectMultipleItems) {
      toggleSelect();
      dispatchEvent();
    }
  }

  function dispatchEvent() {
    dispatch('message', { selectedItems: properties.selectedItem });
  }

  function toggleSelect() {
    isSelectOpen = !isSelectOpen;
    dispatch('dropdownClick');
  }

  function clearAllItems() {
    properties.selectedItem = [];
    properties.selectedItemLabel = [];
  }

  function selectAllItems() {
    properties.selectedItem = [...properties.allItems];
    properties.selectedItemLabel = [...properties.allItems];
  }

  function closeSelect(event: Event) {
    const clickedElement = event.target as HTMLElement;
    if (selectedElementDiv !== null && !selectedElementDiv.contains(clickedElement)) {
      const isItemClicked = clickedElement.classList.contains('item');
      const isApplyButtonClicked = clickedElement.classList.contains('apply-btn');
      const isClearAllButtonClicked = clickedElement.innerText === 'Clear All';
      const isSelectAllButtonClicked = clickedElement.innerText === 'Select All';
      if (
        !isItemClicked &&
        !isApplyButtonClicked &&
        !isClearAllButtonClicked &&
        !isSelectAllButtonClicked
      ) {
        isSelectOpen = false;
      }
    }
  }

  onMount(() => {
    document.addEventListener('click', closeSelect);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      document.removeEventListener('click', closeSelect);
    }
  });
</script>

{#if properties.label !== null}
  <label class="label-container" for={properties.label}>
    {properties.label}
  </label>
{/if}

{#if properties.allItems.length !== 0}
  <div class="select">
    <div
      class="selected item"
      on:click={toggleSelect}
      bind:this={selectedElementDiv}
      on:keydown
      role="button"
      tabindex="0"
    >
    {#if properties.iconPath !== null && properties.iconPath !== ""}
      <div class="icon-container">
        <img src={properties.iconPath} class="icon" alt={alt} />
      </div>
    {/if}
      {#if properties.selectMultipleItems && Array.isArray(properties.selectedItemLabel) && Array.isArray(properties.selectedItem)}
        {#if properties.selectedItem.length === 0}
          {properties.placeholder}
        {:else if properties.selectedItemLabel?.length === 0 || properties.showSelectedItemInDropdown}
          {properties.selectedItem.join(', ')}
        {:else}
          {properties.selectedItemLabel.join(', ')}
        {/if}
      {:else if properties.selectedItem === ''}
        {properties.placeholder}
      {:else if properties.selectedItemLabel === null || properties.selectedItemLabel === ''}
        {properties.selectedItem}
      {:else}
        {properties.selectedItemLabel}
      {/if}
      <div class="filler" />
      <img
        src="https://sdk.breeze.in/gallery/icons/right-arrow.svg"
        alt=""
        class="arrow {isSelectOpen ? 'active' : ''}"
      />
    </div>
    <div
      class="non-selected-items"
      style="--non-selected-display:{isSelectOpen ? 'inline-block' : 'none'};"
    >
      {#if properties.selectMultipleItems}
        <div class="multipleSelect-btn">
          <Button properties={applyButtonProps} on:click={dispatchEvent} />
          <Button properties={selectAllButtonProps} on:click={selectAllItems} />
          <Button properties={clearAllButtonProps} on:click={clearAllItems} />
        </div>
      {/if}
      <div class="item-list">
        {#each properties.showSelectedItemInDropdown ? properties.allItems : nonSelectedItems as item}
          <div
            on:keydown
            on:click={() => {
              selectItem(item);
            }}
            class="item {properties.selectedItem.includes(item) ? 'selected item-selected' : ''}"
            role="button"
            tabindex="0"
          >
            {item}
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .select {
    height: var(--select-height, fit-content);
    background-color: var(--select-bgcolor, #ffffff);
    font-size: var(--select-font-size, 14px);
    font-family: var(--select-font-family, Euclid Circular A);
    border-radius: var(--select-radius, 4px);
    font-weight: var(--select-font-weight, 400);
    width: var(--select-width, 100%);
    min-width: var(--select-min-width);
    box-shadow: 0px 1px 8px #2f537733;
    -webkit-appearance: none !important; /* For Safari MWeb */
    outline: none;
    cursor: pointer;
    border: var(--select-border);
    word-break: var(--select-word-break, break-word);
    resize: none;
    position: relative;
    white-space: var(--select-white-space);
    color: var(--select-color);
    --button-margin: 1px;
    --button-border-radius: 2px;
  }

  .arrow {
    height:var(--dropdown-arrow-icon-height, 16px);
    width: var(--dropdown-arrow-icon-width, 16px);
    transform: rotate(-0.25turn);
    transition: transform 0.1s;
  }

  .active {
    transform: rotate(0.25turn);
  }

  .item {
    padding: var(--item-padding, 8px);
    border-radius: 4px;
  }

  .filler {
    flex: 1;
  }

  .item:hover {
    background-color: var(--non-selected-hover-bg, #00000010);
    color: var(--non-selected-hover-color);
  }

  .selected {
    margin: 0px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }

  .selected:hover {
    background-color: var(--selected-hover-bg, transparent);
    color: var(--selected-color, black);
  }

  .non-selected-items {
    display: var(--non-selected-display);
    background-color: var(--non-selected-item-bgcolor, #ffffff);
    color: var(--non-selected-item-color);
    box-shadow: 0px 1px 8px #2f537733;
    width: var(--non-selected-width, fit-content);
    min-width: var(--non-selected-min-width, 100%);
    position: absolute;
    border-radius: 4px 4px 4px 4px;
    margin: 4px 0px 0px 0px;
    z-index: 10;
    word-wrap: var(--non-selected-word-break, break-word);
    white-space: var(--non-selected-white-space);
    font-weight: var(--non-select-font-weight, 500)
  }

  ::-webkit-scrollbar {
    width: 0;
  }

  .item-list {
    max-height: var(--non-selected-max-height, 135px);
    overflow-y: auto;
    position: relative;
  }

  .item-selected::after {
    content: '✔';
    position: absolute;
    right: 7px;
  }

  .label-container {
    font-weight: var(--label-text-weight, 400);
    font-size: var(--label-text-size, 12px);
    color: var(--label-text-color, #000000);
    margin-bottom: 4px;
    display: inline-block;
  }

  .multipleSelect-btn {
    display: flex;
    width: var(--multipleSelect-btn-width, 100%);
    white-space: var(--multipleSelect-btn-white-space, nowrap);
    padding: var(--multipleSelect-btn-padding, 2px);
  }

  .icon {
    width: var(--select-icon-width,16px);
    height: var(--select-icon-height,16px);
  }
  .icon-container{
    width: var(--select-icon-container-width,32px);
    height: var(--select-icon-container-height,32px);
    gap: var(--select-icon-container-gap,0px);
    border-radius: var(--select-icon-container-border-radius,333px);
    opacity: var(--select-icon-container-opacity,0px);
    background: var(--select-icon-container-background,#EEEEEE);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: var(--select-icon-container-margin,0px 8px 0px 0px);
    padding: var(--select-icon-container-padding);
}

</style>
