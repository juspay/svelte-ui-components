# AspectRatio

Constrains its content to a fixed width-to-height ratio, using the CSS `aspect-ratio` property directly (no `padding-bottom` percentage-hack wrapper). Common uses: reserving layout space for an image or video before it loads (preventing layout shift), or forcing embedded media (an iframe, a map) into a consistent frame regardless of its own intrinsic size. The `ratio` prop takes a plain width/height number — `16 / 9` for widescreen, `4 / 3` for a photo, `1` (the default) for a square.

## Usage

```svelte
<script>
  import { AspectRatio } from '@juspay/svelte-ui-components';
</script>

<AspectRatio ratio={16 / 9}>
  <img src="/cover.jpg" alt="" style="width: 100%; height: 100%; object-fit: cover;" />
</AspectRatio>
```

## Props

| Prop     | Type      | Required | Default | Description                                                                                                                                                                                                                                                     |
| -------- | --------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ratio    | `number`  | No       | `1`     | Width-to-height ratio the content is constrained to, e.g. `16 / 9`. Must be a finite, positive number — a zero, negative, `NaN`, or non-finite (`Infinity`) ratio has no geometric meaning and falls back to the default of `1` instead of emitting broken CSS. |
| children | `Snippet` | No       | `-`     | Content rendered inside the ratio-constrained container. An empty `AspectRatio` still reserves the correctly-shaped layout space, useful as a placeholder while content is loading.                                                                             |
| testId   | `string`  | No       | `-`     | Value for the data-pw attribute, used for end-to-end testing selectors.                                                                                                                                                                                         |
| classes  | `string`  | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                                                          |

## Sizing content to the frame

`AspectRatio` sizes its own root element to the ratio; it does not resize its children. Content that should fill the frame (typically an `<img>` or `<video>`) needs its own `width: 100%; height: 100%; object-fit: cover;` (or `contain`), the same as it would need inside any other fixed-size box. The root clips overflow by default (`--aspect-ratio-container-overflow`), so content that does not opt into filling the frame is cropped to it rather than spilling out.

## Why no `padding-bottom` fallback

Older aspect-ratio implementations rely on a `padding-bottom: <percentage>` hack (padding percentages resolve against the containing block's _width_, so a wrapper with no set height gets one anyway), plus an absolutely-positioned inner element to hold content, since the padding-driven box has no real content area. `AspectRatio` uses the CSS `aspect-ratio` property directly instead: it has shipped in every evergreen browser since 2021 (Chrome 88, Firefox 89, Safari 15), the same generation of CSS this library already depends on elsewhere with no legacy fallback (`Accordion`'s expand/collapse animates `grid-template-rows` between `0fr` and `1fr`, which needs the same-era browser support). Adding a `padding-bottom` fallback here would reintroduce the extra wrapper/absolute-position structure `aspect-ratio` exists to remove, for browsers this library does not otherwise support.

## CSS Variables

Override these custom properties to theme the component.

| Variable                                | Default  | CSS Property | Description                                                                                                                                                                                                                                         |
| --------------------------------------- | -------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--aspect-ratio-container-aspect-ratio` | _(none)_ | aspect-ratio | Overrides the resolved ratio purely through CSS, without touching the `ratio` prop — e.g. set it on an ancestor to retheme every `AspectRatio` beneath it, or on this element via `classes`. When unset, the `ratio` prop's resolved value is used. |
| `--aspect-ratio-container-width`        | `100%`   | width        | Width of the root container. The height then follows from the ratio.                                                                                                                                                                                |
| `--aspect-ratio-container-overflow`     | `hidden` | overflow     | Overflow behavior of the root container. Set to `visible` if content should be allowed to spill outside the ratio-constrained box.                                                                                                                  |

## Web Component

Tag: `<sui-aspect-ratio>`

```html
<sui-aspect-ratio ratio="1.7777777777777777">
  <img src="/cover.jpg" alt="" style="width: 100%; height: 100%; object-fit: cover;" />
</sui-aspect-ratio>
```
