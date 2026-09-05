# IframeViewer

A security-conscious iframe embed. It renders an `<iframe>` for the given `src` and forwards `postMessage` events to `onmessage` only when the message origin is in `allowedOrigins` **and** the message originates from the embedded iframe's own window. An empty `allowedOrigins` list (the default) processes nothing, so it is secure by default.

## Usage

```svelte
<script>
  import { IframeViewer } from '@juspay/svelte-ui-components';
</script>

<IframeViewer
  src={'https://example.com'}
  title={'Example'}
  allowedOrigins={['https://example.com']}
  onmessage={(event) => console.log(event.data)}
/>
```

## Props

| Prop           | Type                | Required | Default              | Description                                                                                                                      |
| -------------- | ------------------- | -------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| src            | `string`            | Yes      | `-`                  | URL loaded into the iframe.                                                                                                      |
| title          | `string`            | No       | `'Embedded Content'` | Accessible title for the iframe.                                                                                                 |
| allowedOrigins | `string[]`          | No       | `[]`                 | Origins allowed to send `postMessage` events to `onmessage`. An empty array (the default) processes nothing — secure by default. |
| allow          | `string`            | No       | `'fullscreen'`       | Permissions policy applied to the iframe `allow` attribute.                                                                      |
| sandbox        | `string`            | No       | `-`                  | Value for the iframe `sandbox` attribute. Omitted when not set.                                                                  |
| credentialless | `boolean`           | No       | `-`                  | Sets the iframe's `credentialless` attribute. Applied in the same render statement as `src`, so it is present before the iframe's first load — no dependency on effect-scheduling order. |
| loading        | `'eager' \| 'lazy'` | No       | `-`                  | Loading strategy for the iframe. Omitted when not set.                                                                           |
| referrerpolicy | `ReferrerPolicy`    | No       | `-`                  | Referrer policy for the iframe. Omitted when not set.                                                                            |
| testId         | `string`            | No       | `-`                  | Test selector applied as `data-pw` on the container.                                                                             |
| classes        | `string`            | No       | `-`                  | Additional CSS classes applied to the container.                                                                                 |

## Events

Event handler props with callback signatures.

| Event     | Type                            | Description                                                                                                                                 |
| --------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| onmessage | `(event: MessageEvent) => void` | Called with the `MessageEvent` for `postMessage` events whose origin is in `allowedOrigins` and whose source is the embedded iframe window. |

## Instance Methods

`postMessage` is exported from the component instance — bind it to send messages into the embedded iframe (outbound), mirroring `onmessage` for the inbound direction:

```svelte
<script>
  import { IframeViewer } from '@juspay/svelte-ui-components';

  let viewerRef;
</script>

<IframeViewer bind:this={viewerRef} src="https://example.com" />
<button onclick={() => viewerRef.postMessage({ type: 'ping' }, 'https://example.com')}>
  Send message
</button>
```

| Method                                                | Description                                                                                        |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `postMessage(message: unknown, targetOrigin: string)` | Posts `message` to the embedded iframe's `contentWindow` at `targetOrigin`. No-op before the iframe mounts (`src` unset) or once it unmounts. |

This is a Svelte-only accessor via `bind:this` (same pattern as `FileInput`'s `openFilePicker`) — it is not bridged onto the `<sui-iframe-viewer>` custom element; see Web Component section below.

## CSS Variables

Override these custom properties to theme the component.

| Variable                        | Default | CSS Property  | Description                     |
| ------------------------------- | ------- | ------------- | ------------------------------- |
| `--iframe-viewer-width`         | `100%`  | width         | Width of the iframe container.  |
| `--iframe-viewer-height`        | `100%`  | height        | Height of the iframe container. |
| `--iframe-viewer-border`        | `none`  | border        | Border of the iframe.           |
| `--iframe-viewer-border-radius` | `0`     | border-radius | Corner rounding of the iframe.  |

## Web Component

Tag: `<sui-iframe-viewer>`

```html
<sui-iframe-viewer
  src="https://example.com"
  title="Example"
  allow="fullscreen"
  sandbox="allow-scripts allow-same-origin"
  credentialless
  loading="lazy"
  referrer-policy="no-referrer"
  test-id="commerce-frame"
></sui-iframe-viewer>
```

The `allowed-origins` attribute and the `onmessage` callback are set as JavaScript properties on the element (callbacks cannot cross the HTML attribute boundary):

```js
const frame = document.querySelector('sui-iframe-viewer');
frame.allowedOrigins = ['https://example.com'];
frame.onmessage = (event) => console.log(event.data);
```

`postMessage` is **not** exposed on `<sui-iframe-viewer>` — it is a Svelte-only instance accessor (see Instance Methods above). Web Component consumers already have a standard way to reach the same outcome: query the rendered `<iframe>` inside the element's shadow root and call its `contentWindow.postMessage` directly.
