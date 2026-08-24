<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import Button from '../Button/Button.svelte';
  import Card from '../Card/Card.svelte';
  import Progress from '../Progress/Progress.svelte';
  import { pauseAllConfirmationTimers } from './timers';
  import type { HITLAction, HITLProperties, HITLResponse, HITLSection } from './properties';

  /**
   * Human-in-the-loop approval card: the assistant wants to run an action and the
   * person approves or cancels it. Unless disabled, a countdown sweeps across the
   * confirm button and auto-approves when it completes; interacting with any
   * HITL pauses every sibling's countdown.
   */
  let {
    confirmationId,
    title,
    description,
    sections,
    functionArguments,
    hiddenKeys,
    onConfirm,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    countdownSeconds = 10,
    autoCancelSeconds = 0,
    isMicMuted = false,
    onMicToggle = null,
    isHistoryMode = false,
    initialState = null,
    approvedIcon,
    rejectedIcon,
    badgeLabel = 'ACTION',
    approvedLabel = 'Approved',
    autoApprovedLabel = 'Completed',
    rejectedLabel = 'Action halted',
    expiredLabel = 'Action timed out',
    testId,
    confirmTestId,
    cancelTestId,
    completionTestId,
    completionTextTestId,
    classes
  }: HITLProperties = $props();

  const DEFAULT_HIDDEN_KEYS = [
    'action',
    'userhasconfirmed',
    'confirmed',
    'userid',
    'sessionid',
    'timestamp'
  ];

  let isProcessing = $state(false);
  let localResponse = $state<HITLResponse | null>(null);
  let countdownActive = $state(false);
  // Seeded from the prop; startCountdown re-seeds it on every (re)start.
  // svelte-ignore state_referenced_locally
  let timeRemaining = $state(countdownSeconds);
  let countdownInterval: ReturnType<typeof setInterval> | null = null;
  let autoCancelTimeout: ReturnType<typeof setTimeout> | null = null;
  let originalMicState: boolean | null = null;

  // History mode renders the settled state from props; live mode from local state.
  // A history card with no initialState renders as expired rather than falling
  // through to the pending interactive card — a replayed card must never be able
  // to fire onConfirm.
  const userResponse = $derived.by((): HITLResponse | null => {
    if (isHistoryMode) {
      if (initialState === null) {
        return 'expired';
      }
      if (initialState.status === 'EXPIRED') {
        return 'expired';
      }
      return initialState.approved === true ? 'approved' : 'rejected';
    }
    return localResponse;
  });
  const isCompleted = $derived(userResponse !== null);
  const isApproved = $derived(userResponse === 'approved' || userResponse === 'auto-approved');
  const elapsedTime = $derived(countdownSeconds - timeRemaining);

  const completionText = $derived(
    userResponse === 'auto-approved'
      ? autoApprovedLabel
      : userResponse === 'approved'
        ? approvedLabel
        : userResponse === 'expired'
          ? expiredLabel
          : rejectedLabel
  );

  const stopCountdown = (): void => {
    if (countdownInterval !== null) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    countdownActive = false;
  };

  const clearAutoCancel = (): void => {
    if (autoCancelTimeout !== null) {
      clearTimeout(autoCancelTimeout);
      autoCancelTimeout = null;
    }
  };

  const restoreMicState = async (): Promise<void> => {
    if (onMicToggle !== null && originalMicState !== null && isMicMuted !== originalMicState) {
      try {
        await onMicToggle();
      } catch {
        // Mic restoration is best-effort; a failure must not block the decision.
      }
    }
  };

  // Latched by the first decision path (click, countdown, auto-cancel) BEFORE its
  // await, so a second path cannot also run restoreMicState — two restorations
  // toggle the mic back to the wrong state, since the isMicMuted prop cannot have
  // updated in between.
  let decisionPending = false;

  const settle = (action: HITLAction): void => {
    if (isProcessing || isCompleted) {
      return;
    }
    localResponse = action;
    isProcessing = true;
    try {
      onConfirm?.({
        confirmationId,
        action,
        approved: action !== 'rejected'
      });
    } catch {
      // The decision failed to hand off; release the card for another attempt.
      localResponse = null;
      decisionPending = false;
    } finally {
      isProcessing = false;
    }
  };

  const decide = async (action: HITLAction): Promise<void> => {
    if (decisionPending || isCompleted) {
      return;
    }
    decisionPending = true;
    await restoreMicState();
    settle(action);
  };

  const startCountdown = (): void => {
    countdownActive = true;
    timeRemaining = countdownSeconds;
    countdownInterval = setInterval(() => {
      // A sibling card's interaction pauses this countdown on its next tick.
      if (get(pauseAllConfirmationTimers)) {
        stopCountdown();
        return;
      }
      timeRemaining = timeRemaining - 0.1;
      if (timeRemaining <= 0) {
        stopCountdown();
        void decide('auto-approved');
      }
    }, 100);
  };

  const interact = async (action: HITLAction): Promise<void> => {
    pauseAllConfirmationTimers.set(true);
    stopCountdown();
    clearAutoCancel();
    await decide(action);
  };

  onMount(() => {
    if (isHistoryMode) {
      return;
    }
    if (onMicToggle !== null) {
      originalMicState = isMicMuted;
      if (!isMicMuted) {
        void Promise.resolve(onMicToggle()).catch(() => {
          // Auto-mute is best-effort.
        });
      }
    }
    pauseAllConfirmationTimers.set(false);
    if (countdownSeconds > 0) {
      startCountdown();
    } else if (autoCancelSeconds > 0) {
      autoCancelTimeout = setTimeout(() => {
        void decide('rejected');
      }, autoCancelSeconds * 1000);
    }
  });

  onDestroy(() => {
    stopCountdown();
    clearAutoCancel();
  });

  const titleCase = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  };

  const formatValue = (value: unknown, indentLevel: number): string => {
    const indent = '  '.repeat(indentLevel);
    if (value === null) {
      return '';
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed === '-') {
        return '';
      }
      if (trimmed === '*') {
        return 'All';
      }
      return trimmed.replace(/\s+/g, ' ');
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === 'object' && item !== null) {
            return formatValue(item, indentLevel + 1);
          }
          return `${indent}• ${formatValue(item, 0)}`;
        })
        .filter((line) => line)
        .join('\n');
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return '{}';
      }
      return entries
        .map(([key, nested]) => {
          const readableKey = titleCase(String(key));
          if (typeof nested === 'object' && nested !== null && !Array.isArray(nested)) {
            return `${indent}${readableKey}:\n${formatValue(nested, indentLevel + 1)}`;
          }
          const formatted = formatValue(nested, indentLevel + 1);
          return formatted ? `${indent}${readableKey}: ${formatted}` : '';
        })
        .filter((line) => line)
        .join('\n');
    }
    return JSON.stringify(value);
  };

  const formatArguments = (args: Record<string, unknown>): HITLSection[] => {
    const hidden = (hiddenKeys ?? DEFAULT_HIDDEN_KEYS).map((key) => key.toLowerCase());
    const built: HITLSection[] = [];
    for (const [key, value] of Object.entries(args)) {
      if (hidden.includes(key.toLowerCase()) || value === null) {
        continue;
      }
      const wildcardKey = key
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .replace(/\btype\b/gi, '')
        .trim();
      const formatted =
        typeof value === 'string' && value.trim() === '*'
          ? `All ${wildcardKey}s`
          : formatValue(value, 0);
      if (formatted.trim()) {
        built.push({ label: key.replace(/([A-Z])/g, ' $1').trim(), value: formatted });
      }
    }
    return built.length > 0 ? built : [{ label: 'PARAMETERS', value: 'No parameters' }];
  };

  const parameterSections = $derived.by((): HITLSection[] => {
    if (sections && sections.length > 0) {
      return sections;
    }
    if (functionArguments && Object.keys(functionArguments).length > 0) {
      return formatArguments(functionArguments);
    }
    return [{ label: 'PARAMETERS', value: 'No parameters' }];
  });
</script>

<div
  class="hitl {classes ?? ''}"
  data-confirmation-id={confirmationId}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  <Card
    cssVars={{
      '--card-background': 'var(--hitl-background, #ffffff)',
      '--card-border': 'var(--hitl-border, 1px solid #e4e4e7)',
      '--card-border-radius': 'var(--hitl-border-radius, 0.5rem)',
      '--card-content-padding': 'var(--hitl-padding, 1.25rem)',
      '--card-overflow': 'visible',
      '--card-width': '100%'
    }}
  >
    <div class="confirmation-header">
      <span class="badge">{badgeLabel}</span>
      <span class="title" data-pw={testId && `${testId}-title`}>{title}</span>
    </div>

    <div class="header-border"></div>

    {#if typeof description === 'string' && description.length > 0}
      <p class="description" data-pw={testId && `${testId}-description`}>{description}</p>
    {/if}

    <div class="confirmation-body">
      {#each parameterSections as section, sectionIndex (sectionIndex)}
        <div class="params">
          <span class="parameter-label">{section.label}</span>
          <span class="parameter-value">{section.value}</span>
        </div>
      {/each}

      {#if isCompleted && userResponse !== null}
        <div
          class="completion"
          data-pw={completionTestId ?? (testId && `${testId}-completion`) ?? null}
        >
          <span class="completion-icon" class:halted={!isApproved} aria-hidden="true">
            {#if isApproved}
              {#if approvedIcon}
                {@render approvedIcon()}
              {:else}
                <svg viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5" />
                  <path
                    d="M6 10.2l2.6 2.6L14 7.4"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              {/if}
            {:else if rejectedIcon}
              {@render rejectedIcon()}
            {:else}
              <svg viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5" />
                <path d="M6 10h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            {/if}
          </span>
          <span
            class="completion-text"
            class:halted={!isApproved}
            data-pw={completionTextTestId ?? (testId && `${testId}-completion-text`) ?? null}
          >
            {completionText}
          </span>
        </div>
      {:else}
        <div class="action-buttons">
          <div class="cancel-button">
            <Button
              variant="secondary"
              text={cancelLabel}
              enable={!isProcessing}
              testId={cancelTestId ?? (testId && `${testId}-cancel`)}
              onclick={() => interact('rejected')}
            />
          </div>
          <div class="confirm-button">
            {#if countdownActive}
              <div class="progress-anchor">
                <Progress value={elapsedTime} max={countdownSeconds} />
              </div>
            {/if}
            <Button
              text={confirmLabel}
              enable={!isProcessing}
              testId={confirmTestId ?? (testId && `${testId}-confirm`)}
              onclick={() => interact('approved')}
            />
          </div>
        </div>
      {/if}
    </div>
  </Card>
</div>

<style>
  .hitl {
    position: relative;
    width: 100%;
    max-width: var(--hitl-max-width, 100%);
    margin: var(--hitl-margin, 0);
    animation: hitl-slide-in 0.3s ease-out forwards;
    contain: layout style;
  }

  .confirmation-header {
    display: flex;
    flex-direction: column;
    gap: var(--hitl-header-gap, 2px);
    margin-bottom: var(--hitl-header-margin-bottom, 0.75rem);
  }

  .badge {
    font-size: var(--hitl-badge-font-size, 0.6875rem);
    font-weight: var(--hitl-badge-font-weight, 600);
    letter-spacing: var(--hitl-badge-letter-spacing, 0.06em);
    color: var(--hitl-badge-color, #858585);
    text-transform: uppercase;
  }

  .title {
    font-size: var(--hitl-title-font-size, 1rem);
    font-weight: var(--hitl-title-font-weight, 600);
    color: var(--hitl-title-color, #1f1f23);
  }

  .header-border {
    height: 1px;
    background-color: var(--hitl-divider-color, #e4e4e7);
  }

  .description {
    margin: 0;
    padding: var(--hitl-description-padding, 0.25rem 0);
    font-size: var(--hitl-description-font-size, 0.8125rem);
    line-height: var(--hitl-description-line-height, inherit);
    color: var(--hitl-description-color, #858585);
  }

  .confirmation-body {
    display: flex;
    flex-direction: column;
    gap: var(--hitl-content-gap, 1rem);
    margin-top: var(--hitl-content-margin-top, 0.75rem);
  }

  .params {
    display: flex;
    flex-direction: column;
    gap: var(--hitl-param-gap, 0.25rem);
  }

  .parameter-label {
    font-size: var(--hitl-param-label-font-size, 0.6875rem);
    font-weight: var(--hitl-param-label-font-weight, 600);
    letter-spacing: var(--hitl-param-label-letter-spacing, 0.04em);
    color: var(--hitl-param-label-color, #858585);
    word-spacing: var(--hitl-param-label-word-spacing, normal);
    text-transform: uppercase;
  }

  .parameter-value {
    white-space: pre-line;
    overflow-wrap: break-word;
    font-size: var(--hitl-param-value-font-size, 0.875rem);
    line-height: var(--hitl-param-value-line-height, 1.4);
    color: var(--hitl-param-value-color, #1f1f23);
    word-spacing: var(--hitl-param-value-word-spacing, normal);
    text-transform: capitalize;
  }

  .action-buttons {
    display: flex;
    gap: var(--hitl-buttons-gap, 0.75rem);
    width: 100%;
  }

  .cancel-button,
  .confirm-button {
    flex: 1;
    position: relative;
    --button-width: 100%;
  }

  /* The countdown sweep: a transparent Progress stretched over the confirm
     button whose bar darkens what is underneath as it advances. */
  .progress-anchor {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    border-radius: var(--hitl-border-radius, 0.5rem);
    overflow: hidden;
    --progress-track-background: transparent;
    --progress-bar-background: transparent;
    --progress-bar-transition: width 0.1s linear;
    --progress-track-height: 100%;
    --progress-container-padding: 0;
  }

  .progress-anchor > :global(*) {
    height: 100%;
  }

  .progress-anchor :global(.bar) {
    backdrop-filter: var(--hitl-countdown-filter, brightness(0.8));
  }

  .completion {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--hitl-completion-gap, 0.5rem);
    background: var(--hitl-completion-background, #f4f4f5);
    border-radius: var(--hitl-border-radius, 0.5rem);
    padding: var(--hitl-completion-padding, 1rem);
    animation: hitl-fade-in 0.3s ease-in-out;
  }

  .completion-icon {
    display: inline-flex;
    width: var(--hitl-completion-icon-size, 1.25rem);
    height: var(--hitl-completion-icon-size, 1.25rem);
    color: var(--hitl-approved-color, #16a34a);
  }

  .completion-icon svg {
    width: 100%;
    height: 100%;
  }

  .completion-icon.halted {
    color: var(--hitl-halted-color, #b45309);
  }

  .completion-text {
    font-size: var(--hitl-completion-font-size, 0.875rem);
    font-weight: var(--hitl-completion-font-weight, 600);
    color: var(--hitl-approved-color, #16a34a);
  }

  .completion-text.halted {
    color: var(--hitl-halted-color, #b45309);
  }

  @keyframes hitl-slide-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes hitl-fade-in {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }
</style>
