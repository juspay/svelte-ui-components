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

### Initial active preset (display only, no onapply fired)

Use `initialPresetLabel` to seed a preset as visually active on mount — the trigger shows the preset's label and the sidebar highlights it — without firing `onapply`. When the user opens the picker and clicks Apply, the real `onapply` fires normally.

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

## Props

| Prop               | Type                                  | Required | Default         | Description                                                                                                                                                                                                             |
| ------------------ | ------------------------------------- | -------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| rangeStart         | `Date \| null`                        | No       | `null`          | Bindable. Start of the selected range. Only used in range mode.                                                                                                                                                         |
| rangeEnd           | `Date \| null`                        | No       | `null`          | Bindable. End of the selected range. Only used in range mode.                                                                                                                                                           |
| value              | `Date \| null`                        | No       | `null`          | Bindable. Selected date in single mode.                                                                                                                                                                                 |
| mode               | `'range' \| 'single'`                 | No       | `'range'`       | Selection mode.                                                                                                                                                                                                         |
| minDate            | `Date \| null`                        | No       | `null`          | Earliest selectable date.                                                                                                                                                                                               |
| maxDate            | `Date \| null`                        | No       | `null`          | Latest selectable date.                                                                                                                                                                                                 |
| disabledDates      | `Date[] \| ((date: Date) => boolean)` | No       | `[]`            | Dates that cannot be selected. Pass an array or a predicate function.                                                                                                                                                   |
| presets            | `DateRangePreset[] \| null`           | No       | `null`          | Preset options shown in the sidebar. Omit or pass null to hide the sidebar.                                                                                                                                             |
| placeholder        | `string`                              | No       | `'Select date'` | Text shown on the trigger when no date is selected.                                                                                                                                                                     |
| dualMonth          | `boolean`                             | No       | `undefined`     | Show two months side by side. Defaults to true for range mode, false for single. Pass an explicit boolean to override.                                                                                                  |
| timePicker         | `Snippet`                             | No       | —               | Snippet rendered inside a `.drp-time-row` wrapper below the calendars. Consumer owns all time state and input elements.                                                                                                 |
| compareStart       | `Date \| null`                        | No       | `null`          | Bindable. Start of the compare range. Meaningful when `compareCalendar` snippet is provided and `onapplycompare` commits it.                                                                                            |
| compareEnd         | `Date \| null`                        | No       | `null`          | Bindable. End of the compare range.                                                                                                                                                                                     |
| compareCalendar    | `Snippet`                             | No       | —               | Snippet rendered inside a `.drp-compare-section` wrapper below the calendars. Consumer owns all compare state and calendar.                                                                                             |
| weekStartsOn       | `0 \| 1`                              | No       | `0`             | Which day starts the week. 0 = Sunday, 1 = Monday.                                                                                                                                                                      |
| locale             | `string`                              | No       | `undefined`     | BCP-47 locale string for date formatting on the trigger label (e.g., `'en-US'`, `'de-DE'`).                                                                                                                             |
| testId             | `string`                              | No       | `undefined`     | Value for the `data-pw` attribute on the root wrapper element, used for end-to-end testing selectors.                                                                                                                   |
| classes            | `string`                              | No       | —               | Extra CSS class string applied to the root wrapper. Use to pass CSS variable overrides.                                                                                                                                 |
| clearable          | `boolean`                             | No       | `false`         | When `true` and `mode='single'`, shows a Clear button in the footer whenever a date is committed. Clicking it resets `value` to `null` and fires `onclear`. Has no effect in range mode.                                |
| initialPresetLabel | `string`                              | No       | `undefined`     | Label of the preset to show as active on mount, without firing `onapply`. The trigger displays the preset label and the sidebar highlights it. Only evaluated once at mount; if no preset matches, the prop is ignored. |
| compareTrigger     | `Snippet<[string]>`                   | No       | —               | Snippet rendered as a standalone compare-period trigger button adjacent to the main trigger. Receives the formatted compare label string (`"start – end"` or the placeholder). When provided, the `compareCalendar` snippet moves into the standalone compare panel instead of the main DRP panel. |
| openCompare        | `boolean`                             | No       | `false`         | Bindable. Whether the standalone compare-period panel is open. The component writes back on open/close; use `bind:openCompare` to observe state or drive it programmatically. Works even without `compareTrigger`. |

## Snippets

| Snippet         | Argument        | Description                                                                                                                                                                                                                                                     |
| --------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| triggerSnippet  | `label: string` | Custom trigger content. Receives the current formatted label string. When provided, the default label+icon layout is replaced entirely.                                                                                                                         |
| triggerIcon     | —               | Custom icon rendered inside the default trigger layout, replacing the default chevron-down SVG.                                                                                                                                                                 |
| timePicker      | —               | Rendered in the time-picker slot (`.drp-time-row`) below the calendars. Use this to add start/end time inputs. Consumer owns all time state.                                                                                                                    |
| compareCalendar | —               | When `compareTrigger` is **not** provided: rendered in the compare slot (`.drp-compare-section`) below the calendars inside the main panel. When `compareTrigger` **is** provided: rendered inside the standalone compare panel (`.drp-compare-panel-body`). |
| compareTrigger  | `label: string` | Standalone compare trigger button. Receives the formatted compare label string. When provided, a separate trigger+panel widget is rendered adjacent to the main trigger so the compare period can be picked independently of the main panel.                    |

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

| Variable                               | Default                       | Description                                                           |
| -------------------------------------- | ----------------------------- | --------------------------------------------------------------------- |
| `--drp-trigger-background`             | `inherit`                     | Trigger button background color.                                      |
| `--drp-trigger-border`                 | `1px solid currentColor`      | Trigger button border.                                                |
| `--drp-trigger-border-radius`          | `6px`                         | Trigger button corner rounding.                                       |
| `--drp-trigger-color`                  | `inherit`                     | Trigger button text color.                                            |
| `--drp-trigger-padding`                | `8px 12px`                    | Trigger button inner padding.                                         |
| `--drp-trigger-min-width`              | `200px`                       | Minimum width of the trigger button.                                  |
| `--drp-trigger-gap`                    | `8px`                         | Gap between label and icon in the trigger.                            |
| `--drp-trigger-hover-border-color`     | `currentColor`                | Trigger border color on hover.                                        |
| `--drp-trigger-open-border-color`      | `#000000`                     | Trigger border color when the panel is open.                          |
| `--drp-trigger-open-shadow`            | `0 0 0 2px rgba(0,0,0,0.1)`   | Trigger box-shadow when the panel is open.                            |
| `--drp-trigger-icon-color`             | `inherit`                     | Color of the trigger chevron icon.                                    |
| `--drp-panel-offset`                   | `6px`                         | Vertical gap between the trigger and the panel.                       |
| `--drp-panel-z-index`                  | `1000`                        | Panel stack order.                                                    |
| `--drp-panel-background`               | `inherit`                     | Panel background color.                                               |
| `--drp-panel-border`                   | `1px solid #e0e0e0`           | Panel border.                                                         |
| `--drp-panel-border-radius`            | `10px`                        | Panel corner rounding.                                                |
| `--drp-panel-shadow`                   | `0 8px 24px rgba(0,0,0,0.12)` | Panel drop shadow.                                                    |
| `--drp-panel-min-width`                | `320px`                       | Minimum width of the panel.                                           |
| `--drp-panel-max-width`                | `760px`                       | Maximum width of the panel.                                           |
| `--drp-sidebar-padding`                | `12px 8px`                    | Padding inside the presets sidebar.                                   |
| `--drp-sidebar-border`                 | `1px solid #e8e8e8`           | Right border of the presets sidebar.                                  |
| `--drp-sidebar-min-width`              | `140px`                       | Minimum width of the presets sidebar.                                 |
| `--drp-sidebar-max-height`             | `400px`                       | Maximum height of the presets sidebar (scrollable).                   |
| `--drp-preset-padding`                 | `7px 12px`                    | Padding of each preset button.                                        |
| `--drp-preset-border-radius`           | `5px`                         | Corner rounding of preset buttons.                                    |
| `--drp-preset-color`                   | `inherit`                     | Text color of preset buttons.                                         |
| `--drp-preset-hover-background`        | `#f5f5f5`                     | Background of preset buttons on hover.                                |
| `--drp-preset-active-background`       | `currentColor`                | Background of the active/selected preset button.                      |
| `--drp-preset-active-color`            | `#ffffff`                     | Text color of the active/selected preset button.                      |
| `--drp-preset-active-hover-background` | `#333333`                     | Background of the active preset button on hover.                      |
| `--drp-calendars-padding`              | `16px`                        | Padding around the calendar area.                                     |
| `--drp-calendars-gap`                  | `16px`                        | Gap between calendar area sections (header, calendars, footer slots). |
| `--drp-month-label-color`              | `inherit`                     | Color of the dual-month header labels.                                |
| `--drp-nav-btn-size`                   | `32px`                        | Size of the dual-month navigation buttons.                            |
| `--drp-nav-btn-border-radius`          | `4px`                         | Corner rounding of navigation buttons.                                |
| `--drp-nav-btn-color`                  | `inherit`                     | Color of navigation button chevrons.                                  |
| `--drp-nav-btn-hover-background`       | `#f0f0f0`                     | Background of navigation buttons on hover.                            |
| `--drp-nav-chevron-border`             | `2px solid currentColor`      | Chevron border style for navigation arrows.                           |
| `--drp-months-gap`                     | `24px`                        | Gap between the two calendars in dual-month mode.                     |
| `--drp-time-row-gap`                   | `16px`                        | Gap between elements in the time-picker row wrapper.                  |
| `--drp-time-row-padding-top`           | `8px`                         | Top padding of the time-picker row wrapper.                           |
| `--drp-time-divider`                   | `1px solid #e8e8e8`           | Top border of the time-picker row wrapper.                            |
| `--drp-compare-padding-top`            | `12px`                        | Top padding of the compare-calendar section wrapper.                  |
| `--drp-compare-divider`                | `1px solid #e8e8e8`           | Top border of the compare-calendar section wrapper.                   |
| `--drp-footer-gap`                     | `8px`                         | Gap between footer buttons.                                           |
| `--drp-footer-padding`                 | `12px 16px`                   | Padding of the footer.                                                |
| `--drp-footer-border`                  | `1px solid #e8e8e8`           | Top border of the footer.                                             |
| `--drp-cancel-border-color`            | `#d0d0d0`                     | Cancel button border color.                                           |
| `--drp-cancel-color`                   | `inherit`                     | Cancel button text color.                                             |
| `--drp-cancel-hover-background`        | `#f5f5f5`                     | Cancel button background on hover.                                    |
| `--drp-apply-background`               | `currentColor`                | Apply button background color.                                        |
| `--drp-apply-color`                    | `#ffffff`                     | Apply button text color.                                              |
| `--drp-apply-hover-background`         | `#333333`                     | Apply button background on hover.                                     |
| `--drp-apply-disabled-background`      | `#cccccc`                     | Apply button background when disabled.                                |
| `--drp-apply-disabled-color`           | `#888888`                     | Apply button text color when disabled.                                |
| `--drp-clear-border-color`             | `#d0d0d0`                     | Clear button border color (single-mode `clearable`).                  |
| `--drp-clear-color`                    | `inherit`                     | Clear button text color.                                              |
| `--drp-clear-hover-background`         | `#f5f5f5`                     | Clear button background on hover.                                     |
| `--drp-preset-divider-border`          | `1px solid #e8e8e8`           | Border style for the preset group divider line.                       |
| `--drp-preset-divider-gap`             | `6px`                         | Gap between the divider line and the group label.                     |
| `--drp-preset-divider-margin`          | `4px 0`                       | Vertical margin above and below each preset group divider.            |
| `--drp-preset-group-label-color`       | `#999999`                     | Text color of the preset group label rendered beside the divider.     |
| `--drp-preset-divider-leader-width`    | `8px`                         | Width of the leading line segment before the group label.             |
| `--drp-compare-trigger-background`     | `inherit`                     | Compare trigger button background.                                    |
| `--drp-compare-trigger-border`         | `1px solid currentColor`      | Compare trigger button border.                                        |
| `--drp-compare-trigger-border-radius`  | `6px`                         | Compare trigger button corner rounding.                               |
| `--drp-compare-trigger-color`          | `inherit`                     | Compare trigger button text color.                                    |
| `--drp-compare-trigger-padding`        | `8px 12px`                    | Compare trigger button inner padding.                                 |
| `--drp-compare-trigger-min-width`      | `160px`                       | Compare trigger button minimum width.                                 |
| `--drp-compare-panel-left`             | `0`                           | Left offset of the standalone compare panel relative to its trigger.  |
| `--drp-compare-panel-min-width`        | `280px`                       | Minimum width of the standalone compare panel.                        |

### Selector specificity note

The `.drp-trigger` global class selector was tightened to `.drp-trigger-wrapper .drp-trigger` in this version. If you were overriding `.drp-trigger` styles from an outer stylesheet, update your selector to `.drp-trigger-wrapper .drp-trigger` (or add the wrapper class to your existing rule) to maintain the same specificity.

## Web Component

The `DateRangePicker` is also available as a native web component via the `sui-date-range-picker` custom element tag. Import the web component build separately:

```html
<script type="module" src="@juspay/svelte-ui-components/wc"></script>

<sui-date-range-picker
  mode="range"
  placeholder="Pick a date range"
  test-id="my-drp"
  dual-month
></sui-date-range-picker>
```

```javascript
const drp = document.querySelector('sui-date-range-picker');

drp.addEventListener('onapply', (e) => {
  console.log(e.detail.rangeStart, e.detail.rangeEnd);
});

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

### Attributes

String and boolean props map to kebab-case HTML attributes:

| Attribute              | Prop                 | Type      |
| ---------------------- | -------------------- | --------- |
| `mode`                 | `mode`               | `String`  |
| `placeholder`          | `placeholder`        | `String`  |
| `dual-month`           | `dualMonth`          | `Boolean` |
| `week-starts-on`       | `weekStartsOn`       | `Number`  |
| `locale`               | `locale`             | `String`  |
| `test-id`              | `testId`             | `String`  |
| `classes`              | `classes`            | `String`  |
| `clearable`            | `clearable`          | `Boolean` |
| `initial-preset-label` | `initialPresetLabel` | `String`  |

Object and function props (`presets`, `minDate`, `maxDate`, `disabledDates`, `rangeStart`, `rangeEnd`, `value`, `compareStart`, `compareEnd`, and all event handlers) must be set via JavaScript property assignment, not HTML attributes.

### Slots

The `sui-date-range-picker` web component does not support snippet-based slots (`timePicker`, `compareCalendar`, `triggerSnippet`, `triggerIcon`) through HTML. Pass these as JavaScript `Snippet` functions via property assignment when using the web component in a hybrid Svelte + native context.

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
