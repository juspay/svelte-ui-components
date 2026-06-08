<script lang="ts">
  import Tabs from '$lib/Tabs/Tabs.svelte';

  let activeTab = $state(0);
  let activeOverflow = $state(0);
  let activeWorkspace = $state(0);
  let activeSegmented = $state(0);
  let activeSegmentedKey = $state('month');

  const manyTabs = Array.from({ length: 20 }, (_, i) => `Tab ${i + 1}`);

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

<div class="demo-row" style="flex-direction: column; max-width: 500px;">
  <Tabs
    items={['Overview', 'Details', 'Reviews', 'Settings']}
    activeIndex={activeTab}
    onchange={(index) => (activeTab = index)}
  />
  <p class="state-display">Active tab: {activeTab}</p>
</div>

<h3 style="margin: 24px 0 12px; font-size: 1.1rem; color: #374151;">
  Custom tab snippet (workspace-style)
</h3>
<div class="demo-row" style="flex-direction: column; max-width: 600px;">
  <Tabs
    items={workspaceFiles.map((f) => f.name)}
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
          onmouseenter={(e) => {
            if (e.currentTarget instanceof HTMLElement) {
              e.currentTarget.style.opacity = '1';
            }
          }}
          onmouseleave={(e) => {
            if (e.currentTarget instanceof HTMLElement) {
              e.currentTarget.style.opacity = '0.5';
            }
          }}
          onclick={(e) => {
            e.stopPropagation();
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

<h3 style="margin: 24px 0 12px; font-size: 1.1rem; color: #374151;">Overflow (scrollable)</h3>
<div class="demo-row" style="flex-direction: column; max-width: 500px;">
  <Tabs
    items={manyTabs}
    activeIndex={activeOverflow}
    onchange={(index) => (activeOverflow = index)}
  />
  <p class="state-display">Active tab: {activeOverflow}</p>
</div>

<h3 style="margin: 24px 0 12px; font-size: 1.1rem; color: #374151;">
  Segmented variant (pill group)
</h3>
<div class="demo-row" style="flex-direction: column; max-width: 420px;">
  <Tabs
    items={['Day', 'Week', 'Month', 'Year']}
    variant="segmented"
    activeIndex={activeSegmented}
    onchange={(index) => (activeSegmented = index)}
  />
  <p class="state-display">Active index: {activeSegmented}</p>
</div>

<h3 style="margin: 24px 0 12px; font-size: 1.1rem; color: #374151;">
  Segmented variant — key-based items
</h3>
<div class="demo-row" style="flex-direction: column; max-width: 420px;">
  <Tabs
    items={[
      { key: 'day', label: 'Today' },
      { key: 'week', label: 'This Week' },
      { key: 'month', label: 'This Month' }
    ]}
    variant="segmented"
    activeKey={activeSegmentedKey}
    onkeychange={(key) => (activeSegmentedKey = key)}
  />
  <p class="state-display">Active key: {activeSegmentedKey}</p>
</div>
