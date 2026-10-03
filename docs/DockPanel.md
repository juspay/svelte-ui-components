# DockPanel

A persistent, resizable, non-modal panel with closed, docked and expanded states.
The consumer owns its placement and applies the published width reservation to the
page. The panel never locks body scrolling or traps focus.

## Usage

```svelte
<script lang="ts">
  import { DockPanel } from '@juspay/svelte-ui-components';
  import type { DockPanelState } from '@juspay/svelte-ui-components';
  let panelState: DockPanelState = $state('docked');
  let width = $state(380);
  let reservedWidth = $state(0);
</script>

<main style:margin-right={`${reservedWidth}px`}>Your page</main>
<DockPanel bind:state={panelState} bind:width bind:reservedWidth label="Assistant">
  {#snippet header({ expand, collapse, close })}
    <!-- Render your header actions using these state controls. -->
  {/snippet}
  {#snippet body()}Your conversation{/snippet}
  {#snippet footer()}Your composer{/snippet}
</DockPanel>
```

## Props

| Prop          | Type                           | Required | Default        | Description                                                  |
| ------------- | ------------------------------ | -------- | -------------- | ------------------------------------------------------------ |
| state         | `DockPanelState`               | No       | `closed`       | Bindable `closed`, `docked` or `expanded`.                   |
| width         | `number`                       | No       | `380`          | Bindable dock width in pixels, clamped to the bounds.        |
| minWidth      | `number`                       | No       | `300`          | Minimum dock width.                                          |
| maxWidth      | `number`                       | No       | `600`          | Maximum dock width.                                          |
| reservedWidth | `number`                       | No       | `0`            | Bindable output: dock width while docked, zero otherwise.    |
| label         | `string`                       | No       | `Panel`        | Accessible name of the complementary region.                 |
| resizeLabel   | `string`                       | No       | `Resize panel` | Accessible left-edge handle label.                           |
| header        | `Snippet<[DockPanelControls]>` | No       | `-`            | Header receiving state, expand, collapse and close controls. |
| body          | `Snippet`                      | No       | `-`            | Scrollable body content.                                     |
| footer        | `Snippet`                      | No       | `-`            | Footer outside the body scroll area.                         |
| children      | `Snippet`                      | No       | `-`            | Body fallback when body is absent.                           |
| testId        | `string`                       | No       | `-`            | Root data-pw hook.                                           |
| classes       | `string`                       | No       | `-`            | Root classes.                                                |

The root and its content remain mounted and inert when closed. Consumers can conditionally
render a composer to keep only one input active across a separate pill and panel.
Container breakpoints, overlay-versus-push decisions and draft handoff belong to the
host. The published reservation describes the dock; a host can ignore it when overlaying.

## Events

| Event         | Type                              | Description                                      |
| ------------- | --------------------------------- | ------------------------------------------------ |
| onstatechange | `(state: DockPanelState) => void` | State changes through header controls or Escape. |
| onwidthchange | `(width: number) => void`         | Resized or normalized dock width.                |

## Accessibility and keyboard

The root is role=complementary, without aria-modal. The left edge uses Resizable's
keyboard splitter control. Escape is registered only while expanded and returns to
docked through the shared dismissal stack, so a later-opened menu owns Escape first.
There is no focus trap, automatic focus movement, outside-click dismissal or scroll lock.

## CSS Variables

| Variable                         | Default                                    | CSS Property               | Description                                 |
| -------------------------------- | ------------------------------------------ | -------------------------- | ------------------------------------------- |
| --dock-panel-position            | fixed                                      | position                   | Use absolute inside a positioned host slot. |
| --dock-panel-top                 | 0px                                        | top                        | Top inset.                                  |
| --dock-panel-right               | 0px                                        | right                      | Right inset.                                |
| --dock-panel-bottom              | 0px                                        | bottom                     | Bottom inset.                               |
| --dock-panel-left                | 0px                                        | left                       | Expanded left inset.                        |
| --dock-panel-z-index             | 30                                         | z-index                    | Host stacking level.                        |
| --dock-panel-background          | #ffffff                                    | background                 | Panel surface.                              |
| --dock-panel-color               | #18181b                                    | color                      | Panel text.                                 |
| --dock-panel-border              | 1px solid #e4e4e7                          | border                     | Frame border, included in dock width.       |
| --dock-panel-border-radius       | 0px                                        | border-radius              | Panel corners.                              |
| --dock-panel-box-shadow          | -4px 0 16px #00000012                      | box-shadow                 | Panel shadow.                               |
| --dock-panel-header-padding      | 0px                                        | padding                    | Header spacing.                             |
| --dock-panel-header-border       | none                                       | border-bottom              | Header separator.                           |
| --dock-panel-body-padding        | 0px                                        | padding                    | Scrollable body spacing.                    |
| --dock-panel-footer-padding      | 0px                                        | padding                    | Footer spacing.                             |
| --dock-panel-footer-border       | none                                       | border-top                 | Footer separator.                           |
| --dock-panel-transition-duration | duration-base → motion-duration → 200ms    | transition-duration        | Entry/exit duration.                        |
| --dock-panel-transition-easing   | ease-smooth-out → motion-easing → ease-out | transition-timing-function | Entry/exit curve.                           |
| --dock-panel-enter-distance      | distance-base → 8px                        | transform                  | Entry/exit travel.                          |

Reduced motion disables transitions in the component. All fallback chains terminate
in literals. Expanded uses both horizontal insets to fill the containing area; docked
keeps its clamped width anchored at the right edge. A left-edge drag never pins height.

## Web Component

Tag: `<sui-dock-panel>`

```html
<sui-dock-panel state="docked" width="380" label="Assistant">
  <div slot="header">Header</div>
  <p>Conversation</p>
  <div slot="footer">Composer</div>
</sui-dock-panel>
```

State, width and reserved-width reflect the current values. JS properties use camelCase
(`minWidth`, `maxWidth`, `reservedWidth`, `resizeLabel`); attributes use kebab-case.
`onstatechange` and `onwidthchange` callbacks also dispatch statechange and widthchange
with their single value in detail. Their names do not collide with native handlers.

### Slots

| Slot Name | Maps to Snippet | Description                                                       |
| --------- | --------------- | ----------------------------------------------------------------- |
| header    | header          | Optional header; absent slot preserves a supplied header snippet. |
| body      | body            | Body content; falls back to default light-DOM content.            |
| (default) | body            | Body content when no named body slot is assigned.                 |
| footer    | footer          | Optional footer; absent slot preserves a supplied footer snippet. |

The host display is controlled by --sui-dock-panel-display (block by default).

A `body` snippet assigned as a JavaScript property takes precedence over the named
body and default slots. Clearing that property restores native slot content.
