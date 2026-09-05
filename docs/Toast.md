# Toast

An animated notification that slides in from a configurable direction, stays visible for `duration` milliseconds, then slides out and fires `ontoasthide`. Supports type variants (success/error/info/warn) that apply different background colors. The toast can overlap the page (absolute positioning) or be inline (relative). Has optional left icon, right icon (acts as close button), subtext, and bottom content snippet.

## Usage

```svelte
<script>
  import { Toast } from '@juspay/svelte-ui-components';
</script>

<Toast />
```

## Props

| Prop                 | Type                                                                                        | Required | Default | Description                                                                                                                                                                                                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| duration             | `number`                                                                                    | No       | `2000`  | Time in milliseconds the toast stays visible before automatically hiding. The auto-dismiss timer resets whenever `message` or `duration` changes — the toast stays visible for another full `duration` milliseconds from the moment of the prop update. This makes it safe to update a live toast's text or duration without it prematurely hiding. |
| leftIcon             | `string \| null`                                                                            | No       | `-`     | URL of an icon displayed on the left side of the toast (e.g., a status icon).                                                                                                                                                                                                                                                                       |
| message              | `string`                                                                                    | No       | `''`    | The main toast notification text.                                                                                                                                                                                                                                                                                                                   |
| subtext              | `string \| null`                                                                            | No       | `-`     | Optional secondary text displayed below the main message in smaller font.                                                                                                                                                                                                                                                                           |
| rightIcon            | `string \| null`                                                                            | No       | `-`     | URL of an icon displayed on the right side. Acts as a close button — clicking it hides the toast immediately.                                                                                                                                                                                                                                       |
| type                 | `ToastType \| null`                                                                         | No       | `-`     | Visual variant that sets the background color: 'success' (green), 'error' (red), 'info' (light blue), 'warn' (orange).                                                                                                                                                                                                                              |
| direction            | `ToastDirection = 'left-to-right' \| 'right-to-left' \| 'top-to-bottom' \| 'bottom-to-top'` | No       | `-`     | The direction from which the toast slides in/out. Controls the fly animation axis and direction.                                                                                                                                                                                                                                                    |
| overlapPage          | `boolean`                                                                                   | No       | `true`  | When true, the toast is absolutely positioned and overlaps page content. When false, it's relatively positioned and pushes content.                                                                                                                                                                                                                 |
| inAnimationOffset    | `number \| null`                                                                            | No       | `-`     | Pixel offset for the fly-in animation. Higher values mean the toast starts further away.                                                                                                                                                                                                                                                            |
| inAnimationDuration  | `number \| null`                                                                            | No       | `-`     | Duration in milliseconds for the fly-in animation.                                                                                                                                                                                                                                                                                                  |
| outAnimationOffset   | `number \| null`                                                                            | No       | `-`     | Pixel offset for the fly-out animation. Higher values mean the toast exits further away.                                                                                                                                                                                                                                                            |
| outAnimationDuration | `number \| null`                                                                            | No       | `-`     | Duration in milliseconds for the fly-out animation.                                                                                                                                                                                                                                                                                                 |
| testId               | `string \| null`                                                                            | No       | `-`     | Value for data-pw on the toast container.                                                                                                                                                                                                                                                                                                           |
| messageTestId        | `string`                                                                                    | No       | `-`     | Value for data-pw on the message element.                                                                                                                                                                                                                                                                                                           |
| subTextTestId        | `string`                                                                                    | No       | `-`     | Value for data-pw on the subtext element.                                                                                                                                                                                                                                                                                                           |
| closeIconTestId      | `string`                                                                                    | No       | `-`     | Value for data-pw on the close (right icon) button.                                                                                                                                                                                                                                                                                                 |
| classes              | `string`                                                                                    | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                                                                                                                                              |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet       | Type      | Description                                                          |
| ------------- | --------- | -------------------------------------------------------------------- |
| bottomContent | `Snippet` | A Svelte 5 Snippet rendered below the message text inside the toast. |

## Events

| Event       | Type         | Description                                                                                                                   |
| ----------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| ontoasthide | `() => void` | Fires after the toast has fully animated out (outro animation complete). Use this to clean up or remove the toast from state. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                               | Default                                  | CSS Property     | Description                                                                                                                                                                                                                                                                             |
| -------------------------------------- | ---------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--toast-padding`                      | `10px`                                   | padding          | Padding inside the toast container.                                                                                                                                                                                                                                                     |
| `--toast-font-size`                    | `14px`                                   | font-size        | Font size of the toast text.                                                                                                                                                                                                                                                            |
| `--toast-font-family`                  | `inherit`                                | font-family      | Font family of the toast text.                                                                                                                                                                                                                                                          |
| `--toast-font-weight`                  | `-`                                      | font-weight      | Font weight of the toast text.                                                                                                                                                                                                                                                          |
| `--toast-height`                       | `fit-content`                            | height           | Height of the toast container.                                                                                                                                                                                                                                                          |
| `--toast-border-radius`                | `0px`                                    | border-radius    | Corner rounding of the toast.                                                                                                                                                                                                                                                           |
| `--toast-border`                       | `none`                                   | border           | Border of the toast.                                                                                                                                                                                                                                                                    |
| `--toast-border-style`                 | `-`                                      | border-style     |                                                                                                                                                                                                                                                                                         |
| `--toast-width`                        | `fit-content`                            | width            | Width of the toast container.                                                                                                                                                                                                                                                           |
| `--toast-align-items`                  | `center`                                 | align-items      | Vertical alignment of content inside the toast.                                                                                                                                                                                                                                         |
| `--toast-margin`                       | `0px 10px 10px 10px`                     | margin           | Outer margin of the toast.                                                                                                                                                                                                                                                              |
| `--toast-justify-content`              | `space-between`                          | justify-content  | Horizontal alignment of content inside the toast.                                                                                                                                                                                                                                       |
| `--toast-z-index`                      | `1000`                                   | z-index          | Z-index stacking order of the toast.                                                                                                                                                                                                                                                    |
| `--toast-display`                      | `flex`                                   | display          | Display mode of the toast.                                                                                                                                                                                                                                                              |
| `--toast-position`                     | `absolute`                               | position         | CSS position of the toast (absolute overlaps page, relative is inline).                                                                                                                                                                                                                 |
| `--toast-top`                          | `10px`                                   | top              | Top position of the toast.                                                                                                                                                                                                                                                              |
| `--toast-left`                         | `0`                                      | left             | Left position of the toast.                                                                                                                                                                                                                                                             |
| `--toast-right`                        | `0`                                      | right            | Right position of the toast.                                                                                                                                                                                                                                                            |
| `--toast-bottom`                       | `auto`                                   | bottom           | Bottom position of the toast. Combine with `--toast-top: auto` to anchor to the bottom edge instead of the top.                                                                                                                                                                         |
| `--toast-background-color`             | `#87ceeb`                                | background-color | Default background color of the toast.                                                                                                                                                                                                                                                  |
| `--toast-opacity`                      | `1`                                      | opacity          | Opacity of the toast.                                                                                                                                                                                                                                                                   |
| `--toast-pointer-events`               | `none`                                   | pointer-events   | A toast is a transient status overlay, not a click target — it floats above page content and clicks pass through to what's beneath it by default (the close button and any interactive `bottomContent` re-enable their own hit areas). Set to `auto` to make the whole toast clickable. |
| `--toast-box-sizing`                   | `-`                                      | box-sizing       |                                                                                                                                                                                                                                                                                         |
| `--toast-icon-wrapper-width`           | `20px`                                   | width            |                                                                                                                                                                                                                                                                                         |
| `--toast-icon-wrapper-height`          | `20px`                                   | height           |                                                                                                                                                                                                                                                                                         |
| `--toast-icon-margin`                  | `0px 6px 0px 0px`                        | margin           | Margin around the left icon.                                                                                                                                                                                                                                                            |
| `--toast-icon-wrapper-padding`         | `1px`                                    | padding          |                                                                                                                                                                                                                                                                                         |
| `--toast-icon-height`                  | `100%`                                   | height           | Height of the toast icons.                                                                                                                                                                                                                                                              |
| `--toast-icon-filter`                  | `none`                                   | filter           | CSS filter applied to the toast icons.                                                                                                                                                                                                                                                  |
| `--toast-icon-border-radius`           | `50%`                                    | border-radius    | Corner rounding of the toast icons.                                                                                                                                                                                                                                                     |
| `--toast-message-display`              | `flex`                                   | display          |                                                                                                                                                                                                                                                                                         |
| `--toast-message-flex`                 | `1`                                      | flex             |                                                                                                                                                                                                                                                                                         |
| `--toast-message-padding`              | `1px`                                    | padding          |                                                                                                                                                                                                                                                                                         |
| `--toast-subtext-color`                | `#c7c7c7`                                | color            | Color of the subtext.                                                                                                                                                                                                                                                                   |
| `--toast-subtext-font-size`            | `10px`                                   | font-size        | Font size of the subtext.                                                                                                                                                                                                                                                               |
| `--toast-subtext-font-weight`          | `400`                                    | font-weight      | Font weight of the subtext.                                                                                                                                                                                                                                                             |
| `--toast-subtext-margin`               | `10px 0px 0px 0px`                       | margin           | Margin around the subtext.                                                                                                                                                                                                                                                              |
| `--toast-close-button-width`           | `20px`                                   | width            | Width of the close (right icon) button area.                                                                                                                                                                                                                                            |
| `--toast-close-button-height`          | `20px`                                   | height           | Height of the close button area.                                                                                                                                                                                                                                                        |
| `--toast-close-button-cursor`          | `pointer`                                | cursor           | Cursor of the close button.                                                                                                                                                                                                                                                             |
| `--toast-close-button-gap`             | `6px`                                    | gap              |                                                                                                                                                                                                                                                                                         |
| `--toast-close-button-margin`          | `0px 0px 0px 10px`                       | margin           | Margin around the close button.                                                                                                                                                                                                                                                         |
| `--toast-close-button-display`         | `flex`                                   | display          |                                                                                                                                                                                                                                                                                         |
| `--toast-close-button-align-items`     | `center`                                 | align-items      |                                                                                                                                                                                                                                                                                         |
| `--toast-close-button-justify-content` | `center`                                 | justify-content  |                                                                                                                                                                                                                                                                                         |
| `--toast-close-button-padding`         | `1px`                                    | padding          |                                                                                                                                                                                                                                                                                         |
| `--toast-success-text`                 | `#fff`                                   | color            | Text color for 'success' type toast.                                                                                                                                                                                                                                                    |
| `--toast-success-background-color`     | `var(--toast-background-color, #24aa5a)` | background-color | Background color for 'success' type toast.                                                                                                                                                                                                                                              |
| `--toast-success-border`               | `-`                                      | --toast-border   | Border for 'success' type toast.                                                                                                                                                                                                                                                        |
| `--toast-info-text`                    | `#fff`                                   | color            | Text color for 'info' type toast.                                                                                                                                                                                                                                                       |
| `--toast-info-background-color`        | `var(--toast-background-color, #87ceeb)` | background-color | Background color for 'info' type toast.                                                                                                                                                                                                                                                 |
| `--toast-info-border`                  | `-`                                      | --toast-border   | Border for 'info' type toast.                                                                                                                                                                                                                                                           |
| `--toast-warn-text`                    | `#fff`                                   | color            | Text color for 'warn' type toast.                                                                                                                                                                                                                                                       |
| `--toast-warn-background-color`        | `var(--toast-background-color, #f3a42d)` | background-color | Background color for 'warn' type toast.                                                                                                                                                                                                                                                 |
| `--toast-warn-border`                  | `-`                                      | --toast-border   | Border for 'warn' type toast.                                                                                                                                                                                                                                                           |
| `--toast-error-text`                   | `#fff`                                   | color            | Text color for 'error' type toast.                                                                                                                                                                                                                                                      |
| `--toast-error-background-color`       | `var(--toast-background-color, #f04438)` | background-color | Background color for 'error' type toast.                                                                                                                                                                                                                                                |
| `--toast-error-border`                 | `-`                                      | --toast-border   | Border for 'error' type toast.                                                                                                                                                                                                                                                          |

## Type Reference

Custom types used by this component's props and events:

### ToastType

```typescript
type ToastType = 'success' | 'error' | 'info' | 'warn';
```

### ToastDirection

```typescript
type ToastDirection = 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';
```

### MandatoryToastProperties

The required props subset — useful for typing wrapper components that forward to Toast.

```typescript
type MandatoryToastProperties = {
  message: string;
};
```

### OptionalToastProperties

The optional props subset.

```typescript
type OptionalToastProperties = {
  duration?: number;
  leftIcon?: string | null;
  subtext?: string | null;
  rightIcon?: string | null;
  type?: ToastType | null;
  direction?: ToastDirection;
  overlapPage?: boolean;
  inAnimationOffset?: number | null;
  inAnimationDuration?: number | null;
  outAnimationOffset?: number | null;
  outAnimationDuration?: number | null;
  testId?: string | null;
  messageTestId?: string;
  subTextTestId?: string;
  closeIconTestId?: string;
  bottomContent?: Snippet;
  classes?: string;
};
```

### ToastEventProperties

The event handler props subset.

```typescript
type ToastEventProperties = {
  onToastHide?: () => void;
};
```

`ToastProperties = MandatoryToastProperties & OptionalToastProperties & ToastEventProperties`

## Web Component

Tag: `<sui-toast>`

```html
<sui-toast message="Saved!" type="success" duration="3000">
  <a slot="bottom-content" href="/undo">Undo</a>
</sui-toast>
```

### Slots

| Slot Name        | Maps to Snippet | Description                               |
| ---------------- | --------------- | ----------------------------------------- |
| `bottom-content` | `bottomContent` | Content rendered below the toast message. |
