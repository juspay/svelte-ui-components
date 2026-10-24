<script lang="ts">
  import { onMount } from 'svelte';
  import Modal from '$lib/Modal/Modal.svelte';

  const params = new URLSearchParams(window.location.search);
  const hiddenOnly = params.get('controls') === 'none';
  const hiddenType = params.get('type') ?? 'hidden';
  const hiddenTabindex = Number(params.get('tabindex') ?? '-1');
  let open = $state(false);
  let dismissals = $state(0);
  let submissions = $state(0);
  let submittedToken = $state('');

  const dismiss = (): void => {
    dismissals += 1;
    open = false;
  };

  const submit = (event: SubmitEvent): void => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) {
      throw new Error('Controlled modal form is missing');
    }
    submittedToken = String(new FormData(form).get('tokenId'));
    submissions += 1;
    open = false;
  };

  onMount(() => {
    document.documentElement.dataset.fixtureReady = 'true';
  });
</script>

<button data-pw="open-modal" onclick={() => (open = true)}>Review token</button>
<button data-pw="background-action">Background action</button>
<p data-pw="dismissals">{dismissals}</p>
<p data-pw="submissions">{submissions}</p>
<p data-pw="submitted-token">{submittedToken}</p>

{#if open}
  <Modal
    usePortal
    enableTransition={false}
    role="dialog"
    ariaLabel="Controlled token review"
    header={{ text: 'Controlled token review' }}
    testId="hidden-input-modal"
    onoverlayclick={dismiss}
  >
    {#snippet content()}
      <form onsubmit={submit}>
        <input
          type={hiddenType}
          tabindex={hiddenTabindex}
          name="tokenId"
          value="controlled-token"
        />
        <p>Inert fixture: no token service is called.</p>
        {#if !hiddenOnly}
          <button type="button" data-pw="cancel" onclick={dismiss}>Cancel</button>
          <button type="submit" data-pw="confirm">Confirm token</button>
        {/if}
        <input
          type={hiddenType}
          tabindex={hiddenTabindex}
          name="trailing"
          value="controlled-tail"
        />
      </form>
    {/snippet}
  </Modal>
{/if}
