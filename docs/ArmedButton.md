# ArmedButton

A two-click confirmation control for destructive or costly actions. The first click arms the
button and swaps its resting label for `confirmLabel`; a second click within `armedMs` disarms it
and calls `onconfirm`. The armed state also clears on blur, timeout, and unmount.

Use this instead of sharing an `armed` boolean across a list of buttons: each instance owns its
own timer and cannot leave a different row armed.

## Usage

```svelte
<script>
  import { ArmedButton } from '@juspay/svelte-ui-components';

  async function removeSession() {
    await api.removeSession();
  }
</script>

<ArmedButton
  label="Remove session"
  confirmLabel="Really remove?"
  armedMs={3000}
  onconfirm={removeSession}
/>
```

The component disarms **before** awaiting `onconfirm`. A slow request therefore never leaves the
button looking as though it is still waiting for its second click. Put pending/disabled state in
the caller if the confirmed operation needs it.

### Icon at rest

Pass `icon` to replace the resting text with an icon. Once armed, the button always shows the
text `confirmLabel`, so an icon-only square can grow into a readable confirmation control.

```svelte
<ArmedButton label="Delete" confirmLabel="sure?" onconfirm={remove}>
  {#snippet icon()}
    <TrashIcon aria-hidden="true" />
  {/snippet}
</ArmedButton>
```

## Props

| Prop           | Type                          | Required | Default    | Description |
| -------------- | ----------------------------- | -------- | ---------- | ----------- |
| `onconfirm`    | `() => void \| Promise<void>` | Yes      | `-`        | Called on the second click. The component disarms before invoking and awaiting it. |
| `label`        | `string`                      | Yes      | `-`        | Resting label and accessible name. Also supplies the default native `title`. |
| `confirmLabel` | `string`                      | No       | `'sure?'`  | Text shown while armed. The accessible name becomes `confirm: <label>`. |
| `armedMs`      | `number`                      | No       | `3000`     | Milliseconds before an armed button disarms itself. |
| `disabled`     | `boolean`                     | No       | `false`    | Disables the underlying Button. |
| `title`        | `string`                      | No       | derived    | Native title. Defaults to `label` at rest and `click again to <label, lowercased>` while armed. |
| `icon`         | `Snippet`                     | No       | `-`        | Replaces the resting text with an icon. Armed state still renders `confirmLabel`. |
| `classes`      | `string`                      | No       | `-`        | Class string on the outer `.armed-button` span for setting the variables below. |

## Behaviour and accessibility

- First click arms; second click confirms.
- Focus leaving the component disarms it, so a stale confirmation cannot survive keyboard or
  pointer navigation elsewhere.
- Timeout and component teardown clear the timer.
- The outer span is `role="presentation"`; the library Button remains the only interactive
  element and supplies native Enter/Space activation.
- At rest the accessible name is `label`; while armed it is `confirm: <label>`.
- `prefers-reduced-motion: reduce` disables the button transition.

## CSS Variables

Set these on the class passed through `classes`. They bridge into the scoped Button rendered
inside ArmedButton; a consumer selector should not reach into the internal button directly.

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `--armed-btn-bg` | `#f0f0f0` | Resting background. |
| `--armed-btn-hover-bg` | `--armed-btn-bg` | Resting hover background. |
| `--armed-btn-color` | `#4d4d4d` | Resting text/icon colour. |
| `--armed-btn-hover-color` | `#1a1a1a` | Resting hover text/icon colour. |
| `--armed-btn-border` | `1px solid #d0d0d0` | Resting border. |
| `--armed-btn-radius` | `7px` | Border radius. |
| `--armed-btn-height` | `26px` | Button height. |
| `--armed-btn-width` | `auto` | Resting width. |
| `--armed-btn-padding` | `0 8px` | Resting padding. |
| `--armed-btn-gap` | `4px` | Gap between icon and text. |
| `--armed-btn-font-size` | `12px` | Font size. |
| `--armed-btn-font-weight` | `400` | Resting font weight. |
| `--armed-btn-font-family` | `inherit` | Font family. |
| `--armed-btn-duration` | `150ms` | Background/text transition duration. |
| `--armed-btn-disabled-opacity` | `0.5` | Disabled opacity. |
| `--armed-btn-display` | `inline-flex` | Outer display. |
| `--armed-btn-margin-left` | `0` | Outer left margin. |
| `--armed-btn-flex-shrink` | `1` | Outer flex shrink. |
| `--armed-btn-font-ligatures` | `normal` | Outer `font-variant-ligatures`. |
| `--armed-btn-armed-bg` | `#dc2626` | Armed background. |
| `--armed-btn-armed-color` | `#ffffff` | Armed text colour. |
| `--armed-btn-armed-border` | `#dc2626` | Armed border colour. |
| `--armed-btn-armed-width` | `auto` | Armed width. |
| `--armed-btn-armed-padding` | `0 8px` | Armed padding. |
| `--armed-btn-armed-weight` | `600` | Armed font weight. |
