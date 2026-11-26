<script module>
  const W = ['wait', 600];
  export const cases = [
    { name: 'default', actions: [W] },
    { name: 'size-small', actions: [W] },
    { name: 'size-medium', actions: [W] },
    { name: 'size-large', actions: [W] },
    { name: 'size-fit-content', actions: [W] },
    { name: 'align-top', actions: [W] },
    { name: 'align-center', actions: [W] },
    { name: 'align-bottom', actions: [W] },
    { name: 'no-overlay', actions: [W] },
    { name: 'transition-disabled', actions: [W] },
    { name: 'transition-in-only', actions: [W] },
    { name: 'entry-slide-up', actions: [W] },
    { name: 'entry-slide-down', actions: [W] },
    { name: 'overlay-fade-in', actions: [W] },
    { name: 'overlay-backdrop-filter', actions: [W] },
    { name: 'header-text', actions: [W] },
    { name: 'header-long-text', actions: [W] },
    { name: 'header-left-image', actions: [W] },
    { name: 'header-right-image', actions: [W] },
    { name: 'header-all', actions: [W] },
    { name: 'footer-primary', actions: [W] },
    { name: 'footer-both', actions: [W] },
    { name: 'footer-snippet', actions: [W] },
    { name: 'header-and-footer-large', actions: [W] },
    { name: 'long-content-scrolls', actions: [W] },
    { name: 'role-alertdialog', actions: [W] },
    { name: 'classes', actions: [W] },
    {
      name: 'primary-click',
      allowBlank: true,
      actions: [W, ['click', '.footer-primary-button button'], W]
    },
    {
      name: 'secondary-click',
      allowBlank: true,
      actions: [W, ['click', '.footer-secondary-button button'], W]
    },
    {
      name: 'header-right-click-closes',
      allowBlank: true,
      actions: [W, ['click', '[data-pw="hdr-right"]'], W]
    },
    { name: 'header-left-click', actions: [W, ['click', '[data-pw="hdr-left"]'], W] },
    {
      name: 'header-right-keyboard',
      allowBlank: true,
      actions: [W, ['focus', '[data-pw="hdr-right"]'], ['key', 'Enter'], W]
    },
    { name: 'backdrop-click-closes', allowBlank: true, actions: [W, ['mouse', 5, 5], W] },
    { name: 'escape-closes', allowBlank: true, actions: [W, ['key', 'Escape'], W] },
    { name: 'keydown-callback', actions: [W, ['key', 'a'], W] },
    { name: 'auto-dismiss', allowBlank: true, actions: [['wait', 1500]] },
    { name: 'backdrop-click-no-handler-stays', actions: [W, ['mouse', 5, 5], W] },
    { name: 'css-custom-properties', actions: [W] }
  ];
</script>

<script>
  import { Modal } from 'sui-under-test';
  import { log, svg } from './_kit.js';
  let { name } = $props();

  let open = $state(true);
  const closes = (event) => (e) => {
    log(event)(e);
    open = false;
  };
  const header = { text: 'Modal title', testId: 'hdr-text' };
  const withClose = {
    text: 'Modal title',
    rightImage: svg,
    buttonTestId: 'hdr-right',
    buttonAriaLabel: 'Close'
  };
  const footer = {
    primaryButton: { text: 'Confirm' },
    secondaryButton: { text: 'Cancel', variant: 'secondary' }
  };
  const longText =
    'A very long modal heading that goes on and on so that it has to wrap or overflow somewhere inside the header';
  const lorem =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ';
</script>

{#snippet body()}
  <p style="margin: 0; padding: 16px; font-family: sans-serif; font-size: 14px;">
    Body content of the modal.
  </p>
{/snippet}

{#snippet longBody()}
  <div style="padding: 16px; font-family: sans-serif; font-size: 14px;">
    {#each Array(14) as _, i (i)}
      <p style="margin: 0 0 12px;">{i + 1}. {lorem}</p>
    {/each}
  </div>
{/snippet}

{#snippet customFooter()}
  <div style="padding: 12px 16px; font-family: sans-serif; font-size: 13px; color: #555;">
    Custom footer snippet
  </div>
{/snippet}

{#if name === 'default'}
  {#if open}
    <Modal content={body} testId="m" />
  {/if}
{:else if name === 'size-small'}
  {#if open}
    <Modal size="small" {header} content={body} />
  {/if}
{:else if name === 'size-medium'}
  {#if open}
    <Modal size="medium" {header} content={body} />
  {/if}
{:else if name === 'size-large'}
  {#if open}
    <Modal size="large" {header} content={body} />
  {/if}
{:else if name === 'size-fit-content'}
  {#if open}
    <Modal size="fit-content" {header} content={body} />
  {/if}
{:else if name === 'align-top'}
  {#if open}
    <Modal align="top" size="small" {header} content={body} />
  {/if}
{:else if name === 'align-center'}
  {#if open}
    <Modal align="center" size="small" {header} content={body} />
  {/if}
{:else if name === 'align-bottom'}
  {#if open}
    <Modal align="bottom" size="small" {header} content={body} />
  {/if}
{:else if name === 'no-overlay'}
  {#if open}
    <Modal showOverlay={false} {header} content={body} />
  {/if}
{:else if name === 'transition-disabled'}
  {#if open}
    <Modal enableTransition={false} {header} content={body} />
  {/if}
{:else if name === 'transition-in-only'}
  {#if open}
    <Modal transitionType="IN" {header} content={body} />
  {/if}
{:else if name === 'entry-slide-up'}
  {#if open}
    <Modal entryAnimation="slide-up" {header} content={body} />
  {/if}
{:else if name === 'entry-slide-down'}
  {#if open}
    <Modal entryAnimation="slide-down" {header} content={body} />
  {/if}
{:else if name === 'overlay-fade-in'}
  {#if open}
    <Modal overlayFadeIn={true} {header} content={body} />
  {/if}
{:else if name === 'overlay-backdrop-filter'}
  {#if open}
    <div
      style="position: fixed; inset: 0; background: linear-gradient(90deg, #f97316 50%, #2563eb 50%);"
    ></div>
    <Modal overlayBackdropFilter="blur(6px)" {header} content={body} />
  {/if}
{:else if name === 'header-text'}
  {#if open}
    <Modal {header} content={body} />
  {/if}
{:else if name === 'header-long-text'}
  {#if open}
    <Modal size="small" header={{ text: longText }} content={body} />
  {/if}
{:else if name === 'header-left-image'}
  {#if open}
    <Modal
      header={{ leftImage: svg, text: 'Modal title' }}
      leftImageTestId="hdr-left"
      content={body}
    />
  {/if}
{:else if name === 'header-right-image'}
  {#if open}
    <Modal header={withClose} content={body} />
  {/if}
{:else if name === 'header-all'}
  {#if open}
    <Modal
      header={{ ...withClose, leftImage: svg }}
      leftImageTestId="hdr-left"
      leftImageAriaLabel="Back"
      content={body}
    />
  {/if}
{:else if name === 'footer-primary'}
  {#if open}
    <Modal footer={{ primaryButton: { text: 'Confirm' } }} content={body} />
  {/if}
{:else if name === 'footer-both'}
  {#if open}
    <Modal {footer} content={body} />
  {/if}
{:else if name === 'footer-snippet'}
  {#if open}
    <Modal footerSnippet={customFooter} content={body} />
  {/if}
{:else if name === 'header-and-footer-large'}
  {#if open}
    <Modal size="large" header={withClose} {footer} content={body} />
  {/if}
{:else if name === 'long-content-scrolls'}
  {#if open}
    <Modal {header} {footer} content={longBody} />
  {/if}
{:else if name === 'role-alertdialog'}
  {#if open}
    <Modal role="alertdialog" ariaLabel="Confirm deletion" {header} {footer} content={body} />
  {/if}
{:else if name === 'classes'}
  {#if open}
    <Modal classes="custom-modal" {header} content={body} />
  {/if}
{:else if name === 'primary-click'}
  {#if open}
    <Modal
      {footer}
      content={body}
      onprimarybuttonclick={closes('onprimarybuttonclick')}
      onsecondarybuttonclick={log('onsecondarybuttonclick')}
      onclose={log('onclose')}
    />
  {/if}
{:else if name === 'secondary-click'}
  {#if open}
    <Modal
      {footer}
      content={body}
      onprimarybuttonclick={log('onprimarybuttonclick')}
      onsecondarybuttonclick={closes('onsecondarybuttonclick')}
      onclose={log('onclose')}
    />
  {/if}
{:else if name === 'header-right-click-closes'}
  {#if open}
    <Modal
      header={withClose}
      content={body}
      onheaderrightimageclick={closes('onheaderrightimageclick')}
      onclose={log('onclose')}
    />
  {/if}
{:else if name === 'header-left-click'}
  {#if open}
    <Modal
      header={{ leftImage: svg, text: 'Modal title' }}
      leftImageTestId="hdr-left"
      leftImageAriaLabel="Back"
      content={body}
      onheaderleftimageclick={log('onheaderleftimageclick')}
    />
  {/if}
{:else if name === 'header-right-keyboard'}
  {#if open}
    <Modal
      header={withClose}
      content={body}
      onheaderrightimageclick={closes('onheaderrightimageclick')}
    />
  {/if}
{:else if name === 'backdrop-click-closes'}
  {#if open}
    <Modal
      {header}
      content={body}
      onoverlayclick={closes('onoverlayclick')}
      ondismiss={log('ondismiss')}
      onclose={log('onclose')}
    />
  {/if}
{:else if name === 'escape-closes'}
  {#if open}
    <Modal
      {header}
      content={body}
      onoverlayclick={closes('onoverlayclick')}
      ondismiss={log('ondismiss')}
      onclose={log('onclose')}
      onkeydown={log('onkeydown')}
    />
  {/if}
{:else if name === 'keydown-callback'}
  {#if open}
    <Modal {header} content={body} onkeydown={log('onkeydown')} />
  {/if}
{:else if name === 'auto-dismiss'}
  {#if open}
    <Modal
      {header}
      content={body}
      autoDismissAfter={100}
      onclose={closes('onclose')}
      ondismiss={log('ondismiss')}
    />
  {/if}
{:else if name === 'backdrop-click-no-handler-stays'}
  {#if open}
    <Modal {header} content={body} onclose={log('onclose')} />
  {/if}
{:else if name === 'css-custom-properties'}
  {#if open}
    <div
      style="--modal-overlay-background-color: #1e3a8a99; --modal-content-background-color: #fef3c7; --modal-border-radius: 20px; --modal-content-padding: 12px; --modal-viewport-gutter: 64px;"
    >
      <Modal size="medium" {header} {footer} content={body} />
    </div>
  {/if}
{/if}
