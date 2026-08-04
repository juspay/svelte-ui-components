# ModalAnimation

A wrapper that applies fly or fade Svelte transitions to its children based on the modal's `align` prop. For `top` alignment, content flies in from above; for `bottom`, from below; for `center`, a fade transition is used. The `transitionType` controls whether the out-transition is also animated ('ALL') or only the in-transition ('IN'). The optional `entryAnimation` prop overrides the align-based default — e.g. `'slide-up'` makes a `center`-aligned modal fly in from below like a bottom sheet, reusing the same distance/duration constants as `bottom` alignment.

## Usage

```svelte
<script>
  import { ModalAnimation } from '@juspay/svelte-ui-components';
</script>

<ModalAnimation />
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| enable | `boolean` | No | `true` | When true, applies transition animations. When false, renders children without any transitions. |
| align | `'top' \| 'center' \| 'bottom'` | No | `'bottom'` | Determines the transition type: 'top' and 'bottom' use fly transitions, 'center' uses fade. |
| transitionType | `'IN' \| 'ALL'` | No | `'ALL'` | Controls whether the out-transition is animated. 'ALL' animates both in and out. 'IN' only animates the in-transition. |
| entryAnimation | `'fade' \| 'slide-up' \| 'slide-down'` | No | `-` | Overrides the align-based transition choice above. 'slide-up' and 'slide-down' use fly with the same distance/duration as bottom/top alignment respectively. Unset keeps the existing per-align default. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet  | Type      | Description                              |
| -------- | --------- | ---------------------------------------- |
| children | `Snippet` | Content to animate inside the modal. |
