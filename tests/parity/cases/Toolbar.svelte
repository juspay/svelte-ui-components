<script module>
  const W = ['wait', 100];
  export const cases = [
    { name: 'default', actions: [W] },
    { name: 'text', actions: [W] },
    { name: 'text-long', actions: [W] },
    { name: 'no-back-button', actions: [W] },
    { name: 'back-icon-null', actions: [W] },
    { name: 'back-icon-empty', actions: [W] },
    { name: 'back-icon-custom', actions: [W] },
    { name: 'back-label', actions: [W] },
    { name: 'back-href', actions: [W] },
    { name: 'title', actions: [W] },
    { name: 'title-heading-1', actions: [W] },
    { name: 'title-heading-2', actions: [W] },
    { name: 'title-heading-3-subtitle', actions: [W] },
    { name: 'title-subtitle-plain', actions: [W] },
    { name: 'subtitle-without-title', actions: [W] },
    { name: 'title-beats-text', actions: [W] },
    { name: 'left-content', actions: [W] },
    { name: 'center-content', actions: [W] },
    { name: 'center-beats-title', actions: [W] },
    { name: 'right-content', actions: [W] },
    { name: 'additional-content', actions: [W] },
    { name: 'all-slots', actions: [W] },
    { name: 'right-and-additional-title', actions: [W] },
    { name: 'root-tag-header', actions: [W] },
    { name: 'root-tag-nav', actions: [W] },
    { name: 'variant-page-header', actions: [W] },
    { name: 'variant-page-header-wraps', actions: [W] },
    { name: 'variant-page-header-themed-root', actions: [W] },
    { name: 'classes', actions: [W] },
    { name: 'test-ids', actions: [W] },
    { name: 'back-click', actions: [W, ['click', '.back'], W] },
    { name: 'back-keyboard-enter', actions: [W, ['focus', '.back'], ['key', 'Enter'], W] },
    { name: 'back-keyboard-space', actions: [W, ['focus', '.back'], ['key', ' '], W] },
    { name: 'back-href-keyboard-space', actions: [W, ['focus', '.back'], ['key', ' '], W] },
    { name: 'back-href-click', actions: [W, ['click', '.back'], W] },
    { name: 'back-focus-ring', actions: [W, ['key', 'Tab']] },
    { name: 'back-hover', actions: [W, ['hover', '.back']] },
    { name: 'css-custom-properties', actions: [W] },
    { name: 'css-custom-properties-titles', actions: [W] }
  ];
</script>

<script>
  import { Toolbar } from 'sui-under-test';
  import { log, svg } from './_kit.js';
  let { name } = $props();

  const long =
    'A very long toolbar title that has to wrap because it is far wider than the viewport allows';
</script>

{#snippet leftContent()}
  <span style="padding: 12px; font-family: sans-serif;">Left</span>
{/snippet}

{#snippet centerContent()}
  <span style="flex: 1; padding: 12px; font-family: sans-serif;">Center content</span>
{/snippet}

{#snippet rightContent()}
  <button type="button" style="margin: 8px;" onclick={log('onright')}>Action</button>
{/snippet}

{#snippet additionalContent()}
  <div style="padding: 8px 14px; font-family: sans-serif; font-size: 13px;">Additional row</div>
{/snippet}

{#if name === 'default'}
  <Toolbar />
{:else if name === 'text'}
  <Toolbar text="Checkout" />
{:else if name === 'text-long'}
  <Toolbar text={long} />
{:else if name === 'no-back-button'}
  <Toolbar showBackButton={false} text="No back" />
{:else if name === 'back-icon-null'}
  <Toolbar backIcon={null} text="Null icon" />
{:else if name === 'back-icon-empty'}
  <Toolbar backIcon="" text="Empty icon" />
{:else if name === 'back-icon-custom'}
  <Toolbar backIcon={svg} text="Custom icon" />
{:else if name === 'back-label'}
  <Toolbar backLabel="Go back" text="Labelled" />
{:else if name === 'back-href'}
  <Toolbar backHref="#previous" text="Link back" onbackclick={log('onbackclick')} />
{:else if name === 'title'}
  <Toolbar title="Page title" />
{:else if name === 'title-heading-1'}
  <Toolbar title="Heading level 1" headingLevel={1} />
{:else if name === 'title-heading-2'}
  <Toolbar title="Heading level 2" headingLevel={2} />
{:else if name === 'title-heading-3-subtitle'}
  <Toolbar title="Heading level 3" headingLevel={3} subtitle="A supporting subtitle" />
{:else if name === 'title-subtitle-plain'}
  <Toolbar title="Plain title" subtitle="Subtitle without heading level" />
{:else if name === 'subtitle-without-title'}
  <Toolbar subtitle="Orphan subtitle" text="Text wins" />
{:else if name === 'title-beats-text'}
  <Toolbar title="Title wins" text="Text loses" />
{:else if name === 'left-content'}
  <Toolbar {leftContent} text="Custom left" />
{:else if name === 'center-content'}
  <Toolbar {centerContent} />
{:else if name === 'center-beats-title'}
  <Toolbar {centerContent} title="Hidden title" text="Hidden text" />
{:else if name === 'right-content'}
  <Toolbar text="With actions" {rightContent} />
{:else if name === 'additional-content'}
  <Toolbar text="With additional" {additionalContent} />
{:else if name === 'all-slots'}
  <Toolbar {leftContent} {centerContent} {rightContent} {additionalContent} />
{:else if name === 'right-and-additional-title'}
  <Toolbar
    title="Settings"
    subtitle="Manage account"
    headingLevel={1}
    {rightContent}
    {additionalContent}
  />
{:else if name === 'root-tag-header'}
  <Toolbar rootTag="header" text="Header tag" />
{:else if name === 'root-tag-nav'}
  <Toolbar rootTag="nav" text="Nav tag" />
{:else if name === 'variant-page-header'}
  <div style="padding: 16px; width: 388px;">
    <Toolbar
      variant="page-header"
      title="Page header"
      subtitle="In flow"
      headingLevel={1}
      {rightContent}
    />
    <p style="font-family: sans-serif;">Content following the header.</p>
  </div>
{:else if name === 'variant-page-header-wraps'}
  <div style="padding: 16px; width: 200px;">
    <Toolbar variant="page-header" title="A long page header title" {rightContent} />
  </div>
{:else if name === 'variant-page-header-themed-root'}
  <div
    style="--toolbar-background: #fde68a; --toolbar-position: fixed; --toolbar-box-shadow: 0 4px 0 #b45309; padding: 16px; width: 388px;"
  >
    <Toolbar variant="page-header" title="Not leaked" />
  </div>
{:else if name === 'classes'}
  <Toolbar classes="custom-toolbar" text="With classes" />
{:else if name === 'test-ids'}
  <Toolbar testId="tb" headingTestId="tb-heading" text="Test ids" />
{:else if name === 'back-click'}
  <Toolbar text="Click back" onbackclick={log('onbackclick')} />
{:else if name === 'back-keyboard-enter'}
  <Toolbar text="Key back" onbackclick={log('onbackclick')} onkeydown={log('onkeydown')} />
{:else if name === 'back-keyboard-space'}
  <Toolbar text="Key back" onbackclick={log('onbackclick')} onkeydown={log('onkeydown')} />
{:else if name === 'back-href-keyboard-space'}
  <Toolbar
    backHref="#previous"
    text="Key back"
    onbackclick={log('onbackclick')}
    onkeydown={log('onkeydown')}
  />
{:else if name === 'back-href-click'}
  <Toolbar backHref="#previous" text="Key back" onbackclick={log('onbackclick')} />
{:else if name === 'back-focus-ring'}
  <Toolbar text="Focus" />
{:else if name === 'back-hover'}
  <Toolbar text="Hover" />
{:else if name === 'css-custom-properties'}
  <div
    style="--toolbar-background: #1e293b; --toolbar-text-color: #f8fafc; --toolbar-back-icon-color: #fbbf24; --toolbar-padding: 6px 10px; --toolbar-box-shadow: 0 6px 0 #0f172a; --toolbar-text-font-size: 22px; --toolbar-back-button-padding: 10px; --toolbar-height: 80px; --toolbar-border-radius: 0 0 16px 16px;"
  >
    <Toolbar text="Themed toolbar" {rightContent} />
  </div>
{:else if name === 'css-custom-properties-titles'}
  <div
    style="--toolbar-titles-gap: 12px; --toolbar-subtitle-color: #b91c1c; --toolbar-content-padding: 8px 12px; --toolbar-content-column-gap: 16px; --toolbar-justify-content: space-between;"
  >
    <Toolbar title="Title" subtitle="Subtitle" headingLevel={2} {rightContent} />
  </div>
{/if}
