<script lang="ts">
  import Accordion from '../Accordion/Accordion.svelte';
  import Button from '../Button/Button.svelte';
  import Loader from '../Loader/Loader.svelte';
  import type { ThinkingIndicatorProperties } from './properties';

  let {
    label,
    detail,
    expanded = $bindable(false),
    variant = 'default',
    onToggle,
    avatar,
    toggleIcon,
    testId,
    toggleTestId,
    detailTestId,
    labelTestId,
    classes
  }: ThinkingIndicatorProperties = $props();

  // A detail string is what makes the indicator expandable. Without one there is
  // nothing to reveal, so it renders as a plain live status line instead of a
  // disclosure control. `bare` overrides that entirely.
  const isExpandable = $derived(
    variant !== 'bare' && typeof detail === 'string' && detail.length > 0
  );

  const handleToggle = (): void => {
    expanded = !expanded;
    onToggle?.();
  };
</script>

{#if isExpandable}
  <div
    class="thinking-indicator expandable {classes ?? ''}"
    data-pw={typeof testId === 'string' ? testId : null}
    testID={typeof testId === 'string' ? testId : null}
  >
    <div class="toggle">
      <Button
        onclick={handleToggle}
        ariaExpanded={expanded}
        testId={toggleTestId ?? (testId && `${testId}-toggle`)}
      >
        <span class="status-row">
          <span class="avatar">
            {#if avatar}{@render avatar()}{:else}<Loader />{/if}
          </span>
          <span class="status-label static-label" data-pw={labelTestId ?? null}>{label}</span>
        </span>
        <span class="arrow" class:expanded aria-hidden="true">
          {#if toggleIcon}
            {@render toggleIcon()}
          {:else}
            <svg viewBox="0 0 16 16" fill="none">
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          {/if}
        </span>
      </Button>
    </div>
    <Accordion expand={expanded}>
      <p class="detail" data-pw={detailTestId ?? (testId && `${testId}-detail`) ?? null}>
        {detail}
      </p>
    </Accordion>
  </div>
{:else if variant === 'bare'}
  <span
    class="status-label {classes ?? ''}"
    data-pw={typeof testId === 'string' ? testId : null}
    testID={typeof testId === 'string' ? testId : null}
    >{#if typeof labelTestId === 'string'}<span data-pw={labelTestId} testID={labelTestId}
        >{label}</span
      >{:else}{label}{/if}</span
  >
{:else}
  <div
    class="thinking-indicator status-host {classes ?? ''}"
    data-pw={typeof testId === 'string' ? testId : null}
    testID={typeof testId === 'string' ? testId : null}
  >
    <span class="status-row">
      <span class="avatar">
        {#if avatar}{@render avatar()}{:else}<Loader />{/if}
      </span>
      <span class="status-label" data-pw={labelTestId ?? null}>{label}</span>
    </span>
  </div>
{/if}

<style>
  .thinking-indicator {
    box-sizing: border-box;
    width: 100%;
  }

  .expandable {
    border-bottom: var(--thinking-indicator-border-bottom, 1px solid #e4e4e7);
    padding-block: var(--thinking-indicator-padding-block, 0.5rem);
    margin-bottom: var(--thinking-indicator-margin-bottom, 1rem);
  }

  .toggle {
    width: 100%;
    --button-color: transparent;
    --button-border: none;
    --button-box-shadow: none;
    --button-hover-box-shadow: none;
    --button-active-box-shadow: none;
    --button-width: 100%;
    --button-padding: 0;
    --button-justify-content: flex-start;
    --button-text-color: inherit;
  }

  /* A flex ROW host makes the inner status-row hug its content, so the shimmer
     gradient maps to the text's own width rather than the full container. */
  .status-host {
    display: flex;
    align-items: center;
  }

  .status-row {
    display: flex;
    align-items: center;
    gap: var(--thinking-indicator-gap, 0.25rem);
    min-width: 0;
  }

  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--thinking-indicator-avatar-size, 1.5rem);
    height: var(--thinking-indicator-avatar-size, 1.5rem);
    --loader-width: var(--thinking-indicator-avatar-loader-size, 1rem);
    --loader-height: var(--thinking-indicator-avatar-loader-size, 1rem);
  }

  .status-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: left;
    font-size: var(--thinking-indicator-font-size, 0.75rem);
    line-height: var(--thinking-indicator-line-height, 1.25rem);
    color: var(--thinking-indicator-label-color, #858585);
    background: var(
      --thinking-indicator-shimmer-gradient,
      linear-gradient(90deg, #858585 0%, #bebebe 50%, #858585 100%)
    );
    background-size: 200% 100%;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: thinking-indicator-shimmer var(--thinking-indicator-shimmer-duration, 2s) linear
      infinite;
  }

  /* The expandable summary holds still; only live status lines shimmer. */
  .static-label {
    animation: none;
    -webkit-text-fill-color: var(--thinking-indicator-label-color, #858585);
  }

  .arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--thinking-indicator-arrow-size, 1rem);
    height: var(--thinking-indicator-arrow-size, 1rem);
    margin-left: var(--thinking-indicator-arrow-margin-left, 0.25rem);
    color: var(--thinking-indicator-arrow-color, #7a7a7a);
    transform: rotate(-90deg);
    transition: var(--thinking-indicator-arrow-transition, transform 0.2s ease-in-out);
  }

  .arrow svg {
    width: 100%;
    height: 100%;
  }

  .arrow.expanded {
    transform: rotate(0deg);
  }

  .detail {
    margin: 0;
    padding-top: var(--thinking-indicator-detail-padding-top, 0.5rem);
    font-size: var(--thinking-indicator-detail-font-size, 0.875rem);
    line-height: var(--thinking-indicator-detail-line-height, 1.5);
    color: var(--thinking-indicator-detail-color, #bebebe);
    text-align: left;
  }

  @keyframes thinking-indicator-shimmer {
    0% {
      background-position: 200% 0;
    }

    100% {
      background-position: -200% 0;
    }
  }
</style>
