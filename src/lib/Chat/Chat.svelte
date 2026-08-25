<script lang="ts">
  import ChatHeader from '../ChatHeader/ChatHeader.svelte';
  import ChatMessageList from '../ChatMessageList/ChatMessageList.svelte';
  import ChatComposer from '../ChatComposer/ChatComposer.svelte';
  import ChatSuggestions from '../ChatSuggestions/ChatSuggestions.svelte';
  import ChatToolStatus from '../ChatToolStatus/ChatToolStatus.svelte';
  import type { ChatProperties } from './properties';

  let {
    messages,
    value = $bindable(''),
    title = '',
    subtitle = '',
    image,
    imageAlt = '',
    placeholder = '',
    disabled = false,
    streaming = false,
    recording = false,
    autoscroll = true,
    toolStatus = null,
    suggestions = [],
    attachments = $bindable([]),
    accept = '',
    multiple = false,
    allowCopy = false,
    closeLabel = 'Close',
    showClose,
    headerAvatar,
    headerActions,
    headerContent,
    message,
    messageBody,
    messageAttachments,
    empty,
    composerLeading,
    sendIcon,
    stopIcon,
    voiceIcon,
    attachIcon,
    onsend,
    onsuggestion,
    onclose,
    onstop,
    onvoice,
    onattach,
    onretry,
    onfeedback,
    testId,
    classes
  }: ChatProperties = $props();

  let showHeader = $derived(
    title.length > 0 ||
      subtitle.length > 0 ||
      (typeof image === 'string' && image.length > 0) ||
      typeof onclose === 'function' ||
      typeof headerAvatar === 'function' ||
      typeof headerActions === 'function'
  );
  let showSuggestions = $derived(suggestions.length > 0 && messages.length === 0);

  function handleSuggestion(suggestionValue: string, index: number): void {
    if (typeof onsuggestion === 'function') {
      onsuggestion(suggestionValue, index);
      return;
    }
    onsend?.(suggestionValue, []);
  }
</script>

<section
  class="chat {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#if showHeader}
    <ChatHeader
      {title}
      {subtitle}
      {image}
      {imageAlt}
      {closeLabel}
      {showClose}
      {onclose}
      avatar={headerAvatar}
      actions={headerActions}
      children={headerContent}
    />
  {/if}

  <ChatMessageList
    {messages}
    {autoscroll}
    {message}
    {messageBody}
    {messageAttachments}
    {empty}
    {allowCopy}
    {onretry}
    {onfeedback}
  />

  <div class="footer">
    {#if showSuggestions}
      <ChatSuggestions items={suggestions} {disabled} onselect={handleSuggestion} />
    {/if}
    {#if toolStatus !== null}
      <div class="tool-status"><ChatToolStatus label={toolStatus.label} /></div>
    {/if}
    <ChatComposer
      bind:value
      bind:attachments
      {placeholder}
      {disabled}
      {streaming}
      {recording}
      {accept}
      {multiple}
      onsubmit={onsend}
      {onstop}
      {onvoice}
      {onattach}
      leading={composerLeading}
      {sendIcon}
      {stopIcon}
      {voiceIcon}
      {attachIcon}
    />
  </div>
</section>

<style>
  .chat {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    height: var(--chat-height, 100%);
    width: var(--chat-width, 100%);
    background: var(--chat-background, #ffffff);
    border: var(--chat-border, none);
    border-radius: var(--chat-border-radius, 0);
    overflow: hidden;
  }

  .footer {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--chat-footer-gap, 10px);
    padding: var(--chat-footer-padding, 12px 1.5rem);
    background: var(--chat-footer-background, transparent);
    border-top: var(--chat-footer-border-top, none);
  }

  .tool-status {
    display: flex;
    justify-content: var(--chat-tool-status-justify, center);
  }
</style>
