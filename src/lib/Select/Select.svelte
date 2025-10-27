<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { SelectProperties } from './properties';
  import type { ButtonProperties } from '$lib/Button/properties';
  import Img from '$lib/Img/Img.svelte';
  import Button from '$lib/Button/Button.svelte';
  import CheckListItem from '$lib/CheckListItem/CheckListItem.svelte';

  let selectedElementDiv: HTMLDivElement | null = $state(null);

  let {
    dropDownIconAlt = '',
    placeholder = '',
    label = '',
    allItems = [],
    selectedItem = '',
    selectedItemLabel = null,
    showSelectedItemInDropdown = false,
    selectMultipleItems = false,
    hideDropDownIcon,
    dropDownIcon,
    leftIcon = null,
    showSingleSelectButton,
    showSelectedItem = true,
    showSelectedItemCount = false,
    testId,
    labelTestId,
    itemTestId,
    leftContent,
    bottomContent,
    onselect,
    ondropdownClick,
    onkeydown
  }: SelectProperties = $props();

  const dropDownIconUrl = dropDownIcon ?? 'https://sdk.breeze.in/gallery/icons/down-arrow.svg';

  let applyButtonProps: ButtonProperties = $derived({
    text: `Select (${selectedItem.length})`,
    enable: selectedItem.length > 0,
    showLoader: false,
    type: 'submit'
  });

  const selectAllButtonProps: ButtonProperties = {
    text: 'Select All',
    enable: true,
    showLoader: false,
    type: 'submit'
  };

  let isSelectOpen = $state(false);

  let nonSelectedItems = $derived(
    allItems.filter((item) =>
      selectMultipleItems ? !selectedItem.includes(item) : item !== selectedItem
    )
  );

  function isSelected(selectedItem: string | string[], item: string) {
    if (Array.isArray(selectedItem)) {
      return selectedItem.includes(item);
    } else {
      return selectedItem.trim() === item.trim();
    }
  }

  function selectItem(item: string) {
    if (selectMultipleItems && Array.isArray(selectedItemLabel) && Array.isArray(selectedItem)) {
      if (isSelected(selectedItem, item)) {
        selectedItem = selectedItem.filter((selected) => selected !== item);
        selectedItemLabel = selectedItemLabel.filter((label) => label !== item);
      } else {
        selectedItem = [...selectedItem, item];
        selectedItemLabel = [...selectedItemLabel, item];
      }
    } else {
      selectedItem = [item];
      selectedItemLabel = [item];
    }
    if (!selectMultipleItems) {
      toggleSelect();
      dispatchEvent();
    }
  }

  function dispatchEvent() {
    onselect?.({ selectedItems: selectedItem });
    isSelectOpen = false;
  }

  function toggleSelect() {
    isSelectOpen = !isSelectOpen;
    ondropdownClick?.();
  }

  function selectAllItems() {
    if (selectedItem.length === allItems.length) {
      selectedItem = [];
      selectedItemLabel = [];
    } else {
      selectedItem = [...allItems];
      selectedItemLabel = [...allItems];
    }
  }

  function closeSelect(event: Event) {
    const clickedElement = event.target as HTMLElement;
    if (selectedElementDiv !== null && !selectedElementDiv.contains(clickedElement)) {
      const isItemClicked = clickedElement.classList.contains('item');
      const isApplyButtonClicked = clickedElement.classList.contains('apply-btn');
      const isClearAllButtonClicked = clickedElement.innerText === 'Clear All';
      const isSelectAllButtonClicked = clickedElement.innerText === 'Select All';
      const isCheckListClicked = clickedElement.classList.contains('checkbox');
      if (
        !isItemClicked &&
        !isApplyButtonClicked &&
        !isClearAllButtonClicked &&
        !isSelectAllButtonClicked &&
        !isCheckListClicked
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

{#if label !== null && label !== ''}
  <label class="label-container" for={label} data-pw={labelTestId}>
    {label}
  </label>
{/if}

{#if allItems.length !== 0}
  <div class="select">
    <div
      class="selected item"
      onclick={toggleSelect}
      bind:this={selectedElementDiv}
      {onkeydown}
      role="button"
      tabindex="0"
      data-pw={testId}
    >
      {#if leftIcon !== null}
        <div class="icon-container">
          <Img {...leftIcon} />
        </div>
      {/if}
      {#if leftContent}
        {@render leftContent()}
      {/if}
      <div class="selected-content">
        {#if selectMultipleItems && Array.isArray(selectedItemLabel) && Array.isArray(selectedItem)}
          {#if selectedItem.length === 0}
            {placeholder}
          {:else if selectedItemLabel?.length === 0 || (showSelectedItemInDropdown && showSelectedItem !== false)}
            {selectedItem.join(', ')}
          {:else if showSelectedItem !== false}
            {selectedItemLabel.join(', ')}
          {:else}
            {placeholder}
          {/if}
        {:else if selectedItem === ''}
          {placeholder}
        {:else if selectedItemLabel === null || (selectedItemLabel === '' && showSelectedItem !== false)}
          {selectedItem}
        {:else if showSelectedItem !== false}
          {selectedItemLabel}
        {:else}
          {placeholder}
        {/if}
      </div>
      <div class="filler"></div>
      {#if showSelectedItemCount && selectMultipleItems && Array.isArray(selectedItem)}
        <div class="selected-item-count">
          {selectedItem.length}
        </div>
      {/if}
      {#if !hideDropDownIcon}
        <img
          src={dropDownIconUrl}
          alt={dropDownIconAlt}
          class="arrow {isSelectOpen ? 'active' : ''}"
        />
      {/if}
    </div>
    <div
      class="non-selected-items"
      style="--non-selected-display:{isSelectOpen ? 'inline-block' : 'none'};"
    >
      {#if selectMultipleItems && !showSingleSelectButton}
        <div class="select-all-btn">
          <CheckListItem
            checked={Array.isArray(selectedItem) && selectedItem.length === allItems.length}
            text=""
            onclick={selectAllItems}
          />
          <Button {...selectAllButtonProps} onclick={selectAllItems} />
        </div>
      {/if}
      <div class="item-list">
        {#each showSelectedItemInDropdown ? allItems : nonSelectedItems as item (item)}
          <div
            {onkeydown}
            onclick={() => {
              selectItem(item);
            }}
            class="item {isSelected(selectedItem, item) ? ' item-selected' : ''}"
            role="button"
            tabindex="0"
            data-pw={`${itemTestId}-${item}`}
          >
            {#if selectMultipleItems}
              <CheckListItem checked={isSelected(selectedItem, item)} text="" />
            {/if}
            {item}
          </div>
        {/each}
      </div>
      {#if bottomContent}
        {@render bottomContent()}
      {/if}
      {#if selectMultipleItems}
        <div class="apply-btn-container">
          <Button {...applyButtonProps} onclick={dispatchEvent} />
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
    align-content: var(--select-align-content);
    display: var(--select-display, inline-block);
    --button-margin: var(--select-btn-margin, 1px);
    --button-border-radius: var(--select-btn-border-radius, 2px);
    --input-button-margin: var(--select-input-button-margin, 10px);
    --check-list-item-margin: var(--select-check-list-item-margin, 0px);
    --checkbox-margin: var(--select-checkbox-margin, 2px 8px 0px 0px);
    --checkbox-height: var(--select-checkbox-height, 14px);
    --checkbox-width: var(--select-checkbox-width, 14px);
    --checkbox-accent-color: var(--select-checkbox-accent-color, #3a4550);
    --check-list-item-checked-font-weight: var(--select-check-list-item-checked-font-weight, bold);
    --check-list-item-width: var(--select-check-list-item-width, fit-content);
  }

  .select:hover {
    color: var(--select-hover-color, #000);
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
    align-items: var(--item-align-items);
    height: var(--item-height);
    cursor: pointer;
    position: relative;
    display: flex;
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

  .select-all-btn {
    display: flex;
    width: var(--select-all-btn-width, 99%);
    white-space: var(--select-all-btn-white-space, nowrap);
    padding: var(--select-all-btn-padding, 10px 16px);
    --button-font-size: var(--select-all-btn-font-size, 14px);
    --button-width: var(--select-all-btn-width, 100%);
    --button-color: var(--select-all-btn-color, #ffffff);
    --button-text-color: var(--select-all-btn-text-color, #333);
    --button-padding: var(--select-all-btn-inner-padding, 0px);
    --button-justify-content: var(--select-all-btn-justify-content, flex-start);
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

  .selected-item-count {
    margin: var(--selected-item-count-margin, 0px 6px);
    height: var(--selected-item-count-height, 18px);
    width: var(--selected-item-count-width, 18px);
    min-width: var(--selected-item-count-min-width, 18px);
    padding: var(--selected-item-count-padding, 4px);
    display: var(--selected-item-count-display, flex);
    justify-content: var(--selected-item-count-justify-content, center);
    align-items: var(--selected-item-count-align-item, center);
    background-color: var(--selected-item-count-bg-color, #3a4550);
    color: var(--selected-item-count-text-color, #ffffff);
    border-radius: var(--selected-item-count-border-radius, 4px);
  }
</style>
