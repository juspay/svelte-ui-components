<script context="module">
  export const cases = [
    // Pure defaults auto-hide after 2s, so the settled state is the hidden toast and its event.
    { name: 'default-props', allowBlank: true, actions: [['wait', 3500]] },
    { name: 'message-only' },
    { name: 'type-none' },
    { name: 'type-success' },
    { name: 'type-error' },
    { name: 'type-info' },
    { name: 'type-warn' },
    { name: 'direction-left-to-right' },
    { name: 'direction-right-to-left' },
    { name: 'direction-top-to-bottom' },
    { name: 'direction-bottom-to-top' },
    { name: 'overlap-true' },
    { name: 'overlap-false' },
    { name: 'overlap-false-bottom-to-top' },
    { name: 'left-icon' },
    { name: 'right-icon' },
    { name: 'both-icons' },
    { name: 'no-icons' },
    { name: 'subtext' },
    { name: 'subtext-empty' },
    { name: 'bottom-content-slot' },
    { name: 'full-featured' },
    { name: 'test-ids' },
    { name: 'long-message' },
    { name: 'long-message-subtext-icons' },
    { name: 'custom-animation' },
    { name: 'vars-ancestor' },
    { name: 'vars-style-props' },
    { name: 'vars-type-colors' },
    {
      name: 'click-close',
      allowBlank: true,
      actions: [
        ['click', '.close-button'],
        ['wait', 2500]
      ]
    },
    { name: 'click-close-no-icon-absent', actions: [['click', '.toast-message']] },
    {
      name: 'key-close',
      actions: [
        ['focus', '.close-button'],
        ['key', 'Enter']
      ]
    },
    { name: 'auto-hide', allowBlank: true, actions: [['wait', 2500]] },
    { name: 'auto-hide-with-icons', allowBlank: true, actions: [['wait', 2500]] },
    { name: 'auto-hide-no-overlap', actions: [['wait', 2500]] }
  ];
</script>

<script>
  import { Toast, defaultToastProperties } from 'sui-v1-under-test';
  import { log, png, svg } from './_kit.js';
  export let name;

  const onHide = log('onToastHide');
  const long = 600000;
  const base = { ...defaultToastProperties, duration: long, message: 'Payment successful' };

  const types = {
    'type-success': 'success',
    'type-error': 'error',
    'type-info': 'info',
    'type-warn': 'warn'
  };
  const directions = {
    'direction-left-to-right': 'left-to-right',
    'direction-right-to-left': 'right-to-left',
    'direction-top-to-bottom': 'top-to-bottom',
    'direction-bottom-to-top': 'bottom-to-top'
  };
  const longMessage =
    'Your payment could not be processed because the issuing bank declined the transaction, please try again later or use another method';
</script>

{#if name === 'default-props'}
  <Toast on:onToastHide={onHide} />
{:else if name === 'message-only'}
  <Toast properties={base} on:onToastHide={onHide} />
{:else if name === 'type-none'}
  <Toast properties={{ ...base, message: 'No type' }} on:onToastHide={onHide} />
{:else if name in types}
  <Toast
    properties={{ ...base, type: types[name], message: 'Type ' + types[name] }}
    on:onToastHide={onHide}
  />
{:else if name in directions}
  <Toast
    properties={{ ...base, direction: directions[name], message: directions[name] }}
    on:onToastHide={onHide}
  />
{:else if name === 'overlap-true'}
  <div class="page">
    <Toast properties={{ ...base, type: 'info', overlapPage: true }} on:onToastHide={onHide} />
    <div class="page-text">Page content behind the toast</div>
  </div>
{:else if name === 'overlap-false' || name === 'auto-hide-no-overlap'}
  <div class="page">
    <Toast
      properties={{
        ...base,
        duration: name === 'auto-hide-no-overlap' ? 100 : long,
        type: 'info',
        overlapPage: false
      }}
      on:onToastHide={onHide}
    />
    <div class="page-text">Page content pushed down</div>
  </div>
{:else if name === 'overlap-false-bottom-to-top'}
  <div class="page">
    <Toast
      properties={{ ...base, type: 'warn', overlapPage: false, direction: 'bottom-to-top' }}
      on:onToastHide={onHide}
    />
    <div class="page-text">Page content pushed down</div>
  </div>
{:else if name === 'left-icon'}
  <Toast properties={{ ...base, type: 'success', leftIcon: png }} on:onToastHide={onHide} />
{:else if name === 'right-icon' || name === 'click-close' || name === 'key-close'}
  <Toast properties={{ ...base, type: 'error', rightIcon: svg }} on:onToastHide={onHide} />
{:else if name === 'both-icons'}
  <Toast
    properties={{ ...base, type: 'info', leftIcon: png, rightIcon: svg }}
    on:onToastHide={onHide}
  />
{:else if name === 'no-icons' || name === 'click-close-no-icon-absent'}
  <Toast properties={{ ...base, type: 'info' }} on:onToastHide={onHide} />
{:else if name === 'subtext'}
  <Toast
    properties={{ ...base, type: 'success', subtext: 'Order 1234 confirmed' }}
    on:onToastHide={onHide}
  />
{:else if name === 'subtext-empty'}
  <Toast properties={{ ...base, type: 'success', subtext: '' }} on:onToastHide={onHide} />
{:else if name === 'bottom-content-slot'}
  <Toast properties={{ ...base, type: 'warn', subtext: 'Check details' }} on:onToastHide={onHide}>
    <div slot="bottomContent" class="bottom">Bottom slot content</div>
  </Toast>
{:else if name === 'full-featured'}
  <Toast
    properties={{
      ...base,
      type: 'success',
      leftIcon: png,
      rightIcon: svg,
      subtext: 'Order 1234 confirmed',
      direction: 'right-to-left',
      overlapPage: true
    }}
    on:onToastHide={onHide}
  >
    <div slot="bottomContent" class="bottom">Bottom slot content</div>
  </Toast>
{:else if name === 'test-ids'}
  <Toast
    properties={{
      ...base,
      type: 'info',
      subtext: 'Sub',
      rightIcon: svg,
      testId: 'toast-root',
      messageTestId: 'toast-message',
      subTextTestId: 'toast-subtext',
      closeIconTestId: 'toast-close'
    }}
    on:onToastHide={onHide}
  />
{:else if name === 'long-message'}
  <Toast properties={{ ...base, type: 'error', message: longMessage }} on:onToastHide={onHide} />
{:else if name === 'long-message-subtext-icons'}
  <Toast
    properties={{
      ...base,
      type: 'error',
      message: longMessage,
      subtext: 'Reference ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      leftIcon: png,
      rightIcon: svg
    }}
    on:onToastHide={onHide}
  />
{:else if name === 'custom-animation'}
  <Toast
    properties={{
      ...base,
      type: 'success',
      direction: 'bottom-to-top',
      inAnimationOffset: 100,
      inAnimationDuration: 200,
      outAnimationOffset: 50,
      outAnimationDuration: 300
    }}
    on:onToastHide={onHide}
  />
{:else if name === 'vars-ancestor'}
  <div class="themed">
    <Toast
      properties={{
        ...base,
        type: 'info',
        leftIcon: png,
        rightIcon: svg,
        subtext: 'Themed subtext'
      }}
      on:onToastHide={onHide}
    >
      <div slot="bottomContent" class="bottom">Bottom slot content</div>
    </Toast>
  </div>
{:else if name === 'vars-style-props'}
  <Toast
    properties={{ ...base, type: 'success', leftIcon: png, subtext: 'Style props' }}
    on:onToastHide={onHide}
    --toast-padding="20px"
    --toast-font-size="18px"
    --toast-height="100px"
    --toast-border-radius="16px"
    --toast-width="300px"
    --toast-margin="0px 40px"
    --toast-top="40px"
    --toast-background-color="#7c3aed"
    --toast-success-text="#fef08a"
  />
{:else if name === 'vars-type-colors'}
  <div class="type-themed">
    <Toast properties={{ ...base, type: 'warn', message: 'Warn themed' }} on:onToastHide={onHide} />
  </div>
{:else if name === 'auto-hide'}
  <Toast properties={{ ...base, duration: 100, type: 'success' }} on:onToastHide={onHide} />
{:else if name === 'auto-hide-with-icons'}
  <Toast
    properties={{
      ...base,
      duration: 100,
      type: 'error',
      leftIcon: png,
      rightIcon: svg,
      subtext: 'Hides soon',
      direction: 'left-to-right'
    }}
    on:onToastHide={onHide}
  />
{/if}

<style>
  .page {
    width: 420px;
  }
  .page-text {
    font-family: sans-serif;
    padding: 8px;
    background: #f3f4f6;
  }
  .bottom {
    font-size: 12px;
    padding-top: 6px;
    text-decoration: underline;
  }
  .themed {
    --toast-padding: 14px 18px;
    --toast-font-size: 16px;
    --toast-font-family: serif;
    --toast-font-weight: 700;
    --toast-height: 90px;
    --toast-border-radius: 12px;
    --toast-border: 2px;
    --toast-border-style: dashed;
    --toast-width: 340px;
    --toast-align-items: flex-start;
    --toast-margin: 0px 20px;
    --toast-justify-content: flex-start;
    --toast-z-index: 2000;
    --toast-display: flex;
    --toast-position: absolute;
    --toast-top: 30px;
    --toast-left: 0;
    --toast-right: 0;
    --default-background-color: #111827;
    --toast-background-color: #0f766e;
    --toast-info-text: #ccfbf1;
    --toast-info-border: #fde047;
    --toast-icon-wrapper-width: 32px;
    --toast-icon-wrapper-height: 32px;
    --toast-icon-margin: 0px 10px 0px 0px;
    --toast-icon-wrapper-padding: 4px;
    --toast-icon-height: 80%;
    --toast-icon-border-radius: 4px;
    --toast-message-display: flex;
    --toast-message-flex: 2;
    --toast-message-padding: 4px;
    --toast-subtext-color: #fef3c7;
    --toast-subtext-font-size: 12px;
    --toast-subtext-font-weight: 700;
    --toast-subtext-margin: 4px 0px 0px 0px;
    --toast-close-button-width: 28px;
    --toast-close-button-height: 28px;
    --toast-close-button-cursor: default;
    --toast-close-button-gap: 2px;
    --toast-close-button-margin: 0px 0px 0px 6px;
    --toast-close-button-display: flex;
    --toast-close-button-align-items: flex-start;
    --toast-close-button-justify-content: flex-end;
    --toast-close-button-padding: 4px;
  }
  .type-themed {
    --toast-warn-text: #1f2937;
    --toast-warn-border: 3px solid #b45309;
    --toast-border-style: solid;
    --toast-error-text: #fef2f2;
    --toast-success-text: #052e16;
  }
</style>
