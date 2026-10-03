# HITL

Human-in-the-loop approval: the assistant wants to run an action, and the person approves or cancels it before it executes. Unless disabled, a countdown sweeps across the confirm button and auto-approves the action when it completes. Interacting with any HITL pauses every sibling card's countdown, so an auto-approval never fires while the user is actively deciding.

Set `confirmDisabled` while an action's arguments are being edited or validated. Confirm becomes disabled, any running auto-approval countdown stops, and Cancel remains available. Re-enabling Confirm does not restart a stopped countdown; the user must approve explicitly. The default is `false`.

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

<!-- A third disposition beside confirm/cancel, plus free-form input in the body -->
<HITL
  confirmationId={confirmation.id}
  title="Deploy to production"
  actions={[{ label: 'Deny with instructions…', onSelect: () => (composing = true) }]}
  onconfirm={({ approved }) => respond(approved)}
>
  {#if composing}
    <textarea bind:value={note} placeholder="What should change instead…"></textarea>
  {/if}
</HITL>
```

### Async decisions and retry (Svelte)

Return the request promise from `onconfirm`. The card awaits it before displaying
Approved, Completed or Action halted. While it is pending, all decision and side
action buttons are disabled and repeated clicks cannot send another decision.
Synchronous callbacks remain supported.

```svelte
<HITL
  confirmationId={confirmation.id}
  title="Apply change"
  countdownSeconds={0}
  onconfirm={async ({ confirmationId, approved }) => {
    const response = await fetch(`/confirmations/${confirmationId}`, {
      method: 'POST',
      body: JSON.stringify({ approved })
    });
    if (!response.ok) throw new Error(`Approval failed: HTTP ${response.status}`);
  }}
/>
```

A thrown error or rejected promise leaves the card pending and enables a manual
retry; the component catches the rejection. The caller owns error messaging and
must rethrow if it catches a failed request. Countdown and auto-cancel timers do
not restart on failure, and microphone restoration runs at most once across
retries. Caller updates to history state or `initialState.status: 'EXPIRED'`
during the request take precedence over its eventual success or failure.

### Rich details in pending and resolved cards (Svelte)

`details?: Snippet` replaces the parameter-block area when supplied, taking
precedence over `sections` and formatted `functionArguments`. It renders before
the action row or completion strip in pending, locally resolved and history
cards, including approved, rejected and expired states. With no `details`, the
existing label/value sections, argument formatting and no-parameters fallback
remain unchanged. `children` stays a separate pending-only slot for editable
controls and disappears after resolution.

```svelte
<script lang="ts">
  import { HITL } from '@juspay/svelte-ui-components';

  const change = '- retries: 2\n+ retries: 3';
</script>

{#snippet changeDetails()}
  <section aria-label="Proposed change">
    <p>payments.yaml</p>
    <pre aria-label="Configuration diff"><code>{change}</code></pre>
  </section>
{/snippet}

<HITL
  confirmationId="retry-change"
  title="Increase payment retries"
  countdownSeconds={0}
  details={changeDetails}
  onconfirm={(decision) => console.log(decision)}
/>

<!-- Reuse the same detail renderer for conversation history. -->
<HITL
  confirmationId="retry-history"
  title="Increase payment retries"
  isHistoryMode
  initialState={{ approved: true }}
  details={changeDetails}
/>
```

The library renders the snippet without parameter-value text transforms. The
caller owns semantic markup, accessible names and diff rendering. For HTML consumers, the Web Component bridges this area through a fill-aware
`details` slot; it also accepts actual JS-assigned Svelte Snippets.

## Props

| Prop                  | Type                                              | Required | Default                    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------- | -------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| confirmationId        | `string`                                          | Yes      | `-`                        | Correlates the decision with the pending action; echoed in the event.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| title                 | `string`                                          | Yes      | `-`                        | The action, already humanised.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| description           | `string`                                          | No       | `-`                        | One-line explanation under the header.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| sections              | `HITLSection[]`                                   | No       | `-`                        | Labelled parameter blocks. Wins over `functionArguments`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| functionArguments     | `Record<string, unknown>`                         | No       | `-`                        | Raw arguments, formatted generically (`*` → All, bools → Yes/No, arrays → bullets, nesting indented).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| hiddenKeys            | `string[]`                                        | No       | meta keys                  | Case-insensitive keys excluded from generic formatting.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| onconfirm             | `(event: HITLEvent) => void \| Promise<void>`     | No       | `-`                        | `{ confirmationId, action, approved }`; action is `approved`, `rejected`, or `auto-approved`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| confirmLabel          | `string`                                          | No       | `'Confirm'`                | Confirm button text.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| cancelLabel           | `string`                                          | No       | `'Cancel'`                 | Cancel button text.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| showCancel            | `boolean`                                         | No       | `true`                     | Hides the cancel button — for a card whose only real dispositions come through `actions`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| showConfirm           | `boolean`                                         | No       | `true`                     | Hides the confirm button (and with it the countdown sweep) — for a card whose dispositions are all `'decision'`/`'ask-for-text'` actions. Pair with `countdownSeconds={0}`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| showEmptyParameters   | `boolean`                                         | No       | `true`                     | A card with nothing to list (no `sections`, and no `functionArguments` that survive `hiddenKeys`) shows a "PARAMETERS / No parameters" placeholder. `false` hides it — for a card whose body is its own `children` (a plan, say) and has no parameters to show. Supplying `children` does not hide it by itself, and a card that asks `questions` never shows it either way.                                                                                                                                                                                                                                                                                                                                                                                                      |
| countdownSeconds      | `number`                                          | No       | `10`                       | Auto-approve countdown; `0` disables.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| autoCancelSeconds     | `number`                                          | No       | `0`                        | Auto-reject an untouched card after N seconds; `0` disables.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| isMicMuted            | `boolean`                                         | No       | `false`                    | With `onmictoggle`: mic is muted while the card is open, restored on decision.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| onmictoggle           | `(() => void \| Promise<void>) \| null`           | No       | `null`                     | Toggle handler for voice sessions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| isHistoryMode         | `boolean`                                         | No       | `false`                    | Render a settled card from `initialState`, no timers or buttons.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| initialState          | `{ approved?: boolean; status?: string } \| null` | No       | `null`                     | `status: 'EXPIRED'` renders the timed-out state. In `isHistoryMode`, `null` itself (the default) renders the card as expired rather than falling through to a live countdown.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| approvedIcon          | `Snippet`                                         | No       | built-in check             | Completion icon when approved.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| rejectedIcon          | `Snippet`                                         | No       | built-in halt              | Completion icon when rejected/expired.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| badgeLabel            | `string`                                          | No       | `'ACTION'`                 | Eyebrow label above the title.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| approvedLabel         | `string`                                          | No       | `'Approved'`               | Completion text.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| autoApprovedLabel     | `string`                                          | No       | `'Completed'`              | Completion text after auto-approval.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| rejectedLabel         | `string`                                          | No       | `'Action halted'`          | Completion text after cancel.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| expiredLabel          | `string`                                          | No       | `'Action timed out'`       | Completion text for expired history cards.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| testId                | `string`                                          | No       | `-`                        | `data-pw` on the root; `-title`, `-description`, `-completion`, `-completion-text`, `-confirm`, `-cancel`, `-question-<i>`, `-question-<i>-option-<j>`, `-reply`, `-reply-input`, `-reply-back`, `-reply-send`, `-send-answers` on parts.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| confirmTestId         | `string`                                          | No       | `<testId>-confirm`         | Overrides the confirm button's test id independent of `testId`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| cancelTestId          | `string`                                          | No       | `<testId>-cancel`          | Overrides the cancel button's test id independent of `testId`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| completionTestId      | `string`                                          | No       | `<testId>-completion`      | Overrides the completion strip's test id independent of `testId`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| completionTextTestId  | `string`                                          | No       | `<testId>-completion-text` | Overrides the completion text's test id independent of `testId`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| actions               | `HITLExtraAction[]`                               | No       | `-`                        | Extra actions between cancel and confirm. Default kind (`kind` omitted or `'side'`): `{ label, onSelect, testId?, classes?, ariaLabel? }`, never settles the card, only pauses the countdown then calls `onSelect`. `kind: 'decision'`: `{ label, settleAs, value?, testId?, classes?, ariaLabel? }`, settles the card as `settleAs` with `value` on the event. `kind: 'ask-for-text'`: `{ label, settleAs, value?, placeholder?, submitLabel?, submitClasses?, backLabel?, multiline?, testId?, classes?, ariaLabel? }`, opens a reply box in place of the action row (`multiline`: a growing 3-10 row textarea where Enter adds a line and Ctrl/Cmd+Enter sends); Send (or Enter) settles as `settleAs` with the text on `event.message`, Back closes the box without settling. |
| questions             | `HITLQuestion[]`                                  | No       | `-`                        | Questions answered inside the card: `{ header?, question, options: { label, description? }[], multiSelect? }`. Options are toggle buttons (`aria-pressed`); a single-select question toggles like a radio, multi-select like checkboxes. Send answers (enabled once every question has a pick) settles as `questionsSettleAs` with `answers: { header?, question, picks }[]` on the event. Pair with an `'ask-for-text'` action for a free-text "other…" answer. The questions are the body: with no `sections` or `functionArguments`, the card shows no "No parameters" placeholder.                                                                                                                                                                                            |
| answerOnSelect        | `boolean`                                         | No       | `false`                    | Settle as soon as a single-select option is clicked, with only that question's answer (those options are plain buttons, not toggles). Multi-select questions still collect picks, and Send then needs only those.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| questionsSettleAs     | `HITLAction`                                      | No       | `'approved'`               | What answering `questions` settles the card as.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| sendAnswersLabel      | `string`                                          | No       | `'Send answers'`           | Label of the Send-answers button, which sits in the action row before confirm.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| optionClasses         | `string`                                          | No       | `-`                        | Class string on every question option's Button.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| selectedOptionClasses | `string`                                          | No       | `-`                        | Added to a picked option's Button, after `optionClasses`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| children              | `Snippet`                                         | No       | `-`                        | Arbitrary extra controls (free-text input, multi-select chips) rendered in the body above the action row, only while the card is pending. Passing it does not by itself suppress the "No parameters" placeholder — supply `sections`/`functionArguments`, set `showEmptyParameters={false}`, or ask `questions`, for that.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| classes               | `string`                                          | No       | `-`                        | Class string on the root element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| details               | `Snippet`                                         | No       | `-`                        | Replaces parameter sections in pending and resolved/history cards; HTML consumers use the details slot.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| confirmDisabled       | `boolean`                                         | No       | `false`                    | Blocks manual and timed approval, including a decision that becomes blocked while awaiting mic restoration or the confirmation callback. Cancel remains usable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## CSS Variables

| Variable                               | Default             | Description                                                                                       |
| -------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `--hitl-background`                    | `#ffffff`           | Card background.                                                                                  |
| `--hitl-border`                        | `1px solid #e4e4e7` | Card border.                                                                                      |
| `--hitl-border-radius`                 | `0.5rem`            | Card and overlay rounding.                                                                        |
| `--hitl-padding`                       | `1.25rem`           | Card content padding.                                                                             |
| `--hitl-max-width`                     | `100%`              | Max width of the card.                                                                            |
| `--hitl-margin`                        | `0`                 | Outer margin of the card.                                                                         |
| `--hitl-header-gap`                    | `2px`               | Gap between badge and title.                                                                      |
| `--hitl-header-margin-bottom`          | `0.75rem`           | Space below the header block.                                                                     |
| `--hitl-badge-color`                   | `#858585`           | Eyebrow color.                                                                                    |
| `--hitl-badge-font-size`               | `0.6875rem`         | Eyebrow font size.                                                                                |
| `--hitl-badge-font-weight`             | `600`               | Eyebrow font weight.                                                                              |
| `--hitl-badge-letter-spacing`          | `0.06em`            | Eyebrow letter spacing.                                                                           |
| `--hitl-title-color`                   | `#1f1f23`           | Title color.                                                                                      |
| `--hitl-title-font-size`               | `1rem`              | Title font size.                                                                                  |
| `--hitl-title-font-weight`             | `600`               | Title font weight.                                                                                |
| `--hitl-divider-color`                 | `#e4e4e7`           | Header divider.                                                                                   |
| `--hitl-description-color`             | `#858585`           | Description text color.                                                                           |
| `--hitl-description-font-size`         | `0.8125rem`         | Description font size.                                                                            |
| `--hitl-description-line-height`       | `inherit`           | Description line height.                                                                          |
| `--hitl-description-padding`           | `0.25rem 0`         | Padding around the description.                                                                   |
| `--hitl-content-gap`                   | `1rem`              | Gap between parameter blocks.                                                                     |
| `--hitl-content-margin-top`            | `0.75rem`           | Space above the parameter blocks.                                                                 |
| `--hitl-param-gap`                     | `0.25rem`           | Gap between a parameter's label and value.                                                        |
| `--hitl-param-label-color`             | `#858585`           | Parameter label color.                                                                            |
| `--hitl-param-label-font-size`         | `0.6875rem`         | Parameter label font size.                                                                        |
| `--hitl-param-label-font-weight`       | `600`               | Parameter label font weight.                                                                      |
| `--hitl-param-label-letter-spacing`    | `0.04em`            | Parameter label letter spacing.                                                                   |
| `--hitl-param-label-word-spacing`      | `normal`            | Parameter label word spacing.                                                                     |
| `--hitl-param-value-color`             | `#1f1f23`           | Parameter value color.                                                                            |
| `--hitl-param-value-font-size`         | `0.875rem`          | Parameter value font size.                                                                        |
| `--hitl-param-value-line-height`       | `1.4`               | Parameter value line height.                                                                      |
| `--hitl-param-value-word-spacing`      | `normal`            | Parameter value word spacing.                                                                     |
| `--hitl-param-value-text-transform`    | `capitalize`        | Parameter value text transform; `none` shows commands and paths verbatim.                         |
| `--hitl-buttons-gap`                   | `0.75rem`           | Gap between the confirm/cancel buttons.                                                           |
| `--hitl-reply-gap`                     | `0.5rem`            | Gap between the reply input and its Back/Send row (ask-for-text actions).                         |
| `--hitl-questions-gap`                 | `0.75rem`           | Gap between questions.                                                                            |
| `--hitl-question-gap`                  | `0.375rem`          | Gap between a question's header, text and options.                                                |
| `--hitl-question-options-gap`          | `0.5rem`            | Gap between a question's option buttons.                                                          |
| `--hitl-countdown-filter`              | `brightness(0.8)`   | Backdrop filter of the sweep.                                                                     |
| `--hitl-completion-background`         | `#f4f4f5`           | Completion strip background.                                                                      |
| `--hitl-completion-gap`                | `0.5rem`            | Gap between the completion icon and text.                                                         |
| `--hitl-completion-padding`            | `1rem`              | Padding inside the completion strip.                                                              |
| `--hitl-completion-icon-size`          | `1.25rem`           | Completion icon width/height.                                                                     |
| `--hitl-completion-font-size`          | `0.875rem`          | Completion text font size.                                                                        |
| `--hitl-completion-font-weight`        | `600`               | Completion text font weight.                                                                      |
| `--hitl-approved-color`                | `#16a34a`           | Approved icon/text color.                                                                         |
| `--hitl-halted-color`                  | `#b45309`           | Halted/expired icon/text color.                                                                   |
| `--hitl-slide-in-animation-duration`   | `0.3s`              | Duration of the card's entrance slide-in animation. Falls back through `--motion-duration`.       |
| `--hitl-slide-in-animation-easing`     | `ease-out`          | Easing curve of the card's entrance slide-in animation. Falls back through `--motion-easing`.     |
| `--hitl-completion-animation-duration` | `0.3s`              | Duration of the completion banner's fade-in animation. Falls back through `--motion-duration`.    |
| `--hitl-completion-animation-easing`   | `ease-in-out`       | Easing curve of the completion banner's fade-in animation. Falls back through `--motion-easing`.  |
| `--hitl-buttons-wrap`                  | `nowrap`            | Whether the action button row (`actions`, cancel, confirm) wraps onto a new line on narrow cards. |

## Notes

- The countdown ticks every 100ms for a smooth sweep; the sweep is a transparent `Progress` stretched over the confirm button whose bar darkens what is underneath via `backdrop-filter`.
- Auto-approval emits `action: 'auto-approved'` with `approved: true`.
- Domain-specific rendering (OAuth connect flows, account pickers, currency formatting) belongs in the consuming app — pass `sections` for anything the generic formatter should not touch.
- With neither `actions` nor `children` passed, the card renders exactly as before: two buttons (cancel, confirm) and no extra content block — both are additive and off by default.
- `onconfirm` gains `value` (from a `'decision'` or `'ask-for-text'` action) and `message` (from `'ask-for-text'`) only when those settled the card, and `answers` when `questions` did; a confirm/cancel/auto event keeps its three keys.
- `actions` and `children` are not wired into the `sui-hitl` custom element's `children` prop declaration (it's a reserved name there — see `scripts/wc-parity/prop-parity.ts`); `actions` is.

- `children` is not declared on `sui-hitl` because it is a reserved host name (see `scripts/wc-parity/prop-parity.ts`); `actions` is exposed as a JS property.

## Web Component

Tag: `<sui-hitl>`

```html
<sui-hitl confirmation-id="txn-123" title="Transfer funds" countdown-seconds="10"></sui-hitl>
```

`title` maps to the `hITLTitle` element property (renamed because `title` is a reserved global HTML attribute); every other attribute name matches its `HITLProperties` field. `children` is not exposed on the custom element (see Notes above). `actions`, `sections`, `functionArguments`, `hiddenKeys`, and `initialState` are available as object-valued JS properties.

### Rich details slot

Supply `slot="details"` in the host's light DOM **before it mounts**. The wrapper
claims the rich-detail replacement only when that content exists at mount,
following the library's fill-aware content-slot convention. With no details slot
or JS-assigned Snippet, label/value sections and argument formatting remain the
default. The slot stays projected after a live decision and in resolved history.
Changing the contents of an existing slotted element updates the detail normally;
adding the first details slot after mount does not activate the replacement.

```html
<sui-hitl
  confirmation-id="retry-history"
  title="Increase payment retries"
  is-history-mode
  initialstate='{"approved":true}'
>
  <section slot="details" aria-label="Proposed change">
    <p>payments.yaml</p>
    <pre aria-label="Configuration diff"><code>- retries: 2
+ retries: 3</code></pre>
  </section>
</sui-hitl>
```

`details` is also a JS property for callers with an actual Svelte `Snippet`, such
as one returned by `createRawSnippet`; a function-assigned snippet takes precedence
over the named slot and can be replaced after mount. A JSON `details` attribute
cannot create a Snippet and is unsupported; use light-DOM markup or an actual
Snippet function. Without a slot, a JSON object leaves the default sections intact.

### Web Component Events

`onconfirm` and `onmictoggle` are available as JS properties, and each also dispatches a
same-named DOM custom event (bubbles, composed) for a consumer who only calls
`addEventListener` — `confirm`'s detail is the `HITLEvent` argument
(`{ confirmationId, action, approved }`); `mictoggle` carries no detail, since the callback
itself takes no argument:

```js
const hitl = document.querySelector('sui-hitl');
hitl.addEventListener('confirm', (e) => respond(e.detail.confirmationId, e.detail.approved));
hitl.addEventListener('mictoggle', () => toggleMic());
```

### Slots

| Slot Name       | Maps to Snippet | Description                                                                                           |
| --------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| `details`       | `details`       | Rich parameter detail shown in pending and resolved/history cards; claim only when filled at mount.   |
| `approved-icon` | `approvedIcon`  | Replaces the completion icon shown after an approval. Defaults to the built-in checkmark glyph.       |
| `rejected-icon` | `rejectedIcon`  | Replaces the completion icon shown after a rejection or expiry. Defaults to the built-in cross glyph. |
