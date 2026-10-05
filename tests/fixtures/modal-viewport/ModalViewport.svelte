<script lang="ts">
  import { onMount } from 'svelte';
  import Modal from '$lib/Modal/Modal.svelte';
  import type { ModalAlign, ModalSize } from '$lib/Modal/properties';

  const sizes: readonly ModalSize[] = ['small', 'medium', 'large', 'fit-content'];
  const aligns: readonly ModalAlign[] = ['top', 'center', 'bottom'];

  const params = new URLSearchParams(window.location.search);

  const pick = <Choice extends string>(
    name: string,
    choices: readonly Choice[],
    fallback: Choice
  ): Choice => {
    const requested = params.get(name);
    if (requested === null) {
      return fallback;
    }
    const match = choices.find((choice) => choice === requested) ?? null;
    if (match === null) {
      throw new Error(`Unknown ${name} "${requested}"`);
    }
    return match;
  };

  const size = pick('size', sizes, 'medium');
  const align = pick('align', aligns, 'center');
  const enableTransition = pick('transition', ['on', 'off'] as const, 'on') === 'on';
  const body = pick('body', ['normal', 'wide', 'narrow'] as const, 'normal');
  // Custom properties on an ancestor of the overlay, which is where an app sets
  // them for every modal at once.
  const tokens = params.get('tokens') ?? '';
  const primaryLabel = params.get('primary') ?? 'Save';
  const usePortal = pick('portal', ['on', 'off'] as const, 'off') === 'on';

  // An app's own stylesheet is linked before the library's, so a rule of the
  // app's that targets the same selector loses any tie to it. Placing the
  // consumer rule first in the head reproduces that order.
  const consumerCss = params.get('css');
  if (consumerCss !== null) {
    const consumerSheet = document.createElement('style');
    consumerSheet.textContent = consumerCss;
    document.head.prepend(consumerSheet);
  }

  let overlayClicks = $state(0);

  onMount(() => {
    document.documentElement.dataset.fixtureReady = 'true';
  });
</script>

<p data-pw="fixture-overlay-clicks">{overlayClicks}</p>
<div style={tokens}>
  <Modal
    {size}
    {align}
    {enableTransition}
    {usePortal}
    showOverlay
    testId="fixture-modal"
    onoverlayclick={() => (overlayClicks += 1)}
    header={{ text: 'Viewport fit' }}
    footer={{
      primaryButton: { text: primaryLabel, testId: 'fixture-modal-primary' },
      secondaryButton: { text: 'Cancel', testId: 'fixture-modal-secondary' }
    }}
  >
    {#snippet content()}
      {#if body === 'wide'}
        <div data-pw="fixture-modal-wide-child" style="flex: none; width: 700px; padding: 16px;">
          A child that cannot shrink below 700px.
        </div>
      {:else if body === 'narrow'}
        <div style="padding: 16px;">Hi</div>
      {:else}
        <div style="padding: 16px;">
          <p>The panel stays inside the viewport whatever width the app asks for.</p>
        </div>
      {/if}
    {/snippet}
  </Modal>
</div>
