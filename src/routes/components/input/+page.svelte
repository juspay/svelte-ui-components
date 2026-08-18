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
  let pastedInto = $state('');
  let pasteCount = $state(0);
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>Input</h1>
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
<p data-pw="input-paste-count">paste events seen: {pasteCount}</p>

<style>
  /* Start narrower so horizontal/both resizing has room to grow as well as shrink. */
  .resize-narrow :global(.input-container) {
    --input-width: 240px;
  }
</style>
