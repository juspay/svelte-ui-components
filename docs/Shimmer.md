# Shimmer

A loading placeholder element with an animated shimmer/shine effect. Renders a single rectangle with a sweeping highlight gradient that moves left-to-right continuously. All visual properties (size, shape, colors, speed) are controlled entirely via CSS variables. Use multiple Shimmer elements with different CSS variable values to build skeleton loading layouts.

## Usage

```svelte
<script>
  import { Shimmer } from '@juspay/svelte-ui-components';
</script>

<Shimmer />
```

### Building a Skeleton Layout

```svelte
<div class="skeleton-card">
  <Shimmer />
  <Shimmer />
  <Shimmer />
</div>

<style>
  .skeleton-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }

  .skeleton-card :nth-child(1) {
    --shimmer-height: 120px;
    --shimmer-border-radius: 8px;
  }

  .skeleton-card :nth-child(2) {
    --shimmer-width: 60%;
    --shimmer-height: 20px;
  }

  .skeleton-card :nth-child(3) {
    --shimmer-width: 40%;
    --shimmer-height: 14px;
  }
</style>
```

## Props

| Prop    | Type     | Required | Default | Description                                                                                                                                                            |
| ------- | -------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| testId  | `string` | No       | `-`     | Value for the `data-pw` attribute on the shimmer element, used for Playwright selectors.                                                                               |
| classes | `string` | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                  | Default                    | CSS Property       | Description                                               |
| ------------------------- | -------------------------- | ------------------ | --------------------------------------------------------- |
| `--shimmer-width`         | `100%`                     | width              | Width of the shimmer rectangle.                           |
| `--shimmer-height`        | `16px`                     | height             | Height of the shimmer rectangle.                          |
| `--shimmer-border-radius` | `4px`                      | border-radius      | Corner rounding of the shimmer rectangle.                 |
| `--shimmer-background`    | `#e0e0e0`                  | background-color   | Base background color of the shimmer.                     |
| `--shimmer-highlight`     | `rgba(255, 255, 255, 0.4)` | gradient color     | Color of the sweeping highlight in the shimmer animation. |
| `--shimmer-duration`      | `1.5s`                     | animation-duration | Duration of one complete shimmer animation cycle.         |
| `--shimmer-opacity`       | `1`                        | opacity            | Opacity of the shimmer element.                           |

## Web Component

Tag: `<sui-shimmer>`

```html
<sui-shimmer></sui-shimmer>
```
