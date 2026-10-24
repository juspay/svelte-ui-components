# NativeFileInput

A native file picker with form participation, reset/cancel recovery and an optional
bindable HTMLInputElement reference. This is an explicit opt-in component; the
released styled FileInput and its custom-element form membership stay unchanged.

```svelte
<script lang="ts">
  import { NativeFileInput } from '@juspay/svelte-ui-components';
</script>

<NativeFileInput name="attachment" required accept="image/*" />
```

Props follow FileInput's native picker props (`name`, `required`, `accept`, `multiple`,
`disabled`, `maxSizeBytes`, `nativeAttrs`, `element`, error/hint metadata and callbacks).
Use `onfileerror(message)` for file-validation failures; the legacy FileInput
`onerror(message)` callback remains unchanged on the old component.
No trigger snippet or drop-region activation mode is needed. The adapter supplies
the legacy component's required trigger internally. `openFilePicker()` forwards to the
same controlled picker implementation. The component adds no layout wrapper.

## Web Component

`<sui-native-file-input name="attachment" required>` is form-associated. Its default
mode is native, with no native attribute required. Outer FormData receives File
entries; external form owners, required validity, reset and disabled fieldsets are
handled through the form-associated bridge. JavaScript nativeAttrs and element props
are available, and callback dispatch follows FileInput's existing conventions.

`<sui-file-input>` retains the styled tag's original non-form-associated behavior,
including its absence from form.elements. Native form membership is not added to old
consumers just because they upgrade the library.

See [4.x compatibility](./COMPATIBILITY_4X.md).
