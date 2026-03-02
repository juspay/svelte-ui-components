# Stepper

A progress indicator showing numbered steps with completion and active states. Each step shows either a step number or a custom icon, a label, and a dashed separator line to the next step. Steps before `currentStepIndex` are styled as completed (green), the step at `currentStepIndex` is active (dark), and remaining steps are inactive (grey). Each step is clickable, firing `onhandleStepClick` with the selected index.

## Usage

```svelte
<script>
  import { Stepper } from '@juspay/svelte-ui-components';
</script>

<Stepper />
```

## Props

| Prop             | Type            | Required | Default | Description                                                                                                                                                            |
| ---------------- | --------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| steps            | `Array`<Step>`` | No       | `-`     | Array of Step objects defining each step. Each Step has a `label` string and optional `icon` URL.                                                                      |
| currentStepIndex | `number`        | No       | `-`     | The 0-based index of the currently active step. Steps before this index are styled as completed, the step at this index is active.                                     |
| classes          | `string`        | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Events

| Event             | Type                                         | Description                                                                                     |
| ----------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| onhandleStepClick | `(event: { selectedIndex: number }) => void` | Fires when any step is clicked. Receives { selectedIndex: number } with the 1-based step index. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                       | Default   | CSS Property                       | Description                                                              |
| ---------------------------------------------- | --------- | ---------------------------------- | ------------------------------------------------------------------------ |
| `--container-flex-direction`                   | `row`     | flex-direction                     | Layout direction of the steps (row for horizontal, column for vertical). |
| `--step-text-active-color`                     | `#2f3841` | --step-text-color                  | Text color of the active step label.                                     |
| `--separator-background-image-active-color`    | `#2f3841` | --separator-background-image-color | Color of the separator line for active steps.                            |
| `--step-text-completed-color`                  | `#24aa5a` | --step-text-color                  | Text color of completed step labels.                                     |
| `--separator-background-image-completed-color` | `#24aa5a` | --separator-background-image-color | Color of the separator line for completed steps.                         |

## Type Reference

Custom types used by this component's props and events:

### Step

```typescript
type Step = { label: string; icon?: string };
```
