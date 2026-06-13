# Img

An image component with automatic fallback. If the primary `src` fails to load (onerror), it switches to the `fallback` URL. The fallback only triggers once (won't loop if fallback also fails). Supports hover styling for interactive image use cases, and opt-in SVG inlining (`inlineSvg` / `transformSvg`) so icons can be recoloured by page CSS or a transform hook.

## Usage

```svelte
<script>
  import { Img } from '@juspay/svelte-ui-components';
</script>

<Img src={'...'} alt={'...'} />
```

## Props

| Prop     | Type             | Required | Default | Description                                                                                                                                                            |
| -------- | ---------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| src      | `string`         | Yes      | `-`     | The primary image URL to display.                                                                                                                                      |
| alt      | `string`         | Yes      | `-`     | Alt text for the image.                                                                                                                                                |
| fallback | `string \| null` | No       | `-`     | Fallback image URL. If the primary src fails to load (onerror), the component switches to this URL.                                                                    |
| testId   | `string`         | No       | `-`     | Test identifier applied as `data-pw` attribute on the `<img>` element for Playwright test selectors.                                                                  |
| classes  | `string`         | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |
| inlineSvg | `boolean`       | No       | `false` | Fetch `.svg` / `data:image/svg+xml` sources and inline their markup into an `<svg>` host so page CSS (`currentColor`, fill/stroke overrides) applies. Non-SVG sources always render the plain `<img>`. If fetching or parsing fails, the component falls back to the plain `<img>` (and from there to the regular `fallback`/`onerror` chain). |
| transformSvg | `(svg: string) => string` | No | `-` | Hook to rewrite the fetched SVG markup before it is inlined (e.g. recolour hardcoded fills). Providing a transform implies `inlineSvg`. The inlining effect re-runs when the prop identity changes, so a closure over reactive state (e.g. a theme colour) re-renders live. JS-only prop (not exposed as a web-component attribute). |

## SVG inlining

With `inlineSvg` (or any `transformSvg`), SVG sources are fetched and their markup is inlined into an `<svg>` host element instead of an `<img>`. This makes the icon stylable by page CSS — `fill: currentColor`, theme variables, and selector-based recolouring all work, which an external `<img>` cannot do.

```svelte
<!-- Inline so the icon picks up currentColor from its parent -->
<Img src={'/icons/refresh.svg'} alt="" inlineSvg />

<!-- Recolour hardcoded fills, live-reactive to a theme store -->
<Img
  src={'/icons/wallet.svg'}
  alt="Wallet"
  transformSvg={(svg) => svg.replaceAll('#2b2b2b', themeColor)}
/>
```

Behaviour notes:

- Non-SVG sources ignore both props and always render the plain `<img>`.
- A failed fetch/parse for a given URL falls back to the plain `<img>` for that URL (which then drives the normal `fallback`/`onerror` chain); a changed `src` gets a fresh inlining attempt.
- Accessibility: the `<svg>` host gets `role="img"` + `aria-label` when `alt` is non-empty, and `aria-hidden="true"` when `alt` is empty (decorative).
- All CSS variables below apply to the inlined `<svg>` host exactly as they do to the `<img>`.

## CSS Variables

Override these custom properties to theme the component.

| Variable                   | Default                   | CSS Property  | Description                                                    |
| -------------------------- | ------------------------- | ------------- | -------------------------------------------------------------- |
| `--image-object-fit`       | `-`                       | object-fit    | Object-fit of the image (contain, cover, etc.).                |
| `--image-height`           | `24px`                    | height        | Height of the image.                                           |
| `--image-width`            | `24px`                    | width         | Width of the image.                                            |
| `--image-padding`          | `0px`                     | padding       | Padding around the image.                                      |
| `--image-border-radius`    | `0px`                     | border-radius | Corner rounding of the image.                                  |
| `--image-margin`           | `0px`                     | margin        | Margin around the image.                                       |
| `--image-filter`           | `none`                    | filter        | CSS filter applied to the image (e.g., grayscale, brightness). |
| `--image-background`       | `-`                       | background    | Background behind the image.                                   |
| `--image-border`           | `-`                       | border        | Border of the image.                                           |
| `--image-transition`       | `-`                       | transition    | Transition animation for hover effects.                        |
| `--image-hover-background` | `var(--image-background)` | background    | Background on hover.                                           |
| `--image-hover-border`     | `var(--image-border)`     | border        | Border on hover.                                               |

## Events

| Event   | Type         | Description                         |
| ------- | ------------ | ----------------------------------- |
| onerror | `() => void` | Fires when the image fails to load and no fallback is available, or when the fallback image itself also fails to load. Does not fire when the primary image fails but a valid fallback URL exists — the component silently switches to the fallback instead. |

## Web Component

Tag: `<sui-img>`

```html
<sui-img src="/photo.jpg" alt="Description" fallback="/fallback.jpg" test-id="my-img"></sui-img>
```
