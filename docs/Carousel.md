# Carousel

A slideshow that renders Svelte components as slides, with opt-in autoplay (`autoplay`, off by default). Supports touch swipe (20px threshold) and mouse drag for navigation. Each slide is a `CarouselView` object containing a Svelte Component reference and optional properties. Shows optional dot indicators below the slides for direct navigation. The carousel width is read from the `--carousel-width` CSS variable at mount time. Built for rotating promotional content — when `autoplay` is on, it advances on its own (as opposed to `Book`, which never auto-advances and is manually paginated for a reading or onboarding flow rather than a rotating one).

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

| Prop              | Type             | Required | Default | Description                                                                                                                                                                                                                |
| ----------------- | ---------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| views             | `CarouselView[]` | Yes      | `-`     | Array of CarouselView objects. Each contains a Svelte Component reference and optional properties to pass to it.                                                                                                           |
| autoplay          | `boolean`        | No       | `false` | When true, the carousel automatically advances to the next slide at the autoplayInterval rate.                                                                                                                             |
| autoplayInterval  | `number`         | No       | `1000`  | Time in milliseconds between automatic slide transitions. Only used when autoplay is true.                                                                                                                                 |
| showDots          | `boolean`        | No       | `false` | When true, shows dot indicators below the carousel for direct slide navigation.                                                                                                                                            |
| isScrollableLast  | `boolean`        | No       | `false` | When true, allows scrolling past the last slide (wrapping to the first) and before the first slide (wrapping to the last).                                                                                                 |
| classes           | `string`         | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides (e.g., `.btn-primary { --button-color: #0070f3; }`) and pass them to create variant styles. |
| testId            | `string`         | No       | `-`     | `data-pw`/`testID` on the root element.                                                                                                                                                                                    |
| dotsWrapperTestId | `string`         | No       | `-`     | `data-pw`/`testID` on the dots wrapper (only rendered when `showDots` is true).                                                                                                                                            |
| dotTestId         | `string`         | No       | `-`     | Base `data-pw`/`testID` for each dot; each one gets `<dotTestId>-<index + 1>`.                                                                                                                                             |

### How a slide receives its properties

`view.properties` is **spread** onto the slide component, so a slide declares named props:

```svelte
<!-- slide component -->
<script lang="ts">
  let { title, description } = $props();
</script>
```

```svelte
views={[{ component: Card, properties: { title: 'Summer Sale', description: '...' } }]}
```

Before this was fixed the whole bag was passed under a single `properties` prop, which meant
no component taking named props — including every component in this library — ever received
its values; slides rendered empty unless the consumer wrote a purpose-built wrapper that
declared `properties` itself.

For those wrappers, `properties` is **still passed alongside the spread**, so they keep
working and this is not a breaking change. Reading `properties` is deprecated: prefer the
named props, which is the only form that works with the library's own components.

## Events

| Event     | Type                             | Description                                                  |
| --------- | -------------------------------- | ------------------------------------------------------------ |
| onkeydown | `(event: KeyboardEvent) => void` | Fires when a key is pressed while a dot indicator has focus. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                      | Default             | CSS Property   | Description                                                                                                                                                                              |
| ----------------------------- | ------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--carousel-width`            | `300px`             | width          | Width of the carousel container. Read by JS at mount time for slide positioning. Note: `.carousel-container` uses this variable without a fallback; inner elements fall back to `300px`. |
| `--carousel-height`           | `100px`             | height         | Height of the carousel slides.                                                                                                                                                           |
| `--carousel-shadow`           | `-`                 | box-shadow     | Box shadow of the carousel container.                                                                                                                                                    |
| `--carousel-border-radius`    | `0%`                | border-radius  | Corner rounding of the carousel container.                                                                                                                                               |
| `--carousel-dot-color`        | `#c4c4c4`           | background     | Background color of an inactive dot indicator.                                                                                                                                           |
| `--carousel-dot-active-color` | `#000000`           | background     | Background color of the active dot indicator.                                                                                                                                            |
| `--dot-gap`                   | `10px`              | gap            | Gap between dot indicators.                                                                                                                                                              |
| `--dot-padding-top`           | `10px`              | padding-top    | Top padding above the dot indicators.                                                                                                                                                    |
| `--dot-width`                 | `5px`               | width          | Width of each dot indicator.                                                                                                                                                             |
| `--dot-height`                | `5px`               | height         | Height of each dot indicator.                                                                                                                                                            |
| `--dot-focus-outline`         | `2px solid #000000` | outline        | Focus ring on a keyboard-focused dot.                                                                                                                                                    |
| `--dot-focus-outline-offset`  | `2px`               | outline-offset | Gap between a focused dot and its focus ring.                                                                                                                                            |

## Accessibility

- Dot indicators are `role="button"` and focusable (`tabindex="0"`), announced as buttons to assistive technology, with an `aria-label` naming the slide they jump to.
- Pressing Enter or Space on a focused dot navigates to that slide, the same as clicking it. `onkeydown` still fires afterward if you pass one — use it for anything additional, not as a required workaround.
- A focused dot shows a visible outline (`--dot-focus-outline`), so keyboard users can see which one is focused before activating it.

## Type Reference

Custom types used by this component's props and events:

### CarouselView

```typescript
type CarouselView = {
  properties?: Record<string, unknown>;
  component: Component<Record<string, unknown>>;
};
```

## Web Component

Tag: `<sui-carousel>`

```html
<sui-carousel autoplay show-dots></sui-carousel>
```

> **Note:** The `views` prop is an array — set it via JavaScript property.
