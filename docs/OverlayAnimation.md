# OverlayAnimation

A wrapper that applies a fade-out transition (350ms) to its children when they are removed from the DOM. Used internally by Modal to animate the overlay background. The optional `fadeIn` prop additionally fades the overlay in on mount (same 350ms duration); default is `false`, which preserves the original instant-appear-on-mount behavior.

## Usage

```svelte
<script>
  import { OverlayAnimation } from '@juspay/svelte-ui-components';
</script>

<OverlayAnimation />

<!-- Fade in on mount too, not just fade out on unmount -->
<OverlayAnimation fadeIn />
```

## Props

| Prop   | Type      | Required | Default | Description                                                                                                               |
| ------ | --------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| fadeIn | `boolean` | No       | `false` | When true, also fades in on mount (350ms, matching the fade-out). Default preserves the original instant-appear behavior. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet  | Type      | Description                           |
| -------- | --------- | ------------------------------------- |
| children | `Snippet` | Content to render inside the overlay. |

## CSS Variables

Override these custom properties to theme the fade duration. Easing is fixed at `linear`
(matching `svelte/transition`'s own `fade` default) and is not tokenized — this component is
a pure background-scrim fade, not a candidate for its own easing decision. Tokens are read
via `getComputedStyle` rather than CSS cascading, so each is checked in the order listed
below rather than relying on `var()` fallback.

| Variable                                    | Default | CSS Property | Description                                                                                                                          |
| -------------------------------------------- | ------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `--modal-overlay-open-transition-duration`  | `350ms` | opacity       | Duration of the fade-in (only rendered when `fadeIn` is true). Checked in order: this token, then `--motion-duration`, then `350ms`. |
| `--modal-overlay-close-transition-duration` | `350ms` | opacity       | Duration of the fade-out on unmount. Checked in order: this token, then `--motion-duration`, then `350ms`.                           |
