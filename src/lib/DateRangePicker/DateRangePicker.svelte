<script lang="ts">
  import type { DateRangePickerProperties, DateRangePreset } from './properties';
  import { untrack } from 'svelte';
  import { SvelteDate } from 'svelte/reactivity';
  import Calendar from '../Calendar/Calendar.svelte';
  import Button from '../Button/Button.svelte';
  import chevronDownSvg from '$lib/assets/chevron-down.svg?raw';

  let {
    rangeStart = $bindable(null),
    rangeEnd = $bindable(null),
    value = $bindable(null),
    mode = 'range',
    minDate = null,
    maxDate = null,
    disabledDates = [],
    maxRangeDays = null,
    presets = null,
    placeholder = 'Select date',
    dualMonth,
    timePicker,
    compareStart = $bindable(null),
    compareEnd = $bindable(null),
    compareCalendar,
    weekStartsOn = 0,
    locale,
    testId,
    classes,
    triggerSnippet,
    triggerIcon,
    clearable = false,
    initialPresetLabel,
    onapply,
    onapplysingle,
    onapplycompare,
    oncancel,
    onopentoggle,
    onclear
  }: DateRangePickerProperties = $props();

  const isDualMonth: boolean = $derived(
    typeof dualMonth === 'boolean' ? dualMonth : mode === 'range'
  );

  // Draft state — only committed on Apply
  let draftStart: Date | null = $state(null);
  let draftEnd: Date | null = $state(null);
  let draftValue: Date | null = $state(null);
  let draftCompareStart: Date | null = $state(null);
  let draftCompareEnd: Date | null = $state(null);

  // Tracks the label of the currently active preset, or null when the user
  // made a custom calendar selection (or before any selection is made).
  let selectedPresetLabel: string | null = $state(null);

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  function isBaseDisabledDate(date: Date): boolean {
    if (typeof disabledDates === 'function') {
      return disabledDates(date);
    }
    return disabledDates.some((disabled) => isSameDay(disabled, date));
  }

  // When maxRangeDays is set, disable any date whose span from the in-progress
  // start would exceed the limit (inclusive of both ends), until the range is
  // completed. Falls back to the raw disabledDates otherwise.
  const rangeConstrainedDisabledDates = $derived.by(() => {
    const limit = maxRangeDays;
    if (limit === null) {
      return disabledDates;
    }
    const anchor = draftStart;
    const selecting = anchor !== null && draftEnd === null;
    return (date: Date): boolean => {
      if (isBaseDisabledDate(date)) {
        return true;
      }
      if (!selecting || anchor === null) {
        return false;
      }
      const diffDays = Math.abs(Math.round((date.getTime() - anchor.getTime()) / MS_PER_DAY));
      return diffDays > limit - 1;
    };
  });

  let isOpen: boolean = $state(false);
  let panelRef: HTMLDivElement | null = $state(null);
  let triggerRef: HTMLDivElement | null = $state(null);

  // Tracks the active preset label for the trigger display (seeded from initialPresetLabel on mount)
  const resolvedInitialPresetLabel: string | null = untrack(() => {
    if (
      typeof initialPresetLabel === 'string' &&
      initialPresetLabel !== '' &&
      presets !== null &&
      presets.length > 0
    ) {
      const matched = presets.find((preset) => preset.label === initialPresetLabel);
      return matched ? matched.label : null;
    }
    return null;
  });

  let activePresetLabel: string | null = $state(resolvedInitialPresetLabel);

  // Dual-month navigation: track the year+month of the left calendar
  let leftYear: number = $state(new SvelteDate().getFullYear());
  let leftMonth: number = $state(new SvelteDate().getMonth());

  // A key counter — incrementing forces Calendar to re-mount with new initialMonth
  let calendarKey: number = $state(0);

  const now = new SvelteDate();

  const leftInitialMonth: Date = $derived(new SvelteDate(leftYear, leftMonth, 1));
  const rightInitialMonth: Date = $derived(new SvelteDate(leftYear, leftMonth + 1, 1));

  // Right calendar header label (derived from leftInitialMonth)
  const rightMonthLabel: string = $derived(
    rightInitialMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  );
  const leftMonthLabel: string = $derived(
    leftInitialMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  );

  function formatDate(d: Date): string {
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const triggerLabel: string = $derived.by(() => {
    // If an initial preset label is active (seeded on mount, not yet overridden), show it
    if (activePresetLabel !== null) {
      return activePresetLabel;
    }
    if (mode === 'single') {
      return value !== null ? formatDate(value) : placeholder;
    }
    if (rangeStart !== null && rangeEnd !== null) {
      return `${formatDate(rangeStart)} – ${formatDate(rangeEnd)}`;
    }
    if (rangeStart !== null) {
      return `${formatDate(rangeStart)} – ...`;
    }
    return placeholder;
  });

  function openPicker(): void {
    // Seed draft from current committed values
    draftStart = rangeStart !== null ? rangeStart : null;
    draftEnd = rangeEnd !== null ? rangeEnd : null;
    draftValue = value !== null ? value : null;
    draftCompareStart = compareStart !== null ? compareStart : null;
    draftCompareEnd = compareEnd !== null ? compareEnd : null;

    // Reset preset tracking so each picker session starts clean.
    selectedPresetLabel = null;

    // Navigate left calendar so it shows the committed start month (or today)
    const anchor = rangeStart !== null ? rangeStart : value !== null ? value : now;
    leftYear = anchor.getFullYear();
    leftMonth = anchor.getMonth();
    calendarKey++;

    isOpen = true;
    onopentoggle?.({ open: true });
  }

  function closePicker(): void {
    isOpen = false;
    onopentoggle?.({ open: false });
  }

  function navigateDualMonths(delta: number): void {
    const next = new SvelteDate(leftYear, leftMonth + delta, 1);
    leftYear = next.getFullYear();
    leftMonth = next.getMonth();
    calendarKey++;
  }

  function handleApply(): void {
    // Once the user explicitly applies, clear the initial-preset display label
    activePresetLabel = null;
    if (mode === 'range') {
      if (draftStart !== null && draftEnd !== null) {
        rangeStart = draftStart;
        rangeEnd = draftEnd;
        onapply?.({ rangeStart: draftStart, rangeEnd: draftEnd, presetLabel: selectedPresetLabel });
      }
      if (
        typeof compareCalendar === 'function' &&
        draftCompareStart !== null &&
        draftCompareEnd !== null
      ) {
        compareStart = draftCompareStart;
        compareEnd = draftCompareEnd;
        onapplycompare?.({
          compareStart: draftCompareStart,
          compareEnd: draftCompareEnd,
          presetLabel: selectedPresetLabel
        });
      }
    } else {
      if (draftValue !== null) {
        value = draftValue;
        onapplysingle?.({ date: draftValue, presetLabel: selectedPresetLabel });
      }
    }
    closePicker();
  }

  function handleClear(): void {
    value = null;
    draftValue = null;
    onclear?.();
    closePicker();
  }

  function handleCancel(): void {
    oncancel?.();
    closePicker();
  }

  function handlePreset(preset: DateRangePreset): void {
    // User explicitly picked a preset — clear the initial-preset display label
    activePresetLabel = null;
    const { start, end } = preset.getValue();
    selectedPresetLabel = preset.label;
    if (mode === 'range') {
      draftStart = start;
      draftEnd = end;
      // Navigate left calendar to show the preset's start month
      leftYear = start.getFullYear();
      leftMonth = start.getMonth();
      calendarKey++;
    } else {
      draftValue = start;
    }
  }

  function handleRangeSelect(event: { rangeStart: Date; rangeEnd: Date }): void {
    draftStart = event.rangeStart;
    draftEnd = event.rangeEnd;
    // A direct calendar click is not a preset selection.
    selectedPresetLabel = null;
  }

  function handleSingleSelect(event: { date: Date }): void {
    draftValue = event.date;
    // A direct calendar click is not a preset selection.
    selectedPresetLabel = null;
  }

  // Close on outside-click
  function handleDocumentClick(event: MouseEvent): void {
    if (!isOpen) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    const clickedInsidePanel = panelRef !== null && panelRef.contains(target);
    const clickedTrigger = triggerRef !== null && triggerRef.contains(target);
    if (!clickedInsidePanel && !clickedTrigger) {
      closePicker();
    }
  }

  function handleDocumentKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && isOpen) {
      handleCancel();
    }
  }

  const canApply: boolean = $derived.by(() => {
    if (mode === 'range') {
      return draftStart !== null && draftEnd !== null;
    }
    return draftValue !== null;
  });

  function isPresetActive(preset: DateRangePreset): boolean {
    // When an initial preset label is active and the user hasn't picked anything yet,
    // highlight the matching preset in the sidebar by label match
    if (
      activePresetLabel !== null &&
      draftStart === null &&
      draftEnd === null &&
      draftValue === null
    ) {
      return preset.label === activePresetLabel;
    }
    if (mode === 'single') {
      if (draftValue === null) {
        return false;
      }
      const { start } = preset.getValue();
      return isSameDay(draftValue, start);
    }
    if (draftStart === null || draftEnd === null) {
      return false;
    }
    const { start, end } = preset.getValue();
    return isSameDay(draftStart, start) && isSameDay(draftEnd, end);
  }

  function isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
</script>

<svelte:document onclick={handleDocumentClick} onkeydown={handleDocumentKeyDown} />

<div class="drp-root {classes ?? ''}" data-pw={testId}>
  <!-- Trigger wrapper — bind:this here so outside-click detection works -->
  <div bind:this={triggerRef} class="drp-trigger-wrapper">
    <Button
      onclick={openPicker}
      ariaLabel="Open date picker"
      classes="drp-trigger {isOpen ? 'drp-trigger-open' : ''}"
    >
      {#if typeof triggerSnippet === 'function'}
        {@render triggerSnippet(triggerLabel)}
      {:else}
        <span class="drp-trigger-label">{triggerLabel}</span>
        <span class="drp-trigger-icon" aria-hidden="true">
          {#if typeof triggerIcon === 'function'}
            {@render triggerIcon()}
          {:else}
            <!-- eslint-disable svelte/no-at-html-tags -->
            {@html chevronDownSvg}
          {/if}
        </span>
      {/if}
    </Button>
  </div>

  <!-- Dropdown panel -->
  {#if isOpen}
    <div
      bind:this={panelRef}
      class="drp-panel"
      role="dialog"
      aria-label="Date range picker"
      aria-modal="true"
    >
      <div class="drp-panel-inner">
        <!-- Preset sidebar -->
        {#if presets !== null && presets.length > 0}
          <div class="drp-sidebar" role="listbox" aria-label="Date presets">
            {#each presets as preset, presetIndex (preset.label)}
              {@const previousPreset = presetIndex > 0 ? presets[presetIndex - 1] : null}
              {@const groupChanged =
                presetIndex > 0 &&
                'group' in preset &&
                (previousPreset === null || previousPreset.group !== preset.group)}
              {#if groupChanged}
                <div class="drp-preset-divider" role="separator" aria-hidden="true">
                  {#if preset.group !== ''}
                    <span class="drp-preset-group-label">{preset.group}</span>
                  {/if}
                </div>
              {/if}
              <button
                type="button"
                class="drp-preset-item"
                class:drp-preset-active={isPresetActive(preset)}
                role="option"
                aria-selected={isPresetActive(preset)}
                onclick={() => handlePreset(preset)}
              >
                {preset.label}
              </button>
            {/each}
          </div>
        {/if}

        <!-- Calendar area -->
        <div class="drp-calendars">
          {#if isDualMonth}
            <!-- Dual-month layout with shared nav -->
            <div class="drp-dual-header">
              <button
                type="button"
                class="drp-nav-btn"
                onclick={() => navigateDualMonths(-1)}
                aria-label="Previous months"
              >
                <span class="drp-nav-chevron drp-nav-chevron-left" aria-hidden="true"></span>
              </button>
              <div class="drp-dual-month-labels">
                <span class="drp-month-label">{leftMonthLabel}</span>
                <span class="drp-month-label">{rightMonthLabel}</span>
              </div>
              <button
                type="button"
                class="drp-nav-btn"
                onclick={() => navigateDualMonths(1)}
                aria-label="Next months"
              >
                <span class="drp-nav-chevron drp-nav-chevron-right" aria-hidden="true"></span>
              </button>
            </div>

            <div class="drp-months-row">
              {#key calendarKey}
                <!-- Left month -->
                <Calendar
                  mode="range"
                  bind:rangeStart={draftStart}
                  bind:rangeEnd={draftEnd}
                  {weekStartsOn}
                  {locale}
                  {minDate}
                  {maxDate}
                  disabledDates={rangeConstrainedDisabledDates}
                  initialMonth={leftInitialMonth}
                  onrangeselect={handleRangeSelect}
                  classes="drp-calendar-embedded"
                />
                <!-- Right month -->
                <Calendar
                  mode="range"
                  bind:rangeStart={draftStart}
                  bind:rangeEnd={draftEnd}
                  {weekStartsOn}
                  {locale}
                  {minDate}
                  {maxDate}
                  disabledDates={rangeConstrainedDisabledDates}
                  initialMonth={rightInitialMonth}
                  onrangeselect={handleRangeSelect}
                  classes="drp-calendar-embedded"
                />
              {/key}
            </div>
          {:else}
            <!-- Single month -->
            <Calendar
              mode={mode === 'range' ? 'range' : 'single'}
              bind:rangeStart={draftStart}
              bind:rangeEnd={draftEnd}
              bind:value={draftValue}
              {weekStartsOn}
              {locale}
              {minDate}
              {maxDate}
              {disabledDates}
              onrangeselect={handleRangeSelect}
              onselect={handleSingleSelect}
              classes="drp-calendar-embedded"
            />
          {/if}

          <!-- Time picker slot: consumer controls all time UI -->
          {#if typeof timePicker === 'function'}
            <div class="drp-time-row">
              {@render timePicker()}
            </div>
          {/if}

          <!-- Compare calendar slot: consumer controls all compare UI -->
          {#if typeof compareCalendar === 'function'}
            <div class="drp-compare-section">
              {@render compareCalendar()}
            </div>
          {/if}
        </div>
      </div>

      <!-- Footer -->
      <div class="drp-footer">
        {#if clearable && mode === 'single' && value !== null}
          <Button onclick={handleClear} ariaLabel="Clear date selection" classes="drp-btn-clear">
            Clear
          </Button>
        {/if}
        <Button onclick={handleCancel} ariaLabel="Cancel date selection" classes="drp-btn-cancel">
          Cancel
        </Button>
        <Button
          onclick={handleApply}
          ariaLabel="Apply date selection"
          classes="drp-btn-apply"
          disabled={!canApply}
        >
          Apply
        </Button>
      </div>
    </div>
  {/if}
</div>

<style>
  .drp-root {
    position: relative;
    display: inline-block;
  }

  /* ── Trigger wrapper ── */
  .drp-trigger-wrapper {
    display: inline-block;
  }

  /* Bridge drp-trigger CSS vars to Button CSS vars on the wrapper */
  .drp-trigger-wrapper {
    --button-color: var(--drp-trigger-background, inherit);
    --button-border: var(--drp-trigger-border, 1px solid currentColor);
    --button-border-radius: var(--drp-trigger-border-radius, 6px);
    --button-text-color: var(--drp-trigger-color, inherit);
    --button-padding: var(--drp-trigger-padding, 8px 12px);
    --button-min-width: var(--drp-trigger-min-width, 200px);
    --button-gap: var(--drp-trigger-gap, 8px);
    --button-hover-border-color: var(--drp-trigger-hover-border-color, currentColor);
  }

  :global(.drp-trigger) {
    display: inline-flex !important;
    align-items: center;
    gap: var(--drp-trigger-gap, 8px);
    white-space: nowrap;
    min-width: var(--drp-trigger-min-width, 200px);
    font-family: inherit;
  }

  :global(.drp-trigger-open) {
    border-color: var(--drp-trigger-open-border-color, #000000) !important;
    box-shadow: var(--drp-trigger-open-shadow, 0 0 0 2px rgba(0, 0, 0, 0.1));
  }

  .drp-trigger-label {
    flex: 1;
    text-align: left;
  }

  .drp-trigger-icon {
    display: inline-flex;
    align-items: center;
    color: var(--drp-trigger-icon-color, inherit);
    flex-shrink: 0;
  }

  /* ── Panel ── */
  .drp-panel {
    position: absolute;
    top: calc(100% + var(--drp-panel-offset, 6px));
    left: 0;
    z-index: var(--drp-panel-z-index, 1000);
    background: var(--drp-panel-background, inherit);
    border: var(--drp-panel-border, 1px solid #e0e0e0);
    border-radius: var(--drp-panel-border-radius, 10px);
    box-shadow: var(--drp-panel-shadow, 0 8px 24px rgba(0, 0, 0, 0.12));
    display: flex;
    flex-direction: column;
    min-width: var(--drp-panel-min-width, 320px);
    max-width: var(--drp-panel-max-width, 760px);
    overflow: hidden;
  }

  .drp-panel-inner {
    display: flex;
    flex-direction: row;
  }

  /* ── Sidebar ── */
  .drp-sidebar {
    display: flex;
    flex-direction: column;
    padding: var(--drp-sidebar-padding, 12px 8px);
    border-right: var(--drp-sidebar-border, 1px solid #e8e8e8);
    min-width: var(--drp-sidebar-min-width, 140px);
    gap: 2px;
    overflow-y: auto;
    max-height: var(--drp-sidebar-max-height, 400px);
  }

  .drp-preset-item {
    display: block;
    width: 100%;
    text-align: left;
    padding: var(--drp-preset-padding, 7px 12px);
    background: none;
    border: none;
    border-radius: var(--drp-preset-border-radius, 5px);
    color: var(--drp-preset-color, inherit);
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.12s ease;
    font-family: inherit;
  }

  .drp-preset-item:hover {
    background: var(--drp-preset-hover-background, #f5f5f5);
  }

  .drp-preset-active {
    background: var(--drp-preset-active-background, currentColor);
    color: var(--drp-preset-active-color, #ffffff);
  }

  .drp-preset-active:hover {
    background: var(--drp-preset-active-hover-background, #333333);
  }

  /* ── Calendar area ── */
  .drp-calendars {
    display: flex;
    flex-direction: column;
    padding: var(--drp-calendars-padding, 16px);
    gap: var(--drp-calendars-gap, 16px);
    flex: 1;
  }

  /* Dual-month shared nav header */
  .drp-dual-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .drp-dual-month-labels {
    display: flex;
    flex: 1;
    justify-content: space-around;
  }

  .drp-month-label {
    color: var(--drp-month-label-color, inherit);
    text-transform: capitalize;
  }

  .drp-nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--drp-nav-btn-size, 32px);
    height: var(--drp-nav-btn-size, 32px);
    background: none;
    border: none;
    border-radius: var(--drp-nav-btn-border-radius, 4px);
    cursor: pointer;
    color: var(--drp-nav-btn-color, inherit);
    transition: background 0.12s ease;
    padding: 0;
  }

  .drp-nav-btn:hover {
    background: var(--drp-nav-btn-hover-background, #f0f0f0);
  }

  /* CSS-only chevrons for the dual-nav */
  .drp-nav-chevron {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-right: var(--drp-nav-chevron-border, 2px solid currentColor);
    border-top: var(--drp-nav-chevron-border, 2px solid currentColor);
  }

  .drp-nav-chevron-left {
    transform: rotate(-135deg);
    margin-left: 2px;
  }

  .drp-nav-chevron-right {
    transform: rotate(45deg);
    margin-right: 2px;
  }

  .drp-months-row {
    display: flex;
    gap: var(--drp-months-gap, 24px);
  }

  /* Embedded calendar: strip outer chrome so only the grid shows */
  :global(.drp-calendar-embedded) {
    --calendar-border: none;
    --calendar-box-shadow: none;
    --calendar-background: transparent;
    --calendar-padding: 0;
    /* Suppress Calendar's own header in dual-month context via CSS var */
    --calendar-header-display: none;
  }

  /* ── Time picker slot ── */
  .drp-time-row {
    display: flex;
    align-items: center;
    gap: var(--drp-time-row-gap, 16px);
    padding-top: var(--drp-time-row-padding-top, 8px);
    border-top: var(--drp-time-divider, 1px solid #e8e8e8);
    flex-wrap: wrap;
  }

  /* ── Compare calendar slot ── */
  .drp-compare-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: var(--drp-compare-padding-top, 12px);
    border-top: var(--drp-compare-divider, 1px solid #e8e8e8);
  }

  /* ── Footer ── */
  .drp-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--drp-footer-gap, 8px);
    padding: var(--drp-footer-padding, 12px 16px);
    border-top: var(--drp-footer-border, 1px solid #e8e8e8);
  }

  /* ── Preset group dividers ── */
  .drp-preset-divider {
    display: flex;
    align-items: center;
    gap: var(--drp-preset-divider-gap, 6px);
    margin: var(--drp-preset-divider-margin, 4px 0);
    padding: 0 var(--drp-preset-padding-left, 12px);
  }

  .drp-preset-divider::before {
    content: '';
    flex: 1;
    height: 0;
    border-top: var(--drp-preset-divider-border, 1px solid #e8e8e8);
  }

  .drp-preset-group-label {
    color: var(--drp-preset-group-label-color, #999999);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .drp-preset-divider:has(.drp-preset-group-label) {
    padding-right: var(--drp-preset-padding-right, 12px);
  }

  .drp-preset-divider:has(.drp-preset-group-label)::before {
    flex: none;
    width: var(--drp-preset-divider-leader-width, 8px);
  }

  .drp-preset-divider:has(.drp-preset-group-label)::after {
    content: '';
    flex: 1;
    height: 0;
    border-top: var(--drp-preset-divider-border, 1px solid #e8e8e8);
  }

  /* Cancel button variant via Button's CSS vars */
  :global(.drp-btn-cancel) {
    --button-color: transparent;
    --button-border: 1px solid var(--drp-cancel-border-color, #d0d0d0);
    --button-text-color: var(--drp-cancel-color, inherit);
    --button-hover-color: var(--drp-cancel-hover-background, #f5f5f5);
  }

  /* Clear button variant (single-mode reset) */
  :global(.drp-btn-clear) {
    --button-color: transparent;
    --button-border: 1px solid var(--drp-clear-border-color, #d0d0d0);
    --button-text-color: var(--drp-clear-color, inherit);
    --button-hover-color: var(--drp-clear-hover-background, #f5f5f5);
    margin-right: auto;
  }

  /* Apply button variant */
  :global(.drp-btn-apply) {
    --button-color: var(--drp-apply-background, currentColor);
    --button-border: none;
    --button-text-color: var(--drp-apply-color, #ffffff);
    --button-hover-color: var(--drp-apply-hover-background, #333333);
    --button-disabled-color: var(--drp-apply-disabled-background, #cccccc);
    --button-disabled-text-color: var(--drp-apply-disabled-color, #888888);
  }
</style>
