<script lang="ts">
  import { SvelteDate } from 'svelte/reactivity';
  import DateRangePicker from '$lib/DateRangePicker/DateRangePicker.svelte';
  import Calendar from '$lib/Calendar/Calendar.svelte';
  import type { DateRangePreset } from '$lib/DateRangePicker/properties';

  // --- Range mode state ---
  let rangeStart = $state<Date | null>(null);
  let rangeEnd = $state<Date | null>(null);
  let lastAppliedPreset = $state<string | null>(null);

  // --- Single mode state ---
  let singleDate = $state<Date | null>(null);

  // --- Time picker state (consumer-owned) ---
  let startHour = $state(0);
  let startMinute = $state(0);
  let endHour = $state(23);
  let endMinute = $state(59);

  // --- Compare mode state ---
  let compareStart = $state<Date | null>(null);
  let compareEnd = $state<Date | null>(null);
  let draftCompareStart = $state<Date | null>(null);
  let draftCompareEnd = $state<Date | null>(null);

  function pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  function clampHour(raw: string): number {
    const n = parseInt(raw, 10);
    if (isNaN(n)) {
      return 0;
    }
    return Math.min(23, Math.max(0, n));
  }

  function clampMinute(raw: string): number {
    const n = parseInt(raw, 10);
    if (isNaN(n)) {
      return 0;
    }
    return Math.min(59, Math.max(0, n));
  }

  function formatDate(d: Date | null): string {
    if (d === null) {
      return 'None';
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const rangeLabel: string = $derived.by(() => {
    if (rangeStart !== null && rangeEnd !== null) {
      return `${formatDate(rangeStart)} – ${formatDate(rangeEnd)}`;
    }
    return 'None selected';
  });

  const compareLabel: string = $derived.by(() => {
    if (compareStart !== null && compareEnd !== null) {
      return `${formatDate(compareStart)} – ${formatDate(compareEnd)}`;
    }
    return 'None selected';
  });

  const timeLabel: string = $derived(
    `${pad(startHour)}:${pad(startMinute)} – ${pad(endHour)}:${pad(endMinute)}`
  );

  // Standard preset definitions matching Lighthouse usage
  const commonPresets: DateRangePreset[] = [
    {
      label: 'Today',
      getValue: () => {
        const today = new SvelteDate();
        today.setHours(0, 0, 0, 0);
        const end = new SvelteDate(today);
        end.setHours(23, 59, 59, 999);
        return { start: today, end };
      }
    },
    {
      label: 'Yesterday',
      getValue: () => {
        const yesterday = new SvelteDate();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const end = new SvelteDate(yesterday);
        end.setHours(23, 59, 59, 999);
        return { start: yesterday, end };
      }
    },
    {
      label: 'Last 7 days',
      getValue: () => {
        const end = new SvelteDate();
        end.setHours(23, 59, 59, 999);
        const start = new SvelteDate();
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return { start, end };
      }
    },
    {
      label: 'Last 30 days',
      getValue: () => {
        const end = new SvelteDate();
        end.setHours(23, 59, 59, 999);
        const start = new SvelteDate();
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        return { start, end };
      }
    },
    {
      label: 'Last 90 days',
      getValue: () => {
        const end = new SvelteDate();
        end.setHours(23, 59, 59, 999);
        const start = new SvelteDate();
        start.setDate(start.getDate() - 89);
        start.setHours(0, 0, 0, 0);
        return { start, end };
      }
    },
    {
      label: 'This month',
      getValue: () => {
        const now = new SvelteDate();
        const start = new SvelteDate(now.getFullYear(), now.getMonth(), 1);
        const end = new SvelteDate(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
    },
    {
      label: 'Last month',
      getValue: () => {
        const now = new SvelteDate();
        const start = new SvelteDate(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new SvelteDate(now.getFullYear(), now.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
    }
  ];

  const today = new SvelteDate();
  const maxDate = new SvelteDate(today.getFullYear(), today.getMonth(), today.getDate());
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>DateRangePicker</h1>
  <p class="page-description">
    Compound picker built on top of Calendar. Provides a trigger button, preset sidebar, dual-month
    layout, snippet-based time picker and compare-range slots, and an apply/cancel footer. Time
    picker and compare-range are fully consumer-controlled via <code>timePicker</code> and
    <code>compareCalendar</code> snippets.
  </p>
</div>

<!-- ── 1. Range with sidebar and dual-month ── -->
<section class="demo-section">
  <h2>Range mode — dual-month + presets sidebar</h2>
  <div class="demo-row">
    <DateRangePicker
      mode="range"
      bind:rangeStart
      bind:rangeEnd
      presets={commonPresets}
      {maxDate}
      placeholder="Pick a date range"
      testId="drp-range-demo"
      onapply={(e) => {
        rangeStart = e.rangeStart;
        rangeEnd = e.rangeEnd;
        lastAppliedPreset = e.presetLabel;
      }}
    />
  </div>
  <p class="result-label">Applied range: <strong>{rangeLabel}</strong></p>
  <p class="result-label">Preset: <strong>{lastAppliedPreset ?? 'custom'}</strong></p>
</section>

<!-- ── 2. Single-month range (dualMonth=false) ── -->
<section class="demo-section">
  <h2>Range mode — single-month (dualMonth=false)</h2>
  <div class="demo-row">
    <DateRangePicker
      mode="range"
      dualMonth={false}
      placeholder="Pick a range"
      testId="drp-single-month-demo"
    />
  </div>
</section>

<!-- ── 3. Single-date mode ── -->
<section class="demo-section">
  <h2>Single-date mode</h2>
  <div class="demo-row">
    <DateRangePicker
      mode="single"
      bind:value={singleDate}
      placeholder="Pick a date"
      testId="drp-single-demo"
      onapplysingle={(e) => {
        singleDate = e.date;
      }}
    />
  </div>
  <p class="result-label">Selected: <strong>{formatDate(singleDate)}</strong></p>
</section>

<!-- ── 4. Range + time picker (consumer snippet) ── -->
<section class="demo-section">
  <h2>Range mode + time picker (timePicker snippet)</h2>
  <p class="section-note">
    Consumer owns all time UI inside the <code>timePicker</code> snippet.
  </p>
  <div class="demo-row">
    <DateRangePicker mode="range" placeholder="Pick range with time" testId="drp-time-demo">
      {#snippet timePicker()}
        <div class="time-group">
          <span class="time-label">Start</span>
          <div class="time-inputs">
            <input
              type="number"
              class="time-input"
              min="0"
              max="23"
              value={pad(startHour)}
              aria-label="Start hour"
              oninput={(e) => {
                if (e.currentTarget instanceof HTMLInputElement) {
                  startHour = clampHour(e.currentTarget.value);
                }
              }}
            />
            <span aria-hidden="true">:</span>
            <input
              type="number"
              class="time-input"
              min="0"
              max="59"
              value={pad(startMinute)}
              aria-label="Start minute"
              oninput={(e) => {
                if (e.currentTarget instanceof HTMLInputElement) {
                  startMinute = clampMinute(e.currentTarget.value);
                }
              }}
            />
          </div>
        </div>
        <span aria-hidden="true">–</span>
        <div class="time-group">
          <span class="time-label">End</span>
          <div class="time-inputs">
            <input
              type="number"
              class="time-input"
              min="0"
              max="23"
              value={pad(endHour)}
              aria-label="End hour"
              oninput={(e) => {
                if (e.currentTarget instanceof HTMLInputElement) {
                  endHour = clampHour(e.currentTarget.value);
                }
              }}
            />
            <span aria-hidden="true">:</span>
            <input
              type="number"
              class="time-input"
              min="0"
              max="59"
              value={pad(endMinute)}
              aria-label="End minute"
              oninput={(e) => {
                if (e.currentTarget instanceof HTMLInputElement) {
                  endMinute = clampMinute(e.currentTarget.value);
                }
              }}
            />
          </div>
        </div>
      {/snippet}
    </DateRangePicker>
  </div>
  <p class="result-label">Time range: <strong>{timeLabel}</strong></p>
</section>

<!-- ── 5. Compare mode (consumer snippet) ── -->
<section class="demo-section">
  <h2>Range mode + compare period (compareCalendar snippet)</h2>
  <p class="section-note">
    Consumer owns all compare UI inside the <code>compareCalendar</code> snippet.
  </p>
  <div class="demo-row">
    <DateRangePicker
      mode="range"
      bind:compareStart
      bind:compareEnd
      placeholder="Pick main + compare range"
      testId="drp-compare-demo"
      onapplycompare={(e) => {
        compareStart = e.compareStart;
        compareEnd = e.compareEnd;
      }}
    >
      {#snippet compareCalendar()}
        <span class="compare-title">Compare period</span>
        <Calendar
          mode="range"
          bind:rangeStart={draftCompareStart}
          bind:rangeEnd={draftCompareEnd}
          classes="drp-calendar-embedded drp-compare-calendar"
        />
      {/snippet}
    </DateRangePicker>
  </div>
  <p class="result-label">Compare range: <strong>{compareLabel}</strong></p>
</section>

<!-- ── 6. Constrained max date ── -->
<section class="demo-section">
  <h2>Constrained range (max = today, no future dates)</h2>
  <div class="demo-row">
    <DateRangePicker
      mode="range"
      {maxDate}
      presets={commonPresets}
      placeholder="Historical range only"
      testId="drp-constrained-demo"
    />
  </div>
</section>

<style>
  .page-description {
    color: #666;
    max-width: 700px;
    margin-top: 8px;
  }

  .demo-section {
    margin-bottom: 48px;
  }

  .demo-section h2 {
    margin-bottom: 8px;
  }

  .section-note {
    color: #666;
    margin-bottom: 16px;
  }

  .demo-row {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
  }

  .result-label {
    margin-top: 12px;
    color: #555;
  }

  /* Consumer time-picker recipe styles */
  .time-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .time-label {
    color: #888;
  }

  .time-inputs {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .time-input {
    width: 48px;
    padding: 4px 6px;
    border: 1px solid #ccc;
    border-radius: 4px;
    text-align: center;
    font-family: inherit;
    appearance: textfield;
    -moz-appearance: textfield;
  }

  .time-input::-webkit-inner-spin-button,
  .time-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .compare-title {
    color: #888;
    margin-bottom: 4px;
  }
</style>
