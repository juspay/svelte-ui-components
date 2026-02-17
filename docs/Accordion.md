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

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| expand | `unknown` | No | `false` | Controls whether the accordion content is expanded (visible) or collapsed (hidden). Uses CSS grid animation. |
