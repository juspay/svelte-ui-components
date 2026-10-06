<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import Menu from '$lib/Menu/Menu.svelte';

  const svgIcon =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Ccircle cx="12" cy="12" r="8" fill="currentColor"/%3E%3C/svg%3E';
  const transformIconSvg = (svg: string): string =>
    svg.replace('<svg', '<svg data-transformed="true"');
</script>

<div class="page-header">
  <span class="category-badge">Overlays</span>
  <h1>Menu</h1>
</div>

<p>
  Every trigger below is one Tab stop. Examples that render a <code>Button</code> set
  <code>interactiveTrigger</code> and spread the wiring onto it; the last example shows a wrapper-owned
  trigger for content that is not itself interactive.
</p>

<div class="demo-row">
  <Menu
    items={[
      { label: 'Edit', value: 'edit' },
      { label: 'Duplicate', value: 'duplicate' },
      { label: 'Archive', value: 'archive', separator: true },
      { label: 'Delete', value: 'delete', danger: true }
    ]}
    testId="menu-default-demo"
    interactiveTrigger
    onselect={(item) => alert(`Selected: ${item.label}`)}
  >
    {#snippet trigger(props)}
      <Button {...props} text="Actions Menu" testId="menu-default-demo-trigger" />
    {/snippet}
  </Menu>

  <Menu
    items={[
      { label: 'Edit', value: 'edit' },
      { label: 'Duplicate', value: 'duplicate' },
      { label: 'Delete', value: 'delete', danger: true }
    ]}
    placement="bottom-right"
    testId="menu-bottom-right-demo"
    interactiveTrigger
  >
    {#snippet trigger(props)}
      <Button {...props} text="Bottom-right" testId="menu-bottom-right-demo-trigger" />
    {/snippet}
  </Menu>

  <Menu
    items={[
      { label: 'Edit', value: 'edit' },
      { label: 'Duplicate', value: 'duplicate' },
      { label: 'Delete', value: 'delete', danger: true }
    ]}
    placement="auto"
    testId="menu-auto-roomy-demo"
    interactiveTrigger
  >
    {#snippet trigger(props)}
      <Button {...props} text="Auto (roomy)" testId="menu-auto-roomy-demo-trigger" />
    {/snippet}
  </Menu>
</div>

<h3>SVG icon transforms</h3>
<div class="demo-row">
  <Menu
    testId="menu-transform-svg"
    items={[{ label: 'Transformed icon', value: 'transformed', icon: svgIcon }]}
    transformSvg={transformIconSvg}
    interactiveTrigger
  >
    {#snippet trigger(props)}
      <Button {...props} text="Transformed icon" testId="menu-transform-svg-trigger" />
    {/snippet}
  </Menu>
</div>

<!-- placement="auto" — the trigger is pinned to the bottom-right viewport corner,
     so the resolved corner must flip to top-right to stay inside the viewport. -->
<div class="corner-pinned-demo">
  <Menu
    items={[
      { label: 'Edit', value: 'edit' },
      { label: 'Duplicate', value: 'duplicate' },
      { label: 'Archive', value: 'archive', separator: true },
      { label: 'Delete', value: 'delete', danger: true }
    ]}
    placement="auto"
    testId="menu-auto-corner-demo"
    interactiveTrigger
  >
    {#snippet trigger(props)}
      <Button {...props} text="Auto (corner)" testId="menu-auto-corner-demo-trigger" />
    {/snippet}
  </Menu>
</div>

<h3>usePortal — escape a clipping container</h3>
<p>
  Inside an <code>overflow: hidden</code> ancestor (like a table cell), the default in-flow panel is
  clipped. Set <code>usePortal</code> to portal the panel to <code>&lt;body&gt;</code> and position
  it
  <code>fixed</code> at the resolved corner so it renders in full.
</p>
<div class="overflow-demo-grid">
  <div class="clipper" data-pw="menu-inflow-clipper">
    <span class="clipper-label">Default (clipped)</span>
    <Menu
      items={[
        { label: 'Edit', value: 'edit' },
        { label: 'Duplicate', value: 'duplicate' },
        { label: 'Archive', value: 'archive', separator: true },
        { label: 'Delete', value: 'delete', danger: true }
      ]}
      testId="menu-inflow-demo"
      interactiveTrigger
    >
      {#snippet trigger(props)}
        <Button {...props} text="In-flow" testId="menu-inflow-demo-trigger" />
      {/snippet}
    </Menu>
  </div>
  <div class="clipper" data-pw="menu-portal-clipper">
    <span class="clipper-label">usePortal (escapes)</span>
    <Menu
      items={[
        { label: 'Edit', value: 'edit' },
        { label: 'Duplicate', value: 'duplicate' },
        { label: 'Archive', value: 'archive', separator: true },
        { label: 'Delete', value: 'delete', danger: true }
      ]}
      usePortal
      testId="menu-portal-demo"
      interactiveTrigger
    >
      {#snippet trigger(props)}
        <Button {...props} text="Portaled" testId="menu-portal-demo-trigger" />
      {/snippet}
    </Menu>
  </div>
</div>

<h3>selectedValue — themed selected item</h3>
<div class="demo-row">
  <Menu
    testId="menu-selected-demo"
    items={[
      { label: 'Newest first', value: 'new' },
      { label: 'Oldest first', value: 'old' }
    ]}
    selectedValue="old"
    classes="menu-selected-themed"
    interactiveTrigger
  >
    {#snippet trigger(props)}
      <Button {...props} text="Sort (themed selection)" testId="menu-selected-demo-trigger" />
    {/snippet}
  </Menu>
</div>

<h3>interactiveTrigger — trigger is its own control</h3>
<p>
  By default Menu wraps the trigger in a <code>role="button" tabindex="0"</code> div. When the
  snippet renders a real control, set <code>interactiveTrigger</code> and spread the wiring Menu
  hands the snippet onto that control — one Tab stop instead of two, and no interactive element
  nested inside another. Every example above that renders a <code>Button</code> does this.
</p>
<div class="demo-row">
  <Menu
    testId="menu-interactive-trigger"
    interactiveTrigger
    items={[
      { label: 'Newest first', value: 'new' },
      { label: 'Oldest first', value: 'old' }
    ]}
  >
    {#snippet trigger(props)}
      <Button {...props} text="Sort" testId="menu-interactive-trigger-button" />
    {/snippet}
  </Menu>
</div>

<h3>Wrapper-owned trigger — non-interactive content</h3>
<p>
  When the snippet renders no control of its own (an icon, a glyph, plain text), leave
  <code>interactiveTrigger</code> off. The wrapper is then the one interactive element: a single Tab
  stop that handles Enter, Space and the arrow keys. It has no visible text here, so
  <code>triggerAriaLabel</code> names it.
</p>
<div class="demo-row">
  <Menu
    testId="menu-wrapper-owned-demo"
    triggerAriaLabel="More options"
    items={[
      { label: 'Rename', value: 'rename' },
      { label: 'Share', value: 'share' },
      { label: 'Remove', value: 'remove', danger: true }
    ]}
  >
    {#snippet trigger()}
      <span class="glyph-trigger" aria-hidden="true">&#8943;</span>
    {/snippet}
  </Menu>
</div>

<style>
  .corner-pinned-demo {
    position: fixed;
    right: 16px;
    bottom: 16px;
  }

  /* Small, fixed-height, overflow-clipping boxes to contrast the in-flow and
     portaled dropdown. */
  .overflow-demo-grid {
    display: flex;
    gap: 32px;
    flex-wrap: wrap;
    margin-top: 16px;
  }

  .clipper {
    width: 220px;
    height: 90px;
    overflow: hidden;
    border: 1px dashed #bbb;
    border-radius: 6px;
    padding: 12px;
  }

  .clipper-label {
    display: block;
    margin-bottom: 8px;
    font-size: 12px;
    color: var(--doc-text-muted, #888);
  }

  .glyph-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid var(--doc-border, #d0d7de);
    border-radius: 6px;
    font-size: 20px;
    line-height: 1;
    user-select: none;
  }

  :global(.menu-selected-themed) {
    --menu-item-selected-background-color: rgb(220, 235, 255);
    --menu-item-selected-color: rgb(10, 60, 160);
  }
</style>
