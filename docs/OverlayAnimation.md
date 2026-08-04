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

| Prop   | Type      | Required | Default | Description                                                                        |
| ------ | --------- | -------- | ------- | ------------------------------------------------------------------------------------ |
| fadeIn | `boolean` | No       | `false` | When true, also fades in on mount (350ms, matching the fade-out). Default preserves the original instant-appear behavior. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet  | Type      | Description                                |
| -------- | --------- | ------------------------------------------ |
| children | `Snippet` | Content to render inside the overlay. |
