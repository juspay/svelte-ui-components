<svelte:options
  customElement={{
    tag: 'sui-toolbar',
    shadow: 'open',
    props: {
      showBackButton: { type: 'Boolean', reflect: true, attribute: 'show-back-button' },
      text: { type: 'String', reflect: true },
      backIcon: { type: 'String', attribute: 'back-icon' },
      backLabel: { type: 'String', attribute: 'back-label' },
      backHref: { type: 'String', attribute: 'back-href' },
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' },
      headingTestId: { type: 'String', attribute: 'heading-test-id' },
      onkeydown: { type: 'Object' },
      leftContent: { type: 'Object' },
      centerContent: { type: 'Object' },
      rightContent: { type: 'Object' },
      additionalContent: { type: 'Object' },
      onbackclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Toolbar from '$lib/Toolbar/Toolbar.svelte';
  let props = $props();

  // Mirrors Toolbar.svelte's own handleBackKeydown: Space activates the anchor
  // variant of the back control the same way Enter does natively.
  function handleBackKeydown(event: KeyboardEvent): void {
    props.onkeydown?.(event);
    const hasBackHref = typeof props.backHref === 'string' && props.backHref.length > 0;
    if (hasBackHref && event.key === ' ') {
      event.preventDefault();
      props.onbackclick?.();
    }
  }
</script>

<Toolbar {...props}>
  {#snippet leftContent()}
    <!-- Mirrors Toolbar.svelte's leftContent fallback: the back button/link shown
         when showBackControl is true (showBackButton !== false && backIcon !== null
         && backIcon !== ''). -->
    <slot name="left-content">
      {#if props.showBackButton !== false && props.backIcon !== null && props.backIcon !== ''}
        <svelte:element
          this={typeof props.backHref === 'string' && props.backHref.length > 0 ? 'a' : 'button'}
          type={typeof props.backHref === 'string' && props.backHref.length > 0 ? null : 'button'}
          href={typeof props.backHref === 'string' && props.backHref.length > 0
            ? props.backHref
            : null}
          role={null}
          class="back"
          aria-label={typeof props.backLabel === 'string' && props.backLabel.trim().length > 0
            ? props.backLabel
            : 'Back'}
          onclick={props.onbackclick}
          onkeydown={handleBackKeydown}
        >
          {#if typeof props.backIcon === 'string'}
            <img src={props.backIcon} alt="" />
          {:else}
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
              <path
                d="M10 3 5 8l5 5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          {/if}
        </svelte:element>
      {/if}
    </slot>
  {/snippet}
  {#snippet centerContent()}
    <!-- Mirrors Toolbar.svelte's centerContent fallback: <div class="text">{text}</div>,
         shown when `text` is a non-empty string. The `.center-content` wrapper is
         already supplied unconditionally by Toolbar.svelte's function branch. -->
    <slot name="center-content">
      {#if typeof props.text === 'string' && props.text.length > 0}
        <div class="text" data-pw={props.headingTestId} testID={props.headingTestId}>
          {props.text}
        </div>
      {/if}
    </slot>
  {/snippet}
  {#snippet rightContent()}
    <slot name="right-content"></slot>
  {/snippet}
  {#snippet additionalContent()}
    <slot name="additional-content"></slot>
  {/snippet}
</Toolbar>
