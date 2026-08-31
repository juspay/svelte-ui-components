# Stepper

A progress indicator showing numbered steps with completion and active states. Each step shows either a step number or a custom icon, a label, and a dashed separator line to the next step. Steps before `currentStepIndex` are styled as completed (green), the step at `currentStepIndex` is active (dark), and remaining steps are inactive (grey). Steps support explicit per-step `status` values (`completed`, `active`, `pending`, `failure`, `in-progress`, `muted`). Each step is clickable, firing `onstepclick` with the 1-based selected index. The component supports both horizontal and vertical layouts.

## Usage

```svelte
<script>
  import { Stepper } from '@juspay/svelte-ui-components';

  let currentStep = $state(0);
</script>

<Stepper
  steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }]}
  currentStepIndex={currentStep}
  onstepclick={(e) => (currentStep = e.selectedIndex - 1)}
/>
```

## Props

| Prop                    | Type                         | Required | Default        | Description                                                                                                                                                                                                                                                                                            |
| ----------------------- | ---------------------------- | -------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| steps                   | `Array<Step>`                | Yes      | `-`            | Array of Step objects defining each step. Each Step has a `label`, optional `icon` URL, optional `status`, optional `badge` snippet, and optional `testId`.                                                                                                                                            |
| currentStepIndex        | `number`                     | Yes      | `-`            | The 0-based index of the currently active step. Steps before this index are styled as completed, the step at this index is active, unless overridden by `step.status`.                                                                                                                                 |
| orientation             | `'horizontal' \| 'vertical'` | No       | `'horizontal'` | Layout direction. `'vertical'` renders steps in a column with vertical separators.                                                                                                                                                                                                                     |
| classes                 | `string`                     | No       | `-`            | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                                                                                                 |
| testId                  | `string`                     | No       | `-`            | Value for the `data-pw` attribute on the root element, used for test selectors.                                                                                                                                                                                                                        |
| suppressRoleAndTabindex | `boolean`                    | No       | `false`        | Removes every step's synthetic `role="button"` and tab stop while keeping its mouse handlers. Opt in for an informational rail, or when an ancestor supplies the interactive control.                                                                                                                  |
| suppressContainerTestId | `boolean`                    | No       | `false`        | Stops the Stepper's own root element from rendering `testId` as `data-pw`/`testID`, while per-step ids still derive from `testId` exactly as before. Opt in when the element wrapping the Stepper already carries the same `data-pw`, which would otherwise leave two elements matching that selector. |

### Test IDs

`testId` renders `data-pw` on the Stepper's own container, and each step falls back to
`` `${testId}-step-${n}` `` (1-based) when it sets no `testId` of its own. Set
`steps[n].testId` to name a step directly.

> If the element wrapping the Stepper already carries the same `data-pw`, setting the
> Stepper's `testId` to that value renders a second matching element inside the first, and
> Playwright's strict mode fails. Pass `suppressContainerTestId` to keep the per-step ids
> (`` `${testId}-step-${n}` ``) without the container itself claiming `testId` — the
> ancestor's `data-pw` is then the only match.

## Events

| Event             | Type                                         | Description                                                                                                               |
| ----------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| onstepclick       | `(event: { selectedIndex: number }) => void` | Fires when any step is clicked. Receives `{ selectedIndex: number }` with the **1-based** step index.                     |
| onhandleStepClick | `(event: { selectedIndex: number }) => void` | **Deprecated.** Use `onstepclick` instead. Same signature, provided for backward compatibility with pre-v2 consumer code. |

## CSS Variables

Override these custom properties to theme the component.

### Stepper-level variables

| Variable                                                 | Default    | CSS Property     | Description                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------- | ---------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--container-flex-direction`                             | `row`      | flex-direction   | Layout direction of the steps container.                                                                                                                                                                                                                                                                                                 |
| `--container-flex-wrap`                                  | `nowrap`   | flex-wrap        | Set to `wrap` so steps drop to a new row instead of clipping/shrinking on a narrow rail. Pair with `--step-container-flex` so each step claims a full-width basis and lands one per row.                                                                                                                                                 |
| `--step-container-flex`                                  | `0 1 auto` | flex             | Flex shorthand on each step's own container element (sibling of every other step inside `.container`). Set e.g. `1 1 100%` with `--container-flex-wrap: wrap` to stack one step per row; set `1 1 0%` with `--step-flex-grow` and `--stepper-separator-flex-grow` (Step-level, below) to let a step's separator stretch and fill a card. |
| `--step-text-active-color`                               | `#2f3841`  | color            | Text color of the active step label.                                                                                                                                                                                                                                                                                                     |
| `--step-text-completed-color`                            | `#24aa5a`  | color            | Text color of completed step labels.                                                                                                                                                                                                                                                                                                     |
| `--step-text-failure-color`                              | `#e53935`  | color            | Text color of failed step labels.                                                                                                                                                                                                                                                                                                        |
| `--step-text-in-progress-color`                          | `#f59e0b`  | color            | Text color of in-progress step labels.                                                                                                                                                                                                                                                                                                   |
| `--step-index-container-active-background-color`         | `#2f3841`  | background-color | Background of the active step circle.                                                                                                                                                                                                                                                                                                    |
| `--step-index-container-completed-background-color`      | `#24aa5a`  | background-color | Background of completed step circles.                                                                                                                                                                                                                                                                                                    |
| `--step-index-container-failure-background-color`        | `#e53935`  | background-color | Background of failed step circles.                                                                                                                                                                                                                                                                                                       |
| `--step-index-container-in-progress-background-color`    | `#f59e0b`  | background-color | Background of in-progress step circles.                                                                                                                                                                                                                                                                                                  |
| `--step-index-container-completed-border`                | `none`     | border           | Border of completed step circles. No status carries a border by default — set this to add a themed ring per state.                                                                                                                                                                                                                       |
| `--step-index-container-active-border`                   | `none`     | border           | Border of the active step circle.                                                                                                                                                                                                                                                                                                        |
| `--step-index-container-failure-border`                  | `none`     | border           | Border of failed step circles.                                                                                                                                                                                                                                                                                                           |
| `--step-index-container-in-progress-border`              | `none`     | border           | Border of in-progress step circles.                                                                                                                                                                                                                                                                                                      |
| `--stepper-status-failure-color`                         | `#e53935`  | (alias)          | Shorthand alias for failure color (circle + text).                                                                                                                                                                                                                                                                                       |
| `--stepper-status-in-progress-color`                     | `#f59e0b`  | (alias)          | Shorthand alias for in-progress color (circle + text).                                                                                                                                                                                                                                                                                   |
| `--stepper-separator-background-image-active-color`      | `#2f3841`  | (gradient color) | Separator color for active steps.                                                                                                                                                                                                                                                                                                        |
| `--stepper-separator-background-image-completed-color`   | `#24aa5a`  | (gradient color) | Separator color for completed steps.                                                                                                                                                                                                                                                                                                     |
| `--stepper-separator-background-image-failure-color`     | `#e53935`  | (gradient color) | Separator color for failed steps.                                                                                                                                                                                                                                                                                                        |
| `--stepper-separator-background-image-in-progress-color` | `#f59e0b`  | (gradient color) | Separator color for in-progress steps.                                                                                                                                                                                                                                                                                                   |
| `--step-text-muted-color`                                | `#667080`  | color            | Text color of muted step labels.                                                                                                                                                                                                                                                                                                         |
| `--step-index-muted-color`                                | `#2f3841`  | color            | Text color of the number inside a muted step circle.                                                                                                                                                                                                                                                                                                         |
| `--step-index-container-muted-background-color`          | `#c9d2db`  | background-color | Background of muted step circles.                                                                                                                                                                                                                                                                                                        |
| `--step-index-container-muted-border`                    | `none`     | border           | Border of muted step circles.                                                                                                                                                                                                                                                                                                            |
| `--step-index-container-muted-height`                    | `20px`     | height           | Height of muted step circles — smaller than the `30px` default.                                                                                                                                                                                                                                                                          |
| `--step-index-container-muted-width`                     | `20px`     | width            | Width of muted step circles — smaller than the `30px` default.                                                                                                                                                                                                                                                                           |
| `--step-index-muted-font-size`                           | `10px`     | font-size        | Font size of the step number inside a muted circle — scaled down to fit the smaller circle.                                                                                                                                                                                                                                              |
| `--stepper-separator-background-image-muted-color`       | `#c9d2db`  | (gradient color) | Separator color for muted steps.                                                                                                                                                                                                                                                                                                         |

### Step sub-component CSS Variables

| Variable                                     | Default                        | CSS Property     | Description                                                                                                                                                                                                 |
| -------------------------------------------- | ------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--step-flex-direction`                      | `row`                          | flex-direction   | Layout direction of each step.                                                                                                                                                                              |
| `--step-flex-grow`                           | `0`                            | flex-grow        | Lets a step's own box grow to fill its `--step-container-flex` share of the row. A prerequisite for the separator's `--stepper-separator-flex-grow` below to have free space to grow into.                  |
| `--step-index-container-height`              | `30px`                         | height           | Height of the step number/icon circle.                                                                                                                                                                      |
| `--step-index-container-width`               | `30px`                         | width            | Width of the step number/icon circle.                                                                                                                                                                       |
| `--step-index-container-radius`              | `50%`                          | border-radius    | Border radius of the step number/icon circle.                                                                                                                                                               |
| `--step-index-container-background-color`    | `#798fa5cc`                    | background-color | Background of inactive step circles.                                                                                                                                                                        |
| `--step-index-container-border`              | `none`                         | border           | Border of the step number/icon circle. No border renders by default; a status class (above) can further override it per state.                                                                              |
| `--step-index-font-size`                     | `14px`                         | font-size        | Font size of the step number.                                                                                                                                                                               |
| `--step-index-color`                         | `white`                        | color            | Text/icon color inside step circles.                                                                                                                                                                        |
| `--step-icon-size`                           | `18px`                         | width / height   | Size of the custom icon image.                                                                                                                                                                              |
| `--step-spinner-size`                        | `18px`                         | width / height   | Size of the in-progress spinner SVG.                                                                                                                                                                        |
| `--stepper-separator-display`                | `block`                        | display          | Display of the separator (`none` on last step automatically). Replaces legacy `--separator-display`.                                                                                                        |
| `--stepper-separator-height`                 | `1px`                          | height           | Height of the horizontal separator. Replaces legacy `--separator-height`.                                                                                                                                   |
| `--stepper-separator-width`                  | `50px`                         | width            | Width of the horizontal separator. Replaces legacy `--separator-width`.                                                                                                                                     |
| `--stepper-separator-flex-grow`              | `0`                            | flex-grow        | Lets the separator stretch and absorb a step's leftover width, turning it into a `flex: 1` hairline that fills a card. Set alongside `--step-flex-grow` and `--step-container-flex` (Stepper-level, above). |
| `--stepper-separator-margin`                 | `0px 12px 0px 12px`            | margin           | Margin around the horizontal separator. Replaces legacy `--separator-margin`.                                                                                                                               |
| `--stepper-separator-background-image`       | `repeating-linear-gradient(…)` | background-image | Full background-image for the separator (overrides color).                                                                                                                                                  |
| `--stepper-separator-background-image-color` | `#798fa5cc`                    | (gradient color) | Color used in the dashed separator gradient. Replaces legacy `--separator-background-image-color`.                                                                                                          |
| `--stepper-separator-vertical-height`        | `32px`                         | height           | Height of the separator in vertical orientation.                                                                                                                                                            |
| `--stepper-separator-vertical-width`         | `1px`                          | width            | Width of the separator in vertical orientation.                                                                                                                                                             |
| `--stepper-separator-vertical-margin`        | `4px 0px 4px 14px`             | margin           | Margin around the separator in vertical orientation.                                                                                                                                                        |
| `--step-text-margin`                         | `0px 0px 0px 12px`             | margin           | Margin around the step label (horizontal).                                                                                                                                                                  |
| `--step-text-vertical-margin`                | `4px 0px 0px 0px`              | margin           | Margin around the step label (vertical).                                                                                                                                                                    |
| `--step-text-font-size`                      | `12px`                         | font-size        | Font size of the step label.                                                                                                                                                                                |
| `--step-text-font-weight`                    | `normal`                       | font-weight      | Weight of the step label. Not set by default; use this instead of a `font-weight` declaration in a consumer's own component styles.                                                                         |
| `--step-text-color`                          | `#798fa5cc`                    | color            | Default step label color (overridden by status classes above).                                                                                                                                              |
| `--step-badge-margin`                        | `0 0 0 4px`                    | margin           | Margin around the badge slot (horizontal).                                                                                                                                                                  |
| `--step-badge-vertical-margin`               | `4px 0 0 0`                    | margin           | Margin around the badge slot (vertical).                                                                                                                                                                    |

> **Migration note (CSS variables):** The CSS variables `--separator-display`, `--separator-height`, `--separator-width`, `--separator-margin`, and `--separator-background-image-color` defined by v1 are still honoured as fallbacks (e.g. `var(--stepper-separator-display, var(--separator-display, block))`). New code should use the `--stepper-separator-*` names.

## Badge snippets

Each step accepts an optional `badge` snippet rendered inline after the step label. Use it for count pills, status chips, or any small inline decoration.

```svelte
<script>
  import { Stepper } from '@juspay/svelte-ui-components';
</script>

<Stepper
  steps={[
    { label: 'Cart', status: 'completed', badge: cartBadge },
    { label: 'Shipping', status: 'active', badge: shippingBadge },
    { label: 'Payment', status: 'pending' }
  ]}
  currentStepIndex={1}
/>

{#snippet cartBadge()}
  <span class="badge badge-done">Done</span>
{/snippet}

{#snippet shippingBadge()}
  <span class="badge badge-eta">ETA 2d</span>
{/snippet}
```

> **Note:** In horizontal layout the badge appears to the right of the label; in vertical layout it appears below the label.

## Type Reference

### Step

```typescript
type Step = {
  label: string;
  /** URL of a custom icon image. When provided, takes precedence over status-driven rendering (including the in-progress spinner). */
  icon?: string;
  /**
   * Explicit per-step status. When omitted, status is derived from currentStepIndex.
   * 'muted' renders a smaller, subtly-tinted circle for a de-emphasized/supplementary
   * step and is only ever reached by setting it explicitly.
   */
  status?: 'completed' | 'active' | 'pending' | 'failure' | 'in-progress' | 'muted';
  /** Optional Svelte snippet rendered after the step label (e.g. a badge or tag). */
  badge?: Snippet;
  /** Value for the step's own `data-pw`, so a consumer can address one step directly. */
  testId?: string;
};
```

## Web Component

Tag: `<sui-stepper>`

```html
<sui-stepper current-step-index="1"></sui-stepper>
```

> **Note:** The `steps` prop is an array — set it via JavaScript property.
