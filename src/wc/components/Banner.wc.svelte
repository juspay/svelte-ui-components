<svelte:options
  customElement={{
    tag: 'sui-banner',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      linkText: { type: 'String', reflect: true, attribute: 'link-text' },
      dismissible: { type: 'Boolean', reflect: true },
      visible: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      bannerRole: { type: 'String', attribute: 'role' },
      onclick: { type: 'Object' },
      ondismiss: { type: 'Object' },
      icon: { type: 'Object' },
      rightContent: { type: 'Object' },
      dismissIcon: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Banner from '$lib/Banner/Banner.svelte';
  import type { BannerProperties } from '$lib/Banner/properties';
  // The element renames `role` to `bannerRole` because the platform already defines `role` on every
  // HTMLElement. The rest still carries the component's own props -- saying so is what
  // a destructured `$props()` no longer infers on its own.
  let {
    bannerRole,
    ...props
    // `title` is omitted as well as `role`: it is host-reserved, so the element never
    // declares it and the wrapper's own title snippet is unconditional. Including it
    // would advertise a prop nothing can set.
  }: Omit<BannerProperties, 'role' | 'title'> & { bannerRole?: BannerProperties['role'] } =
    $props();
</script>

<!--
  A body snippet is passed after {...props} and therefore wins, so a consumer
  assigning `element.icon` used to get nothing: the prop was declared but
  unreachable, the exact defect this wrapper exists to fix. The branch has to
  live *inside* the snippet rather than choosing between two snippets at the
  call site — a `<slot>` hoisted out of the component body compiles against a
  `$$props` binding that is not in scope there, and the element renders nothing
  at all. `title` keeps no property branch: it is host-reserved, never declared.
-->
<Banner {...props} role={bannerRole}>
  {#snippet icon()}
    {#if props.icon}{@render props.icon()}{:else}<slot name="icon"></slot>{/if}
  {/snippet}
  {#snippet title()}
    <slot name="title"></slot>
  {/snippet}
  {#snippet rightContent()}
    {#if props.rightContent}{@render props.rightContent()}{:else}<slot name="right-content"
      ></slot>{/if}
  {/snippet}
  {#snippet dismissIcon()}
    {#if props.dismissIcon}{@render props.dismissIcon()}{:else}<slot name="dismiss-icon"
      ></slot>{/if}
  {/snippet}
</Banner>
