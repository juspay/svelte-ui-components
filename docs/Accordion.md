# Accordion

An expandable/collapsible container that uses CSS grid row animation for smooth open/close transitions. When `expand` is true, the content is visible (grid-template-rows: 1fr); when false, it collapses to 0fr. Transition takes 0.2s ease-out. Render children content using the default `children` snippet.

## Usage

```svelte
<script>
  import { Accordion } from '@juspay/svelte-ui-components';
</script>

<Accordion />
```

## Props

| Prop    | Type      | Required | Default | Description                                                                                                                                                                                                                |
| ------- | --------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| expand  | `boolean` | No       | `false` | Controls whether the accordion content is expanded (visible) or collapsed (hidden). Uses CSS grid animation.                                                                                                               |
| classes | `string`  | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides (e.g., `.btn-primary { --button-color: #0070f3; }`) and pass them to create variant styles. |

## Web Component

Tag: `<sui-accordion>`

```html
<sui-accordion expand>
  <p>Expandable content here</p>
</sui-accordion>
```

### Slots

| Slot Name   | Maps to Snippet | Description                                 |
| ----------- | --------------- | ------------------------------------------- |
| _(default)_ | `children`      | Content rendered inside the accordion body. |
