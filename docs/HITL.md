# HITL

Human-in-the-loop approval: the assistant wants to run an action, and the person approves or cancels it before it executes. Unless disabled, a countdown sweeps across the confirm button and auto-approves the action when it completes. Interacting with any HITL pauses every sibling card's countdown, so an auto-approval never fires while the user is actively deciding.

## Usage

```svelte
<script>
  import { HITL } from '@juspay/svelte-ui-components';
</script>

<HITL
  confirmationId={confirmation.id}
  title="Create discount"
  functionArguments={confirmation.arguments}
  onconfirm={({ confirmationId, action, approved }) => respond(confirmationId, approved, action)}
/>

<!-- Must not auto-approve (e.g. OAuth) — reject instead if untouched for 90s -->
<HITL countdownSeconds={0} autoCancelSeconds={90} ... />

<!-- Conversation history: settled card, no timers or buttons -->
<HITL isHistoryMode initialState={{ approved: true }} ... />
```

## Props

| Prop                 | Type                                      | Required | Default                    | Description                                                                                           |
| -------------------- | ----------------------------------------- | -------- | -------------------------- | ----------------------------------------------------------------------------------------------------- |
| confirmationId       | `string`                                  | Yes      | `-`                        | Correlates the decision with the pending action; echoed in the event.                                 |
| title                | `string`                                  | Yes      | `-`                        | The action, already humanised.                                                                        |
| description          | `string`                                  | No       | `-`                        | One-line explanation under the header.                                                                |
| sections             | `HITLSection[]`                           | No       | `-`                        | Labelled parameter blocks. Wins over `functionArguments`.                                             |
| functionArguments    | `Record<string, unknown>`                 | No       | `-`                        | Raw arguments, formatted generically (`*` → All, bools → Yes/No, arrays → bullets, nesting indented). |
| hiddenKeys           | `string[]`                                | No       | meta keys                  | Case-insensitive keys excluded from generic formatting.                                               |
| onconfirm            | `(event: HITLEvent) => void`              | No       | `-`                        | `{ confirmationId, action, approved }`; action is `approved`, `rejected`, or `auto-approved`.         |
| confirmLabel         | `string`                                  | No       | `'Confirm'`                | Confirm button text.                                                                                  |
| cancelLabel          | `string`                                  | No       | `'Cancel'`                 | Cancel button text.                                                                                   |
| countdownSeconds     | `number`                                  | No       | `10`                       | Auto-approve countdown; `0` disables.                                                                 |
| autoCancelSeconds    | `number`                                  | No       | `0`                        | Auto-reject an untouched card after N seconds; `0` disables.                                          |
| isMicMuted           | `boolean`                                 | No       | `false`                    | With `onmictoggle`: mic is muted while the card is open, restored on decision.                        |
| onmictoggle          | `() => void \| Promise<void>`             | No       | `-`                        | Toggle handler for voice sessions.                                                                    |
| isHistoryMode        | `boolean`                                 | No       | `false`                    | Render a settled card from `initialState`, no timers or buttons.                                      |
| initialState         | `{ approved?: boolean; status?: string }` | No       | `-`                        | `status: 'EXPIRED'` renders the timed-out state.                                                      |
| approvedIcon         | `Snippet`                                 | No       | built-in check             | Completion icon when approved.                                                                        |
| rejectedIcon         | `Snippet`                                 | No       | built-in halt              | Completion icon when rejected/expired.                                                                |
| badgeLabel           | `string`                                  | No       | `'ACTION'`                 | Eyebrow label above the title.                                                                        |
| approvedLabel        | `string`                                  | No       | `'Approved'`               | Completion text.                                                                                      |
| autoApprovedLabel    | `string`                                  | No       | `'Completed'`              | Completion text after auto-approval.                                                                  |
| rejectedLabel        | `string`                                  | No       | `'Action halted'`          | Completion text after cancel.                                                                         |
| expiredLabel         | `string`                                  | No       | `'Action timed out'`       | Completion text for expired history cards.                                                            |
| testId               | `string`                                  | No       | `-`                        | `data-pw` on the root; `-title`, `-completion`, `-completion-text`, `-confirm`, `-cancel` on parts.   |
| confirmTestId        | `string`                                  | No       | `<testId>-confirm`         | Overrides the confirm button's test id independent of `testId`.                                       |
| cancelTestId         | `string`                                  | No       | `<testId>-cancel`          | Overrides the cancel button's test id independent of `testId`.                                        |
| completionTestId     | `string`                                  | No       | `<testId>-completion`      | Overrides the completion strip's test id independent of `testId`.                                     |
| completionTextTestId | `string`                                  | No       | `<testId>-completion-text` | Overrides the completion text's test id independent of `testId`.                                      |
| classes              | `string`                                  | No       | `-`                        | Class string on the root element.                                                                     |

## CSS Variables

| Variable                            | Default             | Description                                |
| ----------------------------------- | ------------------- | ------------------------------------------ |
| `--hitl-background`                 | `#ffffff`           | Card background.                           |
| `--hitl-border`                     | `1px solid #e4e4e7` | Card border.                               |
| `--hitl-border-radius`              | `0.5rem`            | Card and overlay rounding.                 |
| `--hitl-padding`                    | `1.25rem`           | Card content padding.                      |
| `--hitl-max-width`                  | `100%`              | Max width of the card.                     |
| `--hitl-margin`                     | `0`                 | Outer margin of the card.                  |
| `--hitl-header-gap`                 | `2px`               | Gap between badge and title.               |
| `--hitl-header-margin-bottom`       | `0.75rem`           | Space below the header block.              |
| `--hitl-badge-color`                | `#858585`           | Eyebrow color.                             |
| `--hitl-badge-font-size`            | `0.6875rem`         | Eyebrow font size.                         |
| `--hitl-badge-font-weight`          | `600`               | Eyebrow font weight.                       |
| `--hitl-badge-letter-spacing`       | `0.06em`            | Eyebrow letter spacing.                    |
| `--hitl-title-color`                | `#1f1f23`           | Title color.                               |
| `--hitl-title-font-size`            | `1rem`              | Title font size.                           |
| `--hitl-title-font-weight`          | `600`               | Title font weight.                         |
| `--hitl-divider-color`              | `#e4e4e7`           | Header divider.                            |
| `--hitl-description-color`          | `#858585`           | Description text color.                    |
| `--hitl-description-font-size`      | `0.8125rem`         | Description font size.                     |
| `--hitl-description-line-height`    | `inherit`           | Description line height.                   |
| `--hitl-description-padding`        | `0.25rem 0`         | Padding around the description.            |
| `--hitl-content-gap`                | `1rem`              | Gap between parameter blocks.              |
| `--hitl-content-margin-top`         | `0.75rem`           | Space above the parameter blocks.          |
| `--hitl-param-gap`                  | `0.25rem`           | Gap between a parameter's label and value. |
| `--hitl-param-label-color`          | `#858585`           | Parameter label color.                     |
| `--hitl-param-label-font-size`      | `0.6875rem`         | Parameter label font size.                 |
| `--hitl-param-label-font-weight`    | `600`               | Parameter label font weight.               |
| `--hitl-param-label-letter-spacing` | `0.04em`            | Parameter label letter spacing.            |
| `--hitl-param-label-word-spacing`   | `normal`            | Parameter label word spacing.              |
| `--hitl-param-value-color`          | `#1f1f23`           | Parameter value color.                     |
| `--hitl-param-value-font-size`      | `0.875rem`          | Parameter value font size.                 |
| `--hitl-param-value-line-height`    | `1.4`               | Parameter value line height.               |
| `--hitl-param-value-word-spacing`   | `normal`            | Parameter value word spacing.              |
| `--hitl-buttons-gap`                | `0.75rem`           | Gap between the confirm/cancel buttons.    |
| `--hitl-countdown-filter`           | `brightness(0.8)`   | Backdrop filter of the sweep.              |
| `--hitl-completion-background`      | `#f4f4f5`           | Completion strip background.               |
| `--hitl-completion-gap`             | `0.5rem`            | Gap between the completion icon and text.  |
| `--hitl-completion-padding`         | `1rem`              | Padding inside the completion strip.       |
| `--hitl-completion-icon-size`       | `1.25rem`           | Completion icon width/height.              |
| `--hitl-completion-font-size`       | `0.875rem`          | Completion text font size.                 |
| `--hitl-completion-font-weight`     | `600`               | Completion text font weight.               |
| `--hitl-approved-color`             | `#16a34a`           | Approved icon/text color.                  |
| `--hitl-halted-color`               | `#b45309`           | Halted/expired icon/text color.            |

## Notes

- The countdown ticks every 100ms for a smooth sweep; the sweep is a transparent `Progress` stretched over the confirm button whose bar darkens what is underneath via `backdrop-filter`.
- Auto-approval emits `action: 'auto-approved'` with `approved: true`.
- Domain-specific rendering (OAuth connect flows, account pickers, currency formatting) belongs in the consuming app — pass `sections` for anything the generic formatter should not touch.
