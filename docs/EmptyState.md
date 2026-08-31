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

| Prop               | Type      | Required | Default | Description                                                                                                                                                                         |
| ------------------ | --------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| title              | `string`  | Yes      | `-`     | Primary heading text. When `titleSnippet` is provided this value is not rendered, but the prop is still required for backward-compatibility (pass `""` as the minimal valid value). |
| description        | `string`  | No       | `-`     | Supporting text displayed below the title. Omitted entirely when absent or empty. Silently discarded when `descriptionSnippet` is provided.                                         |
| titleSnippet       | `Snippet` | No       | `-`     | Optional snippet that replaces the `title` string at render time. Use for rich markup (e.g. formatted text, inline icons). Takes full rendering priority over `title`.              |
| descriptionSnippet | `Snippet` | No       | `-`     | Optional snippet that replaces the `description` string at render time. Use for rich markup (e.g. links, emphasis). Takes full rendering priority over `description`.               |
| classes            | `string`  | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.              |
| testId             | `string`  | No       | `-`     | Value applied to the `data-pw` attribute on the root element for test selection. When supplied, the title and rendered description wrappers receive `${testId}-title` and `${testId}-description` respectively; no description wrapper is added when no description is rendered. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet            | Type      | Description                                                                                                                                                       |
| ------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| icon               | `Snippet` | Icon or illustration area above the title. Rendered inside a sized container with configurable dimensions and color.                                              |
| titleSnippet       | `Snippet` | Rich-markup override for the title area. When provided, it takes full rendering priority over the `title` string prop — only the snippet is rendered.             |
| descriptionSnippet | `Snippet` | Rich-markup override for the description area. When provided, it takes full rendering priority over the `description` string prop — only the snippet is rendered. |
| children           | `Snippet` | Action area below the description. Typically used for buttons like "Create new", "Clear filters", "Try again", etc.                                               |

### Rich-Markup Title and Description via Snippets

Use `titleSnippet` and `descriptionSnippet` when the plain string props are not enough — for example, to add inline icons, links, or formatted text.

```svelte
<script>
  import { EmptyState, Button } from '@juspay/svelte-ui-components';
</script>

<!-- Rich title with an inline badge -->
<EmptyState title="No results">
  {#snippet titleSnippet()}
    <span>No results <em>yet</em></span>
  {/snippet}
  {#snippet descriptionSnippet()}
    Try a <a href="/help">different search</a> or clear your filters.
  {/snippet}
  <Button text="Clear filters" />
</EmptyState>
```

```svelte
<!-- Minimal snippet usage — title only -->
<EmptyState title="">
  {#snippet titleSnippet()}
    <strong>Nothing here</strong> — check back later
  {/snippet}
</EmptyState>
```

## CSS Variables

Override these custom properties to theme the component.

| Variable                                | Default        | CSS Property    | Description                                                                                 |
| --------------------------------------- | -------------- | --------------- | ------------------------------------------------------------------------------------------- |
| `--empty-state-padding`                 | `32px 16px`    | padding         | Padding of the empty state container.                                                       |
| `--empty-state-text-align`              | `center`       | text-align      | Text alignment of all content.                                                              |
| `--empty-state-gap`                     | `0px`          | gap             | Gap between flex children.                                                                  |
| `--empty-state-icon-size`               | `48px`         | width, height   | Width and height of the icon container.                                                     |
| `--empty-state-icon-color`              | `currentColor` | color           | Color of the icon. Inherits from parent by default.                                         |
| `--empty-state-icon-opacity`            | `0.4`          | opacity         | Opacity of the icon for subtle visual treatment.                                            |
| `--empty-state-icon-margin-bottom`      | `16px`         | margin-bottom   | Space below the icon container.                                                             |
| `--empty-state-title-font-size`         | `16px`         | font-size       | Font size of the title.                                                                     |
| `--empty-state-title-font-weight`       | `600`          | font-weight     | Font weight of the title.                                                                   |
| `--empty-state-title-color`             | `inherit`      | color           | Color of the title. Inherits from parent by default.                                        |
| `--empty-state-description-font-size`   | `14px`         | font-size       | Font size of the description.                                                               |
| `--empty-state-description-color`       | `inherit`      | color           | Color of the description. Inherits from parent by default.                                  |
| `--empty-state-description-opacity`     | `0.6`          | opacity         | Opacity of the description for visual hierarchy.                                            |
| `--empty-state-description-max-width`   | `360px`        | max-width       | Maximum width of the description for readability.                                           |
| `--empty-state-actions-display`         | `block`        | display         | Display mode of the actions container. Set to `flex` to lay out actions in a row or column. |
| `--empty-state-actions-flex-direction`  | `row`          | flex-direction  | Direction of the actions when `display` is `flex` (e.g. `column` to stack buttons).         |
| `--empty-state-actions-align-items`     | `stretch`      | align-items     | Cross-axis alignment of the actions when `display` is `flex` (e.g. `center`).               |
| `--empty-state-actions-justify-content` | `normal`       | justify-content | Main-axis alignment of the actions when `display` is `flex`.                                |
| `--empty-state-actions-gap`             | `0`            | gap             | Gap between action items when `display` is `flex`.                                          |
| `--empty-state-actions-margin-top`      | `16px`         | margin-top      | Space above the actions container.                                                          |

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

| Slot Name             | Maps to Snippet      | Description                                                  |
| --------------------- | -------------------- | ------------------------------------------------------------ |
| `icon`                | `icon`               | Icon or illustration content displayed above the title.      |
| `title-snippet`       | `titleSnippet`       | Rich-markup override for the title area.                     |
| `description-snippet` | `descriptionSnippet` | Rich-markup override for the description area.               |
| (default)             | `children`           | Action content (buttons, links) displayed below description. |
