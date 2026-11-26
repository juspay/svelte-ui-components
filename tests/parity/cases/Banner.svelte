<script module>
  const W = ['wait', 600];
  export const cases = [
    { name: 'default', actions: [W] },
    { name: 'empty-text', actions: [W] },
    { name: 'text-with-link', actions: [W] },
    { name: 'link-only', actions: [W] },
    { name: 'long-text-ellipsis', actions: [W] },
    { name: 'long-text-wrapping', actions: [W] },
    { name: 'children', actions: [W] },
    { name: 'title', actions: [W] },
    { name: 'title-and-children', actions: [W] },
    { name: 'icon', actions: [W] },
    { name: 'right-content', actions: [W] },
    { name: 'dismissible', actions: [W] },
    { name: 'dismissible-custom-icon', actions: [W] },
    { name: 'dismissible-test-id', actions: [W] },
    { name: 'all-slots', actions: [W] },
    { name: 'clickable-cursor', actions: [W] },
    { name: 'visible-false', allowBlank: true, actions: [W] },
    { name: 'visible-bound', actions: [W] },
    { name: 'role-explicit', actions: [W] },
    { name: 'role-null-interactive', actions: [W] },
    { name: 'classes', actions: [W] },
    { name: 'transition-duration', actions: [W] },
    { name: 'transition-duration-zero', actions: [W] },
    { name: 'css-custom-properties', actions: [W] },
    { name: 'css-custom-properties-dismiss', actions: [W] },
    { name: 'click-callback', actions: [W, ['click', '.banner'], W] },
    { name: 'click-keyboard-enter', actions: [W, ['focus', '.banner'], ['key', 'Enter'], W] },
    { name: 'click-keyboard-space', actions: [W, ['focus', '.banner'], ['key', ' '], W] },
    { name: 'focus-ring', actions: [W, ['key', 'Tab']] },
    {
      name: 'dismiss-click',
      allowBlank: true,
      actions: [W, ['click', '.banner-dismiss button'], ['wait', 700]]
    },
    {
      name: 'dismiss-click-no-onclick',
      allowBlank: true,
      actions: [W, ['click', '.banner-dismiss button'], ['wait', 700]]
    },
    {
      name: 'dismiss-keyboard',
      allowBlank: true,
      actions: [W, ['focus', '.banner-dismiss button'], ['key', 'Enter'], ['wait', 700]]
    },
    { name: 'dismiss-hover', actions: [W, ['hover', '.banner-dismiss button']] },
    { name: 'link-click-bubbles', actions: [W, ['click', '.banner-link-text'], W] },
    {
      name: 'toggle-visible',
      actions: [W, ['click', '#t'], ['wait', 700], ['click', '#t'], ['wait', 700]]
    }
  ];
</script>

<script>
  import { Banner } from 'sui-under-test';
  import { log, note, svg } from './_kit.js';
  let { name } = $props();

  let visible = $state(true);
  $effect(() => note('visible', visible));

  const long =
    'This is a long banner message that will not fit on a single line of a narrow container';
</script>

{#snippet children()}
  <div style="font-family: sans-serif;">A sentence with <a href="#x">a link</a> inside it.</div>
{/snippet}

{#snippet title()}
  Banner title
{/snippet}

{#snippet icon()}
  <img src={svg} width="18" height="18" alt="" />
{/snippet}

{#snippet rightContent()}
  <button type="button" style="font-size: 12px;">Retry</button>
{/snippet}

{#snippet dismissIcon()}
  <span aria-hidden="true">x</span>
{/snippet}

{#if name === 'default'}
  <Banner text="Your account is ready" />
{:else if name === 'empty-text'}
  <Banner />
{:else if name === 'text-with-link'}
  <Banner text="New version available." linkText="Update now" />
{:else if name === 'link-only'}
  <Banner linkText="Update now" />
{:else if name === 'long-text-ellipsis'}
  <div style="width: 360px"><Banner text={long} linkText="Read more" /></div>
{:else if name === 'long-text-wrapping'}
  <div style="width: 360px">
    <div style="--banner-white-space: normal; --banner-text-overflow: visible;">
      <Banner text={long} linkText="Read more" />
    </div>
  </div>
{:else if name === 'children'}
  <Banner {children} />
{:else if name === 'title'}
  <Banner {title} text="Body text under the title" />
{:else if name === 'title-and-children'}
  <Banner {title} {children} />
{:else if name === 'icon'}
  <Banner {icon} text="With a leading icon" />
{:else if name === 'right-content'}
  <Banner text="With right content" {rightContent} />
{:else if name === 'dismissible'}
  <Banner text="Dismissible banner" dismissible />
{:else if name === 'dismissible-custom-icon'}
  <Banner text="Custom dismiss icon" dismissible {dismissIcon} />
{:else if name === 'dismissible-test-id'}
  <Banner text="Test id" dismissible testId="b" />
{:else if name === 'all-slots'}
  <Banner {icon} {title} {children} {rightContent} dismissible />
{:else if name === 'clickable-cursor'}
  <Banner text="Clickable banner" onclick={log('onclick')} />
{:else if name === 'visible-false'}
  <Banner text="Hidden banner" visible={false} />
{:else if name === 'visible-bound'}
  <Banner text="Bound visible" bind:visible dismissible />
{:else if name === 'role-explicit'}
  <Banner text="Status banner" role="status" />
{:else if name === 'role-null-interactive'}
  <Banner text="Interactive" role={null} onclick={log('onclick')} />
{:else if name === 'classes'}
  <Banner text="With classes" classes="custom-banner" />
{:else if name === 'transition-duration'}
  <Banner text="Fast transition" transitionDuration={50} dismissible />
{:else if name === 'transition-duration-zero'}
  <Banner text="No transition" transitionDuration={0} dismissible />
{:else if name === 'css-custom-properties'}
  <div
    style="--banner-background: #fef3c7; --banner-color: #78350f; --banner-border-radius: 12px; --banner-padding: 16px 20px; --banner-font-size: 16px; --banner-link-color: #b45309; --banner-border: 1px solid #f59e0b; --banner-width: 90%; --banner-gap: 14px;"
  >
    <Banner {icon} text="Themed banner" linkText="Link" dismissible />
  </div>
{:else if name === 'css-custom-properties-dismiss'}
  <div
    style="--banner-dismiss-size: 20px; --banner-dismiss-color: #dc2626; --banner-dismiss-hover-background: #fee2e2; --banner-icon-size: 28px; --banner-icon-color: #2563eb; --banner-body-gap: 6px; --banner-title-font-weight: 700;"
  >
    <Banner {icon} {title} {children} dismissible />
  </div>
{:else if name === 'click-callback'}
  <Banner text="Click me" onclick={log('onclick')} />
{:else if name === 'click-keyboard-enter'}
  <Banner text="Press me" onclick={log('onclick')} />
{:else if name === 'click-keyboard-space'}
  <Banner text="Press me" onclick={log('onclick')} />
{:else if name === 'focus-ring'}
  <Banner text="Focus me" onclick={log('onclick')} />
{:else if name === 'dismiss-click'}
  <Banner
    text="Dismiss me"
    dismissible
    bind:visible
    ondismiss={log('ondismiss')}
    onclick={log('onclick')}
  />
{:else if name === 'dismiss-click-no-onclick'}
  <Banner text="Dismiss me" dismissible bind:visible ondismiss={log('ondismiss')} />
{:else if name === 'dismiss-keyboard'}
  <Banner text="Dismiss me" dismissible bind:visible ondismiss={log('ondismiss')} />
{:else if name === 'dismiss-hover'}
  <Banner text="Hover dismiss" dismissible />
{:else if name === 'link-click-bubbles'}
  <Banner text="Go" linkText="Link" onclick={log('onclick')} />
{:else if name === 'toggle-visible'}
  <button id="t" onclick={() => (visible = !visible)}>toggle</button><Banner
    text="Toggled"
    bind:visible
  />
{/if}
