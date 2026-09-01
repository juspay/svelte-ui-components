# Accordion

An expandable/collapsible container that uses CSS grid row animation for smooth open/close transitions. When `expand` is true, the content is visible (grid-template-rows: 1fr); when false, it collapses to 0fr. Transition duration/easing is controlled via `--accordion-transition`. Render children content using the default `children` snippet. Pass an optional `trigger` snippet to render a built-in clickable/keyboard-accessible toggle header.

## Usage

```svelte
<script>
  import { Accordion } from '@juspay/svelte-ui-components';
  let open = $state(false);
</script>

<Accordion bind:expand={open}>
  {#snippet trigger({ expanded })}
    <span>{expanded ? 'Collapse' : 'Expand'}</span>
  {/snippet}
  <p>Expandable content here</p>
</Accordion>
```

## Props

| Prop           | Type      | Required | Default   | Description                                                                                                                                                                                                                                                                             |
| -------------- | --------- | -------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| expand         | `boolean` | No       | `false`   | Controls whether the accordion content is expanded (visible) or collapsed (hidden). Supports two-way binding (`bind:expand`).                                                                                                                                                           |
| classes        | `string`  | No       | `-`       | CSS class string applied to the accordion content wrapper element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                                                                              |
| triggerClasses | `string`  | No       | `-`       | CSS class string applied to the `accordion-trigger` wrapper div. Use to style the trigger area independently of the content panel.                                                                                                                                                      |
| testId         | `string`  | No       | `-`       | Value written to `data-pw` on the accordion content wrapper. Enables Playwright locators (`page.getByTestId(testId)`).                                                                                                                                                                  |
| panelId        | `string`  | No       | generated | `id` for the collapsible panel, which the built-in trigger references via `aria-controls`. Defaults to a generated per-instance id, so the trigger and panel are linked without any caller involvement. Supply one only when something else needs to reference the panel by a known id. |

## Events

| Event    | Payload                       | Description                                                                |
| -------- | ----------------------------- | -------------------------------------------------------------------------- |
| ontoggle | `(expanded: boolean) => void` | Fired after the trigger toggles `expand`. Receives the new expanded state. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet  | Parameters              | Description                                                                                                                                                                                                                                                                       |
| -------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| children | _(none)_                | Content rendered inside the accordion panel (the collapsible region).                                                                                                                                                                                                             |
| trigger  | `{ expanded: boolean }` | When provided, renders a keyboard-accessible toggle header (`role="button"`, `tabindex="0"`, `aria-expanded`, and `aria-controls` pointing at the panel it opens). The `expanded` parameter reflects the current open/closed state so you can render different UI for each state. |

## Accessibility

- The built-in trigger is `role="button"` with `tabindex="0"` and toggles on Enter or Space.
- `aria-expanded` reflects the panel's real open state, and `aria-controls` references the panel's `id` — the two elements are siblings rather than nested, so without that reference assistive technology has no way to reach the region the trigger governs. The id is generated per instance, so two accordions on one page never collide.

## CSS Variables

| Variable                     | Default         | Description                                              |
| ---------------------------- | --------------- | -------------------------------------------------------- |
| `--accordion-trigger-cursor` | `pointer`       | Cursor style for the trigger element.                    |
| `--accordion-transition`     | `0.2s ease-out` | Transition value for the `grid-template-rows` animation. |

## Web Component

Tag: `<sui-accordion>`

```html
<sui-accordion expand trigger-classes="my-trigger" test-id="my-accordion">
  <p>Expandable content here</p>
</sui-accordion>
```

### Props (HTML Attributes)

| Attribute         | Maps to Prop     | Type    | Description                                                          |
| ----------------- | ---------------- | ------- | -------------------------------------------------------------------- |
| `expand`          | `expand`         | Boolean | Reflects the expanded state.                                         |
| `classes`         | `classes`        | String  | CSS classes for the content wrapper.                                 |
| `trigger-classes` | `triggerClasses` | String  | CSS classes for the trigger wrapper.                                 |
| `test-id`         | `testId`         | String  | Sets `data-pw` on the content wrapper.                               |
| `panel-id`        | `panelId`        | String  | Sets the panel's `id` (referenced by the trigger's `aria-controls`). |

### Slots

| Slot Name   | Maps to Snippet | Description                                 |
| ----------- | --------------- | ------------------------------------------- |
| _(default)_ | `children`      | Content rendered inside the accordion body. |
