<script lang="ts">
  import { onMount } from 'svelte';
  import maskIconUrl from '$lib/assets/close.svg?url';
  import {
    Accordion,
    Button,
    Card,
    Dialog,
    Icon,
    IframeViewer,
    Img,
    Input,
    MediaPlayer,
    Select
  } from '$lib';

  let open = $state(false);
  let phone = $state('');
  let platform = $state<string[]>([]);
  let submitted = $state('');
  let maskActivations = $state(0);
  let loads = $state(0);
  let mountRefs = $state(0);
  let audio: HTMLVideoElement | HTMLAudioElement | null = $state(null);
  let image: HTMLImageElement | SVGSVGElement | null = $state(null);
  let action: HTMLButtonElement | HTMLAnchorElement | null = $state(null);
  let field: HTMLInputElement | HTMLTextAreaElement | null = $state(null);
  let frame: HTMLIFrameElement | null = $state(null);
  let selection: HTMLSelectElement | null = $state(null);
  let video: HTMLVideoElement | HTMLAudioElement | null = $state(null);

  onMount(() => {
    mountRefs = [image, action, field, frame, selection, video, audio].filter(Boolean).length;
  });

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const target = event.currentTarget;
    if (!(target instanceof HTMLFormElement)) {
      return;
    }
    const data = new FormData(target);
    submitted = `${data.get('phone')}:${data.get('platform')}`;
  };
</script>

<h1>Dialog</h1>
<h2>Native consumer integration</h2>
<p>Library components can retain browser behavior and a host's authored composition.</p>
<div class="native-mask-stage">
  <Icon mask icon={maskIconUrl} size={18} label="Native mask icon" testId="native-mask-contract" />
  <Icon
    mask
    icon={maskIconUrl}
    label="Mask action"
    testId="native-mask-action"
    onclick={() => (maskActivations += 1)}
  />
  <output data-pw="native-mask-activations">{maskActivations}</output>
</div>

<div class="contract-stage" data-pw="native-consumer-stage">
  <Img
    unstyled
    src="/favicon.png"
    alt="Example brand"
    bind:element={image}
    nativeAttrs={{ loading: 'lazy', width: 42, height: 42, decoding: 'async' }}
    testId="native-consumer-image"
  />
  <Button
    unstyled
    classes="contract-action"
    bind:element={action}
    nativeAttrs={{ 'aria-describedby': 'dialog-help' }}
    onclick={() => (open = true)}
    testId="native-consumer-open">Details</Button
  >
  <p id="dialog-help">Inspect details without leaving this page.</p>
  <div style="--input-placeholder-color: rgb(90, 100, 110)">
    <Input
      native
      unstyled
      value=""
      placeholder="Native placeholder"
      classes="native-placeholder-contract"
      testId="native-placeholder-contract"
    />
    <Input value="" placeholder="Styled placeholder" testId="styled-placeholder-contract" />
  </div>
  <Select
    native
    items={['Example']}
    classes="select-trigger native-selector-contract"
    testId="native-selector-contract"
  />
  <select
    class="select-trigger native-selector-contract"
    aria-label="Native select reference"
    data-pw="native-select-reference"
  >
    <option>Example</option>
  </select>
  <Card unstyled interactive onclick={() => (open = true)} testId="native-consumer-card">
    Keyboard details
  </Card>

  <form onsubmit={submit} data-pw="native-consumer-form">
    <label for="native-phone">Indian mobile number</label>
    <Input
      native
      unstyled
      classes="contract-field"
      dataType="tel"
      bind:value={phone}
      bind:element={field}
      id="native-phone"
      name="phone"
      required
      maxLength={10}
      nativeAttrs={{
        pattern: '[6-9][0-9]{9}',
        maxlength: 10,
        dir: 'ltr',
        'aria-describedby': 'phone-hint'
      }}
      testId="native-consumer-phone"
    />
    <p id="phone-hint">Ten digits, starting with 6–9.</p>
    <label for="native-platform">Platform</label>
    <Select
      native
      classes="contract-field"
      id="native-platform"
      name="platform"
      required
      placeholder="Choose a platform"
      items={[
        { id: 'shopify', label: 'Shopify' },
        { id: 'woocommerce', label: 'WooCommerce' }
      ]}
      bind:value={platform}
      bind:element={selection}
      testId="native-consumer-select"
    />
    <Button unstyled classes="contract-action" type="submit" testId="native-consumer-submit"
      >Submit</Button
    >
  </form>
  <p role="status" data-pw="native-consumer-result">{submitted}</p>

  <Accordion native testId="native-consumer-disclosure">
    {#snippet trigger()}
      Setup details
    {/snippet}
    <p data-pw="native-consumer-disclosure-content">These details work before hydration.</p>
  </Accordion>

  <IframeViewer
    classes="native-frame-layout"
    unstyled
    src="data:text/html,Embedded%20example"
    title="Example application"
    bind:element={frame}
    allow="microphone; autoplay"
    onload={() => (loads += 1)}
    nativeAttrs={{ 'data-pw': 'native-consumer-frame', 'aria-busy': loads === 0 }}
  />
  <p data-pw="native-consumer-frame-loads">{loads}</p>

  <MediaPlayer
    unstyled
    src=""
    type="video"
    autoplay={false}
    playing={false}
    bind:element={video}
    nativeAttrs={{ preload: 'none', poster: '/favicon.png' }}
    testId="native-consumer-video"
  >
    <source src="/demo-media/promo-clip.mp4" type="video/mp4" media="(min-width: 600px)" />
    <source src="/demo-media/promo-clip.mp4" type="video/mp4" />
  </MediaPlayer>
  <MediaPlayer
    unstyled
    type="audio"
    src=""
    autoplay
    playing={false}
    muted={false}
    bind:element={audio}
    nativeAttrs={{ style: 'display: none;' }}
    testId="native-consumer-audio"
  />
  <p data-pw="native-consumer-mount-refs">{mountRefs}</p>
  <p data-pw="native-consumer-refs">
    {[image, action, field, frame, selection, video, audio].filter(Boolean).length}
  </p>
</div>

<Dialog
  returnFocusTo={action}
  bind:open
  classes="contract-dialog"
  nativeAttrs={{ 'aria-labelledby': 'native-dialog-title' }}
  testId="native-consumer-dialog"
>
  <h2 id="native-dialog-title">Product details</h2>
  <Button
    unstyled
    classes="contract-action"
    onclick={() => (open = false)}
    testId="native-consumer-close">Close details</Button
  >
</Dialog>

<style>
  .native-mask-stage {
    color: rgb(31, 65, 91);
  }

  :global(input::placeholder) {
    color: rgb(12, 34, 56);
  }

  :global(select.native-selector-contract) {
    display: block;
    padding: 7px 12px;
  }

  .contract-stage {
    display: grid;
    gap: var(--native-consumer-gap, 16px);
    max-width: var(--native-consumer-width, 36rem);
  }

  .contract-stage :global(iframe),
  .contract-stage :global(video) {
    width: var(--native-consumer-media-width, 100%);
    max-width: 100%;
  }

  .contract-stage form {
    display: grid;
    gap: var(--native-consumer-field-gap, 8px);
  }

  :global(.contract-action),
  :global(.contract-field) {
    font: inherit;
    color: var(--native-consumer-color, #25313d);
    background: var(--native-consumer-background, #fff);
    border: var(--native-consumer-border, 1px solid #64748b);
    border-radius: var(--native-consumer-radius, 8px);
    padding: var(--native-consumer-padding, 12px);
  }

  :global(.contract-dialog) {
    color: var(--native-consumer-color, #25313d);
    background: var(--native-consumer-background, #fff);
    padding: var(--native-consumer-dialog-padding, 24px);
    border: var(--native-consumer-border, 1px solid #64748b);
    border-radius: var(--native-consumer-radius, 8px);
    max-width: var(--native-consumer-dialog-width, calc(100% - 32px));
  }
</style>
