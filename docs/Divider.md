# Divider

A thin rule that separates content. Renders horizontally by default or vertically via the `orientation` prop, with proper separator semantics (`role="separator"` + `aria-orientation`). Thickness, color, length, and spacing are all controlled through CSS variables.

## Usage

```svelte
<script>
  import { Divider } from '@juspay/svelte-ui-components';
</script>

<Divider />

<Divider orientation="vertical" />
```

## Props

| Prop        | Type                         | Required | Default        | Description                                                                                                                                                            |
| ----------- | ---------------------------- | -------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| orientation | `'horizontal' \| 'vertical'` | No       | `'horizontal'` | Direction of the rule. Horizontal renders a full-width top border; vertical renders a full-height left border (give the element a height via `--divider-length` or layout). |
| testId      | `string`                     | No       | `-`            | Value for the `data-pw` attribute on the divider element, used for end-to-end testing selectors.                                                                       |
| classes     | `string`                     | No       | `-`            | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Events

This component emits no events.

## CSS Variables

Override these custom properties to theme the component.

| Variable           | Default             | CSS Property             | Description                                                                                  |
| ------------------ | ------------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `--divider-border` | `1px solid #e2e8f0` | border-top / border-left | The rule itself — thickness, style, and color (applied as border-top when horizontal, border-left when vertical). |
| `--divider-length` | `100%`              | width / height           | Length of the rule (width when horizontal, height when vertical).                            |
| `--divider-margin` | `0`                 | margin                   | Spacing around the rule.                                                                     |

## Web Component

Tag: `<sui-divider>`

```html
<sui-divider></sui-divider>

<sui-divider orientation="vertical"></sui-divider>
```
