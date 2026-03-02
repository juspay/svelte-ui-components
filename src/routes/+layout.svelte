<script lang="ts">
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { componentNav } from './components/_nav';
  import ThemeSwitcher from '$lib/ThemeSwitcher/ThemeSwitcher.svelte';
  import type { Snippet } from 'svelte';
  import './components/demo.css';

  let { children }: { children: Snippet } = $props();

  let currentPath = $derived($page.url.pathname);
  let search = $state('');
  let searchLower = $derived(search.toLowerCase());

  let filteredNav = $derived(
    componentNav
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.name.toLowerCase().includes(searchLower))
      }))
      .filter((group) => group.items.length > 0)
  );

  function handleThemeChange(_value: string, resolved: string): void {
    document.documentElement.dataset.theme = resolved;
  }
</script>

<svelte:head>
  <link
    href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="app-layout">
  <aside class="sidebar">
    <div class="sidebar-header">
      <h1 class="site-title">Svelte UI</h1>
      <div class="theme-switcher-slot">
        <ThemeSwitcher mode="segment" onchange={handleThemeChange} />
      </div>
    </div>
    <div class="sidebar-search">
      <input
        type="text"
        placeholder="Search components..."
        bind:value={search}
        class="search-input"
      />
    </div>
    <nav class="sidebar-nav">
      {#each filteredNav as group (group.category)}
        <div class="nav-group">
          <span class="nav-group-label">{group.category}</span>
          {#each group.items as item (item.slug)}
            <a
              href="{base}/components/{item.slug}"
              class="nav-link"
              class:active={currentPath === `/components/${item.slug}`}
            >
              {item.name}
            </a>
          {/each}
        </div>
      {/each}
    </nav>
  </aside>
  <main class="content">
    {@render children()}
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Nunito Sans', sans-serif;
    background: var(--doc-bg);
    color: var(--doc-text-primary);
    transition:
      background 0.2s,
      color 0.2s;
  }

  .app-layout {
    display: grid;
    grid-template-columns: 260px 1fr;
    min-height: 100vh;
  }

  .sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
    border-right: 1px solid var(--doc-border);
    background: var(--doc-sidebar-bg);
    transition:
      background 0.2s,
      border-color 0.2s;
  }

  .sidebar-header {
    padding: 20px 16px 12px;
    border-bottom: 1px solid var(--doc-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .site-title {
    font-size: 1.15rem;
    font-weight: 800;
    margin: 0;
    color: var(--doc-text-heading);
    white-space: nowrap;
  }

  .theme-switcher-slot {
    flex-shrink: 0;
  }

  .sidebar-search {
    padding: 12px 16px 0;
  }

  .search-input {
    width: 100%;
    padding: 8px 12px;
    font-size: 13px;
    font-family: inherit;
    border: 1px solid var(--doc-border);
    border-radius: 6px;
    background: var(--doc-input-bg);
    color: var(--doc-text-primary);
    outline: none;
    box-sizing: border-box;
    transition:
      border-color 0.15s,
      background 0.2s;
  }

  .search-input:focus {
    border-color: var(--doc-accent);
  }

  .search-input::placeholder {
    color: var(--doc-text-faint);
  }

  .sidebar-nav {
    padding: 12px 0;
  }

  .nav-group {
    margin-bottom: 4px;
  }

  .nav-group-label {
    display: block;
    padding: 8px 16px 4px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--doc-text-faint);
  }

  .nav-link {
    display: block;
    padding: 6px 16px 6px 24px;
    font-size: 13.5px;
    color: var(--doc-text-primary);
    text-decoration: none;
    border-left: 3px solid transparent;
    transition:
      background 0.15s,
      border-color 0.15s,
      color 0.15s;
  }

  .nav-link:hover {
    background: var(--doc-accent-hover-bg);
  }

  .nav-link.active {
    background: var(--doc-accent-bg);
    border-left-color: var(--doc-accent);
    color: var(--doc-accent);
    font-weight: 600;
  }

  .content {
    padding: 32px 40px;
    max-width: 900px;
  }
</style>
