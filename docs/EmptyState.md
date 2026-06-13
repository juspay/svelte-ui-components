# EmptyState

A centered placeholder component for empty lists, search results, or views. Displays an optional icon/illustration, a required title, an optional description, and an optional action area (e.g. buttons). Inherits text color from its parent for seamless light/dark theme support.

## Usage

```svelte
<script>
  import { EmptyState, Button } from '@juspay/svelte-ui-components';
</script>

<EmptyState title="No results found" description="Try adjusting your search or filters.">
  {#snippet icon()}
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  {/snippet}
  <Button text="Clear filters" />
</EmptyState>
```

### Minimal (Text Only)

```svelte
<EmptyState title="Empty inbox" description="Messages you receive will show up here." />
```

### With Icon, No Action

```svelte
<EmptyState title="No notifications" description="You're all caught up!">
  {#snippet icon()}
    <svg>...</svg>
  {/snippet}
</EmptyState>
```

### Title Only (No Description)

```svelte
<EmptyState title="No results found" />
```

## Props

| Prop        | Type     | Required | Default | Description                                                                                                                                                            |
| ----------- | -------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| title       | `string` | Yes      | `-`     | Primary heading text displayed prominently.                                                                                                                            |
| description | `string` | No       | `-`     | Supporting text displayed below the title. The description row is omitted entirely when this prop is absent or empty.                                                  |
| classes     | `string` | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |
| testId      | `string` | No       | `-`     | Value applied to the `data-pw` attribute on the root element for test selection.                                                                                       |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet  | Type      | Description                                                                                                          |
| -------- | --------- | -------------------------------------------------------------------------------------------------------------------- |
| icon     | `Snippet` | Icon or illustration area above the title. Rendered inside a sized container with configurable dimensions and color. |
| children | `Snippet` | Action area below the description. Typically used for buttons like "Create new", "Clear filters", "Try again", etc.  |

## CSS Variables

Override these custom properties to theme the component.

| Variable                              | Default        | CSS Property  | Description                                                |
| ------------------------------------- | -------------- | ------------- | ---------------------------------------------------------- |
| `--empty-state-padding`               | `32px 16px`    | padding       | Padding of the empty state container.                      |
| `--empty-state-text-align`            | `center`       | text-align    | Text alignment of all content.                             |
| `--empty-state-gap`                   | `0px`          | gap           | Gap between flex children.                                 |
| `--empty-state-icon-size`             | `48px`         | width, height | Width and height of the icon container.                    |
| `--empty-state-icon-color`            | `currentColor` | color         | Color of the icon. Inherits from parent by default.        |
| `--empty-state-icon-opacity`          | `0.4`          | opacity       | Opacity of the icon for subtle visual treatment.           |
| `--empty-state-icon-margin-bottom`    | `16px`         | margin-bottom | Space below the icon container.                            |
| `--empty-state-title-font-size`       | `16px`         | font-size     | Font size of the title.                                    |
| `--empty-state-title-font-weight`     | `600`          | font-weight   | Font weight of the title.                                  |
| `--empty-state-title-color`           | `inherit`      | color         | Color of the title. Inherits from parent by default.       |
| `--empty-state-description-font-size` | `14px`         | font-size     | Font size of the description.                              |
| `--empty-state-description-color`     | `inherit`      | color         | Color of the description. Inherits from parent by default. |
| `--empty-state-description-opacity`   | `0.6`          | opacity       | Opacity of the description for visual hierarchy.           |
| `--empty-state-description-max-width` | `360px`        | max-width     | Maximum width of the description for readability.          |

## Web Component

Tag: `<sui-empty-state>`

```html
<sui-empty-state title="No results" description="Try a different search.">
  <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
  <button>Clear filters</button>
</sui-empty-state>
```

### Slots

| Slot Name | Maps to Snippet | Description                                                  |
| --------- | --------------- | ------------------------------------------------------------ |
| `icon`    | `icon`          | Icon or illustration content displayed above the title.      |
| (default) | `children`      | Action content (buttons, links) displayed below description. |
