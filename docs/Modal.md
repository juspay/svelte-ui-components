# Modal

A dialog overlay component that renders on top of the page with configurable size, alignment, header (with left/right images and text), footer (with primary/secondary Button components), and transition animations. It locks body scroll on mount and optionally handles hardware back-press navigation. The overlay supports click-to-dismiss (debounced) and Escape key handling.

## Usage

```svelte
<script>
  import { Modal } from '@juspay/svelte-ui-components';
</script>

<Modal />
```

## Props

| Prop                     | Type                                                                                                                        | Required | Default         | Description                                                                                                                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- | -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| size                     | `ModalSize = 'large' \| 'medium' \| 'small' \| 'fit-content'`                                                               | No       | `'fit-content'` | Controls the height of the modal content panel. 'small'=20vh, 'medium'=50vh, 'large'=80vh, 'fit-content'=auto with 80vh max.                                                                                 |
| align                    | `ModalAlign = 'top' \| 'center' \| 'bottom'`                                                                                | No       | `'center'`      | Vertical alignment of the modal within the viewport. 'top' aligns to the top (flex-start), 'center' centers vertically, 'bottom' aligns to the bottom (flex-end).                                            |
| showOverlay              | `boolean`                                                                                                                   | No       | `true`          | When true, shows a dark semi-transparent overlay behind the modal. When false, the overlay is transparent with pointer-events disabled.                                                                      |
| supportHardwareBackPress | `boolean`                                                                                                                   | No       | `false`         | When true, pushes a history state on mount so that pressing the device back button triggers onclose instead of navigating away. Cleans up on destroy.                                                        |
| enableTransition         | `boolean`                                                                                                                   | No       | `true`          | When true, the modal content animates in/out using fly or fade transitions via ModalAnimation.                                                                                                               |
| transitionType           | `ModalTransition = 'IN' \| 'ALL'`                                                                                           | No       | `'ALL'`         | Controls transition behavior. 'ALL' animates both in and out transitions. 'IN' only animates the in-transition (content disappears instantly on close).                                                      |
| header                   | `{     leftImage?: string;     rightImage?: string;     text?: string;     testId?: string;     buttonTestId?: string;     buttonAriaLabel?: string;   }` | No       | `{}`            | Object configuring the modal header bar. leftImage: URL for left icon (e.g., back arrow); rightImage: URL for right icon (e.g., close button); text: header title text; testId/buttonTestId: test selectors; buttonAriaLabel: accessible name (rendered as `aria-label`) for the right image's `role="button"` wrapper — required for screen readers since the wrapper carries no visible text. |
| footer                   | `{     primaryButton?: ButtonProperties;     secondaryButton?: ButtonProperties;   }`                                       | No       | `-`             | Object configuring footer action buttons. primaryButton: ButtonProperties for the main action button; secondaryButton: ButtonProperties for the alternate action button.                                     |
| debounceTime             | `number`                                                                                                                    | No       | `700`           | Debounce delay in milliseconds for overlay click handling. Prevents rapid repeated overlay dismissals.                                                                                                       |
| leftImageTestId          | `string`                                                                                                                    | No       | `-`             | Value for data-pw on the left header image wrapper.                                                                                                                                                          |
| leftImageAriaLabel       | `string`                                                                                                                    | No       | `-`             | Accessible name (rendered as `aria-label`) for the left header image's `role="button"` wrapper (e.g., a back control) — required for screen readers since the wrapper carries no visible text.               |
| testId                   | `string`                                                                                                                    | No       | `-`             | Value for data-pw on the modal overlay container.                                                                                                                                                            |
| classes                  | `string`                                                                                                                    | No       | `-`             | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                       |
| overlayBackdropFilter    | `string`                                                                                                                    | No       | `-`             | CSS `backdrop-filter` value applied to the overlay (e.g. `"blur(6px)"`). Sets `--modal-overlay-backdrop-filter` inline on the overlay div. Default: `none` (no blur).                                        |
| usePortal                | `boolean`                                                                                                                   | No       | `false`         | When true, mounts the modal overlay at `document.body` so it escapes any ancestor clipping or stacking contexts. Useful inside `overflow: hidden` or `transform` containers.                                 |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet       | Type      | Description                                                                                                             |
| ------------- | --------- | ----------------------------------------------------------------------------------------------------------------------- |
| content       | `Snippet` | A Svelte 5 Snippet for the main modal body content. The modal only renders when this snippet is provided.               |
| footerSnippet | `Snippet` | A Svelte 5 Snippet that replaces the default footer buttons with custom content. Takes precedence over the footer prop. |

## Events

| Event                   | Type                             | Description                                                                                                                                                                           |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onclose                 | `() => void`                     | Fires when the hardware back button is pressed (only when `supportHardwareBackPress` is true). Does NOT fire on overlay click or Escape key — those trigger `onoverlayClick` instead. |
| onheaderRightImageClick | `(event: MouseEvent) => void`    | Fires when the right image in the header is clicked (e.g., close button).                                                                                                             |
| onheaderLeftImageClick  | `(event: MouseEvent) => void`    | Fires when the left image in the header is clicked (e.g., back arrow).                                                                                                                |
| onprimaryButtonClick    | `(event: MouseEvent) => void`    | Fires when the primary footer button is clicked.                                                                                                                                      |
| onsecondaryButtonClick  | `(event: MouseEvent) => void`    | Fires when the secondary footer button is clicked.                                                                                                                                    |
| onoverlayClick          | `() => void`                     | Fires when the dark overlay background is clicked (outside the modal content). Also fires when the Escape key is pressed. Debounced by debounceTime milliseconds.                     |
| onkeydown               | `(event: KeyboardEvent) => void` | Fires when any key is pressed while the modal is open (attached to the window).                                                                                                       |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                                 | Default            | CSS Property                    | Description                                                                                                      |
| -------------------------------------------------------- | ------------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--modal-width`                                          | `100vw`            | width                           | Width of the modal overlay container.                                                                            |
| `--modal-height`                                         | `100vh`            | height                          | Height of the modal overlay container.                                                                           |
| `--modal-z-index`                                        | `15`               | z-index                         | Z-index stacking order of the modal overlay.                                                                     |
| `--modal-margin`                                         | `-`                | margin                          | Outer margin of the modal overlay.                                                                               |
| `--modal-overlay-background-color`                       | `#00000066`        | background-color                | Overlay backdrop color. Prefer this modal-specific token over the generic `--background-color`.                  |
| `--background-color`                                     | `#00000066`        | background-color                | Legacy alias for `--modal-overlay-background-color` (kept for backward compatibility).                           |
| `--modal-overlay-backdrop-filter`                        | `none`             | backdrop-filter                 | Backdrop filter applied to the overlay (e.g. `blur(6px)`). Can also be set via the `overlayBackdropFilter` prop. |
| `--modal-content-background-color`                       | `#ffffff`          | background-color                | Background color of the modal content panel.                                                                     |
| `--modal-border-radius`                                  | `0px`              | border-radius                   | Corner rounding of the modal content panel.                                                                      |
| `--modal-content-overflow`                               | `auto`             | overflow                        | Overflow behavior of the modal content panel.                                                                    |
| `--modal-content-border-top`                             | `-`                | border-top                      | Top border of the modal content panel.                                                                           |
| `--modal-max-height`                                     | `calc(100dvh - 32px)` | max-height                   | Viewport cap applied to the content panel at every size. Keeps tall modals (e.g. a size height var overridden to `fit-content`) from growing past the screen — the body scrolls internally and the footer stays visible. |
| `--modal-slot-content-min-height`                        | `0`                | min-height                      | Min-height of the scrollable content area. The `0` default lets it shrink inside the capped panel so `--modal-overflow-y` engages; set to `auto` to restore the old grow-past-the-cap behavior. |
| `--modal-display`                                        | `flex`             | display                         | Display property of the scrollable content area.                                                                 |
| `--modal-overflow-y`                                     | `scroll`           | overflow-y                      | Vertical overflow behavior of the content area.                                                                  |
| `--modal-scrollbar-width`                                | `none`             | scrollbar-width                 | Scrollbar width for the content area (set 'none' to hide).                                                       |
| `--modal-content-padding`                                | `0`                | padding                         | Padding inside the modal content area (slot-content). Defaults to 0; set to inset the body from the modal walls. |
| `--modal-center-justify-content`                         | `center`           | justify-content                 | Vertical positioning of the modal when align='center'.                                                           |
| `--modal-center-align-items`                             | `center`           | align-items                     | Horizontal positioning of the modal when align='center'.                                                         |
| `--modal-bottom-justify-content`                         | `flex-end`         | justify-content                 | Vertical positioning of the modal when align='bottom'.                                                           |
| `--modal-bottom-align-items`                             | `-`                | align-items                     | Horizontal positioning of the modal when align='bottom'.                                                         |
| `--modal-top-justify-content`                            | `flex-start`       | justify-content                 | Vertical positioning of the modal when align='top'.                                                              |
| `--modal-top-align-items`                                | `-`                | align-items                     | Horizontal positioning of the modal when align='top'.                                                            |
| `--modal-small-height`                                   | `20vh`             | height                          | Height of the modal content when size='small'.                                                                   |
| `--modal-small-width`                                    | `-`                | width                           | Width of the modal content when size='small'.                                                                    |
| `--modal-medium-height`                                  | `50vh`             | height                          | Height of the modal content when size='medium'.                                                                  |
| `--modal-medium-width`                                   | `-`                | width                           | Width of the modal content when size='medium'.                                                                   |
| `--modal-large-height`                                   | `80vh`             | height                          | Height of the modal content when size='large'.                                                                   |
| `--modal-large-width`                                    | `-`                | width                           | Width of the modal content when size='large'.                                                                    |
| `--modal-fit-content-max-height`                         | `80vh`             | max-height                      | Maximum height of the modal when size='fit-content'.                                                             |
| `--modal-header-background-color`                        | `#f6f7f9`          | background-color                | Background color of the modal header bar.                                                                        |
| `--modal-header-padding`                                 | `18px 20px`        | padding                         | Padding inside the header bar.                                                                                   |
| `--modal-header-border-radius`                           | `0px`              | border-radius                   | Corner rounding of the header bar.                                                                               |
| `--modal-header-border-bottom`                           | `none`             | border-bottom                   | Bottom border of the header bar.                                                                                 |
| `--modal-header-align-items`                             | `center`           | align-items                     | Vertical alignment of items inside the header bar.                                                               |
| `--modal-footer-background-color`                        | `#f6f7f9`          | background-color                | Background color of the footer area.                                                                             |
| `--modal-footer-padding`                                 | `18px 20px`        | padding                         | Padding inside the footer area.                                                                                  |
| `--modal-footer-border-radius`                           | `0px`              | border-radius                   | Corner rounding of the footer area.                                                                              |
| `--modal-footer-border-top`                              | `none`             | border-top                      | Top border of the footer area.                                                                                   |
| `--modal-footer-justify-content`                         | `none`             | justify-content                 | Horizontal alignment of footer content.                                                                          |
| `--modal-footer-gap`                                     | `0px`              | gap                             | Gap between primary and secondary footer buttons.                                                                |
| `--modal-footer-action-buttons-width`                    | `fit-content`      | width                           | Width of the footer action buttons container.                                                                    |
| `--modal-footer-secondary-button-max-height`             | `-`                | --button-max-height             | Maximum height of the secondary footer button.                                                                   |
| `--modal-footer-secondary-button-max-width`              | `-`                | --button-max-width              | Maximum width of the secondary footer button.                                                                    |
| `--modal-footer-secondary-button-font-family`            | `-`                | --button-font-family            | Font family of the secondary footer button.                                                                      |
| `--modal-footer-secondary-button-font-weight`            | `500`              | --button-font-weight            | Font weight of the secondary footer button.                                                                      |
| `--modal-footer-secondary-button-font-size`              | `14px`             | --button-font-size              | Font size of the secondary footer button.                                                                        |
| `--modal-footer-secondary-button-color`                  | `#3a4550`          | --button-color                  | Background color of the secondary footer button.                                                                 |
| `--modal-footer-secondary-button-text-color`             | `white`            | --button-text-color             | Text color of the secondary footer button.                                                                       |
| `--modal-footer-secondary-button-height`                 | `fit-content`      | --button-height                 | Height of the secondary footer button.                                                                           |
| `--modal-footer-secondary-button-padding`                | `16px`             | --button-padding                | Padding inside the secondary footer button.                                                                      |
| `--modal-footer-secondary-button-margin`                 | `-`                | --button-margin                 | Margin around the secondary footer button.                                                                       |
| `--modal-footer-secondary-button-border-radius`          | `0px`              | --button-border-radius          | Corner rounding of the secondary footer button.                                                                  |
| `--modal-footer-secondary-button-width`                  | `fit-content`      | --button-width                  | Width of the secondary footer button.                                                                            |
| `--modal-footer-secondary-button-cursor`                 | `pointer`          | --cursor                        | Cursor style of the secondary footer button.                                                                     |
| `--modal-footer-secondary-button-opacity`                | `1`                | --opacity                       | Opacity of the secondary footer button.                                                                          |
| `--modal-footer-secondary-button-border`                 | `none`             | --button-border                 | Border of the secondary footer button.                                                                           |
| `--modal-footer-secondary-button-justify-content`        | `center`           | --button-justify-content        | Justify content of the secondary footer button.                                                                  |
| `--modal-footer-secondary-button-content-gap`            | `16px`             | --button-content-gap            | Gap between content elements in the secondary footer button.                                                     |
| `--modal-footer-secondary-button-visibility`             | `visible`          | --button-visibility             | Visibility of the secondary footer button.                                                                       |
| `--modal-footer-secondary-button-box-shadow`             | `none`             | --button-box-shadow             | Box shadow of the secondary footer button.                                                                       |
| `--modal-footer-secondary-button-content-flex-direction` | `row`              | --button-content-flex-direction | Flex direction of the secondary footer button content.                                                           |
| `--modal-secondary-button-order`                         | `none`             | order                           | Flex order of the secondary footer button.                                                                       |
| `--modal-footer-secondary-button-flex-value`             | `none`             | flex                            | Flex value of the secondary footer button.                                                                       |
| `--modal-footer-primary-button-max-height`               | `-`                | --button-max-height             | Maximum height of the primary footer button.                                                                     |
| `--modal-footer-primary-button-max-width`                | `-`                | --button-max-width              | Maximum width of the primary footer button.                                                                      |
| `--modal-footer-primary-button-font-family`              | `-`                | --button-font-family            | Font family of the primary footer button.                                                                        |
| `--modal-footer-primary-button-font-weight`              | `500`              | --button-font-weight            | Font weight of the primary footer button.                                                                        |
| `--modal-footer-primary-button-font-size`                | `14px`             | --button-font-size              | Font size of the primary footer button.                                                                          |
| `--modal-footer-primary-button-color`                    | `#3a4550`          | --button-color                  | Background color of the primary footer button.                                                                   |
| `--modal-footer-primary-button-text-color`               | `white`            | --button-text-color             | Text color of the primary footer button.                                                                         |
| `--modal-footer-primary-button-height`                   | `fit-content`      | --button-height                 | Height of the primary footer button.                                                                             |
| `--modal-footer-primary-button-padding`                  | `16px`             | --button-padding                | Padding inside the primary footer button.                                                                        |
| `--modal-footer-primary-button-margin`                   | `-`                | --button-margin                 | Margin around the primary footer button.                                                                         |
| `--modal-footer-primary-button-border-radius`            | `0px`              | --button-border-radius          | Corner rounding of the primary footer button.                                                                    |
| `--modal-footer-primary-button-width`                    | `fit-content`      | --button-width                  | Width of the primary footer button.                                                                              |
| `--modal-footer-primary-button-cursor`                   | `pointer`          | --cursor                        | Cursor style of the primary footer button.                                                                       |
| `--modal-footer-primary-button-opacity`                  | `1`                | --opacity                       | Opacity of the primary footer button.                                                                            |
| `--modal-footer-primary-button-border`                   | `none`             | --button-border                 | Border of the primary footer button.                                                                             |
| `--modal-footer-primary-button-justify-content`          | `center`           | --button-justify-content        | Justify content of the primary footer button.                                                                    |
| `--modal-footer-primary-button-content-flex-direction`   | `row`              | --button-content-flex-direction | Flex direction of the primary footer button content.                                                             |
| `--modal-footer-primary-button-content-gap`              | `16px`             | --button-content-gap            | Gap between content elements in the primary footer button.                                                       |
| `--modal-footer-primary-button-visibility`               | `visible`          | --button-visibility             | Visibility of the primary footer button.                                                                         |
| `--modal-footer-primary-button-box-shadow`               | `none`             | --button-box-shadow             | Box shadow of the primary footer button.                                                                         |
| `--modal-primary-button-order`                           | `none`             | order                           | Flex order of the primary footer button.                                                                         |
| `--modal-footer-primary-button-flex-value`               | `none`             | flex                            | Flex value of the primary footer button.                                                                         |
| `--header-text-size`                                     | `16px`             | font-size                       | Font size of the header title text.                                                                              |
| `--modal-header-text-weight`                             | `-`                | font-weight                     | Font weight of the header title text.                                                                            |
| `--modal-header-text-line-height`                        | `-`                | line-height                     | Line height of the header title text.                                                                            |
| `--modal-header-text-letter-spacing`                     | `-`                | letter-spacing                  | Letter spacing of the header title text.                                                                         |
| `--header-img-top-padding`                               | `5px`              | padding-top                     | Top padding on both header images.                                                                               |
| `--header-left-image-margin`                             | `0px 18px 0px 0px` | margin                          | Margin around the left header image.                                                                             |
| `--header-left-image-width`                              | `25px`             | width                           | Width of the left header image.                                                                                  |
| `--header-left-image-height`                             | `25px`             | height                          | Height of the left header image.                                                                                 |
| `--header-right-image-width`                             | `25px`             | width                           | Width of the right header image.                                                                                 |
| `--header-right-image-height`                            | `25px`             | height                          | Height of the right header image.                                                                                |
| `--header-right-image-padding`                           | `-`                | padding                         | Padding around the right header image.                                                                           |

## Type Reference

Custom types used by this component's props and events:

### ModalSize

```typescript
type ModalSize = 'large' | 'medium' | 'small' | 'fit-content';
```

### ModalAlign

```typescript
type ModalAlign = 'top' | 'center' | 'bottom';
```

### ModalTransition

```typescript
type ModalTransition = 'IN' | 'ALL';
```

### ButtonProperties

```typescript
type ButtonProperties = {
  text?: string;
  enable?: boolean;
  showProgressBar?: boolean;
  showLoader?: boolean;
  loaderType?: 'Circular' | 'ProgressBar';
  type?: 'submit' | 'reset' | 'button';
  testId?: string;
  icon?: Snippet;
  children?: Snippet;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  disabled?: boolean;
  classes?: string;
  onclick?: (event: MouseEvent) => void;
  onkeyup?: (event: KeyboardEvent) => void;
};
```

## Internal Dependencies

This component uses the following library components internally:

- Animations
- Button

## Web Component

Tag: `<sui-modal>`

```html
<sui-modal size="medium" show-overlay>
  <p>Modal body content</p>
  <div slot="footer">
    <button>Cancel</button>
    <button>Confirm</button>
  </div>
</sui-modal>
```

### Slots

| Slot Name   | Maps to Snippet | Description                                |
| ----------- | --------------- | ------------------------------------------ |
| _(default)_ | `content`       | The main body content of the modal.        |
| `footer`    | `footerSnippet` | Content rendered in the modal footer area. |
