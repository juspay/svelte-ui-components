<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import type { SelectProperties } from './properties';
  import type { ButtonProperties } from '$lib/Button/properties';
  import Img from '$lib/Img/Img.svelte';
  import Button from '$lib/Button/Button.svelte';

  let selectedElementDiv: HTMLDivElement | null = null;

  export let dropDownIconAlt = '';
  export let properties: SelectProperties = {
    placeholder: '',
    label: '',
    allItems: [],
    selectedItem: '',
    selectedItemLabel: null,
    showSelectedItemInDropdown: false,
    selectMultipleItems: false,
    leftIcon: null,
    showSelectedItem: true
  };

  const dropDownIcon =
    properties.dropDownIcon ?? 'https://sdk.breeze.in/gallery/icons/down-arrow.svg';

  let applyButtonProps: ButtonProperties;
  $: applyButtonProps = {
    text: `Select (${properties.selectedItem.length})`,
    enable: properties.selectedItem.length > 0,
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

  function isSelected(selectedItem: string | string[], item: string) {
    if (Array.isArray(selectedItem)) {
      return selectedItem.includes(item);
    } else {
      return selectedItem.trim() === item.trim();
    }
  }

  function selectItem(item: string) {
    if (
      properties.selectMultipleItems &&
      Array.isArray(properties.selectedItemLabel) &&
      Array.isArray(properties.selectedItem)
    ) {
      if (isSelected(properties.selectedItem, item)) {
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
      properties.selectedItemLabel = [item];
    }
    if (!properties.selectMultipleItems) {
      toggleSelect();
      dispatchEvent();
    }
  }

  function dispatchEvent() {
    dispatch('message', { selectedItems: properties.selectedItem });
    isSelectOpen = false;
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

{#if properties.label !== null && properties.label !== ''}
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
      {#if properties.leftIcon !== null}
        <div class="icon-container">
          <Img {...properties.leftIcon} />
        </div>
      {/if}
      <div class="selected-content">
        {#if properties.selectMultipleItems && Array.isArray(properties.selectedItemLabel) && Array.isArray(properties.selectedItem)}
          {#if properties.selectedItem.length === 0}
            {properties.placeholder}
          {:else if properties.selectedItemLabel?.length === 0 || (properties.showSelectedItemInDropdown && properties.showSelectedItem !== false)}
            {properties.selectedItem.join(', ')}
          {:else if properties.showSelectedItem !== false}
            {properties.selectedItemLabel.join(', ')}
          {:else}
            {properties.placeholder}
          {/if}
        {:else if properties.selectedItem === ''}
          {properties.placeholder}
        {:else if properties.selectedItemLabel === null || (properties.selectedItemLabel === '' && properties.showSelectedItem !== false)}
          {properties.selectedItem}
        {:else if properties.showSelectedItem !== false}
          {properties.selectedItemLabel}
        {:else}
          {properties.placeholder}
        {/if}
      </div>
      <div class="filler" />
      {#if !properties.hideDropDownIcon}
        <img
          src={dropDownIcon}
          alt={dropDownIconAlt}
          class="arrow {isSelectOpen ? 'active' : ''}"
        />
      {/if}
    </div>
    <div
      class="non-selected-items"
      style="--non-selected-display:{isSelectOpen ? 'inline-block' : 'none'};"
    >
      {#if properties.selectMultipleItems && !properties.showSingleSelectButton}
        <div class="multipleSelect-btn">
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
            class="item {isSelected(properties.selectedItem, item) ? ' item-selected' : ''}"
            role="button"
            tabindex="0"
          >
            {item}
          </div>
        {/each}
      </div>
      {#if $$slots.bottomContent}
        <slot name="bottomContent" />
      {/if}
      {#if properties.selectMultipleItems}
        <div class="apply-btn-container">
          <Button properties={applyButtonProps} on:click={dispatchEvent} />
        </div>
      {/if}
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
    box-shadow: var(--select-box-shadow, 0px 1px 8px #2f537733);
    -webkit-appearance: none !important; /* For Safari MWeb */
    outline: var(--select-outline, none);
    resize: none;
    cursor: pointer;
    border: var(--select-border, 1px solid #ccc);
    position: var(--select-position, relative);
    color: var(--select-color, #333);
    display: var(--select-display, inline-block);
    --button-margin: var(--select-btn-margin, 1px);
    --button-border-radius: var(--select-btn-border-radius, 2px);
    --input-button-margin: var(--select-input-button-margin, 10px);
  }

  .select:hover {
    background-color: var(--select-hover-bgcolor, #ffffff);
  }

  .arrow {
    height: var(--dropdown-arrow-icon-height, 16px);
    width: var(--dropdown-arrow-icon-width, 16px);
    transition: transform 0.1s;
  }

  .active {
    transform: rotate(0.5turn);
  }

  .item {
    padding: var(--item-padding, 8px 16px);
    background-color: var(--item-background-color, #fff);
    border-radius: var(--item-border-radius);
    cursor: pointer;
    position: relative;
  }

  .filler {
    flex: 1;
  }

  .item:hover {
    background-color: var(--non-selected-hover-bg, #f0f0f0);
    color: var(--non-selected-hover-color);
  }

  .selected {
    display: flex;
    align-items: var(--selected-align-items, center);
    margin: var(--selected-margin, 0px 0px 0px 0px);
    justify-content: var(--selected-justify-content, flex-start);
    background-color: var(--selected-item-background-color, #f9f9f9);
    white-space: var(--selected-item-white-space, nowrap);
    overflow: var(--selected-item-overflow, hidden);
    text-overflow: var(--selected-item-text-overflow, ellipsis);
    max-width: var(--selected-item-max-width, 100%);
    padding: var(--selected-item-padding, var(--item-padding, 8px 16px));
  }

  .selected-content {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: calc(100% - 20px);
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
    width: var(--non-selected-width, 100%);
    min-width: var(--non-selected-min-width, 100%);
    word-wrap: var(--non-selected-word-break, break-word);
    position: var(--non-selected-items-position, absolute);
    border-radius: var(--non-selected-items-border-radius, 4px);
    margin: var(--non-selected-margin, 4px 0px 0px 0px);
    font-weight: var(--non-select-font-weight, 500);
    left: var(--non-selected-left);
    right: var(--non-selected-right);
    top: var(--non-selected-top);
    bottom: var(--non-selected-bottom);
    z-index: 10;
    overflow-y: auto;
  }

  ::-webkit-scrollbar {
    width: var(--scrollbar-width, 0);
  }

  .item-list {
    max-height: var(--non-selected-max-height, 165px);
    overflow-y: auto;
  }

  .item-selected::after {
    content: var(--selected-option-icon, '✔');
    position: absolute;
    right: 7px;
    color: var(--item-selected-icon-color);
  }

  .label-container {
    font-weight: var(--label-text-weight, 400);
    font-size: var(--label-text-size, 12px);
    color: var(--label-text-color, #333);
    margin-bottom: var(--label-container-margin-bottom, 4px);
    display: var(--label-container-display, inline-block);
  }

  .multipleSelect-btn {
    display: flex;
    width: var(--multipleSelect-btn-width, 99%);
    white-space: var(--multipleSelect-btn-white-space, nowrap);
    padding: var(--multipleSelect-btn-padding, 1px);
    --button-border: var(--multipleSelect-btn-border, 1px solid white);
    --button-font-size: var(--multipleSelect-btn-font-size, 12px);
    --button-width: var(--multipleSelect-btn-width, 100%);
  }


  .apply-btn-container {
    padding: var(--apply-btn-container-padding, 5px);
    border-top: var(--apply-btn-container-border-top, 1px solid #ddd);
    background-color: var(--apply-btn-container-background-color, #f9f9f9);
    position: var(--apply-btn-container-position, sticky);
    width: var(--apply-btn-container-width, 94%);
    display: var(--apply-btn-display, flex);
    flex-direction: var(--apply-btn-flex-direction, column);
    --button-width: var(--apply-btn-width, 100%);
    --button-padding: var(--apply-btn-padding, 10px);
    --button-font-size: var(--apply-btn-font-size, 14px);
  }

  .icon-container {
    width: var(--select-icon-container-width, fit-content);
    height: var(--select-icon-container-height, fit-content);
    border-radius: var(--select-icon-container-border-radius);
    opacity: var(--select-icon-container-opacity);
    background: var(--select-icon-container-background);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: var(--select-icon-container-margin, 0px 8px 0px 0px);
    padding: var(--select-icon-container-padding);
    --image-height: var(--select-icon-height);
    --image-width: var(--select-icon-height);
  }
</style>
