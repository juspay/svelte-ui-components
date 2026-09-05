<script lang="ts">
  import ChatHeader from '../ChatHeader/ChatHeader.svelte';
  import ChatMessageList from '../ChatMessageList/ChatMessageList.svelte';
  import ChatComposer from '../ChatComposer/ChatComposer.svelte';
  import ChatSuggestions from '../ChatSuggestions/ChatSuggestions.svelte';
  import ThinkingIndicator from '../ThinkingIndicator/ThinkingIndicator.svelte';
  import type { ChatProperties } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';

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
    scrollPolicy = 'near-bottom',
    pinHold = false,
    jump = true,
    jumpLabel = 'Jump to latest',
    jumpIcon,
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
    onsend: onsendProp,
    onSend,
    onsuggestion: onsuggestionProp,
    onSuggestion,
    onclose: oncloseProp,
    onClose,
    onstop: onstopProp,
    onStop,
    onvoice: onvoiceProp,
    onVoice,
    onattach: onattachProp,
    onAttach,
    onretry: onretryProp,
    onRetry,
    onfeedback: onfeedbackProp,
    onFeedback,
    onscrollstate: onscrollstateLegacy,
    onScrollState,
    testId,
    classes
  }: ChatProperties = $props();

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onattach = $derived(
    resolveDeprecatedProp('Chat', 'onAttach', 'onattach', onAttach, onattachProp)
  );
  const onclose = $derived(
    resolveDeprecatedProp('Chat', 'onClose', 'onclose', onClose, oncloseProp)
  );
  const onfeedback = $derived(
    resolveDeprecatedProp('Chat', 'onFeedback', 'onfeedback', onFeedback, onfeedbackProp)
  );
  const onretry = $derived(
    resolveDeprecatedProp('Chat', 'onRetry', 'onretry', onRetry, onretryProp)
  );
  const onscrollstate = $derived(
    resolveDeprecatedProp(
      'Chat',
      'onscrollstate',
      'onScrollState',
      onscrollstateLegacy,
      onScrollState
    )
  );
  const onsend = $derived(resolveDeprecatedProp('Chat', 'onSend', 'onsend', onSend, onsendProp));
  const onstop = $derived(resolveDeprecatedProp('Chat', 'onStop', 'onstop', onStop, onstopProp));
  const onsuggestion = $derived(
    resolveDeprecatedProp('Chat', 'onSuggestion', 'onsuggestion', onSuggestion, onsuggestionProp)
  );
  const onvoice = $derived(
    resolveDeprecatedProp('Chat', 'onVoice', 'onvoice', onVoice, onvoiceProp)
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(
      onattach,
      onclose,
      onfeedback,
      onretry,
      onscrollstate,
      onsend,
      onstop,
      onsuggestion,
      onvoice
    );
  });

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
    {scrollPolicy}
    {pinHold}
    {jump}
    {jumpLabel}
    {jumpIcon}
    {message}
    {messageBody}
    {messageAttachments}
    {empty}
    {allowCopy}
    {onretry}
    {onfeedback}
    {onscrollstate}
  />

  <div class="footer">
    {#if showSuggestions}
      <ChatSuggestions items={suggestions} {disabled} onselect={handleSuggestion} />
    {/if}
    {#if toolStatus !== null}
      <div class="tool-status"><ThinkingIndicator label={toolStatus.label} variant="chip" /></div>
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
    /* This row is ThinkingIndicator's chip variant internally now, not the standalone
       ChatToolStatus component -- but its public theming contract stays
       --chat-tool-status-*, unchanged, so an existing consumer's overrides keep working
       exactly as before. Defaults below match ChatToolStatus's own byte for byte. */
    --thinking-indicator-chip-gap: var(--chat-tool-status-gap, 8px);
    --thinking-indicator-chip-padding: var(--chat-tool-status-padding, 8px 14px);
    --thinking-indicator-chip-background: var(--chat-tool-status-background, #ffffff);
    --thinking-indicator-chip-border: var(--chat-tool-status-border, 1px solid #e4e4e7);
    --thinking-indicator-chip-border-radius: var(--chat-tool-status-border-radius, 999px);
    --thinking-indicator-chip-box-shadow: var(
      --chat-tool-status-box-shadow,
      0 6px 20px rgba(0, 0, 0, 0.08)
    );
    --thinking-indicator-chip-max-width: var(--chat-tool-status-max-width, 100%);
    --thinking-indicator-chip-color: var(--chat-tool-status-color, #52525b);
    --thinking-indicator-chip-font-size: var(--chat-tool-status-font-size, 0.85rem);
    --thinking-indicator-chip-font-weight: var(--chat-tool-status-font-weight, 500);
    --thinking-indicator-chip-icon-color: var(--chat-tool-status-indicator-color, currentColor);
    --thinking-indicator-chip-spinner-color: var(--chat-tool-status-spinner-color, currentColor);
    --thinking-indicator-chip-spinner-color-end: var(
      --chat-tool-status-spinner-color-end,
      transparent
    );
    --thinking-indicator-chip-spinner-size: var(--chat-tool-status-spinner-size, 14px);
  }
</style>
