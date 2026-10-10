<script lang="ts">
  import Button from '../Button/Button.svelte';
  import Pill from '../Pill/Pill.svelte';
  import AttachmentChipRow from '../AttachmentChipRow/AttachmentChipRow.svelte';
  import sendSvg from '$lib/assets/send.svg?raw';
  import stopSvg from '$lib/assets/stop.svg?raw';
  import micSvg from '$lib/assets/mic.svg?raw';
  import attachSvg from '$lib/assets/attach.svg?raw';
  import { tick } from 'svelte';
  import type { Action } from 'svelte/action';
  import { registerDismissible } from '../_interaction/dismissal';
  import type {
    ChatComposerProperties,
    ChatComposerSlashCommand,
    ChatComposerSlashCommandChoice
  } from './properties';
  import { resolveControlDisabled } from './controlDisabled';
  import { shouldApplyClear } from './submitResult';
  import { normalizeDictationState } from './dictationState';

  let {
    value = $bindable(''),
    layout = 'row',
    variant = 'default',
    placeholder = '',
    disabled = false,
    textDisabled = null,
    voiceDisabled = null,
    sendDisabled = null,
    submitOnEnter = true,
    maxLength = 0,
    streaming = false,
    recording = false,
    attachments = $bindable([]),
    attachmentsPreview,
    richImages = [],
    richFiles = [],
    richVideos = [],
    richImageTooltip,
    richVideoTooltip,
    richRemoveIcon,
    richFileIcon,
    onremoverichimage,
    onremoverichfile,
    onremoverichvideo,
    onopenrichimage,
    onopenrichvideo,
    onopenrichfile,
    sendable = null,
    accept = '',
    multiple = false,
    sendLabel = 'Send message',
    stopLabel = 'Stop generating',
    voiceLabel = 'Voice input',
    attachLabel = 'Attach files',
    sendIcon,
    stopIcon,
    voiceIcon,
    attachIcon,
    actionIcon,
    actionLabel = 'Voice conversation',
    actionText,
    leading,
    trailing,
    statusText,
    statusTestId,
    slashCommands = null,
    slashMenuAriaLabel = 'slash commands',
    slashMenuHint = '↑↓ move · tab complete · ↵ select · esc dismiss',
    slashMenuClasses,
    slashItemClasses,
    slashSelectedItemClasses,
    slashItem,
    onsubmit,
    oninput,
    oninputfocus,
    onkeydown,
    onpaste,
    onstop,
    onvoice,
    oncanceldictation,
    onattach,
    onattachclick,
    onaction,
    testId,
    inputTestId,
    inputAriaLabel,
    sendTestId,
    sendSlotTestId,
    stopTestId,
    voiceTestId,
    attachTestId,
    actionTestId,
    classes
  }: ChatComposerProperties = $props();

  let fileInput: HTMLInputElement | null = $state(null);
  let inputElement: HTMLTextAreaElement | null = $state(null);

  export const focus = (options?: FocusOptions): void => {
    inputElement?.focus(options);
  };

  let showVoice = $derived(typeof onvoice === 'function');
  let showAttach = $derived(typeof onattach === 'function' || typeof onattachclick === 'function');
  let hasRichAttachments = $derived(
    richImages.length > 0 || richVideos.length > 0 || richFiles.length > 0
  );

  // #526: each falls back to the shared `disabled` when its own flag is
  // unset, so a caller who never passes the new props keeps the original
  // single-`disabled`-gates-everything behaviour exactly.
  let resolvedTextDisabled = $derived(resolveControlDisabled(textDisabled, disabled));
  // 'busy' (transcribing) is not cosmetic -- the control must not accept
  // a new press, so busy forces the voice button off regardless of what the
  // caller passed for `voiceDisabled`/`disabled`, the same way `disabled`
  // itself is not something a specific flag can override back on.
  let dictationState = $derived(normalizeDictationState(recording));
  let resolvedVoiceDisabled = $derived(
    resolveControlDisabled(voiceDisabled, disabled) || dictationState === 'busy'
  );
  let resolvedSendDisabled = $derived(resolveControlDisabled(sendDisabled, disabled));

  let canSend = $derived(
    !resolvedSendDisabled &&
      (sendable ?? (value.trim().length > 0 || attachments.length > 0 || hasRichAttachments))
  );

  // ---- slash-command menu (off unless `slashCommands` is set) ----
  // Stage one: "/co" lists the commands that match. Stage two: "/model son"
  // lists the /model command's choices that start with "son". A free-text
  // argument dismisses the menu at the space instead.
  let slashDismissed = $state(false);
  let slashSelected = $state(0);
  let slashList: HTMLUListElement | null = $state(null);

  // A command opens on the first character of its name: "/model" on "/",
  // "@support" on "@". Letters, digits and whitespace never trigger, so a
  // plain word typed into the composer never opens the menu. Read as a whole
  // code point, so an emoji trigger is never split into half a surrogate pair.
  function slashTrigger(text: string): string | null {
    const [first = ''] = text;
    return /^[^\p{L}\p{N}\s]$/u.test(first) ? first : null;
  }

  const slashMatches = $derived.by((): ChatComposerSlashCommand[] => {
    const trigger = slashTrigger(value);
    if (slashCommands === null || slashDismissed || trigger === null || /\s/.test(value)) {
      return [];
    }
    const query = value.toLowerCase();
    return slashCommands.filter(
      (command) =>
        slashTrigger(command.name) === trigger &&
        (command.name.toLowerCase().startsWith(query) ||
          (query.length > trigger.length &&
            (command.description ?? '').toLowerCase().includes(query.slice(trigger.length))))
    );
  });
  const slashArg = $derived.by(
    (): { command: ChatComposerSlashCommand; choices: ChatComposerSlashCommandChoice[] } | null => {
      if (slashCommands === null || slashDismissed) {
        return null;
      }
      const parsed = /^(\S+)\s(\S*)$/.exec(value);
      if (parsed === null || slashTrigger(parsed[1] ?? '') === null) {
        return null;
      }
      const name = (parsed[1] ?? '').toLowerCase();
      const command = slashCommands.find(
        (entry) => entry.name.toLowerCase() === name && (entry.choices?.length ?? 0) > 0
      );
      if (typeof command !== 'object') {
        return null;
      }
      const partial = (parsed[2] ?? '').toLowerCase();
      return {
        command,
        choices: (command.choices ?? []).filter((choice) =>
          choice.value.toLowerCase().startsWith(partial)
        )
      };
    }
  );
  // One list, two stages: stage two shows the choices as rows.
  const slashItems = $derived.by((): ChatComposerSlashCommand[] =>
    slashArg === null
      ? slashMatches
      : slashArg.choices.map((choice) =>
          typeof choice.description === 'string'
            ? { name: choice.value, description: choice.description }
            : { name: choice.value }
        )
  );
  const slashOpen = $derived(slashItems.length > 0);
  // The highlight stays inside the list as typing narrows it.
  const slashActive = $derived(Math.min(slashSelected, Math.max(0, slashItems.length - 1)));

  // Combobox wiring for the textarea, same pattern as CommandMenu's input: the menu's own id
  // for aria-controls, and the highlighted row's id for aria-activedescendant. Both ids --
  // and the role/aria-expanded/aria-autocomplete below -- are applied to the textarea only
  // while slashCommands is set, so a consumer not using slash commands keeps the plain
  // <textarea> role it always had.
  const uid = $props.id();
  const slashListboxId = `chat-composer-slash-listbox-${uid}`;
  const slashActiveId = $derived(
    slashOpen ? `chat-composer-slash-option-${uid}-${slashActive}` : null
  );

  // What the highlighted row completes the input to, stage-aware.
  function slashCompletion(index: number): string | null {
    if (slashArg !== null) {
      const choice = slashArg.choices.at(index);
      return typeof choice === 'object' ? `${slashArg.command.name} ${choice.value}` : null;
    }
    return slashItems.at(index)?.name ?? null;
  }

  function pickSlash(index: number): void {
    if (slashArg !== null) {
      const choice = slashArg.choices.at(index);
      if (typeof choice === 'object') {
        value = `${slashArg.command.name} ${choice.value}`;
        slashSelected = 0;
      }
      return;
    }
    const command = slashMatches.at(index);
    if (typeof command !== 'object') {
      return;
    }
    // A command that takes arguments gets a trailing space and waits for
    // them; with enumerable choices the menu stays open for stage two.
    value = `${command.name} `;
    slashDismissed = (command.choices?.length ?? 0) === 0;
    slashSelected = 0;
  }

  // Keeps the highlighted row in view while the list scrolls.
  function revealSlash(): void {
    void tick().then(() => {
      const row = slashList?.children.item(slashActive);
      row?.scrollIntoView({ block: 'nearest' });
    });
  }

  // Arrows, Tab and Enter while the menu is open. Escape is the dismissible
  // stack's (registered while the menu is open), so an overlay stacked above
  // the composer takes it first.
  function handleSlashKey(event: KeyboardEvent): boolean {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      slashSelected =
        event.key === 'ArrowDown'
          ? Math.min(slashActive + 1, slashItems.length - 1)
          : Math.max(slashActive - 1, 0);
      revealSlash();
      return true;
    }
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      pickSlash(slashActive);
      return true;
    }
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      // Enter on a complete match submits it; otherwise it completes and
      // the next Enter submits.
      if (value.trim() === slashCompletion(slashActive)) {
        submit();
      } else {
        pickSlash(slashActive);
      }
      return true;
    }
    return false;
  }

  function slashDismissal(_node: HTMLDivElement) {
    const release = registerDismissible({
      element: () => _node,
      onEscape: () => {
        slashDismissed = true;
      }
    });
    return { destroy: release };
  }

  function submit(): void {
    if (!canSend) {
      return;
    }
    slashDismissed = false;
    const submitted = { value, attachments };
    const result = onsubmit?.(submitted.value, submitted.attachments);
    if (result instanceof Promise) {
      // Nothing here disables the composer while the promise settles — the
      // user is free to keep typing, so the clear only lands if `value` and
      // `attachments` still match what was actually sent (see shouldApplyClear).
      // A rejection is treated the same as a resolved `false`: keep the draft.
      void result.then(
        (resolved) => {
          if (shouldApplyClear(resolved, submitted, { value, attachments })) {
            value = '';
            attachments = [];
          }
        },
        () => {}
      );
      return;
    }
    if (shouldApplyClear(result, submitted, { value, attachments })) {
      value = '';
      attachments = [];
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    const slashHandled = slashOpen && handleSlashKey(event);
    if (
      !slashHandled &&
      submitOnEnter &&
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.isComposing &&
      !streaming
    ) {
      event.preventDefault();
      submit();
    }
    // Escape cancels dictation when recording, and only then -- not
    // while idle (nothing to cancel) and not while busy (transcribing is
    // already past the point Escape can interrupt).
    if (event.key === 'Escape' && dictationState === 'recording') {
      event.preventDefault();
      oncanceldictation?.();
    }
    onkeydown?.(event);
  }

  function handleInput(event: Event & { currentTarget: HTMLTextAreaElement }): void {
    // A fresh edit un-dismisses the slash menu and resets its highlight.
    slashDismissed = false;
    slashSelected = 0;
    oninput?.(event.currentTarget.value, event);
  }

  function handleFiles(event: Event & { currentTarget: HTMLInputElement }): void {
    const picked = Array.from(event.currentTarget.files ?? []);
    if (picked.length > 0) {
      attachments = [...attachments, ...picked];
      onattach?.(picked);
    }
    event.currentTarget.value = '';
  }

  function removeAttachment(index: number): void {
    attachments = attachments.filter((_, position) => position !== index);
  }

  const autoGrow: Action<HTMLTextAreaElement, string> = (node) => {
    function resize(): void {
      node.style.height = '0px';
      node.style.height = `${node.scrollHeight}px`;
    }
    resize();
    return { update: resize };
  };
</script>

{#snippet leadingControls()}
  {#if showAttach}
    <div class="control attach">
      <Button
        variant="ghost"
        onclick={() => {
          if (typeof onattachclick === 'function') {
            onattachclick();
            return;
          }
          fileInput?.click();
        }}
        {disabled}
        ariaLabel={attachLabel}
        testId={attachTestId}
      >
        {#if typeof attachIcon === 'function'}
          {@render attachIcon()}
        {:else}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html attachSvg}
        {/if}
      </Button>
      <input
        bind:this={fileInput}
        type="file"
        {accept}
        {multiple}
        class="file-input"
        onchange={handleFiles}
        hidden
      />
    </div>
  {/if}

  {#if typeof leading === 'function'}
    <div class="leading">{@render leading()}</div>
  {/if}
{/snippet}

{#snippet textInput()}
  <textarea
    class="input"
    bind:this={inputElement}
    data-pw={inputTestId ?? null}
    bind:value
    {placeholder}
    disabled={resolvedTextDisabled}
    rows="1"
    aria-label={inputAriaLabel ?? (placeholder.length > 0 ? placeholder : 'Message')}
    role={slashCommands !== null ? 'combobox' : null}
    aria-expanded={slashCommands !== null ? slashOpen : null}
    aria-controls={slashOpen ? slashListboxId : null}
    aria-autocomplete={slashCommands !== null ? 'list' : null}
    aria-activedescendant={slashActiveId}
    maxlength={maxLength > 0 ? maxLength : null}
    oninput={handleInput}
    onfocus={(event) => oninputfocus?.(event)}
    onkeydown={handleKeydown}
    onpaste={(event) => onpaste?.(event)}
    use:autoGrow={value}
  ></textarea>
{/snippet}

{#snippet trailingControls()}
  {#if showVoice}
    <div
      class="control voice"
      class:recording={dictationState === 'recording'}
      class:busy={dictationState === 'busy'}
    >
      <Button
        variant="ghost"
        onclick={() => onvoice?.()}
        disabled={resolvedVoiceDisabled}
        ariaLabel={voiceLabel}
        testId={voiceTestId}
      >
        {#if typeof voiceIcon === 'function'}
          {@render voiceIcon()}
        {:else}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html micSvg}
        {/if}
      </Button>
    </div>
  {/if}

  {#if streaming}
    <div class="control send stop" data-pw={sendSlotTestId ?? null}>
      <Button onclick={() => onstop?.()} ariaLabel={stopLabel} testId={stopTestId}>
        {#if typeof stopIcon === 'function'}
          {@render stopIcon()}
        {:else}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html stopSvg}
        {/if}
      </Button>
    </div>
  {:else if typeof onaction === 'function' && !canSend && dictationState === 'idle'}
    <div
      class="control send action"
      class:action-with-text={typeof actionText === 'string' && actionText.length > 0}
      data-pw={sendSlotTestId ?? null}
    >
      <Button
        onclick={() => onaction()}
        disabled={resolvedSendDisabled}
        ariaLabel={actionLabel}
        testId={actionTestId}
      >
        {#if typeof actionIcon === 'function'}
          {@render actionIcon()}
        {:else}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html micSvg}
        {/if}
        {#if typeof actionText === 'string' && actionText.length > 0}
          <span>{actionText}</span>
        {/if}
      </Button>
    </div>
  {:else}
    <div class="control send" data-pw={sendSlotTestId ?? null}>
      <Button onclick={submit} disabled={!canSend} ariaLabel={sendLabel} testId={sendTestId}>
        {#if typeof sendIcon === 'function'}
          {@render sendIcon()}
        {:else}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html sendSvg}
        {/if}
      </Button>
    </div>
  {/if}
  {#if typeof trailing === 'function'}
    {@render trailing()}
  {/if}
{/snippet}

<div
  class="chat-composer {classes ?? ''}"
  class:disabled
  class:pill={variant === 'pill'}
  data-has-slash={slashCommands !== null ? '' : null}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#if slashOpen}
    <div
      class="slash-menu {slashMenuClasses ?? ''}"
      role="listbox"
      id={slashListboxId}
      aria-label={slashMenuAriaLabel}
      use:slashDismissal
    >
      <!-- role="presentation": a listbox's accessible children must be its own role=option
           rows. Left as a plain <ul>, this list's implicit role=list would sit between the
           listbox and its options in the accessibility tree, breaking that ownership chain
           for assistive tech that computes it strictly from the DOM. -->
      <ul class="slash-list" role="presentation" bind:this={slashList}>
        {#each slashItems as command, index (command.name)}
          <!-- The row, not the Button, takes the hover: Button has no
               mouseenter, and it fills the row, so it is the same gesture. -->
          <li
            id={`chat-composer-slash-option-${uid}-${index}`}
            role="option"
            aria-selected={index === slashActive}
            onmouseenter={() => (slashSelected = index)}
            class:slash-item-selected-default={index === slashActive &&
              typeof slashSelectedItemClasses !== 'string'}
          >
            <Button
              type="button"
              classes={[slashItemClasses, index === slashActive ? slashSelectedItemClasses : '']
                .filter((value) => typeof value === 'string' && value.length > 0)
                .join(' ')}
              onclick={() => pickSlash(index)}
            >
              {#if typeof slashItem === 'function'}
                {@render slashItem(command, index === slashActive)}
              {:else}
                <span class="slash-name">{command.name}</span>
                {#if typeof command.argumentHint === 'string'}
                  <span class="slash-hint">{command.argumentHint}</span>
                {/if}
                {#if typeof command.description === 'string'}
                  <span class="slash-desc">{command.description}</span>
                {/if}
                {#if typeof command.badge === 'string'}
                  <span class="slash-badge">{command.badge}</span>
                {/if}
              {/if}
            </Button>
          </li>
        {/each}
      </ul>
      <div class="slash-foot">{slashMenuHint}</div>
    </div>
  {/if}
  {#if typeof statusText === 'string'}
    <!-- Generic region, role and politeness only -- the sentence is
         whatever the caller passed in `statusText`, never hardcoded here. -->
    <div class="sr-only" role="status" aria-live="polite" data-pw={statusTestId ?? null}>
      {statusText}
    </div>
  {/if}
  {#if typeof attachmentsPreview === 'function'}
    {@render attachmentsPreview()}
  {:else if hasRichAttachments}
    <div class="attachments-rich">
      <AttachmentChipRow
        images={richImages}
        videos={richVideos}
        files={richFiles}
        onremoveimage={onremoverichimage}
        onremovevideo={onremoverichvideo}
        onremovefile={onremoverichfile}
        onopenimage={onopenrichimage}
        onopenvideo={onopenrichvideo}
        onopenfile={onopenrichfile}
        imageTooltip={richImageTooltip}
        videoTooltip={richVideoTooltip}
        removeIcon={richRemoveIcon}
        fileIcon={richFileIcon}
        testId={testId && `${testId}-rich-attachments`}
      />
    </div>
  {:else if attachments.length > 0}
    <div class="attachments">
      {#each attachments as file, index (file.name + index)}
        <Pill text={file.name} dismissible ondismiss={() => removeAttachment(index)} />
      {/each}
    </div>
  {/if}

  <div class="input-row" class:stacked={layout === 'stacked'}>
    {#if layout === 'stacked'}
      <div class="text-row">{@render textInput()}</div>
      <div class="control-row">
        {@render leadingControls()}
        <div class="control-spacer" aria-hidden="true"></div>
        {@render trailingControls()}
      </div>
    {:else}
      {@render leadingControls()}
      {@render textInput()}
      {@render trailingControls()}
    {/if}
  </div>
</div>

<style>
  .chat-composer {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--chat-composer-stack-gap, 8px);
    width: var(--chat-composer-width, 100%);
    padding: var(--chat-composer-padding, 8px);
    background: var(--chat-composer-background, #ffffff);
    border: var(--chat-composer-border, 1px solid #e4e4e7);
    border-radius: var(--chat-composer-border-radius, 24px);
    box-shadow: var(--chat-composer-box-shadow, none);
  }

  .chat-composer.disabled {
    opacity: var(--chat-composer-disabled-opacity, 0.6);
  }

  .chat-composer.pill {
    border-radius: var(--chat-composer-pill-border-radius, 999px);
  }

  /* .input below sets outline: none with nothing standing in for it, so the
     visible replacement lives here on the surrounding surface instead --
     :focus-within lights up whenever the textarea inside is focused, the same
     pattern Select's .select-trigger uses for its nested search input. */
  .chat-composer:focus-within {
    border-color: var(--chat-composer-focus-border-color, #2563eb);
    box-shadow: var(--chat-composer-focus-shadow, 0 0 0 2px rgba(37, 99, 235, 0.2));
  }

  .attachments-rich {
    padding: var(--chat-composer-attachments-padding, 2px 4px 0);
  }

  .attachments {
    display: flex;
    flex-wrap: wrap;
    gap: var(--chat-composer-attachments-gap, 6px);
    padding: var(--chat-composer-attachments-padding, 2px 4px 0);
  }

  .input-row {
    display: flex;
    align-items: flex-end;
    gap: var(--chat-composer-gap, 8px);
  }

  .input-row.stacked {
    flex-direction: column;
    align-items: stretch;
    gap: var(--chat-composer-stack-gap, 8px);
  }

  .text-row {
    display: flex;
    min-width: 0;
  }

  .control-row {
    display: flex;
    align-items: flex-end;
    gap: var(--chat-composer-gap, 8px);
  }

  .control-spacer {
    flex: 1;
  }

  .stacked .input {
    min-width: 0;
    width: 100%;
  }

  .leading {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .input {
    flex: 1;
    box-sizing: border-box;
    resize: none;
    border: none;
    outline: none;
    background: transparent;
    font-family: var(--chat-composer-font-family, inherit);
    font-size: var(--chat-composer-font-size, 0.9375rem);
    font-weight: var(--chat-composer-font-weight, 400);
    line-height: var(--chat-composer-line-height, 1.5);
    color: var(--chat-composer-color, #18181b);
    padding: var(--chat-composer-input-padding, 6px 4px);
    max-height: var(--chat-composer-max-height, 160px);
    overflow-y: auto;
  }

  .input::placeholder {
    color: var(--chat-composer-placeholder-color, #52525b);
  }

  .control {
    flex-shrink: 0;
    display: flex;
  }

  .control :global(svg) {
    height: 100%;
    width: 100%;
  }

  .attach,
  .voice {
    --button-width: var(--chat-composer-action-size, 36px);
    --button-height: var(--chat-composer-action-size, 36px);
    --button-padding: var(--chat-composer-action-padding, 8px);
    --button-border-radius: var(--chat-composer-action-border-radius, 50%);
    --button-color: var(--chat-composer-action-background-color, transparent);
    --button-text-color: var(--chat-composer-action-color, #52525b);
    --button-content-gap: 0px;
    --button-hover-color: var(--chat-composer-action-hover-background-color, #f4f4f5);
    /* Ghost brings its own hover label; keep this control's, recording red included. */
    --button-hover-text-color: var(--button-text-color);
  }

  .voice.recording {
    --button-color: var(--chat-composer-voice-recording-background-color, #fee2e2);
    --button-text-color: var(--chat-composer-voice-recording-color, #dc2626);
  }

  /* No dedicated busy palette: the disabled `Button` already dims itself
     (`--disabled-opacity`), which is enough to distinguish "busy" from the
     active "recording" red without inventing new color tokens that would
     need a matching dark-theme entry outside this component's scope. The
     `.busy` class is still applied to the wrapper (see markup) so a caller
     can target it with their own CSS if they want a distinct look. */

  .send {
    --button-width: var(--chat-composer-send-size, 40px);
    --button-height: var(--chat-composer-send-size, 40px);
    --button-padding: var(--chat-composer-send-padding, 8px);
    --button-border-radius: var(--chat-composer-send-border-radius, 50%);
    --button-color: var(--chat-composer-send-background-color, #18181b);
    --button-text-color: var(--chat-composer-send-color, #ffffff);
    --button-content-gap: 0px;
    --button-hover-color: var(--chat-composer-send-hover-background-color, #27272a);
  }

  .send.stop {
    --button-color: var(--chat-composer-stop-background-color, #18181b);
    --button-text-color: var(--chat-composer-stop-color, #ffffff);
  }

  /* Positioned only when slash commands are on, so their menu can sit
     above the composer; a consumer without them is unchanged. A data attribute,
     not a class, and the menu rules below are written down the structure they live in
     (.chat-composer > .slash-menu ...): a class directive would strip a `has-slash` class a
     consumer already passes through `classes`, and a class of one of these names passed
     there would match rules meant for the menu. */
  .chat-composer[data-has-slash] {
    position: relative;
  }

  /* Positioned from the composer's padding box; the outset (e.g. the
     composer's border width) lines it up with the outer edge instead. */
  .chat-composer > .slash-menu {
    position: absolute;
    bottom: calc(100% + var(--chat-composer-slash-menu-outset, 0px));
    left: calc(-1 * var(--chat-composer-slash-menu-outset, 0px));
    right: calc(-1 * var(--chat-composer-slash-menu-outset, 0px));
    margin-bottom: var(--chat-composer-slash-menu-gap, 8px);
    overflow: hidden;
    z-index: var(--chat-composer-slash-menu-z-index, 30);
    background: var(--chat-composer-slash-menu-background, #ffffff);
    border: var(--chat-composer-slash-menu-border, 1px solid #e4e4e7);
    border-radius: var(--chat-composer-slash-menu-border-radius, 12px);
    box-shadow: var(--chat-composer-slash-menu-box-shadow, 0 8px 24px rgb(0 0 0 / 12%));
  }

  .slash-menu > .slash-list {
    list-style: none;
    margin: 0;
    padding: var(--chat-composer-slash-list-padding, 4px);
    max-height: var(--chat-composer-slash-list-max-height, 280px);
    overflow-y: auto;
    display: grid;
    gap: var(--chat-composer-slash-list-gap, 2px);
  }

  .slash-menu .slash-list li {
    min-width: 0;
  }

  .slash-menu > .slash-foot {
    padding: var(--chat-composer-slash-foot-padding, 4px 12px);
    border-top: var(--chat-composer-slash-foot-border, 1px solid #e4e4e7);
    font-family: var(--chat-composer-slash-foot-font-family, inherit);
    font-variant-ligatures: var(--chat-composer-slash-foot-font-variant-ligatures, inherit);
    font-size: var(--chat-composer-slash-foot-font-size, 12px);
    color: var(--chat-composer-slash-foot-color, #71717a);
  }

  /* The default row content (a consumer's slashItem snippet replaces it). */
  .slash-menu .slash-name {
    flex-shrink: 0;
    font-family: var(--chat-composer-slash-name-font-family, monospace);
    color: var(--chat-composer-slash-name-color, #2563eb);
  }

  .slash-menu .slash-hint {
    flex-shrink: 0;
    font-size: var(--chat-composer-slash-hint-font-size, 12px);
    color: var(--chat-composer-slash-hint-color, #71717a);
  }

  .slash-menu .slash-desc {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--chat-composer-slash-desc-color, #52525b);
  }

  /* Default visual for the arrow-key-highlighted row when a consumer hasn't
     opted into their own selected-state look via slashSelectedItemClasses --
     without this, the only signal was aria-selected, screen-reader-only.
     Scoped so a consumer's own class stays authoritative the moment it's
     supplied: this rule simply never applies then. */
  .slash-menu .slash-item-selected-default {
    background: var(--chat-composer-slash-item-selected-background, #f4f4f5);
  }

  .slash-menu .slash-badge {
    padding: var(--chat-composer-slash-badge-padding, 2px 8px);
    border-radius: var(--chat-composer-slash-badge-border-radius, 999px);
    font-size: var(--chat-composer-slash-badge-font-size, 12px);
    background: var(--chat-composer-slash-badge-background, #eff6ff);
    color: var(--chat-composer-slash-badge-color, #2563eb);
  }

  .send.action {
    --button-width: var(--chat-composer-idle-action-width, var(--chat-composer-send-size, 40px));
    --button-padding: var(
      --chat-composer-idle-action-padding,
      var(--chat-composer-send-padding, 8px)
    );
    --button-border-radius: var(
      --chat-composer-idle-action-border-radius,
      var(--chat-composer-send-border-radius, 50%)
    );
    --button-color: var(
      --chat-composer-idle-action-background-color,
      var(--chat-composer-send-background-color, #18181b)
    );
    --button-text-color: var(
      --chat-composer-idle-action-color,
      var(--chat-composer-send-color, #ffffff)
    );
    --button-hover-color: var(
      --chat-composer-idle-action-hover-background-color,
      var(--chat-composer-send-hover-background-color, #27272a)
    );
    --button-hover-text-color: var(
      --chat-composer-idle-action-hover-color,
      var(--button-text-color)
    );
    --button-content-gap: var(--chat-composer-idle-action-gap, 0px);
  }

  .send.action.action-with-text {
    --button-width: var(--chat-composer-idle-action-width, max-content);
    --button-padding: var(--chat-composer-idle-action-padding, 8px 12px);
    --button-content-gap: var(--chat-composer-idle-action-gap, 6px);
  }

  .action-with-text :global(svg) {
    width: var(--chat-composer-idle-action-icon-size, 20px);
    height: var(--chat-composer-idle-action-icon-size, 20px);
  }

  /* Visually hidden but still read by assistive technology -- same pattern
     Table's caption and Label's required marker use. */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border-width: 0;
  }
</style>
