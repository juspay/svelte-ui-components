<script lang="ts">
  import Button from '../Button/Button.svelte';
  import Pill from '../Pill/Pill.svelte';
  import AttachmentChipRow from '../AttachmentChipRow/AttachmentChipRow.svelte';
  import sendSvg from '$lib/assets/send.svg?raw';
  import stopSvg from '$lib/assets/stop.svg?raw';
  import micSvg from '$lib/assets/mic.svg?raw';
  import attachSvg from '$lib/assets/attach.svg?raw';
  import type { Action } from 'svelte/action';
  import type { ChatComposerProperties } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';

  let {
    value = $bindable(''),
    placeholder = '',
    disabled = false,
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
    onremoverichimage: onremoverichimageProp,
    onRemoveRichImage,
    onremoverichfile: onremoverichfileProp,
    onRemoveRichFile,
    onremoverichvideo: onremoverichvideoProp,
    onRemoveRichVideo,
    onopenrichimage: onopenrichimageProp,
    onOpenRichImage,
    onopenrichvideo: onopenrichvideoProp,
    onOpenRichVideo,
    onopenrichfile: onopenrichfileProp,
    onOpenRichFile,
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
    leading,
    onsubmit: onsubmitProp,
    onSubmit,
    oninput,
    onkeydown,
    onpaste,
    onstop: onstopProp,
    onStop,
    onvoice: onvoiceProp,
    onVoice,
    onattach: onattachProp,
    onAttach,
    onattachclick: onattachclickProp,
    onAttachClick,
    onaction: onactionProp,
    onAction,
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

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onaction = $derived(
    resolveDeprecatedProp('ChatComposer', 'onAction', 'onaction', onAction, onactionProp)
  );
  const onattach = $derived(
    resolveDeprecatedProp('ChatComposer', 'onAttach', 'onattach', onAttach, onattachProp)
  );
  const onattachclick = $derived(
    resolveDeprecatedProp(
      'ChatComposer',
      'onAttachClick',
      'onattachclick',
      onAttachClick,
      onattachclickProp
    )
  );
  const onopenrichfile = $derived(
    resolveDeprecatedProp(
      'ChatComposer',
      'onOpenRichFile',
      'onopenrichfile',
      onOpenRichFile,
      onopenrichfileProp
    )
  );
  const onopenrichimage = $derived(
    resolveDeprecatedProp(
      'ChatComposer',
      'onOpenRichImage',
      'onopenrichimage',
      onOpenRichImage,
      onopenrichimageProp
    )
  );
  const onopenrichvideo = $derived(
    resolveDeprecatedProp(
      'ChatComposer',
      'onOpenRichVideo',
      'onopenrichvideo',
      onOpenRichVideo,
      onopenrichvideoProp
    )
  );
  const onremoverichfile = $derived(
    resolveDeprecatedProp(
      'ChatComposer',
      'onRemoveRichFile',
      'onremoverichfile',
      onRemoveRichFile,
      onremoverichfileProp
    )
  );
  const onremoverichimage = $derived(
    resolveDeprecatedProp(
      'ChatComposer',
      'onRemoveRichImage',
      'onremoverichimage',
      onRemoveRichImage,
      onremoverichimageProp
    )
  );
  const onremoverichvideo = $derived(
    resolveDeprecatedProp(
      'ChatComposer',
      'onRemoveRichVideo',
      'onremoverichvideo',
      onRemoveRichVideo,
      onremoverichvideoProp
    )
  );
  const onstop = $derived(
    resolveDeprecatedProp('ChatComposer', 'onStop', 'onstop', onStop, onstopProp)
  );
  const onsubmit = $derived(
    resolveDeprecatedProp('ChatComposer', 'onSubmit', 'onsubmit', onSubmit, onsubmitProp)
  );
  const onvoice = $derived(
    resolveDeprecatedProp('ChatComposer', 'onVoice', 'onvoice', onVoice, onvoiceProp)
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(
      onaction,
      onattach,
      onattachclick,
      onopenrichfile,
      onopenrichimage,
      onopenrichvideo,
      onremoverichfile,
      onremoverichimage,
      onremoverichvideo,
      onstop,
      onsubmit,
      onvoice
    );
  });

  let fileInput: HTMLInputElement | null = $state(null);

  let showVoice = $derived(typeof onvoice === 'function');
  let showAttach = $derived(typeof onattach === 'function' || typeof onattachclick === 'function');
  let hasRichAttachments = $derived(
    richImages.length > 0 || richVideos.length > 0 || richFiles.length > 0
  );

  let canSend = $derived(
    !disabled &&
      (sendable ?? (value.trim().length > 0 || attachments.length > 0 || hasRichAttachments))
  );

  function submit(): void {
    if (!canSend) {
      return;
    }
    onsubmit?.(value, attachments);
    value = '';
    attachments = [];
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (
      submitOnEnter &&
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.isComposing &&
      !streaming
    ) {
      event.preventDefault();
      submit();
    }
    onkeydown?.(event);
  }

  function handleInput(event: Event & { currentTarget: HTMLTextAreaElement }): void {
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

<div
  class="chat-composer {classes ?? ''}"
  class:disabled
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
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

  <div class="input-row">
    {#if showAttach}
      <div class="control attach">
        <Button
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

    <textarea
      class="input"
      data-pw={inputTestId ?? null}
      bind:value
      {placeholder}
      {disabled}
      rows="1"
      aria-label={inputAriaLabel ?? (placeholder.length > 0 ? placeholder : 'Message')}
      maxlength={maxLength > 0 ? maxLength : null}
      oninput={handleInput}
      onkeydown={handleKeydown}
      onpaste={(event) => onpaste?.(event)}
      use:autoGrow={value}
    ></textarea>

    {#if showVoice}
      <div class="control voice" class:recording>
        <Button onclick={() => onvoice?.()} {disabled} ariaLabel={voiceLabel} testId={voiceTestId}>
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
    {:else if typeof onaction === 'function' && !canSend && !recording}
      <div class="control send action" data-pw={sendSlotTestId ?? null}>
        <Button onclick={() => onaction()} {disabled} ariaLabel={actionLabel} testId={actionTestId}>
          {#if typeof actionIcon === 'function'}
            {@render actionIcon()}
          {:else}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html micSvg}
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
    color: var(--chat-composer-placeholder-color, #a1a1aa);
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
  }

  .voice.recording {
    --button-color: var(--chat-composer-voice-recording-background-color, #fee2e2);
    --button-text-color: var(--chat-composer-voice-recording-color, #dc2626);
  }

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
</style>
