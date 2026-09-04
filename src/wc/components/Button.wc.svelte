<svelte:options
  customElement={{
    tag: 'sui-button',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      enable: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      showProgressBar: { type: 'Boolean', reflect: true, attribute: 'show-progress-bar' },
      showLoader: { type: 'Boolean', reflect: true, attribute: 'show-loader' },
      loaderType: { type: 'String', reflect: true, attribute: 'loader-type' },
      type: { type: 'String', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      ariaLabel: { type: 'String', reflect: true, attribute: 'aria-label' },
      ariaExpanded: { type: 'Boolean', attribute: 'aria-expanded' },
      classes: { type: 'String' },
      onclick: { type: 'Object' },
      onkeydown: { type: 'Object' },
      onkeyup: { type: 'Object' },
      onmousedown: { type: 'Object' },
      onmouseup: { type: 'Object' },
      onmouseleave: { type: 'Object' },
      ontouchstart: { type: 'Object' },
      ontouchend: { type: 'Object' },
      variant: { type: 'String', attribute: 'variant' },
      size: { type: 'String', attribute: 'size' },
      iconOnly: { type: 'Boolean', attribute: 'icon-only' },
      fullWidth: { type: 'Boolean', attribute: 'full-width' },
      href: { type: 'String', attribute: 'href' },
      target: { type: 'String', attribute: 'target' },
      rel: { type: 'String', attribute: 'rel' },
      loading: { type: 'Boolean', attribute: 'loading' },
      allowHtml: { type: 'Boolean', attribute: 'allow-html' },
      // Svelte derives the observed attribute by lowercasing the prop name, so
      // without this it listens for `ariahaspopup` and `aria-haspopup="menu"`
      // never arrives. The declared type is a string union widened with boolean;
      // 'Object' would JSON.parse the value and reject `menu` outright.
      ariaHaspopup: { type: 'String', attribute: 'aria-haspopup' },
      icon: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  let props = $props();
</script>

<!-- A property-assigned icon wins; the slot is the fallback. The branch stays
     inside the body snippet so `<slot>` keeps its `$$props` scope. `children` is
     no longer a declared prop, so the default slot is its only path. -->
<Button {...props}>
  {#snippet icon()}
    {#if props.icon}{@render props.icon()}{:else}<slot name="icon"></slot>{/if}
  {/snippet}
  {#snippet children()}
    <slot></slot>
  {/snippet}
</Button>
