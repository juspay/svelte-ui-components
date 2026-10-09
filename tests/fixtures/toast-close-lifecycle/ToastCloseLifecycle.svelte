<script lang="ts">
  import { flushSync } from 'svelte';
  import Toast from '$lib/Toast/Toast.svelte';

  let mounted = $state(false);
  let message = $state('Saved');
  let hides = $state(0);
  let sequence = 0;
  const closeIcon =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24"%3E%3C/svg%3E';

  function closeNativeToast() {
    document.querySelector<HTMLDivElement>('[data-pw="toast-close"]')?.click();
  }

  function showAndClose(unmount = false) {
    mounted = true;
    flushSync();
    closeNativeToast();
    if (unmount) {
      mounted = false;
      flushSync();
    }
  }
</script>

<button data-pw="show-toast" onclick={() => (mounted = true)}>Show</button>
<button data-pw="immediate-close" onclick={() => showAndClose()}>Show and close</button>
<button data-pw="close-unmount" onclick={() => showAndClose(true)}>Show, close and unmount</button>
<button data-pw="replace-message" onclick={() => (message = `Saved ${++sequence}`)}
  >Replace message</button
>
<output data-pw="hide-count">{hides}</output>
{#if mounted}
  <Toast
    {message}
    rightIcon={closeIcon}
    closeIconTestId="toast-close"
    testId="lifecycle-toast"
    duration={100000}
    inAnimationDuration={80}
    outAnimationDuration={160}
    ontoasthide={() => hides++}
  />
{/if}
