# ChatHeader

A header bar for a chat surface: an optional avatar/brand mark, a title and subtitle, optional inline `actions`, and a close button (the `Button` component) that appears when `onclose` is provided. For arbitrary extra content (a toolbar, status line, tabs, model selector), pass a `children` snippet — it renders as a full-width second row below the main bar. The close icon falls back to a built-in asset and can be overridden with a snippet.

## Usage

```svelte
<script>
  import { ChatHeader } from '@juspay/svelte-ui-components';
</script>

<ChatHeader title="Shopping Assistant" subtitle="Online" onclose={() => {}} />
```

## Props

| Prop      | Type        | Required | Default   | Description                                                  |
| --------- | ----------- | -------- | --------- | ----------------------------------------------------------- |
| title     | `string`    | No       | `''`      | Title text. Hidden when empty.                              |
| subtitle  | `string`    | No       | `''`      | Subtitle text. Hidden when empty.                           |
| image     | `string`    | No       | `-`       | Optional brand image URL (rendered via `Img`). Off by default. |
| imageAlt  | `string`    | No       | `''`      | Alt text for the image.                                     |
| avatar    | `Snippet`   | No       | `-`       | Brand/avatar mark left of the title (takes precedence over `image`). |
| actions   | `Snippet`   | No       | `-`       | Extra actions right of the title (before close).            |
| closeIcon | `Snippet`   | No       | `-`       | Custom close icon. Falls back to the built-in asset.        |
| closeLabel| `string`    | No       | `'Close'` | Aria-label for the close button.                            |
| showClose | `boolean`   | No       | `-`       | Force the close button on/off (defaults to showing when `onclose` is set). |
| children  | `Snippet`   | No       | `-`       | Extra content rendered as a full-width second row below the main bar.        |
| testId    | `string`    | No       | `-`       | `data-pw` on the root element.                              |
| classes   | `string`    | No       | `-`       | Class string on the root element.                          |

## Events

| Event   | Type           | Description                              |
| ------- | -------------- | --------------------------------------- |
| onclose | `() => void`   | Fires when the close button is pressed. |

## CSS Variables

| Variable                                   | Default          | CSS Property     | Description                       |
| ------------------------------------------ | ---------------- | ---------------- | --------------------------------- |
| `--chat-header-width`                      | `100%`           | width            | Header width.                     |
| `--chat-header-padding`                    | `0.75rem 1.5rem` | padding          | Header padding.                   |
| `--chat-header-gap`                        | `12px`           | gap              | Gap between brand and trailing.   |
| `--chat-header-background`                 | `transparent`    | background       | Header background.                |
| `--chat-header-border-bottom`              | `none`           | border-bottom    | Header bottom border.             |
| `--chat-header-brand-gap`                  | `10px`           | gap              | Gap between avatar and titles.    |
| `--chat-header-extra-gap`                  | `8px`            | gap              | Gap between the main bar and the `children` row. |
| `--chat-header-image-size`                 | `28px`           | height/width     | Size of the header image.         |
| `--chat-header-image-border-radius`        | `50%`            | border-radius    | Header image corner rounding.     |
| `--chat-header-image-object-fit`           | `cover`          | object-fit       | Header image object-fit.          |
| `--chat-header-title-font-size`            | `0.95rem`        | font-size        | Title font size.                  |
| `--chat-header-title-font-weight`          | `600`            | font-weight      | Title weight.                     |
| `--chat-header-title-color`                | `#18181b`        | color            | Title color.                      |
| `--chat-header-subtitle-font-size`         | `0.7rem`         | font-size        | Subtitle font size.               |
| `--chat-header-subtitle-font-weight`       | `500`            | font-weight      | Subtitle weight.                  |
| `--chat-header-subtitle-color`             | `#71717a`        | color            | Subtitle color.                   |
| `--chat-header-subtitle-text-transform`    | `none`           | text-transform   | Subtitle text transform.          |
| `--chat-header-subtitle-letter-spacing`    | `normal`         | letter-spacing   | Subtitle letter spacing.          |
| `--chat-header-trailing-gap`               | `8px`            | gap              | Gap between actions and close.    |
| `--chat-header-close-size`                 | `36px`           | height/width     | Close button size.                |
| `--chat-header-close-padding`              | `8px`            | padding          | Close button padding.             |
| `--chat-header-close-border-radius`        | `50%`            | border-radius    | Close button corner rounding.     |
| `--chat-header-close-background-color`     | `transparent`    | background       | Close button background.          |
| `--chat-header-close-color`                | `#52525b`        | color            | Close icon color.                 |
| `--chat-header-close-hover-background-color`| `#f4f4f5`       | background       | Close button hover background.    |

## Web Component

Tag: `<sui-chat-header>`

```html
<sui-chat-header title="Assistant" subtitle="Online"></sui-chat-header>
```
