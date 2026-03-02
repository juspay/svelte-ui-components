# KeyboardInput

Renders keyboard shortcut badges inline. Each key is displayed in a styled `<kbd>` element with separators between them. Accepts keys as a string array or a single string that is split by the separator. Common modifier keys are automatically rendered as platform-aware symbols.

## Usage

```svelte
<script>
  import { KeyboardInput } from '@juspay/svelte-ui-components';
</script>

<KeyboardInput keys={['Ctrl', 'K']} />

<KeyboardInput keys="Cmd+Shift+P" />
```

## Props

| Prop      | Type                             | Required | Default    | Description                                                                                                                                                                                                                       |
| --------- | -------------------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| keys      | `string[] \| string`             | Yes      | `-`        | The keys to display. Pass an array of individual key labels (e.g. `['Ctrl', 'K']`) or a single string with keys separated by the separator character (e.g. `"Ctrl+K"`). When a string is given it is split by the separator prop. |
| separator | `string`                         | No       | `"+"`      | The character displayed between key badges and used to split a string `keys` value into individual keys.                                                                                                                          |
| size      | `'small' \| 'medium' \| 'large'` | No       | `"medium"` | Controls the overall font size and internal padding of each key badge.                                                                                                                                                            |
| testId    | `string`                         | No       | `-`        | Value for the `data-pw` attribute on the root element, used for end-to-end testing selectors.                                                                                                                                     |
| classes   | `string`                         | No       | `-`        | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                            |

## Events

| Event   | Type                          | Description                                       |
| ------- | ----------------------------- | ------------------------------------------------- |
| onclick | `(event: MouseEvent) => void` | Fires when the keyboard input element is clicked. |

## Key Symbols

The component automatically converts common modifier key names (case-insensitive) into their typographic symbols:

| Input                            | Symbol  | Description        |
| -------------------------------- | ------- | ------------------ |
| `Cmd` / `Command`                | &#8984; | macOS Command key  |
| `Ctrl` / `Control`               | &#8963; | Control key        |
| `Alt` / `Option`                 | &#8997; | Alt / Option key   |
| `Shift`                          | &#8679; | Shift key          |
| `Enter`                          | &#8629; | Enter / Return key |
| `Backspace`                      | &#9003; | Backspace key      |
| `Delete`                         | &#8998; | Forward delete key |
| `Tab`                            | &#8677; | Tab key            |
| `Escape` / `Esc`                 | Esc     | Escape key         |
| `Up` / `Down` / `Left` / `Right` | Arrow   | Arrow keys         |
| `Space`                          | &#9251; | Space bar          |

Any key name not in this list is rendered as-is (e.g. `"K"` stays `"K"`).

## CSS Variables

Override these custom properties to theme the component.

| Variable                               | Default             | CSS Property     | Description                                                                       |
| -------------------------------------- | ------------------- | ---------------- | --------------------------------------------------------------------------------- |
| `--keyboard-input-gap`                 | `4px`               | gap              | Spacing between key badges and separators.                                        |
| `--keyboard-input-font-family`         | `inherit`           | font-family      | Font family for the entire component.                                             |
| `--keyboard-input-cursor`              | `default`           | cursor           | Cursor style when hovering over the component.                                    |
| `--keyboard-input-separator-color`     | `#888888`           | color            | Text color of the separator character between keys.                               |
| `--keyboard-input-separator-font-size` | `0.85em`            | font-size        | Font size of the separator character.                                             |
| `--keyboard-input-key-font-family`     | `inherit`           | font-family      | Font family for individual key badges.                                            |
| `--keyboard-input-key-font-weight`     | `500`               | font-weight      | Font weight of the key text.                                                      |
| `--keyboard-input-key-color`           | `#333333`           | color            | Text color inside key badges.                                                     |
| `--keyboard-input-key-background`      | `#f5f5f5`           | background-color | Background color of key badges.                                                   |
| `--keyboard-input-key-border`          | `1px solid #d1d1d1` | border           | Border of key badges.                                                             |
| `--keyboard-input-key-border-radius`   | `4px`               | border-radius    | Corner rounding of key badges.                                                    |
| `--keyboard-input-key-box-shadow`      | `0 1px 0 #c4c4c4`   | box-shadow       | Shadow below key badges giving a raised keyboard key effect.                      |
| `--keyboard-input-key-min-width`       | `1.6em`             | min-width        | Minimum width of each key badge (ensures narrow keys like "K" are not too small). |
| `--keyboard-input-key-padding`         | `2px 6px`           | padding          | Inner padding of key badges (medium size).                                        |
| `--keyboard-input-font-size-small`     | `11px`              | font-size        | Font size at the small size variant.                                              |
| `--keyboard-input-key-padding-small`   | `1px 4px`           | padding          | Inner padding of key badges at the small size variant.                            |
| `--keyboard-input-key-min-width-small` | `1.4em`             | min-width        | Minimum width of key badges at the small size variant.                            |
| `--keyboard-input-font-size-medium`    | `13px`              | font-size        | Font size at the medium size variant.                                             |
| `--keyboard-input-font-size-large`     | `15px`              | font-size        | Font size at the large size variant.                                              |
| `--keyboard-input-key-padding-large`   | `3px 8px`           | padding          | Inner padding of key badges at the large size variant.                            |
| `--keyboard-input-key-min-width-large` | `1.8em`             | min-width        | Minimum width of key badges at the large size variant.                            |

## Type Reference

```typescript
type KeyboardInputSize = 'small' | 'medium' | 'large';

type KeyboardInputProperties = MandatoryKeyboardInputProperties &
  OptionalKeyboardInputProperties &
  KeyboardInputEventProperties;

type MandatoryKeyboardInputProperties = {
  keys: string[] | string;
};

type OptionalKeyboardInputProperties = {
  separator?: string;
  size?: KeyboardInputSize;
  testId?: string;
};

type KeyboardInputEventProperties = {
  onclick?: (event: MouseEvent) => void;
};
```
