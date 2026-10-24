# Dialog

A native HTML dialog component for overlays that require browser top-layer focus
and background isolation. The existing `Modal` remains available for its composed
header/footer presentation. Dialog leaves composition and appearance to the host.

```svelte
<script lang="ts">
  import { Dialog, Button } from '@juspay/svelte-ui-components';
  let open = $state(false);
</script>

<Button text="Details" onclick={() => (open = true)} />
<Dialog bind:open nativeAttrs={{ 'aria-labelledby': 'details-title' }}>
  <h2 id="details-title">Details</h2>
  <Button text="Close" onclick={() => (open = false)} />
</Dialog>
```

## Props

| Prop          | Type                                       | Default | Description                                                  |
| ------------- | ------------------------------------------ | ------- | ------------------------------------------------------------ |
| `open`        | `boolean`                                  | `false` | Bindable visibility; modal opening uses native `showModal()` |
| `modal`       | `boolean`                                  | `true`  | Browser top-layer modal versus non-modal `show()`            |
| `lockScroll`  | `boolean`                                  | `true`  | Reference-counted body scroll locking while modal and open   |
| `element`     | `HTMLDialogElement \| null`                | `null`  | Bindable native reference for Svelte consumers               |
| `nativeAttrs` | `Omit<HTMLDialogAttributes, managed keys>` | unset   | Accessible naming and other native attributes                |
| `classes`     | `string`                                   | unset   | Class names on the actual dialog                             |
| `testId`      | `string`                                   | unset   | `data-pw` on the actual dialog                               |
| `children`    | `Snippet`                                  | unset   | Dialog content                                               |

## Events

| Event      | Type                          | Description                                            |
| ---------- | ----------------------------- | ------------------------------------------------------ |
| `onclose`  | `(event: Event) => void`      | Native dialog close; synchronizes `open` to false      |
| `oncancel` | `(event: Event) => void`      | Native Escape/cancel; prevent default to keep open     |
| `onclick`  | `(event: MouseEvent) => void` | Native click, including a host-defined backdrop action |

Keep headings and their `aria-labelledby` targets in the dialog's own tree. In a
web component the content is slotted light DOM: cross-shadow ID references need
an accessible name that resolves in that context. Give the dialog a name; do not
announce a generic unnamed modal.

## Web Component

`<sui-dialog>` accepts `open`, `modal`, `lock-scroll`, `classes`, `test-id`, and
JavaScript `nativeAttrs`/callback properties. Its default slot supplies content.
Native callbacks retain their browser event names; no duplicate synthetic click,
cancel, or close event is dispatched.

Web components expose `ondialogclose` / `dialogclose` and `ondialogcancel` / `dialogcancel`; native host click/keydown accessors remain intact.

The web component also exposes `ondialogclick` / `dialogclick` and
`ondialogkeydown` / `dialogkeydown` as early hooks. These names preserve the
host's native click/keydown accessors.

When a browser leaves focus on the dialog container instead of projected controls,
Dialog focuses its first eligible composed descendant, respecting native autofocus.
Set `returnFocusTo` when the opening control is known: pointer interactions do not
focus buttons consistently across engines. Focus is restored on close, not on
a later unrelated unmount of an already-closed dialog.

Focus restoration runs once per open cycle, including unmount. A native `close`
notification queued by destruction does not invoke `onclose` against an unmounted
component. Replacing props does not discard the mounted dialog reference.

Changing `modal` while open updates the native dialog's top-layer modality without
emitting a logical close. The current composed-tree descendant retains focus
where possible. Non-modal dialogs do not claim priority over modal dismissible
layers. Tab boundaries ignore hidden, disabled and negative-tabindex controls.
