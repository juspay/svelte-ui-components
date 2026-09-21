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

| Prop           | Type                                   | Required | Default    | Description                                                                                                                                                                                              |
| -------------- | -------------------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| enable         | `boolean`                              | No       | `true`     | When true, applies transition animations. When false, renders children without any transitions.                                                                                                          |
| align          | `'top' \| 'center' \| 'bottom'`        | No       | `'bottom'` | Determines the transition type: 'top' and 'bottom' use fly transitions, 'center' uses fade.                                                                                                              |
| transitionType | `'IN' \| 'ALL'`                        | No       | `'ALL'`    | Controls whether the out-transition is animated. 'ALL' animates both in and out. 'IN' only animates the in-transition.                                                                                   |
| entryAnimation | `'fade' \| 'slide-up' \| 'slide-down'` | No       | `-`        | Overrides the align-based transition choice above. 'slide-up' and 'slide-down' use fly with the same distance/duration as bottom/top alignment respectively. Unset keeps the existing per-align default. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet  | Type      | Description                          |
| -------- | --------- | ------------------------------------ |
| children | `Snippet` | Content to animate inside the modal. |

## CSS Variables

Override these custom properties to theme the entrance/exit transition. The fly shape
(`align="top"`/`"bottom"`, or `entryAnimation="slide-up"`/`"slide-down"`) and the fade shape
(`align="center"` with no override) read the same token names, so a consumer does not need
to know which shape a given `align` produces. Tokens are read via `getComputedStyle` rather
than CSS cascading, so each one is checked in the order listed below rather than relying on
`var()` fallback — the first that resolves wins.

| Variable                                    | Default                                | CSS Property        | Description                                                                                                                                                                                            |
| -------------------------------------------- | --------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--modal-content-open-transition-duration`  | `380ms` (fly shape) / `300ms` (fade shape) | transform, opacity | Duration of the entrance transition. Checked in order: this token, then `--motion-duration`, then the literal shown for the active shape.                                                              |
| `--modal-content-close-transition-duration` | `380ms` (fly shape) / `300ms` (fade shape) | transform, opacity | Duration of the exit transition (only rendered when `transitionType="ALL"`). Same fallback order as the open duration token above.                                                                     |
| `--modal-content-open-transition-distance`  | `60px`                                  | transform            | Distance (px) the fly shape's entrance travels. Not read by the fade shape, which has no travel. Checked in order: this token, then `--distance-overlay`, then `60px`.                                 |
| `--modal-content-close-transition-distance` | `60px`                                  | transform            | Distance (px) the fly shape's exit travels. Same fallback order as the open distance token above.                                                                                                      |
| `--modal-content-open-transition-easing`    | `cubicOut` (fly shape) / `linear` (fade shape) | transform, opacity | Easing curve of the entrance transition, parsed from a CSS easing keyword or `cubic-bezier(x1, y1, x2, y2)`. Checked in order: this token, then `--ease-smooth-out`, then `--motion-easing`, then the literal shown. |
| `--modal-content-close-transition-easing`   | `cubicOut` (fly shape) / `linear` (fade shape) | transform, opacity | Easing curve of the exit transition. Same fallback order as the open easing token above.                                                                                                               |

`prefers-reduced-motion` overrides all of the above: when active, duration is clamped to
effectively instant regardless of what any token resolves to (see Sheet's Accessibility
section for the same guarantee, enforced by the same shared `tokenizedFly` helper).
