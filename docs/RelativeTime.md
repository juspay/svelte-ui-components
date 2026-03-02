# RelativeTime

Displays a human-readable relative time string (e.g., "5 minutes ago", "in 3 hours") that auto-updates at a configurable interval. Uses `Intl.RelativeTimeFormat` for locale-aware formatting. Renders a semantic `<time>` element with an ISO `datetime` attribute. Optionally wraps the text in a Tooltip showing the full date and time.

## Usage

```svelte
<script>
  import { RelativeTime } from '@juspay/svelte-ui-components';
</script>

<RelativeTime date={new Date('2025-12-25T00:00:00')} />
```

### With Tooltip

```svelte
<RelativeTime date="2025-01-15T10:30:00Z" tooltip />
```

### Short Format

```svelte
<RelativeTime date={Date.now() - 300000} format="short" />
<!-- Renders: "5 min. ago" -->
```

## Props

| Prop           | Type                            | Required | Default  | Description                                                                                                                                                            |
| -------------- | ------------------------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| date           | `Date \| string \| number`      | Yes      | `-`      | The target date to compute relative time from. Accepts a `Date` object, an ISO date string, or a Unix timestamp in milliseconds.                                       |
| locale         | `string`                        | No       | `-`      | BCP 47 locale tag for formatting (e.g., `'en-US'`, `'fr'`, `'ja'`). Defaults to the browser's locale when not specified.                                               |
| format         | `'long' \| 'short' \| 'narrow'` | No       | `'long'` | The formatting style. `'long'` = "5 minutes ago", `'short'` = "5 min. ago", `'narrow'` = "5m ago".                                                                     |
| updateInterval | `number`                        | No       | `60000`  | How often (in milliseconds) to recalculate the relative time string. Set to `0` to disable auto-updates.                                                               |
| tooltip        | `boolean`                       | No       | `false`  | When true, wraps the time element in a Tooltip that shows the full date and time on hover (e.g., "Wednesday, January 15, 2025 at 10:30 AM").                           |
| testId         | `string`                        | No       | `-`      | Value for the `data-pw` attribute on the `<time>` element, used for Playwright selectors.                                                                              |
| classes        | `string`                        | No       | `-`      | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                      | Default   | CSS Property | Description                                  |
| ----------------------------- | --------- | ------------ | -------------------------------------------- |
| `--relative-time-font-size`   | `14px`    | font-size    | Font size of the relative time text.         |
| `--relative-time-font-weight` | `400`     | font-weight  | Font weight of the relative time text.       |
| `--relative-time-font-family` | `-`       | font-family  | Font family of the relative time text.       |
| `--relative-time-color`       | `inherit` | color        | Text color of the relative time.             |
| `--relative-time-cursor`      | `default` | cursor       | Cursor style when hovering the time element. |

## Type Reference

Custom types used by this component's props:

### RelativeTimeFormat

```typescript
type RelativeTimeFormat = 'long' | 'short' | 'narrow';
```

## Internal Dependencies

This component uses the following library components internally:

- Tooltip (when `tooltip` prop is true)
