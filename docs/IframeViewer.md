# IframeViewer

A security-conscious iframe embed. It renders an `<iframe>` for the given `src` and forwards `postMessage` events to `onMessage` only when the message origin is in `allowedOrigins` **and** the message originates from the embedded iframe's own window. An empty `allowedOrigins` list (the default) processes nothing, so it is secure by default.

## Usage

```svelte
<script>
  import { IframeViewer } from '@juspay/svelte-ui-components';
</script>

<IframeViewer
  src={'https://example.com'}
  title={'Example'}
  allowedOrigins={['https://example.com']}
  onMessage={(event) => console.log(event.data)}
/>
```

## Props

| Prop           | Type                | Required | Default              | Description                                                                                                                      |
| -------------- | ------------------- | -------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| src            | `string`            | Yes      | `-`                  | URL loaded into the iframe.                                                                                                      |
| title          | `string`            | No       | `'Embedded Content'` | Accessible title for the iframe.                                                                                                 |
| allowedOrigins | `string[]`          | No       | `[]`                 | Origins allowed to send `postMessage` events to `onMessage`. An empty array (the default) processes nothing — secure by default. |
| allow          | `string`            | No       | `'fullscreen'`       | Permissions policy applied to the iframe `allow` attribute.                                                                      |
| sandbox        | `string`            | No       | `-`                  | Value for the iframe `sandbox` attribute. Omitted when not set.                                                                  |
| loading        | `'eager' \| 'lazy'` | No       | `-`                  | Loading strategy for the iframe. Omitted when not set.                                                                           |
| referrerpolicy | `ReferrerPolicy`    | No       | `-`                  | Referrer policy for the iframe. Omitted when not set.                                                                            |
| testId         | `string`            | No       | `-`                  | Test selector applied as `data-pw` on the container.                                                                             |
| classes        | `string`            | No       | `-`                  | Additional CSS classes applied to the container.                                                                                 |

## Events

Event handler props with callback signatures.

| Event     | Type                            | Description                                                                                                                                 |
| --------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| onMessage | `(event: MessageEvent) => void` | Called with the `MessageEvent` for `postMessage` events whose origin is in `allowedOrigins` and whose source is the embedded iframe window. |

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
  loading="lazy"
  referrer-policy="no-referrer"
  test-id="commerce-frame"
></sui-iframe-viewer>
```

The `allowed-origins` attribute and the `onMessage` callback are set as JavaScript properties on the element (callbacks cannot cross the HTML attribute boundary):

```js
const frame = document.querySelector('sui-iframe-viewer');
frame.allowedOrigins = ['https://example.com'];
frame.onMessage = (event) => console.log(event.data);
```
