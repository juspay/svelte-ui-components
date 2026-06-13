<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import Modal from '$lib/Modal/Modal.svelte';

  let showModal = $state(false);
  let showModalTop = $state(false);
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
      header={{ text: 'Confirm Action' }}
      footer={{
        primaryButton: { text: 'Confirm' },
        secondaryButton: { text: 'Cancel' }
      }}
      onclose={() => (showModal = false)}
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
            <p>The header uses <code>--modal-header-align-items: flex-start</code> so multi-line header content aligns to the top instead of the default center.</p>
          </div>
        {/snippet}
      </Modal>
    </div>
  {/if}
</div>

<style>
  .modal-top-aligned {
    --modal-header-align-items: flex-start;
  }
</style>
