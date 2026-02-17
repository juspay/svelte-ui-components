# OverlayAnimation

A wrapper that applies a fade-out transition (350ms) to its children when they are removed from the DOM. Used internally by Modal to animate the overlay background.

## Usage

```svelte
<script>
  import { OverlayAnimation } from '@juspay/svelte-ui-components';
</script>

<OverlayAnimation />
```
