# Calendar

A date or date-range picker that displays a monthly calendar grid with navigation and selection. Supports single-date and range selection modes, min/max date constraints, disabled dates, locale-aware formatting via Intl.DateTimeFormat, configurable week start day, keyboard navigation (Arrow keys to move focus, Enter to select), and full CSS theming.

## Usage

```svelte
<script>
  import { Calendar } from '@juspay/svelte-ui-components';

  let selectedDate = $state(null);
</script>

<Calendar bind:value={selectedDate} />
```

### Range Selection

```svelte
<script>
  import { Calendar } from '@juspay/svelte-ui-components';

  let rangeStart = $state(null);
  let rangeEnd = $state(null);
</script>

<Calendar mode="range" bind:rangeStart bind:rangeEnd />
```

## Props

| Prop          | Type                                  | Required | Default     | Description                                                                                                                                                                                                                |
| ------------- | ------------------------------------- | -------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value         | `Date \| null`                        | No       | `null`      | Bindable. The currently selected date in single selection mode. Set to null to clear the selection.                                                                                                                        |
| rangeStart    | `Date \| null`                        | No       | `null`      | Bindable. The start date of a range selection. Only used when mode is 'range'.                                                                                                                                             |
| rangeEnd      | `Date \| null`                        | No       | `null`      | Bindable. The end date of a range selection. Only used when mode is 'range'.                                                                                                                                               |
| mode          | `'single' \| 'range'`                 | No       | `'single'`  | Selection mode. 'single' allows picking one date, 'range' allows picking a start and end date.                                                                                                                             |
| minDate       | `Date \| null`                        | No       | `null`      | The earliest selectable date. Dates before this are visually dimmed and cannot be clicked.                                                                                                                                 |
| maxDate       | `Date \| null`                        | No       | `null`      | The latest selectable date. Dates after this are visually dimmed and cannot be clicked.                                                                                                                                    |
| disabledDates | `Date[] \| ((date: Date) => boolean)` | No       | `[]`        | Dates that cannot be selected. Pass an array of specific Date objects or a function that returns true for dates that should be disabled.                                                                                   |
| weekStartsOn  | `0 \| 1`                              | No       | `0`         | Which day starts the week. 0 = Sunday, 1 = Monday. Affects the day names header and grid layout.                                                                                                                           |
| locale        | `string`                              | No       | `undefined` | BCP 47 locale string for formatting month/year header and day names (e.g., 'en-US', 'de-DE'). Defaults to the browser's locale when undefined.                                                                             |
| testId        | `string`                              | No       | `undefined` | Value for the data-pw attribute on the root element, used for end-to-end testing selectors.                                                                                                                                |
| classes       | `string`                              | No       | `-`         | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides (e.g., `.btn-primary { --button-color: #0070f3; }`) and pass them to create variant styles. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet           | Type      | Description                                                                                         |
| ----------------- | --------- | --------------------------------------------------------------------------------------------------- |
| previousMonthIcon | `Snippet` | Custom content rendered inside the previous-month navigation button, replacing the default chevron. |
| nextMonthIcon     | `Snippet` | Custom content rendered inside the next-month navigation button, replacing the default chevron.     |

## Events

| Event         | Type                                                    | Description                                                                                                  |
| ------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| onselect      | `(event: { date: Date }) => void`                       | Fires when a date is selected in single mode, providing the chosen date.                                     |
| onrangeselect | `(event: { rangeStart: Date; rangeEnd: Date }) => void` | Fires when a complete range is selected (both start and end dates are set) in range mode.                    |
| onmonthchange | `(event: { year: number; month: number }) => void`      | Fires when the displayed month changes via navigation arrows, providing the new year and zero-indexed month. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                 | Default             | CSS Property     | Description                                                                             |
| ---------------------------------------- | ------------------- | ---------------- | --------------------------------------------------------------------------------------- |
| `--calendar-font-family`                 | `inherit`           | font-family      | Font family for the entire calendar.                                                    |
| `--calendar-width`                       | `280px`             | width            | Width of the calendar container.                                                        |
| `--calendar-padding`                     | `16px`              | padding          | Inner padding of the calendar container.                                                |
| `--calendar-background`                  | `#ffffff`           | background-color | Background color of the calendar container.                                             |
| `--calendar-border`                      | `1px solid #e0e0e0` | border           | Border of the calendar container.                                                       |
| `--calendar-border-radius`               | `8px`               | border-radius    | Corner rounding of the calendar container.                                              |
| `--calendar-box-shadow`                  | `none`              | box-shadow       | Box shadow of the calendar container.                                                   |
| `--calendar-header-margin-bottom`        | `12px`              | margin-bottom    | Space below the navigation header row.                                                  |
| `--calendar-header-font-size`            | `16px`              | font-size        | Font size of the month/year label in the header.                                        |
| `--calendar-header-font-weight`          | `600`               | font-weight      | Font weight of the month/year label.                                                    |
| `--calendar-header-color`                | `#000000`           | color            | Text color of the month/year label.                                                     |
| `--calendar-nav-button-size`             | `32px`              | width, height    | Size of the previous/next navigation arrow buttons.                                     |
| `--calendar-nav-button-border-radius`    | `4px`               | border-radius    | Corner rounding of the navigation arrow buttons.                                        |
| `--calendar-nav-button-color`            | `#666666`           | color            | Color of the navigation arrow SVG icons.                                                |
| `--calendar-nav-button-hover-background` | `#f0f0f0`           | background-color | Background color of the navigation arrows on hover.                                     |
| `--calendar-day-name-font-size`          | `12px`              | font-size        | Font size of the day-of-week header labels (Sun, Mon, etc.).                            |
| `--calendar-day-name-font-weight`        | `600`               | font-weight      | Font weight of the day-of-week header labels.                                           |
| `--calendar-day-name-color`              | `#999999`           | color            | Text color of the day-of-week header labels.                                            |
| `--calendar-day-name-padding`            | `4px 0`             | padding          | Padding of each day-of-week header cell.                                                |
| `--calendar-cell-size`                   | `36px`              | width, height    | Size of each day number cell in the grid.                                               |
| `--calendar-cell-font-size`              | `14px`              | font-size        | Font size of the day numbers.                                                           |
| `--calendar-cell-border-radius`          | `50%`               | border-radius    | Corner rounding of day cells. Use 50% for circles, a smaller value for rounded squares. |
| `--calendar-cell-color`                  | `#000000`           | color            | Text color of selectable day numbers.                                                   |
| `--calendar-cell-hover-background`       | `#f0f0f0`           | background-color | Background color of day cells on hover.                                                 |
| `--calendar-focus-ring-color`            | `#000000`           | outline-color    | Color of the focus ring shown on day cells when focused via keyboard.                   |
| `--calendar-today-border`                | `1px solid #000000` | border           | Border applied to today's date cell to distinguish it.                                  |
| `--calendar-today-font-weight`           | `700`               | font-weight      | Font weight of today's date number.                                                     |
| `--calendar-selected-background`         | `#000000`           | background-color | Background color of the selected date cell.                                             |
| `--calendar-selected-color`              | `#ffffff`           | color            | Text color of the selected date cell.                                                   |
| `--calendar-range-background`            | `#e8e8e8`           | background-color | Background color of cells between range start and end dates.                            |
| `--calendar-range-start-background`      | `#000000`           | background-color | Background color of the range start date cell.                                          |
| `--calendar-range-end-background`        | `#000000`           | background-color | Background color of the range end date cell.                                            |
| `--calendar-range-start-color`           | `#ffffff`           | color            | Text color of the range start date cell.                                                |
| `--calendar-range-end-color`             | `#ffffff`           | color            | Text color of the range end date cell.                                                  |
| `--calendar-disabled-color`              | `#cccccc`           | color            | Text color of disabled and out-of-range day numbers.                                    |
| `--calendar-disabled-cursor`             | `not-allowed`       | cursor           | Cursor shown when hovering over disabled day cells.                                     |
| `--calendar-outside-month-color`         | `#cccccc`           | color            | Text color of day numbers that belong to the previous or next month.                    |

## Internal Dependencies

This component uses the following library components internally:

- Button (for month navigation controls)

## Web Component

Tag: `<sui-calendar>`

```html
<sui-calendar mode="single" locale="en-US"></sui-calendar>
```

> **Note:** `value`, `rangeStart`, `rangeEnd`, `minDate`, `maxDate`, and `disabledDates` are object props — set them via JavaScript properties.
