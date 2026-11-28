<script context="module">
  export const cases = [
    { name: 'default' },
    { name: 'no-content-slot', allowBlank: true },
    { name: 'size-large-top' },
    { name: 'size-large-center' },
    { name: 'size-large-bottom' },
    { name: 'size-medium-top' },
    { name: 'size-medium-center' },
    { name: 'size-medium-bottom' },
    { name: 'size-small-top' },
    { name: 'size-small-center' },
    { name: 'size-small-bottom' },
    { name: 'size-fit-top' },
    { name: 'size-fit-center' },
    { name: 'size-fit-bottom' },
    { name: 'overlay-off' },
    { name: 'header-text' },
    { name: 'header-empty-text' },
    { name: 'header-left-image' },
    { name: 'header-right-image' },
    { name: 'header-all' },
    { name: 'header-none' },
    { name: 'header-test-ids' },
    { name: 'footer-primary' },
    { name: 'footer-secondary' },
    { name: 'footer-both' },
    { name: 'footer-empty-object' },
    { name: 'footer-slot' },
    { name: 'footer-slot-with-buttons' },
    { name: 'transition-off' },
    { name: 'transition-in-center' },
    { name: 'transition-in-top' },
    { name: 'transition-in-bottom' },
    { name: 'transition-all-top' },
    { name: 'long-content' },
    { name: 'vars-ancestor' },
    { name: 'vars-footer-buttons' },
    { name: 'vars-style-props' },
    {
      name: 'click-overlay',
      actions: [
        ['mouse', 10, 10],
        ['wait', 300]
      ]
    },
    { name: 'click-content-not-overlay', actions: [['click', '.slot-content']] },
    { name: 'click-header-left', actions: [['click', '.header-left-img']] },
    { name: 'click-header-right', actions: [['click', '.header-right-img']] },
    { name: 'click-primary', actions: [['click', '.footer-primary-button button']] },
    { name: 'click-secondary', actions: [['click', '.footer-secondary-button button']] },
    { name: 'escape', actions: [['key', 'Escape']] },
    {
      name: 'remove-after-click',
      actions: [
        ['click', '.footer-primary-button button'],
        ['wait', 2500]
      ]
    },
    { name: 'hardware-back' },
    {
      name: 'hardware-back-pop',
      actions: [
        ['click', '#back'],
        ['wait', 500]
      ]
    }
  ];
</script>

<script>
  import { Modal, defaultModalProperties, defaultButtonProperties } from 'sui-v1-under-test';
  import { log, png, svg } from './_kit.js';
  export let name;

  const onOverlay = log('overlayClick');
  const onClose = log('close');
  const onLeft = log('headerLeftImageClick');
  const onRight = log('headerRightImageClick');
  const onPrimary = log('primaryButtonClick');
  const onSecondary = log('secondaryButtonClick');

  const header = { leftImage: png, rightImage: svg, text: 'Select an option' };
  const primary = { ...defaultButtonProperties, text: 'Confirm', type: 'button', testId: 'ok' };
  const secondary = { ...defaultButtonProperties, text: 'Cancel', type: 'button', testId: 'no' };
  const base = { ...defaultModalProperties, header };

  const matrix = {
    'size-large-top': { size: 'large', align: 'top' },
    'size-large-center': { size: 'large', align: 'center' },
    'size-large-bottom': { size: 'large', align: 'bottom' },
    'size-medium-top': { size: 'medium', align: 'top' },
    'size-medium-center': { size: 'medium', align: 'center' },
    'size-medium-bottom': { size: 'medium', align: 'bottom' },
    'size-small-top': { size: 'small', align: 'top' },
    'size-small-center': { size: 'small', align: 'center' },
    'size-small-bottom': { size: 'small', align: 'bottom' },
    'size-fit-top': { size: 'fit-content', align: 'top' },
    'size-fit-center': { size: 'fit-content', align: 'center' },
    'size-fit-bottom': { size: 'fit-content', align: 'bottom' }
  };

  let open = true;
  const lines = Array.from({ length: 40 }, (_, i) => 'Line ' + (i + 1));
</script>

{#if name === 'default'}
  <Modal
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">Modal body</div>
  </Modal>
{:else if name === 'no-content-slot'}
  <Modal
    properties={{ ...base, footer: { primaryButton: primary } }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  />
{:else if name in matrix}
  <Modal
    properties={{
      ...base,
      size: matrix[name].size,
      align: matrix[name].align,
      footer: { primaryButton: primary, secondaryButton: secondary }
    }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">Modal body</div>
  </Modal>
{:else if name === 'overlay-off'}
  <Modal
    properties={{ ...base, showOverlay: false, size: 'small', align: 'bottom' }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">No overlay</div>
  </Modal>
{:else if name === 'header-text'}
  <Modal
    properties={{
      ...defaultModalProperties,
      header: { leftImage: null, rightImage: null, text: 'Only text' }
    }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">Modal body</div>
  </Modal>
{:else if name === 'header-empty-text'}
  <Modal
    properties={{
      ...defaultModalProperties,
      header: { leftImage: null, rightImage: null, text: '' }
    }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">Empty header text</div>
  </Modal>
{:else if name === 'header-left-image' || name === 'click-header-left'}
  <Modal
    properties={{
      ...defaultModalProperties,
      header: { leftImage: png, rightImage: null, text: null }
    }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">Left image only</div>
  </Modal>
{:else if name === 'header-right-image' || name === 'click-header-right'}
  <Modal
    properties={{
      ...defaultModalProperties,
      header: { leftImage: null, rightImage: svg, text: null }
    }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">Right image only</div>
  </Modal>
{:else if name === 'header-all'}
  <Modal
    properties={base}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">All header parts</div>
  </Modal>
{:else if name === 'header-none'}
  <Modal
    properties={{
      ...defaultModalProperties,
      header: { leftImage: null, rightImage: null, text: null }
    }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">No header</div>
  </Modal>
{:else if name === 'header-test-ids'}
  <Modal
    properties={{
      ...base,
      testId: 'modal-root',
      leftImageTestId: 'left-img',
      rightImageTestId: 'right-img',
      header: { ...header, testId: 'header-title', buttonTestId: 'header-right-btn' }
    }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">Test ids</div>
  </Modal>
{:else if name === 'footer-primary'}
  <Modal
    properties={{ ...base, footer: { primaryButton: primary } }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">Primary only</div>
  </Modal>
{:else if name === 'footer-secondary' || name === 'click-secondary'}
  <Modal
    properties={{ ...base, footer: { secondaryButton: secondary } }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">Secondary only</div>
  </Modal>
{:else if name === 'footer-both' || name === 'click-primary'}
  <Modal
    properties={{ ...base, footer: { primaryButton: primary, secondaryButton: secondary } }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">Both buttons</div>
  </Modal>
{:else if name === 'footer-empty-object'}
  <Modal
    properties={{ ...base, footer: {} }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">Empty footer object</div>
  </Modal>
{:else if name === 'footer-slot'}
  <Modal
    properties={base}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">Custom footer</div>
    <div slot="footer" class="custom-footer">Footer slot content</div>
  </Modal>
{:else if name === 'footer-slot-with-buttons'}
  <Modal
    properties={{ ...base, footer: { primaryButton: primary, secondaryButton: secondary } }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">Slot wins over buttons</div>
    <div slot="footer" class="custom-footer">Footer slot content</div>
  </Modal>
{:else if name === 'transition-off'}
  <Modal
    properties={{ ...base, enableTransition: false, align: 'bottom', size: 'medium' }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">No transition</div>
  </Modal>
{:else if name === 'transition-in-center'}
  <Modal
    properties={{ ...base, transitionType: 'IN', align: 'center' }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">IN, center</div>
  </Modal>
{:else if name === 'transition-in-top'}
  <Modal
    properties={{ ...base, transitionType: 'IN', align: 'top' }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">IN, top</div>
  </Modal>
{:else if name === 'transition-in-bottom'}
  <Modal
    properties={{ ...base, transitionType: 'IN', align: 'bottom' }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">IN, bottom</div>
  </Modal>
{:else if name === 'transition-all-top'}
  <Modal
    properties={{ ...base, transitionType: 'ALL', align: 'top' }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">ALL, top</div>
  </Modal>
{:else if name === 'long-content'}
  <Modal
    properties={{ ...base, size: 'medium', footer: { primaryButton: primary } }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">
      {#each lines as line}
        <div>{line}</div>
      {/each}
    </div>
  </Modal>
{:else if name === 'vars-ancestor'}
  <div class="themed">
    <Modal
      properties={{ ...base, size: 'large', align: 'bottom', footer: { primaryButton: primary } }}
      on:overlayClick={onOverlay}
      on:close={onClose}
      on:headerLeftImageClick={onLeft}
      on:headerRightImageClick={onRight}
      on:primaryButtonClick={onPrimary}
      on:secondaryButtonClick={onSecondary}
    >
      <div slot="content" class="body">Themed modal</div>
    </Modal>
  </div>
{:else if name === 'vars-footer-buttons'}
  <div class="footer-themed">
    <Modal
      properties={{
        ...base,
        footer: { primaryButton: primary, secondaryButton: secondary }
      }}
      on:overlayClick={onOverlay}
      on:close={onClose}
      on:headerLeftImageClick={onLeft}
      on:headerRightImageClick={onRight}
      on:primaryButtonClick={onPrimary}
      on:secondaryButtonClick={onSecondary}
    >
      <div slot="content" class="body">Footer themed</div>
    </Modal>
  </div>
{:else if name === 'vars-style-props'}
  <Modal
    properties={{ ...base, size: 'small', align: 'top', footer: { primaryButton: primary } }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
    --modal-height="700px"
    --modal-margin="20px"
    --modal-small-height="300px"
    --modal-small-width="300px"
    --modal-border-radius="16px"
    --header-text-size="22px"
    --background-color="#1d4ed866"
    --modal-top-align-items="center"
  >
    <div slot="content" class="body">Style props</div>
  </Modal>
{:else if name === 'click-overlay'}
  <Modal
    properties={{ ...base, size: 'small', align: 'center' }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">Click outside</div>
  </Modal>
{:else if name === 'click-content-not-overlay'}
  <Modal
    properties={{ ...base, size: 'medium' }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">Click inside</div>
  </Modal>
{:else if name === 'escape'}
  <Modal
    properties={{ ...base, size: 'small' }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">Press Escape</div>
  </Modal>
{:else if name === 'remove-after-click'}
  {#if open}
    <Modal
      properties={{ ...base, footer: { primaryButton: primary } }}
      on:overlayClick={onOverlay}
      on:close={onClose}
      on:headerLeftImageClick={onLeft}
      on:headerRightImageClick={onRight}
      on:primaryButtonClick={(e) => {
        onPrimary(e);
        open = false;
      }}
      on:secondaryButtonClick={onSecondary}
    >
      <div slot="content" class="body">Closes on confirm</div>
    </Modal>
  {/if}
  <div class="page-text">Page behind</div>
{:else if name === 'hardware-back'}
  <Modal
    properties={{ ...base, supportHardwareBackPress: true, size: 'small' }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">Hardware back</div>
  </Modal>
{:else if name === 'hardware-back-pop'}
  <button id="back" class="back-trigger" on:click={() => history.back()}>Back</button>
  <Modal
    properties={{ ...base, supportHardwareBackPress: true, size: 'small' }}
    on:overlayClick={onOverlay}
    on:close={onClose}
    on:headerLeftImageClick={onLeft}
    on:headerRightImageClick={onRight}
    on:primaryButtonClick={onPrimary}
    on:secondaryButtonClick={onSecondary}
  >
    <div slot="content" class="body">Hardware back pop</div>
  </Modal>
{/if}

<style>
  .body {
    padding: 16px;
    font-family: sans-serif;
  }
  .custom-footer {
    padding: 4px;
    color: #7c2d12;
    font-family: sans-serif;
  }
  .page-text {
    font-family: sans-serif;
    padding: 8px;
  }
  .back-trigger {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100;
  }
  .themed {
    --modal-large-height: 60vh;
    --modal-margin: 12px;
    --modal-width: 396px;
    --modal-height: 776px;
    --modal-border-radius: 20px;
    --modal-content-background-color: #fffbeb;
    --modal-content-border-top: 4px solid #b45309;
    --modal-header-background-color: #fde68a;
    --modal-header-padding: 24px 16px;
    --modal-header-border-radius: 12px;
    --modal-header-border-bottom: 2px solid #92400e;
    --modal-header-text-weight: 700;
    --modal-header-text-line-height: 28px;
    --modal-header-text-letter-spacing: 1px;
    --header-text-size: 20px;
    --header-img-top-padding: 0px;
    --header-left-image-margin: 0px 8px 0px 0px;
    --header-left-image-width: 32px;
    --header-left-image-height: 32px;
    --header-right-image-width: 16px;
    --header-right-image-height: 16px;
    --header-right-image-padding: 4px;
    --background-color: #11182799;
    --modal-z-index: 20;
    --modal-bottom-align-items: stretch;
    --modal-display: block;
    --modal-overflow-y: auto;
    --modal-content-overflow: hidden;
    --modal-footer-background-color: #fef3c7;
    --modal-footer-padding: 8px 16px;
    --modal-footer-border-radius: 8px;
    --modal-footer-border-top: 1px solid #b45309;
    --modal-footer-justify-content: flex-end;
  }
  .footer-themed {
    --modal-footer-gap: 12px;
    --modal-footer-action-buttons-width: 100%;
    --modal-footer-justify-content: space-between;
    --modal-secondary-button-order: 2;
    --modal-primary-button-order: 1;
    --modal-footer-secondary-button-flex-value: 1;
    --modal-footer-primary-button-flex-value: 2;
    --modal-footer-secondary-button-color: #e5e7eb;
    --modal-footer-secondary-button-text-color: #111827;
    --modal-footer-secondary-button-font-size: 12px;
    --modal-footer-secondary-button-font-weight: 700;
    --modal-footer-secondary-button-height: 40px;
    --modal-footer-secondary-button-padding: 8px;
    --modal-footer-secondary-button-border-radius: 8px;
    --modal-footer-secondary-button-width: 100%;
    --modal-footer-secondary-button-border: 1px solid #6b7280;
    --modal-footer-secondary-button-box-shadow: 0 1px 2px #00000040;
    --modal-footer-primary-button-color: #047857;
    --modal-footer-primary-button-text-color: #ecfdf5;
    --modal-footer-primary-button-font-size: 18px;
    --modal-footer-primary-button-font-weight: 700;
    --modal-footer-primary-button-height: 48px;
    --modal-footer-primary-button-padding: 12px;
    --modal-footer-primary-button-border-radius: 24px;
    --modal-footer-primary-button-width: 100%;
    --modal-footer-primary-button-border: 2px solid #064e3b;
    --modal-footer-primary-button-box-shadow: 0 2px 4px #00000040;
  }
</style>
