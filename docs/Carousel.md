# Carousel

An auto-playing slideshow that renders Svelte components as slides. Supports touch swipe (20px threshold) and mouse drag for navigation. Each slide is a `CarouselView` object containing a Svelte Component reference and optional properties. Shows optional dot indicators below the slides for direct navigation. The carousel width is read from the `--carousel-width` CSS variable at mount time.

## Usage

```svelte
<script>
  import { Carousel } from '@juspay/svelte-ui-components';
</script>

<Carousel
  views={/* CarouselView[] */}
/>
```

## Props

| Prop             | Type             | Required | Default | Description                                                                                                                                                                                                                |
| ---------------- | ---------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| views            | `CarouselView[]` | Yes      | `-`     | Array of CarouselView objects. Each contains a Svelte Component reference and optional properties to pass to it.                                                                                                           |
| autoplay         | `boolean`        | No       | `false` | When true, the carousel automatically advances to the next slide at the autoplayInterval rate.                                                                                                                             |
| autoplayInterval | `number`         | No       | `1000`  | Time in milliseconds between automatic slide transitions. Only used when autoplay is true.                                                                                                                                 |
| showDots         | `boolean`        | No       | `false` | When true, shows dot indicators below the carousel for direct slide navigation.                                                                                                                                            |
| isScrollableLast | `boolean`        | No       | `false` | When true, allows scrolling past the last slide (wrapping to the first) and before the first slide (wrapping to the last).                                                                                                 |
| classes          | `string`         | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides (e.g., `.btn-primary { --button-color: #0070f3; }`) and pass them to create variant styles. |

## Events

| Event     | Type                             | Description                                                  |
| --------- | -------------------------------- | ------------------------------------------------------------ |
| onkeydown | `(event: KeyboardEvent) => void` | Fires when a key is pressed while a dot indicator has focus. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                   | Default | CSS Property  | Description                                                                      |
| -------------------------- | ------- | ------------- | -------------------------------------------------------------------------------- |
| `--carousel-width`         | `-`     | width         | Width of the carousel container. Read by JS at mount time for slide positioning. |
| `--carousel-height`        | `100px` | height        | Height of the carousel slides.                                                   |
| `--carousel-shadow`        | `-`     | box-shadow    | Box shadow of the carousel container.                                            |
| `--carousel-border-radius` | `0%`    | border-radius | Corner rounding of the carousel container.                                       |
| `--dot-gap`                | `10px`  | gap           | Gap between dot indicators.                                                      |
| `--dot-padding-top`        | `10px`  | padding-top   | Top padding above the dot indicators.                                            |
| `--dot-width`              | `5px`   | width         | Width of each dot indicator.                                                     |
| `--dot-height`             | `5px`   | height        | Height of each dot indicator.                                                    |

## Type Reference

Custom types used by this component's props and events:

### CarouselView

```typescript
type CarouselView = {
  properties?: Record<string, unknown>;
  component: Component<Record<string, unknown>>;
};
```
