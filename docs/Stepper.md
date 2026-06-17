# Stepper

A progress indicator showing numbered steps with completion and active states. Each step shows either a step number or a custom icon, a label, and a dashed separator line to the next step. Steps before `currentStepIndex` are styled as completed (green), the step at `currentStepIndex` is active (dark), and remaining steps are inactive (grey). Steps support explicit per-step `status` values (`completed`, `active`, `pending`, `failure`, `in-progress`). Each step is clickable, firing `onstepclick` with the 1-based selected index. The component supports both horizontal and vertical layouts.

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

| Prop             | Type                         | Required | Default        | Description                                                                                                                                                            |
| ---------------- | ---------------------------- | -------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| steps            | `Array<Step>`                | Yes      | `-`            | Array of Step objects defining each step. Each Step has a `label`, optional `icon` URL, optional `status`, and optional `badge` snippet.                               |
| currentStepIndex | `number`                     | Yes      | `-`            | The 0-based index of the currently active step. Steps before this index are styled as completed, the step at this index is active, unless overridden by `step.status`. |
| orientation      | `'horizontal' \| 'vertical'` | No       | `'horizontal'` | Layout direction. `'vertical'` renders steps in a column with vertical separators.                                                                                     |
| classes          | `string`                     | No       | `-`            | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |
| testId           | `string`                     | No       | `-`            | Value for the `data-pw` attribute on the root element, used for test selectors.                                                                                        |

## Events

| Event             | Type                                         | Description                                                                                                               |
| ----------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| onstepclick       | `(event: { selectedIndex: number }) => void` | Fires when any step is clicked. Receives `{ selectedIndex: number }` with the **1-based** step index.                     |
| onhandleStepClick | `(event: { selectedIndex: number }) => void` | **Deprecated.** Use `onstepclick` instead. Same signature, provided for backward compatibility with pre-v2 consumer code. |

## CSS Variables

Override these custom properties to theme the component.

### Stepper-level variables

| Variable                                                 | Default   | CSS Property     | Description                                            |
| -------------------------------------------------------- | --------- | ---------------- | ------------------------------------------------------ |
| `--container-flex-direction`                             | `row`     | flex-direction   | Layout direction of the steps container.               |
| `--step-text-active-color`                               | `#2f3841` | color            | Text color of the active step label.                   |
| `--step-text-completed-color`                            | `#24aa5a` | color            | Text color of completed step labels.                   |
| `--step-text-failure-color`                              | `#e53935` | color            | Text color of failed step labels.                      |
| `--step-text-in-progress-color`                          | `#f59e0b` | color            | Text color of in-progress step labels.                 |
| `--step-index-container-active-background-color`         | `#2f3841` | background-color | Background of the active step circle.                  |
| `--step-index-container-completed-background-color`      | `#24aa5a` | background-color | Background of completed step circles.                  |
| `--step-index-container-failure-background-color`        | `#e53935` | background-color | Background of failed step circles.                     |
| `--step-index-container-in-progress-background-color`    | `#f59e0b` | background-color | Background of in-progress step circles.                |
| `--stepper-status-failure-color`                         | `#e53935` | (alias)          | Shorthand alias for failure color (circle + text).     |
| `--stepper-status-in-progress-color`                     | `#f59e0b` | (alias)          | Shorthand alias for in-progress color (circle + text). |
| `--stepper-separator-background-image-active-color`      | `#2f3841` | (gradient color) | Separator color for active steps.                      |
| `--stepper-separator-background-image-completed-color`   | `#24aa5a` | (gradient color) | Separator color for completed steps.                   |
| `--stepper-separator-background-image-failure-color`     | `#e53935` | (gradient color) | Separator color for failed steps.                      |
| `--stepper-separator-background-image-in-progress-color` | `#f59e0b` | (gradient color) | Separator color for in-progress steps.                 |

### Step sub-component CSS Variables

| Variable                                     | Default                        | CSS Property     | Description                                                                                          |
| -------------------------------------------- | ------------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------- |
| `--step-flex-direction`                      | `row`                          | flex-direction   | Layout direction of each step.                                                                       |
| `--step-index-container-height`              | `30px`                         | height           | Height of the step number/icon circle.                                                               |
| `--step-index-container-width`               | `30px`                         | width            | Width of the step number/icon circle.                                                                |
| `--step-index-container-radius`              | `50%`                          | border-radius    | Border radius of the step number/icon circle.                                                        |
| `--step-index-container-background-color`    | `#798fa5cc`                    | background-color | Background of inactive step circles.                                                                 |
| `--step-index-font-size`                     | `14px`                         | font-size        | Font size of the step number.                                                                        |
| `--step-index-color`                         | `white`                        | color            | Text/icon color inside step circles.                                                                 |
| `--step-icon-size`                           | `18px`                         | width / height   | Size of the custom icon image.                                                                       |
| `--step-spinner-size`                        | `18px`                         | width / height   | Size of the in-progress spinner SVG.                                                                 |
| `--stepper-separator-display`                | `block`                        | display          | Display of the separator (`none` on last step automatically). Replaces legacy `--separator-display`. |
| `--stepper-separator-height`                 | `1px`                          | height           | Height of the horizontal separator. Replaces legacy `--separator-height`.                            |
| `--stepper-separator-width`                  | `50px`                         | width            | Width of the horizontal separator. Replaces legacy `--separator-width`.                              |
| `--stepper-separator-margin`                 | `0px 12px 0px 12px`            | margin           | Margin around the horizontal separator. Replaces legacy `--separator-margin`.                        |
| `--stepper-separator-background-image`       | `repeating-linear-gradient(…)` | background-image | Full background-image for the separator (overrides color).                                           |
| `--stepper-separator-background-image-color` | `#798fa5cc`                    | (gradient color) | Color used in the dashed separator gradient. Replaces legacy `--separator-background-image-color`.   |
| `--stepper-separator-vertical-height`        | `32px`                         | height           | Height of the separator in vertical orientation.                                                     |
| `--stepper-separator-vertical-width`         | `1px`                          | width            | Width of the separator in vertical orientation.                                                      |
| `--stepper-separator-vertical-margin`        | `4px 0px 4px 14px`             | margin           | Margin around the separator in vertical orientation.                                                 |
| `--step-text-margin`                         | `0px 0px 0px 12px`             | margin           | Margin around the step label (horizontal).                                                           |
| `--step-text-vertical-margin`                | `4px 0px 0px 0px`              | margin           | Margin around the step label (vertical).                                                             |
| `--step-text-font-size`                      | `12px`                         | font-size        | Font size of the step label.                                                                         |
| `--step-text-color`                          | `#798fa5cc`                    | color            | Default step label color (overridden by status classes above).                                       |
| `--step-badge-margin`                        | `0 0 0 4px`                    | margin           | Margin around the badge slot (horizontal).                                                           |
| `--step-badge-vertical-margin`               | `4px 0 0 0`                    | margin           | Margin around the badge slot (vertical).                                                             |

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
  /** Explicit per-step status. When omitted, status is derived from currentStepIndex. */
  status?: 'completed' | 'active' | 'pending' | 'failure' | 'in-progress';
  /** Optional Svelte snippet rendered after the step label (e.g. a badge or tag). */
  badge?: Snippet;
};
```

## Web Component

Tag: `<sui-stepper>`

```html
<sui-stepper current-step-index="1"></sui-stepper>
```

> **Note:** The `steps` prop is an array — set it via JavaScript property.
