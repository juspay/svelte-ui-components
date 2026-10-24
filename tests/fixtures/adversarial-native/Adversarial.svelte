<script lang="ts">
  import { onMount } from 'svelte';
  import Input from '$lib/Input/Input.svelte';
  import Card from '$lib/Card/Card.svelte';
  import Dialog from '$lib/Dialog/Dialog.svelte';
  import Select from '$lib/Select/Select.svelte';
  import NativeFileInput from '$lib/NativeFileInput/NativeFileInput.svelte';
  let inputValue = $state('initial');
  let textareaValue = $state('initial');
  let open = $state(false);
  let modal = $state(true);
  let hiddenKind = $state('css');
  let rootClicks = $state(0);
  let childClicks = $state(0);
  let dark = $state(false);
  let closeCount = $state(0);
  let showDialogSelect = $state(false);
  let anchorKeys = $state(0);
  onMount(() => {
    const handle = (event: Event) => {
      if (!(event instanceof CustomEvent)) {
        return;
      }
      const command = event.detail;
      if (typeof command.showDialogSelect === 'boolean') {
        showDialogSelect = command.showDialogSelect;
      }
      if (typeof command.modal === 'boolean') {
        modal = command.modal;
      }
      if (typeof command.open === 'boolean') {
        open = command.open;
      }
      if (typeof command.hiddenKind === 'string') {
        hiddenKind = command.hiddenKind;
      }
      if (typeof command.dark === 'boolean') {
        dark = command.dark;
      }
    };
    window.addEventListener('sui-adversarial-command', handle);
    document.documentElement.dataset.adversarialReady = 'true';
    return () => window.removeEventListener('sui-adversarial-command', handle);
  });
</script>

<h1>Native contract adversarial fixture</h1>
<form data-pw="reset-form" onsubmit={(event) => event.preventDefault()}>
  <label for="audit-input">Native text</label>
  <Input
    native
    unstyled
    id="audit-input"
    bind:value={inputValue}
    nativeAttrs={{ defaultValue: 'initial' }}
    testId="audit-input"
  />
  <label for="audit-textarea">Native textarea</label>
  <Input
    native
    unstyled
    useTextArea
    id="audit-textarea"
    bind:value={textareaValue}
    nativeAttrs={{ defaultValue: 'initial' }}
    testId="audit-textarea"
  />
  <button type="reset">Reset text fields</button>
</form>
<p data-pw="input-model">{inputValue}</p>
<p data-pw="textarea-model">{textareaValue}</p>
<form data-pw="file-form" onsubmit={(event) => event.preventDefault()}>
  <label for="audit-file">Native file</label><NativeFileInput
    nativeAttrs={{ id: 'audit-file', name: 'attachment' }}
    testId="audit-file"
  ></NativeFileInput>
</form>
<Card interactive unstyled testId="nested-card" onclick={() => rootClicks++}>
  <button
    type="button"
    data-pw="nested-button"
    onclick={(event) => {
      event.stopPropagation();
      childClicks++;
    }}>Nested action</button
  >
</Card>
<Card href="#card-destination" testId="anchor-card" onkeydown={() => anchorKeys++}>Anchor card</Card
>
<p data-pw="anchor-keys">{anchorKeys}</p>
<Select
  native
  ariaLabel="Native disabled options"
  items={[
    { id: 'enabled', label: 'Enabled' },
    { id: 'disabled', label: 'Unavailable', disabled: true }
  ]}
  value={['enabled']}
/>
<p data-pw="root-clicks">{rootClicks}</p>
<p data-pw="child-clicks">{childClicks}</p>
<section class="scope" class:dark data-pw="scoped-theme">
  <Select
    ariaLabel="Scoped country"
    usePortal
    searchable
    searchPosition="menu"
    items={[
      { id: 'IN', label: 'India (+91)', displayLabel: '+91' },
      { id: 'GB', label: 'United Kingdom (+44)', displayLabel: '+44' }
    ]}
    value={['IN']}
  />
</section>
<button type="button" data-pw="dialog-opener" onclick={() => (open = true)}>Open dialog</button>
<p data-pw="dialog-close-count">{closeCount}</p>
<Dialog
  bind:open
  {modal}
  testId="audit-dialog"
  nativeAttrs={{ 'aria-label': 'Adversarial dialog' }}
  onclose={() => closeCount++}
>
  <button type="button" data-pw="dialog-first">First action</button>
  <button type="button" data-pw="dialog-last">Last action</button>
  {#if showDialogSelect}
    <Select
      ariaLabel="Dialog country"
      usePortal
      searchable
      searchPosition="menu"
      items={[
        { id: 'IN', label: 'India' },
        { id: 'GB', label: 'United Kingdom' }
      ]}
      value={['IN']}
    />
  {/if}
  {#if hiddenKind === 'css'}<button type="button" style="display:none">CSS-hidden action</button>
  {:else if hiddenKind === 'negative'}<button type="button" tabindex="-1"
      >Programmatic-only action</button
    >
  {:else}<input type="hidden" name="hidden-metadata" value="metadata" />{/if}
</Dialog>

<style>
  :global(body) {
    margin: 24px;
    font-family: sans-serif;
  }
  form,
  section,
  :global([data-pw='nested-card']) {
    margin: 20px 0;
  }
  button,
  :global(input),
  :global(textarea) {
    min-height: 44px;
  }
  .scope {
    --select-dropdown-background: #ffffff;
    --select-option-color: #111111;
    --select-dropdown-width: 300px;
  }
  .scope.dark {
    --select-dropdown-background: #112233;
    --select-option-color: #eeeeee;
  }
</style>
