<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import Modal from '$lib/Modal/Modal.svelte';

  let showModal = $state(false);
  let showModalTop = $state(false);
  let showTallModal = $state(false);
  let showDecorativeLeftImageModal = $state(false);
  let showBackButtonModal = $state(false);
  let backButtonClickCount = $state(0);
  let showSlideUpModal = $state(false);

  // Inline data-URI so the demo has no external asset dependency; exercises
  // the Img component's `inlineSvg` currentColor path used by the header.
  const backIconSrc =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M15 18l-6-6 6-6'/%3E%3C/svg%3E";
  const closeIconSrc =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M18 6L6 18M6 6l12 12'/%3E%3C/svg%3E";
</script>

<div class="page-header">
  <span class="category-badge">Overlays</span>
  <h1>Modal</h1>
</div>

<div class="demo-row">
  <Button text="Open Modal" onclick={() => (showModal = true)} />
  {#if showModal}
    <Modal
      size="medium"
      align="center"
      showOverlay
      header={{
        text: 'Confirm Action',
        rightImage: closeIconSrc,
        buttonTestId: 'confirm-modal-close',
        buttonAriaLabel: 'Close dialog'
      }}
      footer={{
        primaryButton: { text: 'Confirm' },
        secondaryButton: { text: 'Cancel' }
      }}
      onclose={() => (showModal = false)}
      onheaderRightImageClick={() => (showModal = false)}
      onoverlayClick={() => (showModal = false)}
      onprimaryButtonClick={() => {
        alert('Confirmed!');
        showModal = false;
      }}
      onsecondaryButtonClick={() => (showModal = false)}
    >
      {#snippet content()}
        <div style="padding: 16px;">
          <p>Are you sure you want to proceed with this action?</p>
        </div>
      {/snippet}
    </Modal>
  {/if}
</div>

<div class="demo-row">
  <Button text="Open Modal (header align: flex-start)" onclick={() => (showModalTop = true)} />
  {#if showModalTop}
    <div class="modal-top-aligned">
      <Modal
        size="fit-content"
        align="center"
        showOverlay
        header={{ text: 'Top-Aligned Header Items' }}
        onoverlayClick={() => (showModalTop = false)}
      >
        {#snippet content()}
          <div style="padding: 16px;">
            <p>
              The header uses <code>--modal-header-align-items: flex-start</code> so multi-line header
              content aligns to the top instead of the default center.
            </p>
          </div>
        {/snippet}
      </Modal>
    </div>
  {/if}
</div>

<div class="demo-row">
  <Button
    text="Open modal with decorative left image"
    onclick={() => (showDecorativeLeftImageModal = true)}
  />
  {#if showDecorativeLeftImageModal}
    <Modal
      size="medium"
      align="center"
      showOverlay
      testId="decorative-left-image-modal"
      leftImageTestId="decorative-left-image"
      header={{ text: 'Decorative left image', leftImage: backIconSrc, rightImage: closeIconSrc }}
      onclose={() => (showDecorativeLeftImageModal = false)}
      onoverlayClick={() => (showDecorativeLeftImageModal = false)}
      onheaderRightImageClick={() => (showDecorativeLeftImageModal = false)}
    >
      {#snippet content()}
        <div style="padding: 16px;">
          <p>
            No <code>onheaderLeftImageClick</code> is supplied, so the left image is a plain decorative
            image — it must not be focusable and must not be announced as a button.
          </p>
        </div>
      {/snippet}
    </Modal>
  {/if}
</div>

<div class="demo-row">
  <Button text="Open modal with back button" onclick={() => (showBackButtonModal = true)} />
  {#if showBackButtonModal}
    <Modal
      size="medium"
      align="center"
      showOverlay
      testId="back-button-modal"
      leftImageTestId="back-button-left-image"
      leftImageAriaLabel="Go back"
      header={{ text: 'Back button', leftImage: backIconSrc, rightImage: closeIconSrc }}
      onclose={() => (showBackButtonModal = false)}
      onoverlayClick={() => (showBackButtonModal = false)}
      onheaderRightImageClick={() => (showBackButtonModal = false)}
      onheaderLeftImageClick={() => (backButtonClickCount += 1)}
    >
      {#snippet content()}
        <div style="padding: 16px;">
          <p>
            A real back control: <code>onheaderLeftImageClick</code> is supplied, so it keeps
            <code>role="button"</code>, its tab stop and keyboard activation.
          </p>
          <p data-pw="back-button-click-count">clicks: {backButtonClickCount}</p>
        </div>
      {/snippet}
    </Modal>
  {/if}
</div>

<div class="demo-row">
  <Button text="Open tall modal (viewport containment)" onclick={() => (showTallModal = true)} />
  {#if showTallModal}
    <div class="modal-tall-demo">
      <Modal
        size="medium"
        align="center"
        showOverlay
        testId="tall-modal"
        header={{ text: 'Tall content stays contained' }}
        footer={{
          primaryButton: { text: 'Save' },
          secondaryButton: { text: 'Cancel' }
        }}
        onclose={() => (showTallModal = false)}
        onoverlayClick={() => (showTallModal = false)}
        onprimaryButtonClick={() => (showTallModal = false)}
        onsecondaryButtonClick={() => (showTallModal = false)}
      >
        {#snippet content()}
          <div style="padding: 16px;">
            <p>
              This wrapper overrides <code>--modal-medium-height: fit-content</code> — the common
              app-level sizing that used to let tall content grow the modal past the viewport. The
              content box now caps at <code>--modal-max-height</code> and scrolls internally, so the footer
              and bottom rounding always stay on screen.
            </p>
            {#each Array.from({ length: 40 }, (_, i) => i + 1) as row (row)}
              <p>Form row {row} — enough content to overflow any laptop viewport.</p>
            {/each}
          </div>
        {/snippet}
      </Modal>
    </div>
  {/if}
</div>

<div class="demo-row">
  <Button text="Open centered modal (slide-up)" onclick={() => (showSlideUpModal = true)} />
  {#if showSlideUpModal}
    <Modal
      size="fit-content"
      align="center"
      entryAnimation="slide-up"
      overlayFadeIn
      showOverlay
      header={{
        text: 'Slides Up, Stays Centered',
        rightImage: closeIconSrc,
        buttonTestId: 'slide-up-modal-close',
        buttonAriaLabel: 'Close dialog'
      }}
      footer={{
        primaryButton: { text: 'Got it' }
      }}
      onclose={() => (showSlideUpModal = false)}
      onheaderRightImageClick={() => (showSlideUpModal = false)}
      onoverlayClick={() => (showSlideUpModal = false)}
      onprimaryButtonClick={() => (showSlideUpModal = false)}
    >
      {#snippet content()}
        <div style="padding: 16px;">
          <p>
            <code>align="center"</code> paired with <code>entryAnimation="slide-up"</code> — the
            dialog stays centered but enters like a bottom sheet instead of fading in.
            <code>overlayFadeIn</code> softens the backdrop's appearance to match.
          </p>
        </div>
      {/snippet}
    </Modal>
  {/if}
</div>

<style>
  .modal-top-aligned {
    --modal-header-align-items: flex-start;
  }

  .modal-tall-demo {
    /* Reproduces the app override that used to break containment: a medium
       modal sized to its content instead of the 50vh default. */
    --modal-medium-height: fit-content;
  }
</style>
