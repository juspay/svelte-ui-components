<script lang="ts">
  import Tabs from '$lib/Tabs/Tabs.svelte';

  let activeTab = $state(0);
  let activeOverflow = $state(0);
  let activeWorkspace = $state(0);
  let activeSlowTab = $state(0);

  const manyTabs = Array.from({ length: 20 }, (_, i) => `Tab ${i + 1}`);

  let activeNav = $state('cart-design');

  const gearIcon =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"/></svg>'
    );

  const navItems = [
    {
      key: 'cart-design',
      label: 'Cart Design',
      icon: gearIcon,
      status: 'default' as const,
      sectionLabel: 'SETTINGS'
    },
    { key: 'general', label: 'General', icon: gearIcon, status: 'none' as const },
    {
      key: 'scarcity-timer',
      label: 'Scarcity Timer',
      icon: gearIcon,
      status: 'pending' as const,
      sectionLabel: 'BODY'
    },
    { key: 'free-gift', label: 'Free Gift', icon: gearIcon, status: 'error' as const },
    { key: 'upsell', label: 'One-Tick Upsell', icon: gearIcon, status: 'success' as const }
  ];

  let workspaceFiles = $state([
    { name: 'index.ts', dirty: true },
    { name: 'App.svelte', dirty: false },
    { name: 'styles.css', dirty: true },
    { name: 'utils.ts', dirty: false }
  ]);

  function closeFile(index: number) {
    workspaceFiles.splice(index, 1);
    if (activeWorkspace >= workspaceFiles.length) {
      activeWorkspace = Math.max(0, workspaceFiles.length - 1);
    }
  }
</script>

<div class="page-header">
  <span class="category-badge">Navigation</span>
  <h1>Tabs</h1>
</div>

<h3 class="demo-heading">Default (slide indicator)</h3>
<p class="demo-caption">
  A single indicator element slides between tabs. Controlled via
  <code>--tabs-indicator-transition</code>.
</p>
<div class="demo-row" style="flex-direction: column; max-width: 500px;">
  <Tabs
    items={['Overview', 'Details', 'Reviews', 'Settings']}
    activeIndex={activeTab}
    onchange={(index) => (activeTab = index)}
  />
  <p class="state-display">Active tab: {activeTab}</p>
</div>

<h3 class="demo-heading">Custom tab snippet (workspace-style)</h3>
<div class="demo-row" style="flex-direction: column; max-width: 600px;">
  <Tabs
    items={workspaceFiles.map((file) => file.name)}
    activeIndex={activeWorkspace}
    onchange={(index) => (activeWorkspace = index)}
  >
    {#snippet tab({ label, index, active })}
      <span style="display: flex; align-items: center; gap: 6px;">
        {#if workspaceFiles[index]?.dirty}
          <span
            style="width: 6px; height: 6px; border-radius: 50%; background: {active
              ? '#1a73e8'
              : '#999'}; flex-shrink: 0;"
          ></span>
        {/if}
        <span>{label}</span>
        <button
          style="all: unset; cursor: pointer; font-size: 12px; line-height: 1; padding: 2px; border-radius: 3px; color: inherit; opacity: 0.5;"
          onmouseenter={(event) => {
            if (event.currentTarget instanceof HTMLElement) {
              event.currentTarget.style.opacity = '1';
            }
          }}
          onmouseleave={(event) => {
            if (event.currentTarget instanceof HTMLElement) {
              event.currentTarget.style.opacity = '0.5';
            }
          }}
          onclick={(event) => {
            event.stopPropagation();
            closeFile(index);
          }}
          aria-label="Close {label}"
        >
          ✕
        </button>
      </span>
    {/snippet}
  </Tabs>
  <p class="state-display">Active file: {workspaceFiles[activeWorkspace]?.name ?? 'none'}</p>
</div>

<h3 class="demo-heading">Slow transition (custom --tabs-indicator-transition)</h3>
<p class="demo-caption">
  Override <code>--tabs-indicator-transition</code> to any CSS transition value. Default is
  <code>left 0.3s ease, width 0.3s ease</code>.
</p>
<div
  class="demo-row"
  style="flex-direction: column; max-width: 500px; --tabs-indicator-transition: left 0.8s cubic-bezier(0.34,1.56,0.64,1), width 0.8s cubic-bezier(0.34,1.56,0.64,1);"
>
  <Tabs
    items={['Alpha', 'Beta', 'Gamma', 'Delta']}
    activeIndex={activeSlowTab}
    onchange={(index) => (activeSlowTab = index)}
  />
  <p class="state-display">Active tab: {activeSlowTab}</p>
</div>

<h3 class="demo-heading">Overflow (scrollable)</h3>
<p class="demo-caption">
  Overflowing edges fade out through a mask that holds fully transparent for
  <code>--tabs-fade-solid</code> (8px) before ramping over <code>--tabs-fade-size</code> (32px), so no
  clipped glyph fragment stays perceptible beside the scroll arrows.
</p>
<div class="demo-row" style="flex-direction: column; max-width: 500px;">
  <Tabs
    items={manyTabs}
    activeIndex={activeOverflow}
    testId="tabs-overflow-demo"
    onchange={(index) => (activeOverflow = index)}
  />
  <p class="state-display">Active tab: {activeOverflow}</p>
</div>

<h3 class="demo-heading">Vertical orientation (nav / menu rail)</h3>
<p class="demo-caption">
  <code>orientation="vertical"</code> stacks items in a column with the indicator on the leading
  edge. Items support per-item <code>icon</code>, a trailing <code>status</code> dot (<code
    >default</code
  >
  blue / <code>pending</code> amber / <code>error</code> red /
  <code>success</code> green) and an optional <code>sectionLabel</code> group header.
</p>
<div class="demo-row" style="max-width: 260px;">
  <Tabs
    orientation="vertical"
    items={navItems}
    activeKey={activeNav}
    testId="tabs-vertical-demo"
    onkeychange={(key) => (activeNav = key)}
  />
  <p class="state-display">Active: {activeNav}</p>
</div>

<style>
  .demo-heading {
    margin: 24px 0 8px;
  }

  .demo-caption {
    margin: 0 0 12px;
    color: #666;
  }
</style>
