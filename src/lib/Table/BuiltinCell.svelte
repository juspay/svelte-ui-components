<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { TableCellValue, TableColumn } from './properties';
  import {
    asActionGroupCellData,
    asAvatarStackData,
    asButtonCellData,
    asCompareCellData,
    asInputCellData,
    asInputDataType,
    asJsonObject,
    asLinkCellData,
    asPopupMenuCellData,
    asSelectCellData,
    asTagArrayItems,
    asTagCellData,
    buildAvatarStack,
    cellValueToText
  } from './cellData';
  import Pill from '../Pill/Pill.svelte';
  import Img from '../Img/Img.svelte';
  import IconStack from '../IconStack/IconStack.svelte';
  import Toggle from '../Toggle/Toggle.svelte';
  import Button from '../Button/Button.svelte';
  import Select from '../Select/Select.svelte';
  import Input from '../Input/Input.svelte';
  import Menu from '../Menu/Menu.svelte';
  import trendUpSvg from '$lib/assets/trend-up.svg?raw';
  import trendDownSvg from '$lib/assets/trend-down.svg?raw';
  import copySvg from '$lib/assets/copy.svg?raw';
  import dotsSvg from '$lib/assets/dots-vertical.svg?raw';

  let {
    column,
    value,
    rowIndex,
    originalIndex,
    usePortal = false
  }: {
    column: TableColumn;
    value: TableCellValue;
    rowIndex: number;
    originalIndex: number;
    usePortal?: boolean;
  } = $props();

  // The td applies column.align as text-align, which flex containers ignore:
  // column-flex builtins stretch their children and row-flex builtins pack to
  // flex-start, so an aligned column's builtin cells stayed left. Mirror the
  // column alignment as a modifier class the flex builtins translate into
  // align-items / justify-content (same idiom as the header's
  // justify-content mapping).
  const alignmentClass = $derived(
    column.align === 'right'
      ? 'builtin-align-end'
      : column.align === 'center'
        ? 'builtin-align-center'
        : ''
  );

  let copied = $state(false);
  let copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  onDestroy(() => {
    if (copyResetTimer) {
      clearTimeout(copyResetTimer);
    }
  });

  // Interactive cells stop click/keydown propagation so a clickable row's
  // onRowClick never mis-fires from within a built-in control — the same
  // pattern Table's own checkbox column uses. Scoped to built-in renderers
  // only; bare cell-snippet consumers keep owning their own propagation.
  const stopClickPropagation = (event: MouseEvent): void => {
    event.stopPropagation();
  };

  const stopKeydownPropagation = (event: KeyboardEvent): void => {
    event.stopPropagation();
  };

  const handleCopy = async (url: string): Promise<void> => {
    // SSR / non-secure-context safety: the library renders server-side and as
    // web components, where the clipboard API may be absent.
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
      if (copyResetTimer) {
        clearTimeout(copyResetTimer);
      }
      copyResetTimer = setTimeout(() => {
        copied = false;
      }, 2000);
    } catch {
      copied = false;
    }
  };
</script>

{#if column.type === 'tag'}
  {@const tag = asTagCellData(value)}
  {#if tag}
    <Pill
      text={tag.text}
      classes={tag.classes ?? ''}
      dismissible={tag.dismissible ?? false}
      testId={tag.testId}
    />
  {:else}
    {cellValueToText(value)}
  {/if}
{:else if column.type === 'text-tag'}
  {@const data = asJsonObject(value) ?? {}}
  {@const tag = asTagCellData(data.tag ?? null)}
  <div class="builtin-text-tag {alignmentClass}">
    <span class="builtin-primary-text"
      >{typeof data.text === 'string' ? data.text : cellValueToText(value)}</span
    >
    {#if tag}
      <Pill
        text={tag.text}
        classes={tag.classes ?? ''}
        dismissible={tag.dismissible ?? false}
        testId={tag.testId}
      />
    {/if}
  </div>
{:else if column.type === 'two-line-text'}
  {@const data = asJsonObject(value) ?? {}}
  <div class="builtin-two-line {alignmentClass}">
    <span class="builtin-primary-text">{typeof data.text1 === 'string' ? data.text1 : '-'}</span>
    <span class="builtin-secondary-text">{typeof data.text2 === 'string' ? data.text2 : '-'}</span>
  </div>
{:else if column.type === 'icon-label'}
  {@const data = asJsonObject(value) ?? {}}
  {@const icons = Array.isArray(data.icons)
    ? data.icons.filter((iconSrc) => typeof iconSrc === 'string')
    : []}
  <div class="builtin-icon-label {alignmentClass}">
    {#each icons as iconSrc, iconIndex (`${iconIndex}-${iconSrc}`)}
      <span
        class="builtin-icon-label-icon"
        data-pw={column.testId ? `${column.testId}-icon-${iconIndex}` : null}
        testID={column.testId ? `${column.testId}-icon-${iconIndex}` : null}
      >
        <Img inlineSvg src={String(iconSrc)} alt="" fallback="" />
      </span>
    {/each}
    <span>{typeof data.label === 'string' ? data.label : '-'}</span>
  </div>
{:else if column.type === 'image-two-line-text'}
  {@const data = asJsonObject(value) ?? {}}
  <div class="builtin-image-two-line {alignmentClass}">
    {#if typeof data.imageUrl === 'string' && data.imageUrl}
      <span
        class="builtin-thumb"
        data-pw={column.testId ? `${column.testId}-thumb` : null}
        testID={column.testId ? `${column.testId}-thumb` : null}
      >
        <Img
          src={data.imageUrl}
          alt={typeof data.text1 === 'string' ? data.text1 : ''}
          fallback=""
        />
      </span>
    {:else}
      <span
        class="builtin-thumb builtin-thumb-placeholder"
        data-pw={column.testId ? `${column.testId}-thumb-placeholder` : null}
        testID={column.testId ? `${column.testId}-thumb-placeholder` : null}
        >{typeof data.text1 === 'string' && data.text1
          ? data.text1.charAt(0).toUpperCase()
          : ''}</span
      >
    {/if}
    <div class="builtin-two-line {alignmentClass}">
      <span class="builtin-primary-text">{typeof data.text1 === 'string' ? data.text1 : '-'}</span>
      <span class="builtin-secondary-text">{typeof data.text2 === 'string' ? data.text2 : '-'}</span
      >
    </div>
  </div>
{:else if column.type === 'tag-array'}
  {@const tags = asTagArrayItems(value)}
  {#if tags}
    <div class="builtin-tag-array {alignmentClass}">
      {#each tags as tag, tagIndex (`${tagIndex}-${tag.text}`)}
        <Pill
          text={tag.text}
          classes={tag.classes ?? ''}
          testId={tag.testId ?? (column.testId && `${column.testId}-tag-${tagIndex}`)}
        />
      {/each}
    </div>
  {:else}
    {cellValueToText(value)}
  {/if}
{:else if column.type === 'avatar-stack'}
  {@const stackData = asAvatarStackData(value)}
  {#if stackData}
    {@const stack = buildAvatarStack(stackData)}
    <div class="builtin-avatar-stack {alignmentClass}">
      <IconStack icons={stack.icons} />
      {#if stack.rest > 0}
        <span class="builtin-avatar-rest">+{stack.rest}</span>
      {/if}
    </div>
  {:else}
    {cellValueToText(value)}
  {/if}
{:else if column.type === 'compare'}
  {#if typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null}
    {cellValueToText(value)}
  {:else}
    {@const compare = asCompareCellData(value)}
    {#if compare}
      <div class="builtin-compare {alignmentClass}">
        {#if typeof compare.primary === 'string'}
          <span class="builtin-primary-text">{compare.primary}</span>
        {/if}
        {#if typeof compare.comparison === 'string'}
          <span class="builtin-secondary-text">{compare.comparison}</span>
        {/if}
        {#if typeof compare.trendPercent === 'number'}
          {#if compare.trendPercent > 0}
            <span
              class="builtin-trend builtin-trend-up"
              data-pw={column.testId ? `${column.testId}-trend-up` : null}
              testID={column.testId ? `${column.testId}-trend-up` : null}
            >
              <!-- eslint-disable svelte/no-at-html-tags -->
              <span class="builtin-trend-icon">{@html trendUpSvg}</span>
              {compare.trendPercent}%
            </span>
          {:else if compare.trendPercent < 0}
            <span
              class="builtin-trend builtin-trend-down"
              data-pw={column.testId ? `${column.testId}-trend-down` : null}
              testID={column.testId ? `${column.testId}-trend-down` : null}
            >
              <!-- eslint-disable svelte/no-at-html-tags -->
              <span class="builtin-trend-icon">{@html trendDownSvg}</span>
              {compare.trendPercent}%
            </span>
          {:else}
            <span class="builtin-trend builtin-trend-flat">↔ 0%</span>
          {/if}
        {:else if typeof compare.trendLabel === 'string'}
          <span class="builtin-trend builtin-trend-flat">{compare.trendLabel}</span>
        {/if}
      </div>
    {:else}
      {cellValueToText(value)}
    {/if}
  {/if}
{:else if column.type === 'toggle'}
  {@const data = asJsonObject(value) ?? {}}
  {@const isChecked = data.checked === true}
  <span
    class="builtin-toggle"
    role="switch"
    aria-checked={isChecked ? 'true' : 'false'}
    aria-label={typeof data.ariaLabel === 'string' ? data.ariaLabel : null}
    data-pw={typeof data.testId === 'string' ? data.testId : null}
    testID={typeof data.testId === 'string' ? data.testId : null}
    onclick={stopClickPropagation}
    onkeydown={stopKeydownPropagation}
    tabindex={-1}
  >
    <Toggle
      checked={isChecked}
      text=""
      onclick={(newChecked) => column.onToggle?.(rowIndex, newChecked, originalIndex)}
    />
  </span>
{:else if column.type === 'select'}
  {@const selectData = asSelectCellData(value)}
  {#if selectData}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span
      class="builtin-interactive"
      onclick={stopClickPropagation}
      onkeydown={stopKeydownPropagation}
    >
      <Select
        items={selectData.options}
        value={selectData.selectedId ? [selectData.selectedId] : []}
        placeholder={selectData.placeholder ?? ''}
        disabled={selectData.disabled ?? false}
        testId={selectData.testId}
        itemTestId={selectData.itemTestId}
        {usePortal}
        onchange={(selectedIds) => {
          if (selectedIds.length > 0) {
            column.onSelect?.(rowIndex, selectedIds[0], originalIndex);
          }
        }}
      />
    </span>
  {:else}
    {cellValueToText(value)}
  {/if}
{:else if column.type === 'input'}
  {@const inputData = asInputCellData(value)}
  {#if inputData}
    {#snippet inputLeadingIcon()}
      <img class="builtin-input-icon" src={inputData.iconUrl} alt="" />
    {/snippet}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span
      class="builtin-interactive"
      onclick={stopClickPropagation}
      onkeydown={stopKeydownPropagation}
    >
      <Input
        value={inputData.value ?? ''}
        placeholder={inputData.placeholder ?? ''}
        ariaLabel={inputData.ariaLabel ?? null}
        disable={inputData.disabled ?? false}
        testId={inputData.testId ?? ''}
        dataType={asInputDataType(inputData.dataType ?? null)}
        validationPattern={inputData.validationPattern
          ? new RegExp(inputData.validationPattern)
          : null}
        onErrorMessage={inputData.onErrorMessage ?? null}
        actionInput={false}
        onInput={(newValue) => column.onInput?.(rowIndex, newValue, originalIndex)}
        {...inputData.iconUrl ? { leftIcon: inputLeadingIcon } : {}}
      />
    </span>
  {:else}
    {cellValueToText(value)}
  {/if}
{:else if column.type === 'button'}
  {@const buttonData = asButtonCellData(value)}
  {#if buttonData}
    <!-- The icon <img> is always decorative (alt=""): an icon-only button is
         named by the required ariaLabel on the Button, and a text-bearing
         button is named by its visible text — the image never carries the
         accessible name itself. -->
    {#snippet buttonCellIcon()}
      <img class="builtin-button-icon" src={buttonData.iconUrl} alt="" />
    {/snippet}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span
      class="builtin-interactive"
      class:builtin-icon-button={buttonData.iconUrl && !buttonData.text}
      onclick={stopClickPropagation}
      onkeydown={stopKeydownPropagation}
    >
      {#if buttonData.iconUrl}
        <Button
          text={buttonData.text}
          icon={buttonCellIcon}
          iconOnly={!buttonData.text}
          ariaLabel={buttonData.ariaLabel}
          disabled={buttonData.disabled ?? false}
          classes={buttonData.classes ?? ''}
          testId={buttonData.testId}
          onclick={() => column.onButtonClick?.(rowIndex, originalIndex)}
        />
      {:else}
        <Button
          text={buttonData.text}
          ariaLabel={buttonData.ariaLabel}
          disabled={buttonData.disabled ?? false}
          classes={buttonData.classes ?? ''}
          testId={buttonData.testId}
          onclick={() => column.onButtonClick?.(rowIndex, originalIndex)}
        />
      {/if}
    </span>
  {:else}
    {cellValueToText(value)}
  {/if}
{:else if column.type === 'action-group'}
  {@const actionData = asActionGroupCellData(value)}
  {#if actionData}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span
      class="builtin-interactive builtin-action-group"
      onclick={stopClickPropagation}
      onkeydown={stopKeydownPropagation}
    >
      {#if actionData.primaryButton}
        {@const primary = actionData.primaryButton}
        {#snippet primaryButtonIcon()}
          <img class="builtin-button-icon" src={primary.iconUrl} alt="" />
        {/snippet}
        {#if primary.iconUrl}
          <Button
            text={primary.text}
            icon={primaryButtonIcon}
            iconOnly={!primary.text}
            ariaLabel={primary.ariaLabel}
            disabled={primary.disabled ?? false}
            classes={primary.classes ?? ''}
            testId={primary.testId}
            onclick={() => column.onPrimaryAction?.(rowIndex, originalIndex)}
          />
        {:else}
          <Button
            text={primary.text}
            ariaLabel={primary.ariaLabel}
            disabled={primary.disabled ?? false}
            classes={primary.classes ?? ''}
            testId={primary.testId}
            onclick={() => column.onPrimaryAction?.(rowIndex, originalIndex)}
          />
        {/if}
      {/if}
      {#if actionData.menuItems && actionData.menuItems.length > 0}
        <Menu
          items={actionData.menuItems.map((item) => ({
            value: item.id,
            label: item.label ?? item.id,
            danger: item.danger,
            separator: item.separator
          }))}
          testId={column.testId && `${column.testId}-menu-${rowIndex}`}
          {usePortal}
          onselect={(menuItem) => column.onMenuAction?.(rowIndex, menuItem.value, originalIndex)}
        >
          {#snippet trigger()}
            <span class="builtin-icon-button">
              <Button
                ariaLabel="More actions"
                testId={column.testId && `${column.testId}-menu-trigger-${rowIndex}`}
              >
                {#snippet icon()}
                  <!-- eslint-disable svelte/no-at-html-tags -->
                  <span class="builtin-menu-dots">{@html dotsSvg}</span>
                {/snippet}
              </Button>
            </span>
          {/snippet}
        </Menu>
      {/if}
    </span>
  {:else}
    {cellValueToText(value)}
  {/if}
{:else if column.type === 'popup-menu'}
  {@const popupData = asPopupMenuCellData(value)}
  {#if popupData}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span
      class="builtin-interactive"
      onclick={stopClickPropagation}
      onkeydown={stopKeydownPropagation}
    >
      <Menu
        items={popupData.items.map((item) => ({
          value: item.id,
          label: item.label ?? item.id,
          danger: item.danger,
          separator: item.separator
        }))}
        testId={column.testId && `${column.testId}-popup-${rowIndex}`}
        {usePortal}
        onselect={(menuItem) => column.onMenuAction?.(rowIndex, menuItem.value, originalIndex)}
      >
        {#snippet trigger()}
          <span class="builtin-icon-button">
            <Button
              ariaLabel={popupData.ariaLabel ?? 'More actions'}
              testId={column.testId && `${column.testId}-popup-trigger-${rowIndex}`}
            >
              {#snippet icon()}
                <!-- eslint-disable svelte/no-at-html-tags -->
                <span class="builtin-menu-dots">{@html dotsSvg}</span>
              {/snippet}
            </Button>
          </span>
        {/snippet}
      </Menu>
    </span>
  {:else}
    {cellValueToText(value)}
  {/if}
{:else if column.type === 'link'}
  {@const link = asLinkCellData(value)}
  {#if link}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="builtin-link" onclick={stopClickPropagation} onkeydown={stopKeydownPropagation}>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        class="builtin-link-anchor"
        data-pw={column.testId ? `${column.testId}-link-${rowIndex}` : null}
        testID={column.testId ? `${column.testId}-link-${rowIndex}` : null}
      >
        {link.label ?? link.url}
      </a>
      {#if link.copyable !== false}
        <span class="builtin-link-copy">
          <Button
            ariaLabel={copied ? 'Link copied' : 'Copy link'}
            testId={column.testId && `${column.testId}-copy-${rowIndex}`}
            onclick={() => handleCopy(link.url)}
          >
            {#snippet icon()}
              <!-- eslint-disable svelte/no-at-html-tags -->
              <span class="builtin-copy-icon">{@html copySvg}</span>
            {/snippet}
          </Button>
        </span>
        {#if copied}
          <span
            class="builtin-link-copied"
            data-pw={column.testId ? `${column.testId}-link-copied` : null}
            testID={column.testId ? `${column.testId}-link-copied` : null}>Copied</span
          >
        {/if}
      {/if}
    </div>
  {:else}
    {cellValueToText(value)}
  {/if}
{:else}
  {cellValueToText(value)}
{/if}

<style>
  .builtin-primary-text {
    display: block;
    font-size: var(--table-cell-primary-font-size, var(--table-content-font-size, 14px));
    color: var(--table-cell-primary-color, var(--table-content-color, #111827));
  }

  .builtin-secondary-text {
    display: block;
    font-size: var(--table-cell-secondary-font-size, 12px);
    color: var(--table-cell-secondary-color, #6b7280);
  }

  .builtin-two-line,
  .builtin-compare {
    display: flex;
    flex-direction: column;
    gap: var(--table-cell-line-gap, 2px);
  }

  /* column.align lands on the td as text-align, which flex layouts ignore.
     Column-flex builtins follow it via align-items… */
  .builtin-two-line.builtin-align-end,
  .builtin-compare.builtin-align-end {
    align-items: flex-end;
  }

  .builtin-two-line.builtin-align-center,
  .builtin-compare.builtin-align-center {
    align-items: center;
  }

  /* …and row-flex builtins follow it via justify-content. */
  .builtin-text-tag.builtin-align-end,
  .builtin-icon-label.builtin-align-end,
  .builtin-image-two-line.builtin-align-end,
  .builtin-tag-array.builtin-align-end,
  .builtin-avatar-stack.builtin-align-end {
    justify-content: flex-end;
  }

  .builtin-text-tag.builtin-align-center,
  .builtin-icon-label.builtin-align-center,
  .builtin-image-two-line.builtin-align-center,
  .builtin-tag-array.builtin-align-center,
  .builtin-avatar-stack.builtin-align-center {
    justify-content: center;
  }

  .builtin-text-tag {
    display: flex;
    align-items: center;
    gap: var(--table-cell-inline-gap, 8px);
  }

  .builtin-icon-label {
    display: flex;
    align-items: center;
    gap: var(--table-cell-inline-gap, 8px);
  }

  .builtin-icon-label-icon :global(img),
  .builtin-icon-label-icon :global(svg) {
    width: var(--table-cell-icon-size, 16px);
    height: var(--table-cell-icon-size, 16px);
    display: block;
  }

  .builtin-image-two-line {
    display: flex;
    align-items: center;
    gap: var(--table-cell-inline-gap, 8px);
  }

  .builtin-thumb {
    display: inline-flex;
    width: var(--table-cell-thumb-size, 32px);
    height: var(--table-cell-thumb-size, 32px);
    border-radius: var(--table-cell-thumb-radius, var(--radius, 4px));
    overflow: hidden;
    flex-shrink: 0;
  }

  .builtin-thumb :global(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .builtin-thumb-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--table-cell-thumb-placeholder-background, #f3f4f6);
    color: var(--table-cell-thumb-placeholder-color, #6b7280);
    font-size: var(--table-cell-thumb-placeholder-font-size, 14px);
    font-weight: 600;
    line-height: 1;
    text-transform: uppercase;
  }

  .builtin-tag-array {
    display: flex;
    flex-wrap: wrap;
    gap: var(--table-tag-array-gap, 4px);
  }

  .builtin-avatar-stack {
    display: flex;
    align-items: center;
    gap: var(--table-cell-inline-gap, 8px);
  }

  .builtin-avatar-rest {
    font-size: var(--table-cell-secondary-font-size, 12px);
    color: var(--table-cell-secondary-color, #6b7280);
  }

  .builtin-trend {
    display: inline-flex;
    align-items: center;
    gap: var(--table-trend-gap, 4px);
    font-size: var(--table-cell-secondary-font-size, 12px);
  }

  .builtin-trend-up {
    color: var(--table-trend-up-color, #16a34a);
  }

  .builtin-trend-down {
    color: var(--table-trend-down-color, #dc2626);
  }

  .builtin-trend-flat {
    color: var(--table-trend-flat-color, #6b7280);
  }

  .builtin-trend-icon :global(svg) {
    width: var(--table-trend-icon-size, 12px);
    height: var(--table-trend-icon-size, 12px);
    display: block;
  }

  .builtin-toggle {
    display: inline-flex;
    align-items: center;
  }

  .builtin-interactive {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    width: var(--table-interactive-width, auto);
  }

  .builtin-input-icon {
    display: block;
    width: var(--table-cell-input-icon-size, 16px);
    height: var(--table-cell-input-icon-size, 16px);
  }

  .builtin-button-icon {
    display: block;
    width: var(--table-cell-icon-size, 16px);
    height: var(--table-cell-icon-size, 16px);
  }

  .builtin-action-group {
    gap: var(--table-cell-inline-gap, 8px);
  }

  .builtin-icon-button {
    --button-color: transparent;
    --button-border: none;
    --button-padding: 2px;
    --button-margin: 0;
    --button-width: fit-content;
    --button-height: fit-content;
    --button-text-color: var(--table-cell-icon-button-color, #6b7280);
    --button-hover-color: var(--table-cell-icon-button-hover-background, rgba(0, 0, 0, 0.05));
    display: inline-flex;
  }

  .builtin-menu-dots :global(svg) {
    width: var(--table-cell-icon-size, 16px);
    height: var(--table-cell-icon-size, 16px);
    display: block;
  }

  .builtin-link {
    display: flex;
    align-items: center;
    gap: var(--table-cell-inline-gap, 8px);
    min-width: 0;
  }

  .builtin-link-anchor {
    color: var(--table-link-color, #2563eb);
    text-decoration: var(--table-link-decoration, underline);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .builtin-link-copy {
    --button-color: transparent;
    --button-border: none;
    --button-padding: 2px;
    --button-margin: 0;
    --button-width: fit-content;
    --button-height: fit-content;
    --button-text-color: var(--table-link-copy-color, #6b7280);
    --button-hover-color: var(--table-link-copy-hover-background, rgba(0, 0, 0, 0.05));
    display: inline-flex;
    flex-shrink: 0;
  }

  .builtin-copy-icon :global(svg) {
    width: var(--table-cell-icon-size, 16px);
    height: var(--table-cell-icon-size, 16px);
    display: block;
  }

  .builtin-link-copied {
    font-size: var(--table-cell-secondary-font-size, 12px);
    color: var(--table-cell-secondary-color, #6b7280);
    flex-shrink: 0;
  }
</style>
