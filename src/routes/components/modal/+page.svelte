<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import Modal from '$lib/Modal/Modal.svelte';

  let showModal = $state(false);
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
