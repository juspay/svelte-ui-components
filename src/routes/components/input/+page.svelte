<script lang="ts">
  import Input from '$lib/Input/Input.svelte';

  let inputValue = $state('');
  let notes = $state('');
  let autoGrow = $state('');
  let bio = $state('');
  let resizable = $state('');
  let resizableX = $state('');
  let resizableBoth = $state('');
  let scheduleTime = $state('09:30');
  let configJson = $state('{ "enabled": true }');
  let readonlySnapshot = $state('{"captured":"selector"}');
  let invalidEmail = $state('not-an-email');
  let helperOnly = $state('');
  let pastedInto = $state('');
  let pasteCount = $state(0);
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>Input</h1>
</div>

<h3>Validation errors are announced</h3>
<p>
  When a field is invalid it carries <code>aria-invalid</code> and points at its message through
  <code>aria-describedby</code>; the message itself is a <code>role="alert"</code> live region, so it
  is spoken when it appears rather than only drawn on screen.
</p>
<div class="demo-row" style="max-width: 400px;">
  <Input
    bind:value={invalidEmail}
    label="Work email"
    dataType="text"
    forceError
    onErrorMessage="Enter a valid email address"
    infoMessage="Use your company address, not a personal one."
    testId="input-announced-error"
  />
</div>

<h3>Helper text is associated too</h3>
<p>
  <code>infoMessage</code> is part of the field's description, so it is referenced by
  <code>aria-describedby</code> even when the field is valid.
</p>
<div class="demo-row" style="max-width: 400px;">
  <Input
    bind:value={helperOnly}
    label="Display name"
    infoMessage="Shown to your teammates."
    testId="input-helper-only"
  />
</div>

<h3>Basic</h3>
<div class="demo-row" style="max-width: 400px;">
  <Input bind:value={inputValue} placeholder="Enter your name" label="Name" />
</div>

<h3>Multi-line (useTextArea)</h3>
<p>
  Set <code>useTextArea</code> to render a <code>&lt;textarea&gt;</code> instead of an
  <code>&lt;input&gt;</code>. Use <code>rows</code> for the initial height.
</p>
<div class="demo-row" style="max-width: 400px;">
  <Input bind:value={notes} useTextArea label="Notes" placeholder="Add your notes" rows={4} />
</div>

<h3>Auto-resize</h3>
<p>
  With <code>autoResize</code> the textarea grows with its content between <code>minRows</code> and
  <code>maxRows</code> (then scrolls).
</p>
<div class="demo-row" style="max-width: 400px;">
  <Input
    bind:value={autoGrow}
    useTextArea
    autoResize
    minRows={2}
    maxRows={8}
    label="Description"
    placeholder="Keep typing — the field grows…"
  />
</div>

<h3>Character counter</h3>
<p>Pass <code>showCount</code> with a <code>maxLength</code> to show a live counter.</p>
<div class="demo-row" style="max-width: 400px;">
  <Input
    bind:value={bio}
    useTextArea
    showCount
    maxLength={140}
    label="Bio"
    placeholder="Max 140 characters"
    rows={3}
  />
</div>

<h3>Manual resize</h3>
<p>
  Control the resize handle with <code>resize</code> (default <code>'none'</code>) —
  <code>'vertical'</code>, <code>'horizontal'</code>, or <code>'both'</code>. Drag the corner/edge
  of each field below.
</p>
<div class="demo-row" style="max-width: 400px;">
  <Input bind:value={resizable} useTextArea resize="vertical" label="Vertical" rows={3} />
</div>
<div class="demo-row resize-narrow">
  <Input bind:value={resizableX} useTextArea resize="horizontal" label="Horizontal" rows={3} />
</div>
<div class="demo-row resize-narrow">
  <Input bind:value={resizableBoth} useTextArea resize="both" label="Both" rows={3} />
</div>

<h3>Independent leading icon colour</h3>
<p>
  <code>--input-left-icon-color</code> overrides only the leading icon. When it is unset, both icons
  retain <code>--input-icon-color</code>.
</p>
<div class="demo-row input-icon-colour-independent">
  {#snippet independentlyColouredLeftIcon()}
    <svg data-pw="input-independent-left-icon" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="currentColor" />
    </svg>
  {/snippet}
  {#snippet independentlyColouredRightIcon()}
    <svg data-pw="input-independent-right-icon" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="currentColor" />
    </svg>
  {/snippet}
  <Input
    value=""
    label="Independent leading icon"
    leftIcon={independentlyColouredLeftIcon}
    rightIcon={independentlyColouredRightIcon}
  />
</div>
<div class="demo-row input-icon-colour-generic">
  {#snippet genericallyColouredLeftIcon()}
    <svg data-pw="input-generic-left-icon" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="currentColor" />
    </svg>
  {/snippet}
  {#snippet genericallyColouredRightIcon()}
    <svg data-pw="input-generic-right-icon" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="currentColor" />
    </svg>
  {/snippet}
  <Input
    value=""
    label="Generic icon colour fallback"
    leftIcon={genericallyColouredLeftIcon}
    rightIcon={genericallyColouredRightIcon}
  />
</div>

<h3>Native input types (dataType)</h3>
<p>
  <code>dataType</code> is passed straight through as the native <code>type</code>. Beyond the
  original text/tel/password/email/number it also accepts <code>time</code>, <code>date</code>,
  <code>search</code> and <code>url</code>.
</p>
<div class="demo-row" style="max-width: 400px;">
  <Input
    bind:value={scheduleTime}
    dataType="time"
    label="Schedule time"
    name="schedule-time"
    testId="input-datatype-time"
  />
</div>

<h3>spellcheck</h3>
<p>
  Defaults to unset, so the browser default is untouched. Pass <code>false</code> for fields holding code,
  JSON or identifiers.
</p>
<div class="demo-row" style="max-width: 400px;">
  <Input
    bind:value={configJson}
    useTextArea
    spellcheck={false}
    label="Config JSON"
    rows={3}
    testId="input-spellcheck-off"
  />
</div>

<h3>readonly</h3>
<p>
  <code>readonly</code> keeps the field focusable and selectable but not editable — unlike
  <code>disable</code>, which removes it from the focus order entirely and so cannot carry a
  select-all-to-copy affordance.
</p>
<div class="demo-row" style="max-width: 400px;">
  <Input
    bind:value={readonlySnapshot}
    useTextArea
    readonly
    label="Captured snapshot"
    rows={3}
    testId="input-readonly"
  />
</div>

<h3>onPaste on a non-tel field</h3>
<p>
  The paste callback fires for every <code>dataType</code>, not just <code>tel</code> — which is what
  lets a consumer intercept pasted files or images in a multi-line field.
</p>
<div class="demo-row" style="max-width: 400px;">
  <Input
    bind:value={pastedInto}
    useTextArea
    label="Paste here"
    rows={3}
    testId="input-paste-textarea"
    onPaste={() => (pasteCount += 1)}
  />
</div>

<h3>maxLength={null} — no limit</h3>
<p>
  <code>maxLength</code> defaults to 1000 and is rendered as a native <code>maxlength</code>
  unconditionally. A composer or paste target that silently truncates long input is worse than an unbounded
  one, so pass <code>null</code> to omit the attribute entirely.
</p>
<div class="demo-row">
  <Input
    value=""
    useTextArea
    maxLength={null}
    label="Unbounded"
    name="unbounded-textarea"
    testId="input-unbounded"
  />
</div>

<h3>line-height</h3>
<p>
  A textarea/input computes <code>line-height: normal</code> from the UA sheet regardless of what
  its container inherits, so a consumer cannot reach it by inheritance. This is the hook; the
  default is the same <code>normal</code>, so existing fields are unchanged.
</p>
<div class="demo-row">
  <Input
    value=""
    useTextArea
    rows={3}
    label="Tall lines"
    name="lineheight-textarea"
    classes="lineheight-textarea"
    testId="input-line-height"
  />
</div>

<h3>min-height / max-height</h3>
<p>
  A textarea that grows with its content needs a ceiling before it can scroll, and one used as a
  paste target needs a floor. Both default to the CSS initial value, so a field that sets neither is
  unchanged.
</p>
<div class="demo-row">
  <Input
    value=""
    useTextArea
    label="Bounded"
    name="bounded-textarea"
    classes="bounded-textarea"
    testId="input-bounded-height"
  />
</div>

<h3>autoResize with a CSS ceiling</h3>
<p>
  <code>autoResize</code> grows the field to fit its content. When the ceiling comes from
  <code>--input-max-height</code> rather than <code>maxRows</code>, the field must still become
  scrollable at the ceiling instead of clipping what it cannot show.
</p>
<div class="demo-row">
  <Input
    value=""
    useTextArea
    autoResize
    minRows={1}
    label="Grows, then scrolls"
    name="autoresize-capped"
    classes="autoresize-capped"
    testId="input-autoresize-capped"
  />
</div>

<p data-pw="input-paste-count">paste events seen: {pasteCount}</p>

<style>
  /* Start narrower so horizontal/both resizing has room to grow as well as shrink. */
  .resize-narrow :global(.input-container) {
    --input-width: 240px;
  }

  :global(.input-icon-colour-independent) {
    --input-icon-color: #2563eb;
    --input-left-icon-color: #dc2626;
  }

  :global(.input-icon-colour-generic) {
    --input-icon-color: #2563eb;
  }

  :global(.lineheight-textarea) {
    --input-line-height: 32px;
  }

  :global(.autoresize-capped) {
    --input-max-height: 90px;
  }

  :global(.bounded-textarea) {
    --input-min-height: 80px;
    --input-max-height: 160px;
  }
</style>
