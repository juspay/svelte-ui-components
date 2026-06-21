<script lang="ts">
  import type { DateRangePickerProperties, DateRangePreset } from './properties';
  import { tick, untrack } from 'svelte';
  import { SvelteDate } from 'svelte/reactivity';
  import Calendar from '../Calendar/Calendar.svelte';
  import Button from '../Button/Button.svelte';
  import chevronDownSvg from '$lib/assets/chevron-down.svg?raw';
  import checkmarkSvg from '$lib/assets/checkmark.svg?raw';
  import chevronRightSvg from '$lib/assets/chevron-right.svg?raw';
  import {
    TIME_DISPLAY_PATTERN,
    applyTimeDisplay,
    formatTimeDisplay,
    toMinutesOfDay
  } from './timeUtils';

  const clockSvg =
    '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.5V8l2.25 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

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
    presetCheckmark = false,
    showDateInputs = false,
    showTimeSelection = false,
    timeSelectionLayout = 'toggle',
    presetToggle = false,
    placeholder = 'Select date',
    dualMonth,
    timePicker,
    align = 'left',
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
    compareTrigger,
    openCompare = $bindable(false),
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

  // Built-in time-of-day selection (opt-in via showTimeSelection). Display strings
  // are 12-hour ("02:30 PM"); they seed from the draft dates when the picker opens
  // and are combined back onto the committed range in handleApply. showTimeRow drives
  // the collapsible time inputs, toggled by the clock button in the date-input row.
  let startTimeDisplay: string = $state('12:00 AM');
  let endTimeDisplay: string = $state('11:59 PM');
  let showTimeRow: boolean = $state(false);

  // Inline time layout (timeSelectionLayout="inline"): the start/end time inputs
  // render beside their date inputs on the same row, always visible — no clock
  // toggle and no collapsible row. All seeding/validation/fold logic is shared
  // with the default toggle layout (it keys off showTimeSelection, not the layout).
  const isInlineTime: boolean = $derived(
    showTimeSelection && timeSelectionLayout === 'inline' && mode === 'range'
  );

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
  let comparePanelRef: HTMLDivElement | null = $state(null);
  let compareTriggerRef: HTMLDivElement | null = $state(null);
  // Stores the element that opened the compare panel so focus can be restored on close.
  let compareFocusReturnEl: HTMLElement | null = null;

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

  // The preset whose range is currently committed (seeded from initialPresetLabel,
  // updated on every Apply). Unlike activePresetLabel — which is cleared the moment
  // the user interacts so the trigger can fall back to a date range — this survives
  // the open/apply cycle so re-opening the picker re-highlights the committed preset
  // by label instead of date-matching (which lights up every same-day preset at once).
  let committedPresetLabel: string | null = $state(resolvedInitialPresetLabel);

  // Seed draft from initialPresetLabel whenever presets become available so
  // the calendar shows the preset's date selection when the picker is first
  // opened — even if presets arrive asynchronously after initial render.
  // The draftStart/draftEnd/draftValue guards prevent re-seeding once the
  // user has made a custom selection.
  $effect.pre(() => {
    if (
      resolvedInitialPresetLabel !== null &&
      presets !== null &&
      draftStart === null &&
      draftEnd === null &&
      draftValue === null
    ) {
      const matchedPreset = presets.find((p) => p.label === resolvedInitialPresetLabel) ?? null;
      if (matchedPreset !== null) {
        const { start, end } = matchedPreset.getValue();
        if (mode === 'single') {
          draftValue = start;
        } else {
          draftStart = start;
          draftEnd = end;
        }
      }
    }
  });

  const now = new SvelteDate();

  // Dual-month navigation: track the year+month of the left calendar
  let leftYear: number = $state(now.getFullYear());
  let leftMonth: number = $state(now.getMonth());

  // A key counter — incrementing forces Calendar to re-mount with new initialMonth
  let calendarKey: number = $state(0);

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

  // Read-only date-input box contents (opt-in via showDateInputs), reflecting the draft.
  const draftStartDateLabel: string = $derived(draftStart !== null ? formatDate(draftStart) : '');
  const draftEndDateLabel: string = $derived(draftEnd !== null ? formatDate(draftEnd) : '');

  const isStartTimeValid: boolean = $derived(TIME_DISPLAY_PATTERN.test(startTimeDisplay.trim()));
  const isEndTimeValid: boolean = $derived(TIME_DISPLAY_PATTERN.test(endTimeDisplay.trim()));
  // Apply is blocked while a time is malformed, or while both ends fall on the same
  // calendar day and the start time is after the end time. Different days are fine.
  const isTimeRangeValid: boolean = $derived.by(() => {
    if (!showTimeSelection) {
      return true;
    }
    if (!isStartTimeValid || !isEndTimeValid) {
      return false;
    }
    if (draftStart === null || draftEnd === null || !isSameDay(draftStart, draftEnd)) {
      return true;
    }
    const startMinutes = toMinutesOfDay(startTimeDisplay);
    const endMinutes = toMinutesOfDay(endTimeDisplay);
    return startMinutes === null || endMinutes === null || startMinutes <= endMinutes;
  });

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

  const compareTriggerLabel: string = $derived.by(() => {
    if (compareStart !== null && compareEnd !== null) {
      return `${formatDate(compareStart)} – ${formatDate(compareEnd)}`;
    }
    return placeholder;
  });

  function openPicker(): void {
    // Seed draft from current committed values
    draftStart = rangeStart;
    draftEnd = rangeEnd;
    draftValue = value;
    draftCompareStart = compareStart;
    draftCompareEnd = compareEnd;

    // Re-seed the session from the committed preset so the sidebar re-highlights it
    // by label. A direct calendar click later clears this, reverting to date matching.
    selectedPresetLabel = committedPresetLabel;

    // Seed the time inputs from the committed range's time-of-day, and collapse the
    // time row so each open starts from the date view.
    if (showTimeSelection) {
      startTimeDisplay = draftStart !== null ? formatTimeDisplay(draftStart) : '12:00 AM';
      endTimeDisplay = draftEnd !== null ? formatTimeDisplay(draftEnd) : '11:59 PM';
      showTimeRow = false;
    }

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

  // The trigger toggles: clicking it while the panel is already open dismisses
  // the picker instead of re-opening it onto itself. The open-only handler left
  // a second click feeling dead — the panel could only be closed by clicking away.
  function togglePicker(): void {
    if (isOpen) {
      closePicker();
    } else {
      openPicker();
    }
  }

  function openComparePicker(): void {
    compareFocusReturnEl =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    draftCompareStart = compareStart ?? null;
    draftCompareEnd = compareEnd ?? null;
    openCompare = true;
    tick().then(() => {
      const firstFocusable = comparePanelRef?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    });
  }

  function closeComparePicker(): void {
    openCompare = false;
    const returnEl = compareFocusReturnEl;
    compareFocusReturnEl = null;
    tick().then(() => {
      returnEl?.focus();
    });
  }

  function handleApplyCompare(): void {
    if (draftCompareStart !== null && draftCompareEnd !== null) {
      compareStart = draftCompareStart;
      compareEnd = draftCompareEnd;
      onapplycompare?.({
        compareStart: draftCompareStart,
        compareEnd: draftCompareEnd,
        presetLabel: selectedPresetLabel
      });
    }
    closeComparePicker();
  }

  function handleCancelCompare(): void {
    closeComparePicker();
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
        // Fold the time-of-day inputs onto the committed dates when time selection is on.
        const appliedStart = showTimeSelection
          ? (applyTimeDisplay(draftStart, startTimeDisplay) ?? draftStart)
          : draftStart;
        const appliedEnd = showTimeSelection
          ? (applyTimeDisplay(draftEnd, endTimeDisplay) ?? draftEnd)
          : draftEnd;
        rangeStart = appliedStart;
        rangeEnd = appliedEnd;
        committedPresetLabel = selectedPresetLabel;
        onapply?.({
          rangeStart: appliedStart,
          rangeEnd: appliedEnd,
          presetLabel: selectedPresetLabel
        });
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
        committedPresetLabel = selectedPresetLabel;
        onapplysingle?.({ date: draftValue, presetLabel: selectedPresetLabel });
      }
    }
    closePicker();
  }

  function handleClear(): void {
    value = null;
    draftValue = null;
    committedPresetLabel = null;
    onclear?.();
    closePicker();
  }

  function handleCancel(): void {
    oncancel?.();
    closePicker();
  }

  function handlePreset(preset: DateRangePreset): void {
    // presetToggle: clicking the already-selected preset deselects it and reverts the
    // draft to the committed selection (mirrors openPicker). Lets a toggle-style preset
    // such as "No Comparison" be switched back off without having to pick a calendar
    // date, instead of being a one-way radio choice.
    if (presetToggle && selectedPresetLabel === preset.label) {
      draftStart = rangeStart;
      draftEnd = rangeEnd;
      draftValue = value;
      selectedPresetLabel = committedPresetLabel;
      const anchor = rangeStart !== null ? rangeStart : value !== null ? value : now;
      leftYear = anchor.getFullYear();
      leftMonth = anchor.getMonth();
      calendarKey++;
      return;
    }
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
    if (!isOpen && !openCompare) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    const clickedInsidePanel = panelRef !== null && panelRef.contains(target);
    const clickedTrigger = triggerRef !== null && triggerRef.contains(target);
    const clickedInsideComparePanel = comparePanelRef !== null && comparePanelRef.contains(target);
    const clickedCompareTrigger = compareTriggerRef !== null && compareTriggerRef.contains(target);
    if (
      isOpen &&
      !clickedInsidePanel &&
      !clickedTrigger &&
      !clickedInsideComparePanel &&
      !clickedCompareTrigger
    ) {
      closePicker();
    }
    if (
      openCompare &&
      !clickedInsideComparePanel &&
      !clickedCompareTrigger &&
      !clickedInsidePanel &&
      !clickedTrigger
    ) {
      closeComparePicker();
    }
  }

  function handleDocumentKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (openCompare) {
        handleCancelCompare();
      } else if (isOpen) {
        handleCancel();
      }
    }
  }

  const canApply: boolean = $derived.by(() => {
    if (mode === 'range') {
      return draftStart !== null && draftEnd !== null && isTimeRangeValid;
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
    // A preset was explicitly chosen this session — match it by label, not by date.
    // Several presets can share a calendar day (e.g. "Today", "Last 30 minutes" and
    // "Last 12 hours" all start today), so same-day matching would light up all of
    // them at once. selectedPresetLabel is cleared on a direct calendar click, so the
    // date-based fallbacks below still drive highlighting for manual selections.
    if (selectedPresetLabel !== null) {
      return preset.label === selectedPresetLabel;
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
      onclick={togglePicker}
      ariaLabel={isOpen ? 'Close date picker' : 'Open date picker'}
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

  <!-- Compare trigger wrapper (standalone): position:relative so the compare panel
       anchors below this trigger rather than the drp-root corner. -->
  {#if typeof compareTrigger === 'function'}
    <div bind:this={compareTriggerRef} class="drp-compare-trigger-wrapper">
      <Button
        onclick={openComparePicker}
        ariaLabel="Open compare period picker"
        classes="drp-compare-trigger {openCompare ? 'drp-compare-trigger-open' : ''}"
      >
        {@render compareTrigger(compareTriggerLabel)}
      </Button>

      <!-- Compare period picker panel (standalone): nested here so position:absolute
           resolves against .drp-compare-trigger-wrapper, not .drp-root. -->
      {#if openCompare}
        <div
          bind:this={comparePanelRef}
          class="drp-compare-panel"
          role="dialog"
          aria-label="Compare period picker"
          aria-modal="true"
          tabindex="-1"
          onkeydown={(event) => {
            if (event.key === 'Tab') {
              const focusable = comparePanelRef?.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
              );
              if (!focusable || focusable.length === 0) {
                return;
              }
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              if (event.shiftKey) {
                if (document.activeElement === first) {
                  event.preventDefault();
                  last.focus();
                }
              } else {
                if (document.activeElement === last) {
                  event.preventDefault();
                  first.focus();
                }
              }
            }
          }}
        >
          {#if typeof compareCalendar === 'function'}
            <div class="drp-compare-panel-body">
              {@render compareCalendar()}
            </div>
          {/if}
          <div class="drp-footer">
            <Button
              onclick={handleCancelCompare}
              ariaLabel="Cancel compare selection"
              classes="drp-btn-cancel">Cancel</Button
            >
            <Button
              onclick={handleApplyCompare}
              ariaLabel="Apply compare selection"
              classes="drp-btn-apply"
              disabled={draftCompareStart === null || draftCompareEnd === null}>Apply</Button
            >
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Dropdown panel -->
  {#if isOpen}
    <div
      bind:this={panelRef}
      class="drp-panel"
      class:drp-panel-align-left={align === 'left'}
      class:drp-panel-align-right={align === 'right'}
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
                presetIndex > 0 && (previousPreset?.group ?? '') !== (preset.group ?? '')}
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
                class:drp-preset-checkable={presetCheckmark}
                role="option"
                aria-selected={isPresetActive(preset)}
                onclick={() => handlePreset(preset)}
              >
                {preset.label}
                {#if presetCheckmark && isPresetActive(preset)}
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  <span class="drp-preset-check" aria-hidden="true">{@html checkmarkSvg}</span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}

        <!-- Calendar area -->
        <div class="drp-calendars">
          {#if (showDateInputs || showTimeSelection) && mode === 'range'}
            <div class="drp-datetime-header" class:drp-datetime-header-inline={isInlineTime}>
              <div class="drp-date-input-row">
                {#if isInlineTime}
                  <div class="drp-date-time-group">
                    <div class="drp-date-input" data-pw={testId ? `${testId}-start-date` : null}>
                      <span class="drp-date-input-value">{draftStartDateLabel || 'Start date'}</span
                      >
                    </div>
                    <div
                      class="drp-time-input drp-time-input-inline"
                      class:drp-time-input-invalid={!isStartTimeValid}
                    >
                      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                      <span class="drp-time-input-icon" aria-hidden="true">{@html clockSvg}</span>
                      <input
                        type="text"
                        class="drp-time-field"
                        bind:value={startTimeDisplay}
                        maxlength="8"
                        placeholder="12:00 AM"
                        aria-label="Start time"
                        aria-invalid={!isStartTimeValid}
                        data-pw={testId ? `${testId}-start-time` : null}
                      />
                    </div>
                  </div>
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  <span class="drp-datetime-arrow" aria-hidden="true">{@html chevronRightSvg}</span>
                  <div class="drp-date-time-group">
                    <div class="drp-date-input" data-pw={testId ? `${testId}-end-date` : null}>
                      <span class="drp-date-input-value">{draftEndDateLabel || 'End date'}</span>
                    </div>
                    <div
                      class="drp-time-input drp-time-input-inline"
                      class:drp-time-input-invalid={!isEndTimeValid}
                    >
                      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                      <span class="drp-time-input-icon" aria-hidden="true">{@html clockSvg}</span>
                      <input
                        type="text"
                        class="drp-time-field"
                        bind:value={endTimeDisplay}
                        maxlength="8"
                        placeholder="11:59 PM"
                        aria-label="End time"
                        aria-invalid={!isEndTimeValid}
                        data-pw={testId ? `${testId}-end-time` : null}
                      />
                    </div>
                  </div>
                {:else}
                  <div class="drp-date-input" data-pw={testId ? `${testId}-start-date` : null}>
                    <span class="drp-date-input-value">{draftStartDateLabel || 'Start date'}</span>
                  </div>
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  <span class="drp-datetime-arrow" aria-hidden="true">{@html chevronRightSvg}</span>
                  <div class="drp-date-input" data-pw={testId ? `${testId}-end-date` : null}>
                    <span class="drp-date-input-value">{draftEndDateLabel || 'End date'}</span>
                  </div>
                  {#if showTimeSelection}
                    <button
                      type="button"
                      class="drp-time-toggle"
                      class:drp-time-toggle-active={showTimeRow}
                      aria-label="Toggle time selection"
                      aria-pressed={showTimeRow}
                      data-pw={testId ? `${testId}-time-toggle` : null}
                      onclick={() => (showTimeRow = !showTimeRow)}
                    >
                      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                      <span class="drp-time-toggle-icon" aria-hidden="true">{@html clockSvg}</span>
                    </button>
                  {/if}
                {/if}
              </div>
              {#if showTimeSelection && !isInlineTime && showTimeRow}
                <div class="drp-time-input-row">
                  <div class="drp-time-input" class:drp-time-input-invalid={!isStartTimeValid}>
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    <span class="drp-time-input-icon" aria-hidden="true">{@html clockSvg}</span>
                    <input
                      type="text"
                      class="drp-time-field"
                      bind:value={startTimeDisplay}
                      maxlength="8"
                      placeholder="12:00 AM"
                      aria-label="Start time"
                      aria-invalid={!isStartTimeValid}
                      data-pw={testId ? `${testId}-start-time` : null}
                    />
                  </div>
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  <span class="drp-datetime-arrow" aria-hidden="true">{@html chevronRightSvg}</span>
                  <div class="drp-time-input" class:drp-time-input-invalid={!isEndTimeValid}>
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    <span class="drp-time-input-icon" aria-hidden="true">{@html clockSvg}</span>
                    <input
                      type="text"
                      class="drp-time-field"
                      bind:value={endTimeDisplay}
                      maxlength="8"
                      placeholder="11:59 PM"
                      aria-label="End time"
                      aria-invalid={!isEndTimeValid}
                      data-pw={testId ? `${testId}-end-time` : null}
                    />
                  </div>
                </div>
              {/if}
            </div>
          {/if}
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

          <!-- Compare calendar slot: only rendered here when there is no standalone
               compareTrigger. When compareTrigger is provided the consumer uses the
               separate compare panel; rendering the same Snippet in two places at once
               causes a Svelte 5 runtime error. -->
          {#if typeof compareCalendar === 'function' && typeof compareTrigger !== 'function'}
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
    --button-hover-border: var(
      --drp-trigger-hover-border,
      var(--drp-trigger-border, 1px solid currentColor)
    );
  }

  :global(.drp-trigger-wrapper .drp-trigger) {
    display: inline-flex;
    align-items: center;
    gap: var(--drp-trigger-gap, 8px);
    white-space: nowrap;
    min-width: var(--drp-trigger-min-width, 200px);
  }

  :global(.drp-trigger-wrapper .drp-trigger-open) {
    border-color: var(--drp-trigger-open-border-color, #000000);
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

  .drp-panel-align-left {
    left: 0;
    right: auto;
  }

  .drp-panel-align-right {
    right: 0;
    left: auto;
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

  /* Opt-in checkmark layout: reserve a trailing slot so the active preset's tick
     sits flush-right while the label stays left. A preset with no tick (or a
     label-only preset) keeps its single flex child at the start, unchanged. */
  .drp-preset-checkable {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--drp-preset-check-gap, 8px);
  }

  .drp-preset-check {
    display: inline-flex;
    flex-shrink: 0;
    width: var(--drp-preset-check-size, 16px);
    height: var(--drp-preset-check-size, 16px);
    color: var(--drp-preset-check-color, inherit);
  }

  .drp-preset-check :global(svg) {
    width: 100%;
    height: 100%;
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

  /* ── Built-in date + time inputs (showDateInputs / showTimeSelection) ── */
  .drp-datetime-header {
    display: flex;
    flex-direction: column;
    gap: var(--drp-datetime-gap, 8px);
    padding-bottom: var(--drp-datetime-padding-bottom, 12px);
    margin-bottom: var(--drp-datetime-margin-bottom, 4px);
    border-bottom: var(--drp-datetime-divider, 1px solid #e8e8e8);
  }

  .drp-date-input-row,
  .drp-time-input-row {
    display: flex;
    align-items: center;
    gap: var(--drp-datetime-row-gap, 12px);
  }

  .drp-date-input {
    flex: 1;
    min-width: 0;
    padding: var(--drp-date-input-padding, 10px 14px);
    border: var(--drp-date-input-border, 1px solid #d4d4d4);
    border-radius: var(--drp-date-input-radius, 8px);
    background: var(--drp-date-input-background, #ffffff);
  }

  .drp-date-input-value {
    display: block;
    color: var(--drp-date-input-color, #333333);
    font-size: var(--drp-date-input-font-size, 13px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .drp-datetime-arrow {
    flex-shrink: 0;
    display: inline-flex;
    width: var(--drp-datetime-arrow-size, 16px);
    height: var(--drp-datetime-arrow-size, 16px);
    color: var(--drp-datetime-arrow-color, #888888);
  }

  .drp-datetime-arrow :global(svg) {
    width: 100%;
    height: 100%;
  }

  .drp-time-toggle {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--drp-time-toggle-size, 40px);
    height: var(--drp-time-toggle-size, 40px);
    padding: 0;
    border: var(--drp-time-toggle-border, 1px solid #d4d4d4);
    border-radius: var(--drp-time-toggle-radius, 8px);
    background: var(--drp-time-toggle-background, #f6f7f9);
    color: var(--drp-time-toggle-color, #555555);
    cursor: pointer;
  }

  .drp-time-toggle-active {
    border-color: var(--drp-time-toggle-active-border, currentColor);
    color: var(--drp-time-toggle-active-color, #1b85ff);
  }

  .drp-time-toggle-icon {
    display: inline-flex;
    width: var(--drp-time-toggle-icon-size, 16px);
    height: var(--drp-time-toggle-icon-size, 16px);
  }

  .drp-time-toggle-icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  .drp-time-input {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    border: var(--drp-time-input-border, 1px solid #d4d4d4);
    border-radius: var(--drp-time-input-radius, 8px);
    background: var(--drp-time-input-background, #ffffff);
  }

  .drp-time-input-invalid {
    border-color: var(--drp-time-input-invalid-border, #e5484d);
  }

  .drp-time-input-icon {
    display: inline-flex;
    flex-shrink: 0;
    width: var(--drp-time-input-icon-size, 16px);
    height: var(--drp-time-input-icon-size, 16px);
    margin-left: var(--drp-time-input-icon-gap, 12px);
    color: var(--drp-time-input-icon-color, #888888);
    pointer-events: none;
  }

  .drp-time-input-icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  .drp-time-field {
    flex: 1;
    min-width: 0;
    width: 100%;
    padding: var(--drp-time-field-padding, 10px 14px 10px 8px);
    border: none;
    outline: none;
    background: transparent;
    color: var(--drp-time-field-color, #333333);
    font-size: var(--drp-time-field-font-size, 13px);
    font-family: inherit;
  }

  .drp-time-field::placeholder {
    color: var(--drp-time-field-placeholder-color, #aaaaaa);
  }

  /* ── Inline time layout (timeSelectionLayout="inline") ── */
  /* Each date input is paired with its time input on the same row: the date box
     flexes to fill, the time input takes a fixed compact width beside it. */
  .drp-date-time-group {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    gap: var(--drp-datetime-inline-gap, 8px);
  }

  .drp-date-time-group .drp-date-input {
    flex: 1;
  }

  .drp-time-input.drp-time-input-inline {
    flex: 0 0 var(--drp-time-inline-width, 116px);
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
    --disabled-background-color: var(--drp-apply-disabled-background, #cccccc);
    --disabled-text-color: var(--drp-apply-disabled-color, #888888);
  }

  /* ── Compare standalone trigger ── */
  .drp-compare-trigger-wrapper {
    display: inline-block;
    position: relative;
    --button-color: var(--drp-compare-trigger-background, inherit);
    --button-border: var(--drp-compare-trigger-border, 1px solid currentColor);
    --button-border-radius: var(--drp-compare-trigger-border-radius, 6px);
    --button-text-color: var(--drp-compare-trigger-color, inherit);
    --button-padding: var(--drp-compare-trigger-padding, 8px 12px);
    --button-min-width: var(--drp-compare-trigger-min-width, 160px);
  }

  :global(.drp-compare-trigger-open) {
    border-color: var(--drp-trigger-open-border-color, #000000);
    box-shadow: var(--drp-trigger-open-shadow, 0 0 0 2px rgba(0, 0, 0, 0.1));
  }

  /* ── Compare standalone panel ── */
  .drp-compare-panel {
    position: absolute;
    top: calc(100% + var(--drp-panel-offset, 6px));
    left: var(--drp-compare-panel-left, 0);
    z-index: var(--drp-panel-z-index, 1000);
    background: var(--drp-panel-background, inherit);
    border: var(--drp-panel-border, 1px solid #e0e0e0);
    border-radius: var(--drp-panel-border-radius, 10px);
    box-shadow: var(--drp-panel-shadow, 0 8px 24px rgba(0, 0, 0, 0.12));
    display: flex;
    flex-direction: column;
    min-width: var(--drp-compare-panel-min-width, 280px);
    overflow: hidden;
  }

  .drp-compare-panel-body {
    padding: var(--drp-calendars-padding, 16px);
  }
</style>
