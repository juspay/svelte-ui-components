# DateRangePicker

A compound date-range picker built on top of Calendar. Provides a trigger button shell, an optional preset sidebar, dual-month or single-month calendar display, snippet-based time-picker and compare-range slots, and an apply/cancel footer with draft-state isolation. Supports range and single-date modes, min/max constraints, disabled dates, locale-aware formatting, and full CSS theming via custom properties. Opt-in features include a Clear button for single mode (`clearable`), an initial active-preset display seed (`initialPresetLabel`), grouped preset sidebars with dividers via the `group` field on `DateRangePreset`, and a standalone compare-period trigger via the `compareTrigger` snippet + `openCompare` bindable prop.

## Usage

```svelte
<script>
  import { DateRangePicker } from '@juspay/svelte-ui-components';

  let rangeStart = $state(null);
  let rangeEnd = $state(null);
</script>

<DateRangePicker
  mode="range"
  bind:rangeStart
  bind:rangeEnd
  placeholder="Pick a date range"
  onapply={(e) => {
    rangeStart = e.rangeStart;
    rangeEnd = e.rangeEnd;
  }}
/>
```

### With presets sidebar

```svelte
<script>
  import { DateRangePicker } from '@juspay/svelte-ui-components';

  const presets = [
    {
      label: 'Today',
      getValue: () => {
        const d = new Date();
        return { start: d, end: d };
      }
    },
    {
      label: 'Last 7 days',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return { start, end };
      }
    }
  ];
</script>

<DateRangePicker mode="range" {presets} placeholder="Select range" />
```

### With time picker (consumer snippet)

The component does not build time input UI. Pass a `timePicker` snippet to render any time controls you need inside the picker panel. The consumer owns all time state.

```svelte
<script>
  import { DateRangePicker } from '@juspay/svelte-ui-components';

  let startHour = $state(0);
  let startMinute = $state(0);
  let endHour = $state(23);
  let endMinute = $state(59);
</script>

<DateRangePicker mode="range" placeholder="Pick range with time">
  {#snippet timePicker()}
    <input type="number" min="0" max="23" bind:value={startHour} aria-label="Start hour" />
    <span>:</span>
    <input type="number" min="0" max="59" bind:value={startMinute} aria-label="Start minute" />
    <span>–</span>
    <input type="number" min="0" max="23" bind:value={endHour} aria-label="End hour" />
    <span>:</span>
    <input type="number" min="0" max="59" bind:value={endMinute} aria-label="End minute" />
  {/snippet}
</DateRangePicker>
```

### Built-in date inputs + time selection

For a richer panel without owning any time state, opt into `showDateInputs` (typeable start/end date boxes at the top of the calendar) and `showTimeSelection` (a clock toggle revealing start/end time inputs). The entered times are folded onto the committed range on Apply; Apply is blocked while a time is malformed or — when both ends are the same day — the start time is after the end time. Both are range-mode only.

The date boxes are directly editable, matching the time inputs: each seeds from the current draft selection, and typing a new date parses and commits it on blur or Enter. Accepted formats are the component's own display format (`Jul 10, 2026`), numeric `M/D/YYYY`, and ISO `YYYY-MM-DD`. Unparseable text, a date outside `minDate`/`maxDate`, a disabled date, or a start/end that would cross the other boundary is rejected — the field reverts to its last valid value instead of committing garbage, and the field shows an invalid border while the typed text can't yet resolve to a selectable date. A successfully committed typed date updates the calendar grid (renavigating to the typed month if needed) and clears any active preset, exactly like a calendar click.

```svelte
<DateRangePicker
  mode="range"
  {presets}
  showDateInputs
  showTimeSelection
  placeholder="Select range + time"
/>
```

By default the time inputs sit in a collapsible row revealed by a clock toggle. Set `timeSelectionLayout="inline"` to render each time input **beside** its date input on the same row instead — always visible, with no toggle. Validation and the Apply-time fold are identical to the toggle layout. The inline time-input width and the date↔time gap are themeable via `--drp-time-inline-width` and `--drp-datetime-inline-gap`.

```svelte
<DateRangePicker
  mode="range"
  {presets}
  showDateInputs
  showTimeSelection
  timeSelectionLayout="inline"
  placeholder="Select range + time"
/>
```

### With compare calendar (consumer snippet)

Pass a `compareCalendar` snippet to render a comparison period section inside the panel. The consumer controls all compare state and wires `onapplycompare` to commit it.

```svelte
<script>
  import { DateRangePicker, Calendar } from '@juspay/svelte-ui-components';

  let compareStart = $state(null);
  let compareEnd = $state(null);
</script>

<DateRangePicker
  mode="range"
  bind:compareStart
  bind:compareEnd
  onapplycompare={(e) => {
    compareStart = e.compareStart;
    compareEnd = e.compareEnd;
  }}
>
  {#snippet compareCalendar()}
    <span>Compare period</span>
    <Calendar mode="range" bind:rangeStart={compareStart} bind:rangeEnd={compareEnd} />
  {/snippet}
</DateRangePicker>
```

### Standalone compare trigger

Pass a `compareTrigger` snippet to render a separate trigger button for the compare-period panel. The panel opens adjacent to its own trigger (not the main DRP panel). Use `bind:openCompare` to observe or programmatically control the compare panel's open state.

```svelte
<script>
  import { DateRangePicker, Calendar } from '@juspay/svelte-ui-components';

  let compareStart = $state(null);
  let compareEnd = $state(null);
  let isCompareOpen = $state(false);
</script>

<DateRangePicker
  mode="range"
  bind:compareStart
  bind:compareEnd
  bind:openCompare={isCompareOpen}
  onapplycompare={(e) => {
    compareStart = e.compareStart;
    compareEnd = e.compareEnd;
  }}
>
  {#snippet compareTrigger(label)}
    Compare: {label}
  {/snippet}
  {#snippet compareCalendar()}
    <Calendar mode="range" bind:rangeStart={compareStart} bind:rangeEnd={compareEnd} />
  {/snippet}
</DateRangePicker>
```

When `compareTrigger` is provided the `compareCalendar` snippet is rendered inside the standalone compare panel, not inside the main DRP panel. Passing both to the same instance renders the compare calendar in exactly one place (the Svelte 5 runtime would error if the same snippet were rendered in two locations simultaneously).

### Custom trigger

```svelte
<DateRangePicker mode="range">
  {#snippet triggerSnippet(label)}
    <strong>📅 {label}</strong>
  {/snippet}
</DateRangePicker>
```

### Single-mode with Clear button

Pass `clearable` to show a Clear button in the footer whenever a date is committed. Clicking it resets `value` to `null` and fires `onclear`.

```svelte
<script>
  import { DateRangePicker } from '@juspay/svelte-ui-components';

  let selectedDate = $state(null);
</script>

<DateRangePicker
  mode="single"
  clearable
  bind:value={selectedDate}
  onapplysingle={(e) => {
    selectedDate = e.date;
  }}
  onclear={() => {
    selectedDate = null;
  }}
/>
```

### Initial active preset (display + draft seed, no onapply fired)

Use `initialPresetLabel` to seed a preset as active on mount. The trigger shows the preset's label, the sidebar highlights it, and the matching preset's date range is seeded into the draft state — so when the user opens the picker the calendar already shows the preset's date selection. `onapply` is not fired on mount; it only fires when the user explicitly clicks Apply.

```svelte
<script>
  import { DateRangePicker } from '@juspay/svelte-ui-components';

  const presets = [
    {
      label: 'All time',
      getValue: () => {
        const s = new Date(2020, 0, 1);
        return { start: s, end: new Date() };
      }
    },
    {
      label: 'Last 7 days',
      getValue: () => {
        const e = new Date();
        const s = new Date();
        s.setDate(s.getDate() - 6);
        return { start: s, end: e };
      }
    }
  ];
</script>

<DateRangePicker
  mode="range"
  {presets}
  initialPresetLabel="All time"
  placeholder="Select range"
  onapply={(e) => console.log(e.rangeStart, e.rangeEnd)}
/>
```

### Preset groups with dividers

Add a `group` key to any `DateRangePreset`. A thin divider (with an optional group label) is rendered between consecutive presets that have different `group` values. Presets without a `group` field render exactly as before.

```svelte
<script>
  import { DateRangePicker } from '@juspay/svelte-ui-components';

  const makeRange = (daysBack) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (daysBack - 1));
    return { start, end };
  };

  const presets = [
    { label: 'Today', group: 'Days', getValue: () => makeRange(1) },
    { label: 'Yesterday', group: 'Days', getValue: () => makeRange(2) },
    { label: 'Last 7 days', group: 'Weeks', getValue: () => makeRange(7) },
    { label: 'Last 30 days', group: 'Months', getValue: () => makeRange(30) },
    { label: 'Last 90 days', group: 'Months', getValue: () => makeRange(90) }
  ];
</script>

<DateRangePicker mode="range" {presets} placeholder="Select range" />
```

### Presets above the calendars

By default the presets sit in a column beside the calendars. `presetsPosition="top"` lays them out as a wrapping row above the calendars instead, which suits a picker that has to live in a narrow container. The panel stays anchored to the trigger. Group dividers and group labels are hidden while the presets are on top.

```svelte
<DateRangePicker mode="range" {presets} presetsPosition="top" dualMonth={false} />
```

### Responsive layout

The panel is an absolutely positioned dropdown that can be up to `--drp-panel-max-width` wide, so on a phone it can run off the edge of the viewport and take Apply with it. Set `responsiveLayout` to make the picker follow the window:

```svelte
<DateRangePicker mode="range" {presets} showDateInputs responsiveLayout />
```

| Viewport             | What changes                                                                                                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1023px and below     | Range mode only. The panel becomes a fixed sheet confined to the viewport, inset by the `--drp-sheet-*` tokens, and the presets move above the calendars. Two months stay side by side while `dualMonth` is on. |
| 688px and below      | Both modes. A single-mode picker becomes the same sheet here. The calendar area shows one month (even with `dualMonth`), the date and time inputs stack, and the arrow between them is hidden.                  |
| Wider than the above | Nothing. The panel is the dropdown it always was.                                                                                                                                                               |

The breakpoints are fixed at `1023px` and `688px`, not themable custom properties: a media query cannot read a custom property, and the same two queries decide the layout classes and the number of months, so there is one place that says where the layout flips. The panel follows the window while it is open. Resizing keeps the draft selection, and Apply, Cancel and Escape behave as before. If a resize removes the element that has focus, such as a day in the second month when two months collapse to one, focus moves to the first control in the panel instead of being lost. Focus that is outside the panel, or on a control the resize keeps, is left where it is.

The prop itself changes nothing unless it is set: a picker without `responsiveLayout` never reads the window's media queries and keeps the dropdown layout at every width. Separate from the prop, three behaviours are always on and are described under [Behaviour for every picker](#behaviour-for-every-picker).

The sheet is a `position: fixed` element, and it is only confined to the viewport while no ancestor takes over as its containing block. These ancestor styles do: `transform`, `perspective`, `filter`, `backdrop-filter`, `will-change` naming any of those, `content-visibility: auto`, and any `contain` value that includes layout or paint (`layout`, `paint`, `content` and `strict`). Inside one, the sheet is positioned against that ancestor's box instead of the viewport, so it can be displaced and part of it, Apply included, can end up outside the viewport. `overflow: hidden`, `isolation` and `container-type` do not have this effect. This list was measured in Chromium. Check a picker that lives inside a modal, a drawer or an animated container, and give such a host a layout that does not set one of these styles on the picker's ancestors. The standalone compare panel (`compareTrigger`) is not turned into a sheet.

The sheet is driven by the viewport width alone, not by the room around the trigger. A page with a sidebar puts the trigger away from the left edge, so just above `1023px` the dropdown can still run past the right edge. Pick `align` for the side the trigger is nearer to, or lower `--drp-panel-max-width`, if that range matters for your layout.

The insets are tokens because the free area differs per host: a fixed sidebar, an embedding shell and safe-area insets all change it. The defaults suit a bare page.

```css
.my-picker {
  --drp-sheet-left: calc(env(safe-area-inset-left, 0px) + 1rem);
  --drp-sheet-right: calc(env(safe-area-inset-right, 0px) + 1rem);
  --drp-sheet-bottom: calc(env(safe-area-inset-bottom, 0px) + 1rem);
  --drp-sheet-z-index: 9999;
}
```

The layout adds `drp-panel-sheet`, `drp-panel-narrow` and `drp-panel-presets-top` to `.drp-panel`. The `.drp-panel` and `.drp-compare-panel` class names are unchanged.

### Behaviour for every picker

These apply whether or not `responsiveLayout` is set.

- **Open panel under a `pointer-events: none` ancestor.** The open panel and the standalone compare panel set `pointer-events: auto`, as Modal's content does. A host that disables pointer events on an ancestor, for example while a sidebar is open, would otherwise make a panel opened from the keyboard impossible to click. Anything inside a panel that used to inherit `none` from such an ancestor is now clickable.
- **The single-month calendar opens on the selection.** With `dualMonth={false}` in range mode, and in every `mode="single"` picker, the calendar opens on the month of the committed `rangeStart`, or of `value` when there is no range, instead of the current month, and the picker follows the calendar's own previous and next buttons. A single-date picker whose value is not in the current month therefore opens on that value's month.
- **Presets and typed dates move a single-month calendar in range mode only.** With `dualMonth={false}` in range mode the calendar also moves to the month of a clicked preset or of a date typed into the built-in date inputs. A `mode="single"` picker has no built-in date inputs, and clicking one of its presets sets the selection without changing the month on screen.
- **`maxRangeDays` in the single-month grid.** With `dualMonth={false}` in range mode, days further than `maxRangeDays` from the picked start are now disabled in the grid, as the two-month layout already did. `mode="single"` still uses `disabledDates` alone.

## Props

| Prop                | Type                                  | Required | Default         | Description                                                                                                                                                                                                                                                                                                                                                        |
| ------------------- | ------------------------------------- | -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| rangeStart          | `Date \| null`                        | No       | `null`          | Bindable. Start of the selected range. Only used in range mode.                                                                                                                                                                                                                                                                                                    |
| rangeEnd            | `Date \| null`                        | No       | `null`          | Bindable. End of the selected range. Only used in range mode.                                                                                                                                                                                                                                                                                                      |
| value               | `Date \| null`                        | No       | `null`          | Bindable. Selected date in single mode. The calendar opens on this date's month.                                                                                                                                                                                                                                                                                   |
| mode                | `'range' \| 'single'`                 | No       | `'range'`       | Selection mode.                                                                                                                                                                                                                                                                                                                                                    |
| minDate             | `Date \| null`                        | No       | `null`          | Earliest selectable date.                                                                                                                                                                                                                                                                                                                                          |
| maxDate             | `Date \| null`                        | No       | `null`          | Latest selectable date.                                                                                                                                                                                                                                                                                                                                            |
| disabledDates       | `Date[] \| ((date: Date) => boolean)` | No       | `[]`            | Dates that cannot be selected. Pass an array or a predicate function.                                                                                                                                                                                                                                                                                              |
| presets             | `DateRangePreset[] \| null`           | No       | `null`          | Preset options shown in the sidebar. Omit or pass null to hide the sidebar.                                                                                                                                                                                                                                                                                        |
| maxRangeDays        | `number \| null`                      | No       | `null`          | Maximum number of days a selected range may span, inclusive of both endpoints (range mode only). Once a start date is picked, dates that would exceed this span are disabled until the range is completed. `null` means no limit.                                                                                                                                  |
| showDateInputs      | `boolean`                             | No       | `false`         | Range mode only. Show typeable start/end date boxes at the top of the calendar area, seeded from the current draft selection. Typing a date and blurring or pressing Enter parses and commits it (accepts the display format, `M/D/YYYY`, or ISO `YYYY-MM-DD`); unparseable, out-of-range, disabled, or boundary-crossing input is rejected and the field reverts. |
| showTimeSelection   | `boolean`                             | No       | `false`         | Range mode only. Show a clock toggle in the date-input row that reveals start/end time inputs (`HH:MM AM/PM`); the entered times are folded onto the committed range's start/end on Apply. Implies the date-input row, and blocks Apply while a time is malformed or (same day) the start time is after the end time.                                              |
| timeSelectionLayout | `'toggle' \| 'inline'`                | No       | `'toggle'`      | How the time inputs are presented when `showTimeSelection` is on (range mode). `'toggle'` shows a clock button that reveals a collapsible start/end time row below the dates; `'inline'` renders each time input beside its date input on the same row, always visible, with no toggle. No effect unless `showTimeSelection` is true.                              |
| presetCheckmark     | `boolean`                             | No       | `false`         | Show a trailing checkmark on the active preset in the sidebar. Opt-in; the active preset is always distinguished by its highlighted background regardless of this flag.                                                                                                                                                                                            |
| presetToggle        | `boolean`                             | No       | `false`         | Make presets toggle instead of one-way: clicking the already-selected preset deselects it and reverts the draft to the committed selection (so a preset like "No Comparison" can be switched back off without picking a calendar date).                                                                                                                            |
| placeholder         | `string`                              | No       | `'Select date'` | Text shown on the trigger when no date is selected.                                                                                                                                                                                                                                                                                                                |
| dualMonth           | `boolean`                             | No       | `undefined`     | Show two months side by side. Defaults to true for range mode, false for single. Pass an explicit boolean to override. With `false` in range mode the single calendar opens on the selected range's month, follows presets and typed dates, and enforces `maxRangeDays`.                                                                                           |
| align               | `'left' \| 'right'`                   | No       | `'left'`        | Aligns the dropdown panel to the left or right edge of the trigger.                                                                                                                                                                                                                                                                                                |
| presetsPosition     | `'side' \| 'top'`                     | No       | `'side'`        | Where the presets sit. `'top'` lays them out as a wrapping row above the calendars, at any width. Group dividers are hidden while they are on top.                                                                                                                                                                                                                 |
| responsiveLayout    | `boolean`                             | No       | `false`         | Opt-in viewport awareness. At 1023px and below (range mode) or 688px and below (single mode) the panel becomes a fixed sheet confined to the viewport with the presets on top; at 688px and below it also shows one month and stacks the date and time inputs. See Responsive layout.                                                                              |
| timePicker          | `Snippet`                             | No       | —               | Snippet rendered inside a `.drp-time-row` wrapper below the calendars. Consumer owns all time state and input elements.                                                                                                                                                                                                                                            |
| compareStart        | `Date \| null`                        | No       | `null`          | Bindable. Start of the compare range. Meaningful when `compareCalendar` snippet is provided and `onapplycompare` commits it.                                                                                                                                                                                                                                       |
| compareEnd          | `Date \| null`                        | No       | `null`          | Bindable. End of the compare range.                                                                                                                                                                                                                                                                                                                                |
| compareCalendar     | `Snippet`                             | No       | —               | Snippet rendered inside a `.drp-compare-section` wrapper below the calendars. Consumer owns all compare state and calendar.                                                                                                                                                                                                                                        |
| weekStartsOn        | `0 \| 1`                              | No       | `0`             | Which day starts the week. 0 = Sunday, 1 = Monday.                                                                                                                                                                                                                                                                                                                 |
| locale              | `string`                              | No       | `undefined`     | BCP-47 locale string for date formatting on the trigger label (e.g., `'en-US'`, `'de-DE'`).                                                                                                                                                                                                                                                                        |
| testId              | `string`                              | No       | `undefined`     | Value for the `data-pw` attribute on the root wrapper element, used for end-to-end testing selectors.                                                                                                                                                                                                                                                              |
| classes             | `string`                              | No       | —               | Extra CSS class string applied to the root wrapper. Use to pass CSS variable overrides.                                                                                                                                                                                                                                                                            |
| clearable           | `boolean`                             | No       | `false`         | When `true` and `mode='single'`, shows a Clear button in the footer whenever a date is committed. Clicking it resets `value` to `null` and fires `onclear`. Has no effect in range mode.                                                                                                                                                                           |
| initialPresetLabel  | `string`                              | No       | `undefined`     | Label of the preset to activate on mount, without firing `onapply`. The trigger shows the preset's label, the sidebar highlights it, and the preset's date range is seeded into the draft so the calendar reflects the selection when the picker opens. Only evaluated once at mount; if no preset matches the prop is ignored.                                    |
| compareTrigger      | `Snippet<[string]>`                   | No       | —               | Snippet rendered as a standalone compare-period trigger button adjacent to the main trigger. Receives the formatted compare label string (`"start – end"` or the placeholder). When provided, the `compareCalendar` snippet moves into the standalone compare panel instead of the main DRP panel.                                                                 |
| openCompare         | `boolean`                             | No       | `false`         | Bindable. Whether the standalone compare-period panel is open. The component writes back on open/close; use `bind:openCompare` to observe state or drive it programmatically. Works even without `compareTrigger`.                                                                                                                                                 |

## Snippets

| Snippet         | Argument        | Description                                                                                                                                                                                                                                                  |
| --------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| triggerSnippet  | `label: string` | Custom trigger content. Receives the current formatted label string. When provided, the default label+icon layout is replaced entirely.                                                                                                                      |
| triggerIcon     | —               | Custom icon rendered inside the default trigger layout, replacing the default chevron-down SVG.                                                                                                                                                              |
| timePicker      | —               | Rendered in the time-picker slot (`.drp-time-row`) below the calendars. Use this to add start/end time inputs. Consumer owns all time state.                                                                                                                 |
| compareCalendar | —               | When `compareTrigger` is **not** provided: rendered in the compare slot (`.drp-compare-section`) below the calendars inside the main panel. When `compareTrigger` **is** provided: rendered inside the standalone compare panel (`.drp-compare-panel-body`). |
| compareTrigger  | `label: string` | Standalone compare trigger button. Receives the formatted compare label string. When provided, a separate trigger+panel widget is rendered adjacent to the main trigger so the compare period can be picked independently of the main panel.                 |

## Events

| Event          | Type                                                        | Description                                                                                                                     |
| -------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| onapply        | `(event: { rangeStart: Date; rangeEnd: Date }) => void`     | Fired when Apply is clicked in range mode and both dates are set.                                                               |
| onapplysingle  | `(event: { date: Date }) => void`                           | Fired when Apply is clicked in single mode and a date is set.                                                                   |
| onapplycompare | `(event: { compareStart: Date; compareEnd: Date }) => void` | Fired when Apply is clicked and the `compareCalendar` snippet is present.                                                       |
| oncancel       | `() => void`                                                | Fired when the user dismisses the picker without applying.                                                                      |
| onopentoggle   | `(event: { open: boolean }) => void`                        | Fired whenever the panel opens or closes.                                                                                       |
| onclear        | `() => void`                                                | Fired when the Clear button is clicked in single mode (`clearable=true`). `value` is already reset to `null` before this fires. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                | Default                       | Description                                                                                    |
| --------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------- |
| `--drp-root-display`                    | `inline-block`                | Root `display`. Set `block` so the root, panel and calendar can fill a container.              |
| `--drp-trigger-background`              | `inherit`                     | Trigger button background color.                                                               |
| `--drp-trigger-border`                  | `1px solid currentColor`      | Trigger button border.                                                                         |
| `--drp-trigger-border-radius`           | `6px`                         | Trigger button corner rounding.                                                                |
| `--drp-trigger-color`                   | `inherit`                     | Trigger button text color.                                                                     |
| `--drp-trigger-padding`                 | `8px 12px`                    | Trigger button inner padding.                                                                  |
| `--drp-trigger-min-width`               | `200px`                       | Minimum width of the trigger button.                                                           |
| `--drp-trigger-gap`                     | `8px`                         | Gap between label and icon in the trigger.                                                     |
| `--drp-trigger-hover-border`            | `1px solid currentColor`      | Trigger border on hover. Falls back through `--drp-trigger-border`.                            |
| `--drp-trigger-open-border-color`       | `#000000`                     | Trigger border color when the panel is open.                                                   |
| `--drp-trigger-open-shadow`             | `0 0 0 2px rgba(0,0,0,0.1)`   | Trigger box-shadow when the panel is open.                                                     |
| `--drp-trigger-icon-color`              | `inherit`                     | Color of the trigger chevron icon.                                                             |
| `--drp-panel-offset`                    | `6px`                         | Vertical gap between the trigger and the panel.                                                |
| `--drp-panel-z-index`                   | `1000`                        | Panel stack order.                                                                             |
| `--drp-panel-background`                | `#ffffff`                     | Panel background color.                                                                        |
| `--drp-panel-border`                    | `1px solid #e0e0e0`           | Panel border.                                                                                  |
| `--drp-panel-border-radius`             | `10px`                        | Panel corner rounding.                                                                         |
| `--drp-panel-shadow`                    | `0 8px 24px rgba(0,0,0,0.12)` | Panel drop shadow.                                                                             |
| `--drp-panel-max-height`                | `calc(100dvh - 80px)`         | Maximum height of the dropdown panel before its contents scroll.                               |
| `--drp-panel-min-width`                 | `320px`                       | Minimum width of the panel.                                                                    |
| `--drp-panel-max-width`                 | `760px`                       | Maximum width of the panel.                                                                    |
| `--drp-sheet-top`                       | `auto`                        | Top inset of the sheet (`responsiveLayout`). `auto` anchors the sheet to the bottom.           |
| `--drp-sheet-right`                     | `16px`                        | Right inset of the sheet (`responsiveLayout`).                                                 |
| `--drp-sheet-bottom`                    | `16px`                        | Bottom inset of the sheet (`responsiveLayout`).                                                |
| `--drp-sheet-left`                      | `16px`                        | Left inset of the sheet (`responsiveLayout`).                                                  |
| `--drp-sheet-max-width`                 | `48rem`                       | Maximum width of the sheet; a narrower viewport makes it fill the insets instead.              |
| `--drp-sheet-max-height`                | `calc(100dvh - 2rem)`         | Maximum height of the sheet; the calendar area scrolls above a pinned footer.                  |
| `--drp-sheet-z-index`                   | `1000`                        | Stack order of the sheet. Falls back through `--drp-panel-z-index`.                            |
| `--drp-sidebar-padding`                 | `12px 8px`                    | Padding inside the presets sidebar.                                                            |
| `--drp-sidebar-border`                  | `1px solid #e8e8e8`           | Right border of the presets sidebar.                                                           |
| `--drp-sidebar-min-width`               | `140px`                       | Minimum width of the presets sidebar.                                                          |
| `--drp-sidebar-max-height`              | `400px`                       | Maximum height of the presets sidebar (scrollable).                                            |
| `--drp-preset-padding`                  | `7px 12px`                    | Padding of each preset button.                                                                 |
| `--drp-preset-border-radius`            | `5px`                         | Corner rounding of preset buttons.                                                             |
| `--drp-preset-color`                    | `inherit`                     | Text color of preset buttons.                                                                  |
| `--drp-preset-hover-background`         | `#f5f5f5`                     | Background of preset buttons on hover.                                                         |
| `--drp-preset-active-background`        | `currentColor`                | Background of the active/selected preset button.                                               |
| `--drp-preset-active-color`             | `#ffffff`                     | Text color of the active/selected preset button.                                               |
| `--drp-preset-active-hover-background`  | `#333333`                     | Background of the active preset button on hover.                                               |
| `--drp-calendars-padding`               | `16px`                        | Padding around the calendar area.                                                              |
| `--drp-calendars-padding-narrow`        | `16px 8px`                    | Calendar-area padding in the narrow layout (`responsiveLayout`, 688px and below).              |
| `--drp-calendars-gap`                   | `16px`                        | Gap between calendar area sections (header, calendars, footer slots).                          |
| `--drp-month-label-color`               | `inherit`                     | Color of the dual-month header labels.                                                         |
| `--drp-nav-btn-size`                    | `32px`                        | Size of the dual-month navigation buttons.                                                     |
| `--drp-nav-btn-border-radius`           | `4px`                         | Corner rounding of navigation buttons.                                                         |
| `--drp-nav-btn-color`                   | `inherit`                     | Color of navigation button chevrons.                                                           |
| `--drp-nav-btn-hover-background`        | `#f0f0f0`                     | Background of navigation buttons on hover.                                                     |
| `--drp-nav-chevron-border`              | `2px solid currentColor`      | Chevron border style for navigation arrows.                                                    |
| `--drp-months-gap`                      | `24px`                        | Gap between the two calendars in dual-month mode.                                              |
| `--drp-time-row-gap`                    | `16px`                        | Gap between elements in the time-picker row wrapper.                                           |
| `--drp-time-row-padding-top`            | `8px`                         | Top padding of the time-picker row wrapper.                                                    |
| `--drp-time-divider`                    | `1px solid #e8e8e8`           | Top border of the time-picker row wrapper.                                                     |
| `--drp-compare-padding-top`             | `12px`                        | Top padding of the compare-calendar section wrapper.                                           |
| `--drp-compare-divider`                 | `1px solid #e8e8e8`           | Top border of the compare-calendar section wrapper.                                            |
| `--drp-footer-gap`                      | `8px`                         | Gap between footer buttons.                                                                    |
| `--drp-footer-padding`                  | `12px 16px`                   | Padding of the footer.                                                                         |
| `--drp-footer-border`                   | `1px solid #e8e8e8`           | Top border of the footer.                                                                      |
| `--drp-cancel-border-color`             | `#d0d0d0`                     | Cancel button border color.                                                                    |
| `--drp-cancel-color`                    | `#3a4550`                     | Cancel button text color. Falls back through ancestor colors; see Footer button colors.        |
| `--drp-cancel-hover-background`         | `#f5f5f5`                     | Cancel button background on hover.                                                             |
| `--drp-apply-background`                | `#3a4550`                     | Apply button background color, Button's default fill. Was `currentColor`; see below.           |
| `--drp-apply-color`                     | `#ffffff`                     | Apply button text color.                                                                       |
| `--drp-apply-hover-background`          | `#333333`                     | Apply button background on hover.                                                              |
| `--drp-apply-disabled-background`       | `#cccccc`                     | Apply button background when disabled.                                                         |
| `--drp-apply-disabled-color`            | `#888888`                     | Apply button text color when disabled.                                                         |
| `--drp-clear-border-color`              | `#d0d0d0`                     | Clear button border color (single-mode `clearable`).                                           |
| `--drp-clear-color`                     | `#3a4550`                     | Clear button text color. Falls back through ancestor colors; see Footer button colors.         |
| `--drp-clear-hover-background`          | `#f5f5f5`                     | Clear button background on hover.                                                              |
| `--drp-preset-divider-border`           | `1px solid #e8e8e8`           | Border style for the preset group divider line.                                                |
| `--drp-preset-divider-gap`              | `6px`                         | Gap between the divider line and the group label.                                              |
| `--drp-preset-divider-margin`           | `4px 0`                       | Vertical margin above and below each preset group divider.                                     |
| `--drp-preset-padding-left`             | `12px`                        | Left padding of the preset sidebar list.                                                       |
| `--drp-preset-padding-right`            | `12px`                        | Right padding of the preset sidebar list.                                                      |
| `--drp-preset-check-size`               | `16px`                        | Width/height of the trailing checkmark shown when `presetCheckmark` is true.                   |
| `--drp-preset-check-color`              | `inherit`                     | Colour of the trailing checkmark.                                                              |
| `--drp-preset-check-gap`                | `8px`                         | Gap between a preset's label and its trailing checkmark.                                       |
| `--drp-preset-group-label-color`        | `#999999`                     | Text color of the preset group label rendered beside the divider.                              |
| `--drp-preset-divider-leader-width`     | `8px`                         | Width of the leading line segment before the group label.                                      |
| `--drp-compare-trigger-background`      | `inherit`                     | Compare trigger button background.                                                             |
| `--drp-compare-trigger-border`          | `1px solid currentColor`      | Compare trigger button border.                                                                 |
| `--drp-compare-trigger-border-radius`   | `6px`                         | Compare trigger button corner rounding.                                                        |
| `--drp-compare-trigger-color`           | `inherit`                     | Compare trigger button text color.                                                             |
| `--drp-compare-trigger-padding`         | `8px 12px`                    | Compare trigger button inner padding.                                                          |
| `--drp-compare-trigger-min-width`       | `160px`                       | Compare trigger button minimum width.                                                          |
| `--drp-compare-panel-left`              | `0`                           | Left offset of the standalone compare panel relative to its trigger.                           |
| `--drp-compare-panel-min-width`         | `280px`                       | Minimum width of the standalone compare panel.                                                 |
| `--drp-datetime-divider`                | `1px solid #e8e8e8`           | Divider below the date + time header (`showDateInputs`/`showTimeSelection`).                   |
| `--drp-datetime-gap`                    | `8px`                         | Gap between the date-input row's own elements.                                                 |
| `--drp-datetime-padding-bottom`         | `12px`                        | Padding below the date + time header row.                                                      |
| `--drp-datetime-margin-bottom`          | `4px`                         | Margin below the date + time header row.                                                       |
| `--drp-datetime-arrow-size`             | `16px`                        | Width/height of the arrow icon between the start and end date boxes.                           |
| `--drp-datetime-arrow-color`            | `#888888`                     | Colour of the arrow icon between the start and end date boxes.                                 |
| `--drp-date-input-border`               | `1px solid #d4d4d4`           | Border of the typeable date boxes.                                                             |
| `--drp-date-input-background`           | `#ffffff`                     | Background of the typeable date boxes.                                                         |
| `--drp-date-input-color`                | `#333333`                     | Text color of the typeable date boxes.                                                         |
| `--drp-date-input-invalid-border`       | `#e5484d`                     | Border of a date box holding text that can't resolve to a selectable date.                     |
| `--drp-date-input-placeholder-color`    | `#aaaaaa`                     | Placeholder text color of the date boxes (shown when empty).                                   |
| `--drp-date-input-font-size`            | `13px`                        | Font size of the date box input text.                                                          |
| `--drp-date-input-radius`               | `var(--radius, 4px)`          | Corner rounding of the typeable date boxes.                                                    |
| `--drp-time-toggle-background`          | `#f6f7f9`                     | Background of the clock toggle button.                                                         |
| `--drp-time-toggle-border`              | `1px solid #d4d4d4`           | Border of the clock toggle button.                                                             |
| `--drp-time-toggle-active-color`        | `#1b85ff`                     | Clock toggle icon/border color when the time row is open.                                      |
| `--drp-time-toggle-active-border`       | `currentColor`                | Clock toggle border colour when the time row is open.                                          |
| `--drp-time-toggle-size`                | `40px`                        | Width/height of the clock toggle button.                                                       |
| `--drp-time-toggle-radius`              | `var(--radius, 4px)`          | Corner rounding of the clock toggle button.                                                    |
| `--drp-time-toggle-icon-size`           | `16px`                        | Width/height of the clock icon inside the toggle button.                                       |
| `--drp-time-input-border`               | `1px solid #d4d4d4`           | Border of the time inputs.                                                                     |
| `--drp-time-input-invalid-border`       | `#e5484d`                     | Border of a time input holding an invalid value.                                               |
| `--drp-time-input-background`           | `#ffffff`                     | Background of the time inputs.                                                                 |
| `--drp-time-input-radius`               | `var(--radius, 4px)`          | Corner rounding of the time inputs.                                                            |
| `--drp-time-input-icon-size`            | `16px`                        | Width/height of the clock icon inside each time input.                                         |
| `--drp-time-input-icon-gap`             | `12px`                        | Left margin between a time input's text and its icon.                                          |
| `--drp-time-input-icon-color`           | `#888888`                     | Colour of the icon inside each time input.                                                     |
| `--drp-time-field-color`                | `#333333`                     | Text color of the time inputs.                                                                 |
| `--drp-time-field-padding`              | `10px 14px 10px 8px`          | Inner padding of the time inputs.                                                              |
| `--drp-time-field-font-size`            | `13px`                        | Font size of the time input text.                                                              |
| `--drp-time-field-placeholder-color`    | `#aaaaaa`                     | Placeholder text color of the time inputs.                                                     |
| `--drp-time-inline-width`               | `116px`                       | Width of each inline time input (`timeSelectionLayout="inline"`).                              |
| `--drp-datetime-inline-gap`             | `8px`                         | Gap between a date input and its time input in the inline layout.                              |
| `--drp-preset-item-transition-duration` | `0.12s`                       | Duration of a preset button's background transition. Falls back through `--motion-duration`.   |
| `--drp-preset-item-transition-easing`   | `ease`                        | Easing curve of a preset button's background transition. Falls back through `--motion-easing`. |
| `--drp-nav-btn-transition-duration`     | `0.12s`                       | Duration of a nav button's background transition. Falls back through `--motion-duration`.      |
| `--drp-nav-btn-transition-easing`       | `ease`                        | Easing curve of a nav button's background transition. Falls back through `--motion-easing`.    |

### Footer button colors

Cancel and Clear take their text color from `--drp-cancel-color` and `--drp-clear-color`, then from an ancestor's `--button-text-color`, then from `--button-secondary-text-color`, then `#3a4550`. Apply's background is `--drp-apply-background`, then `#3a4550` (Button's default fill), under a `#ffffff` label. Both clear 4.5:1 on the default white panel (9.8:1).

Apply does not follow an ancestor's `--button-color`. Its fill and its white label are a fixed pair, so a theme that sets a light or a transparent `--button-color` for its own buttons cannot leave Apply unreadable (a light `#e0e0e0` fill measures 1.3:1 under the white label, a transparent one 1:1). To match a themed fill, set `--drp-apply-background`, and `--drp-apply-color` when the label should not be white.

The old defaults rendered white on white. `inherit` inside a custom property takes the ancestor's `--button-text-color`, not the text color, so with neither set Cancel and Clear showed Button's white label on the white panel, and `currentColor` made an enabled Apply's background its own white label (1:1 until hover). A token you set to a color still wins exactly as before, and an ancestor's `--button-text-color` still reaches Cancel and Clear; only a button with none of its tokens set changes. The two old defaults, set by hand, differ: `--drp-cancel-color: inherit` and `--drp-clear-color: inherit` now render like an unset token (a custom property set to `inherit` takes its parent's value, which is empty), while `--drp-apply-background: currentColor` is a color you chose and still renders the old white fill.

An app that sets a light `--button-text-color` for every button still gets a light Cancel label until it sets `--drp-cancel-color` and `--drp-clear-color`, and Cancel and Clear hover text still follows an ancestor's `--button-hover-text-color`, so pair a light one with `--drp-cancel-hover-background` and `--drp-clear-hover-background`. On a dark panel, set those two and `--drp-apply-background`, or load `theme-dark.css`, which sets `--button-secondary-text-color` for Cancel and Clear but leaves Apply on Button's default fill (1.7:1 against the dark panel).

### Selector specificity note

The `.drp-trigger` global class selector was tightened to `.drp-trigger-wrapper .drp-trigger` in this version. If you were overriding `.drp-trigger` styles from an outer stylesheet, update your selector to `.drp-trigger-wrapper .drp-trigger` (or add the wrapper class to your existing rule) to maintain the same specificity.

### Filling a container

To embed a single-month picker (`mode="single"`) without presets in a fixed-width host, make the root block-level and let the panel and the calendar follow it:

```css
.host {
  --drp-root-display: block;
  --drp-panel-min-width: 100%;
  --calendar-width: 100%;
  --calendar-grid-columns: repeat(7, minmax(0, 1fr));
  --calendar-cell-width: 100%;
}
```

`--drp-panel-min-width: 100%` is what makes the panel as wide as the root; with `0` it shrinks to its content. The trigger button keeps its own width, which `--drp-trigger-min-width` sets. The panel is `content-box`, so on a page without a `box-sizing: border-box` reset its 1px border is drawn outside the host. In the web component also set `--sui-date-range-picker-display: block` on `<sui-date-range-picker>`: `--drp-root-display` crosses the shadow boundary, but the element is its own box. A page-level `box-sizing` reset does not reach the shadow root either, so inside the web component the 2px of border is always outside the host: leave 2px of room, or set `--drp-panel-border: none` to drop the border.

This recipe was verified for a single-month picker without presets. In range mode (the default) the panel holds two months side by side, so a narrow host leaves them very small: the day names run together and the month title wraps. A presets sidebar is at least 140px wide (`--drp-sidebar-min-width`) plus its padding, so a single-month picker with presets needs a host of about 316px or more. Measured with four presets, the panel is about 316px wide in a 300px host and still overhangs hosts from 305px to 314px. A range-mode picker with presets needs about 393px.

The recipe does not combine with `responsiveLayout` (see [Responsive layout](#responsive-layout)) at narrow widths. At and below the sheet's breakpoints, 688px for a single-month picker and 1023px in range mode, the panel becomes a fixed sheet with `min-width: 0`, so `--drp-panel-min-width: 100%` no longer applies: the panel is sized and placed by the viewport instead of the host (343px wide at a 375px viewport, in a 300px host). Use the recipe for a picker that lives in a fixed-width host, and `responsiveLayout` for one that should follow the window.

## Web Component

The `DateRangePicker` is also available as a native web component via the `sui-date-range-picker` custom element tag. Import the web component build separately:

```html
<script type="module" src="https://juspay.github.io/svelte-ui-components/wc/index.js"></script>

<sui-date-range-picker
  mode="range"
  placeholder="Pick a date range"
  test-id="my-drp"
  dual-month
></sui-date-range-picker>
```

```javascript
const drp = document.querySelector('sui-date-range-picker');

drp.onapply = (event) => {
  console.log(event.rangeStart, event.rangeEnd);
};

// Set object props via JS (not HTML attributes)
drp.presets = [
  {
    label: 'Today',
    getValue: () => {
      const d = new Date();
      return { start: d, end: d };
    }
  }
];
drp.maxDate = new Date();
```

> **Note:** assigning `onapply` (and `onapplysingle`, `onapplycompare`, `onopentoggle`, `onclear`) as a property, as above, still works exactly as shown. Each of those five also dispatches a same-named DOM event — `drp.addEventListener('apply', (e) => console.log(e.detail.rangeStart, e.detail.rangeEnd))` fires too, with `detail` carrying the same argument the property callback receives (`onclear` takes no argument, so its `clear` event carries no `detail`). `oncancel` is the one exception: it collides with the native `HTMLElement.oncancel` handler, so it stays a callback-only property — `drp.addEventListener('cancel', ...)` registers without error but is never called.

### Attributes

String and boolean props map to kebab-case HTML attributes:

| Attribute              | Prop                 | Type      |
| ---------------------- | -------------------- | --------- |
| `mode`                 | `mode`               | `String`  |
| `placeholder`          | `placeholder`        | `String`  |
| `dual-month`           | `dualMonth`          | `Boolean` |
| `presets-position`     | `presetsPosition`    | `String`  |
| `responsive-layout`    | `responsiveLayout`   | `Boolean` |
| `week-starts-on`       | `weekStartsOn`       | `Number`  |
| `locale`               | `locale`             | `String`  |
| `test-id`              | `testId`             | `String`  |
| `classes`              | `classes`            | `String`  |
| `clearable`            | `clearable`          | `Boolean` |
| `initial-preset-label` | `initialPresetLabel` | `String`  |

Object and function props (`presets`, `minDate`, `maxDate`, `disabledDates`, `rangeStart`, `rangeEnd`, `value`, `compareStart`, `compareEnd`, and all event handlers) must be set via JavaScript property assignment, not HTML attributes.

### Slots

| Slot Name          | Maps to Snippet   | Description                                                                                                                                            |
| ------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `trigger-icon`     | `triggerIcon`     | Glyph after the trigger label. Defaults to the built-in chevron.                                                                                       |
| `time-picker`      | `timePicker`      | Time row inside the panel. Nothing renders when the slot is empty — there is no built-in time row, and the panel's time divider stays hidden.          |
| `compare-calendar` | `compareCalendar` | Compare-range calendar inside the panel. Nothing renders when the slot is empty, and compare-range Apply stays off, exactly as when the prop is unset. |

A JavaScript-assigned property of the same name wins over slotted markup. `trigger-icon` carries
the built-in chevron as its own fallback, so supplying neither still renders the glyph.
`time-picker` and `compare-calendar` are claimed only when actually filled: each sits in a row
styled `border-top` plus padding, so an always-claimed snippet would draw a divider across every
panel above an empty strip, and `compareCalendar` additionally gates whether Apply commits
`compareStart`/`compareEnd` and fires `onapplycompare`.

> **Svelte-only:** `triggerSnippet` (receives `string`), `compareTrigger` (receives `string`) take arguments, so they cannot be expressed as a named slot: a Web Component `<slot>` projects markup, it does not forward Svelte snippet parameters, so the arguments above would be silently dropped. Use the Svelte component directly when you need these.

## Consumer Recipes

### Time picker

The `timePicker` snippet gives full control over time input UI and state. A minimal recipe:

```svelte
<script>
  let startHour = $state(0);
  let startMinute = $state(0);
  let endHour = $state(23);
  let endMinute = $state(59);

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, isNaN(value) ? min : value));
  }
</script>

<DateRangePicker mode="range">
  {#snippet timePicker()}
    <label>
      Start
      <input type="number" min="0" max="23" bind:value={startHour} />
      :
      <input type="number" min="0" max="59" bind:value={startMinute} />
    </label>
    <span>–</span>
    <label>
      End
      <input type="number" min="0" max="23" bind:value={endHour} />
      :
      <input type="number" min="0" max="59" bind:value={endMinute} />
    </label>
  {/snippet}
</DateRangePicker>
```

### Compare range (inline, inside main panel)

The `compareCalendar` snippet lets you embed a second Calendar for period comparison inside the main DRP panel. Wire its selection back through `onapplycompare`:

```svelte
<script>
  import { DateRangePicker, Calendar } from '@juspay/svelte-ui-components';

  let compareStart = $state(null);
  let compareEnd = $state(null);
</script>

<DateRangePicker
  mode="range"
  bind:compareStart
  bind:compareEnd
  onapplycompare={(e) => {
    compareStart = e.compareStart;
    compareEnd = e.compareEnd;
  }}
>
  {#snippet compareCalendar()}
    <p>Compare period</p>
    <Calendar mode="range" bind:rangeStart={compareStart} bind:rangeEnd={compareEnd} />
  {/snippet}
</DateRangePicker>
```

### Compare range (standalone trigger, separate panel)

Pass both `compareTrigger` and `compareCalendar` for an independent compare picker button. The compare panel renders anchored to its own trigger, leaving the main picker unaffected:

```svelte
<script>
  import { DateRangePicker, Calendar } from '@juspay/svelte-ui-components';

  let compareStart = $state(null);
  let compareEnd = $state(null);
</script>

<DateRangePicker
  mode="range"
  bind:compareStart
  bind:compareEnd
  onapplycompare={(e) => {
    compareStart = e.compareStart;
    compareEnd = e.compareEnd;
  }}
>
  {#snippet compareTrigger(label)}
    Compare: {label}
  {/snippet}
  {#snippet compareCalendar()}
    <Calendar mode="range" bind:rangeStart={compareStart} bind:rangeEnd={compareEnd} />
  {/snippet}
</DateRangePicker>
```
