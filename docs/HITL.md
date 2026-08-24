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
  onConfirm={({ confirmationId, action, approved }) => respond(confirmationId, approved, action)}
/>

<!-- Must not auto-approve (e.g. OAuth) — reject instead if untouched for 90s -->
<HITL countdownSeconds={0} autoCancelSeconds={90} ... />

<!-- Conversation history: settled card, no timers or buttons -->
<HITL isHistoryMode initialState={{ approved: true }} ... />
```

## Props

| Prop              | Type                                       | Required | Default            | Description                                                            |
| ----------------- | ------------------------------------------ | -------- | ------------------ | ---------------------------------------------------------------------- |
| confirmationId    | `string`                                   | Yes      | `-`                | Correlates the decision with the pending action; echoed in the event.  |
| title             | `string`                                   | Yes      | `-`                | The action, already humanised.                                         |
| description       | `string`                                   | No       | `-`                | One-line explanation under the header.                                 |
| sections          | `HITLSection[]`                | No       | `-`                | Labelled parameter blocks. Wins over `functionArguments`.              |
| functionArguments | `Record<string, unknown>`                  | No       | `-`                | Raw arguments, formatted generically (`*` → All, bools → Yes/No, arrays → bullets, nesting indented). |
| hiddenKeys        | `string[]`                                 | No       | meta keys          | Case-insensitive keys excluded from generic formatting.                |
| onConfirm         | `(event: HITLEvent) => void`   | No       | `-`                | `{ confirmationId, action, approved }`; action is `approved`, `rejected`, or `auto-approved`. |
| confirmLabel      | `string`                                   | No       | `'Confirm'`        | Confirm button text.                                                   |
| cancelLabel       | `string`                                   | No       | `'Cancel'`         | Cancel button text.                                                    |
| countdownSeconds  | `number`                                   | No       | `10`               | Auto-approve countdown; `0` disables.                                  |
| autoCancelSeconds | `number`                                   | No       | `0`                | Auto-reject an untouched card after N seconds; `0` disables.           |
| isMicMuted        | `boolean`                                  | No       | `false`            | With `onMicToggle`: mic is muted while the card is open, restored on decision. |
| onMicToggle       | `() => void \| Promise<void>`              | No       | `-`                | Toggle handler for voice sessions.                                     |
| isHistoryMode     | `boolean`                                  | No       | `false`            | Render a settled card from `initialState`, no timers or buttons.       |
| initialState      | `{ approved?: boolean; status?: string }`  | No       | `-`                | `status: 'EXPIRED'` renders the timed-out state.                       |
| approvedIcon      | `Snippet`                                  | No       | built-in check     | Completion icon when approved.                                         |
| rejectedIcon      | `Snippet`                                  | No       | built-in halt      | Completion icon when rejected/expired.                                 |
| badgeLabel        | `string`                                   | No       | `'ACTION'`         | Eyebrow label above the title.                                         |
| approvedLabel     | `string`                                   | No       | `'Approved'`       | Completion text.                                                       |
| autoApprovedLabel | `string`                                   | No       | `'Completed'`      | Completion text after auto-approval.                                   |
| rejectedLabel     | `string`                                   | No       | `'Action halted'`  | Completion text after cancel.                                          |
| expiredLabel      | `string`                                   | No       | `'Action timed out'` | Completion text for expired history cards.                           |
| testId            | `string`                                   | No       | `-`                | `data-pw` on the root; `-title`, `-completion`, `-confirm`, `-cancel` on parts. |
| classes           | `string`                                   | No       | `-`                | Class string on the root element.                                      |

## CSS Variables

| Variable                                     | Default               | Description                       |
| -------------------------------------------- | --------------------- | --------------------------------- |
| `--hitl-background`             | `#ffffff`             | Card background.                  |
| `--hitl-border`                 | `1px solid #e4e4e7`   | Card border.                      |
| `--hitl-border-radius`          | `0.5rem`              | Card and overlay rounding.        |
| `--hitl-padding`                | `1.25rem`             | Card content padding.             |
| `--hitl-badge-color`            | `#858585`             | Eyebrow color.                    |
| `--hitl-title-color`            | `#1f1f23`             | Title color.                      |
| `--hitl-divider-color`          | `#e4e4e7`             | Header divider.                   |
| `--hitl-param-label-color`      | `#858585`             | Parameter label color.            |
| `--hitl-param-value-color`      | `#1f1f23`             | Parameter value color.            |
| `--hitl-countdown-filter`       | `brightness(0.8)`     | Backdrop filter of the sweep.     |
| `--hitl-completion-background`  | `#f4f4f5`             | Completion strip background.      |
| `--hitl-approved-color`         | `#16a34a`             | Approved icon/text color.         |
| `--hitl-halted-color`           | `#b45309`             | Halted/expired icon/text color.   |

## Notes

- The countdown ticks every 100ms for a smooth sweep; the sweep is a transparent `Progress` stretched over the confirm button whose bar darkens what is underneath via `backdrop-filter`.
- Auto-approval emits `action: 'auto-approved'` with `approved: true`.
- Domain-specific rendering (OAuth connect flows, account pickers, currency formatting) belongs in the consuming app — pass `sections` for anything the generic formatter should not touch.
