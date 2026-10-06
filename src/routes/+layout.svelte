<script lang="ts">
  import { page } from '$app/stores';
  import { afterNavigate } from '$app/navigation';
  import { base } from '$app/paths';
  import { componentNav } from './components/_nav';
  import { routeName, routeTitle } from './components/_titles';
  import { scrollRegions } from './components/_scroll-regions';
  import ThemeSwitcher from '$lib/ThemeSwitcher/ThemeSwitcher.svelte';
  import { onMount, tick, type Snippet } from 'svelte';
  // The library's own dark theme. These used to live in demo.css, which made
  // the docs app the only place that knew how to render this library on a dark
  // page -- every other consumer of ThemeSwitcher got light components on a
  // dark ground. It is library knowledge, so it now ships with the library and
  // this app imports it like anyone else would.
  import '$lib/styles/theme-dark.css';
  import './components/demo.css';

  let { children }: { children: Snippet } = $props();

  // The route id, not the URL: it carries no `paths.base`, which the URL does on
  // Pages, so the current link is marked there too.
  let routeId = $derived($page.route.id);
  // One title per route, derived from the same inventory as the sidebar. It is a
  // reactive derivation of the route, so it is in the prerendered HTML on a direct
  // load and updates on client-side navigation without any per-page code.
  let pageTitle = $derived(routeTitle(routeId));
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

  /*
   * Below this width the sidebar becomes an off-canvas drawer behind a menu
   * button. It must equal the `max-width` in the stylesheet below: that rule
   * decides how the shell LOOKS (so the prerendered HTML is already right with no
   * script), this query decides whether the drawer's open state is in effect.
   */
  const COMPACT_QUERY = '(max-width: 1023.98px)';

  let compact = $state(false);
  let navRequested = $state(false);
  // The drawer can only be open in the compact layout: widening the window turns
  // the same element back into the persistent sidebar, with nothing left inert.
  let drawerOpen = $derived(compact && navRequested);
  let menuButton: HTMLButtonElement | null = $state(null);
  let closeButton: HTMLButtonElement | null = $state(null);

  // Wide blocks scroll in labelled, keyboard-reachable regions instead of
  // widening the document; see _scroll-regions.ts for which and why.
  let scrollOptions = $derived({
    context: routeName(routeId) ?? 'Svelte UI',
    demoRows: true
  });

  /*
   * `inert` on the page behind the drawer stops Tab, clicks and assistive
   * technology reaching it; it does not stop the wheel scrolling the document
   * underneath the scrim, so that is locked as well.
   */
  function lockPageScroll(locked: boolean): void {
    document.documentElement.style.overflow = locked ? 'hidden' : '';
  }

  async function openNav(): Promise<void> {
    navRequested = true;
    lockPageScroll(true);
    await tick();
    closeButton?.focus();
  }

  async function closeNav(returnFocus: boolean): Promise<void> {
    if (!navRequested) {
      return;
    }
    navRequested = false;
    lockPageScroll(false);
    if (returnFocus) {
      // After the flush, so the menu button is no longer inert when focused.
      await tick();
      menuButton?.focus();
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && drawerOpen && !event.defaultPrevented) {
      event.preventDefault();
      void closeNav(true);
    }
  }

  // Choosing a destination, or the browser's back/forward button, ends the
  // drawer. Focus is not returned to the menu button: SvelteKit resets it for the
  // new page, which is what a screen-reader user navigating expects.
  afterNavigate(() => {
    void closeNav(false);
  });

  /*
   * Marks the document once the app is interactive, for the Playwright suite.
   *
   * Every demo page is server-rendered, so a control exists and passes all of
   * Playwright's actionability checks -- visible, stable, enabled, receiving
   * events -- while the page is still inert. Playwright has no way to check
   * that a listener is attached, so a click that arrives before hydration is
   * delivered to dead markup and silently does nothing; the assertion that
   * follows then fails as a timeout with no clue as to why. Under load, with
   * `video`/`trace` recording on every test, that window is wide enough to hit.
   *
   * A parent's onMount runs after its children have mounted, so the root layout
   * setting this is the app as a whole reporting that it is ready.
   */
  onMount(() => {
    const query = window.matchMedia(COMPACT_QUERY);
    compact = query.matches;
    const handleBreakpoint = (event: MediaQueryListEvent): void => {
      compact = event.matches;
      if (!event.matches) {
        void closeNav(false);
      }
    };
    query.addEventListener('change', handleBreakpoint);
    document.documentElement.dataset.hydrated = 'true';
    return () => {
      query.removeEventListener('change', handleBreakpoint);
      lockPageScroll(false);
    };
  });

  function handleThemeChange(_value: string, resolved: string): void {
    document.documentElement.dataset.theme = resolved;
  }
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <link href={`${base}/fonts/nunito-sans/fonts.css`} rel="stylesheet" />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="app-layout">
  <header class="topbar" data-pw="app-topbar" inert={drawerOpen}>
    <button
      bind:this={menuButton}
      type="button"
      class="icon-button"
      aria-label="Navigation menu"
      aria-expanded={drawerOpen}
      aria-controls="app-sidebar"
      onclick={openNav}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
        <path
          d="M4 6h16M4 12h16M4 18h16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </button>
    <span class="topbar-title">Svelte UI</span>
  </header>
  <aside id="app-sidebar" class="sidebar" class:open={drawerOpen} data-pw="app-sidebar">
    <div class="sidebar-header">
      <h1 class="site-title">Svelte UI</h1>
      <button
        bind:this={closeButton}
        type="button"
        class="icon-button close-button"
        aria-label="Close navigation menu"
        onclick={() => closeNav(true)}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
          <path
            d="M6 6l12 12M18 6L6 18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>
      <div class="theme-switcher-slot">
        <ThemeSwitcher mode="segment" onchange={handleThemeChange} />
      </div>
    </div>
    <div class="sidebar-search">
      <input
        type="text"
        placeholder="Search components..."
        aria-label="Search components"
        bind:value={search}
        class="search-input"
      />
    </div>
    <nav class="sidebar-nav" aria-label="Components">
      {#each filteredNav as group (group.category)}
        <div class="nav-group">
          <span class="nav-group-label">{group.category}</span>
          {#each group.items as item (item.slug)}
            <a
              href="{base}/components/{item.slug}"
              class="nav-link"
              class:active={routeId === `/components/${item.slug}`}
              aria-current={routeId === `/components/${item.slug}` ? 'page' : null}
            >
              {item.name}
            </a>
          {/each}
        </div>
      {/each}
    </nav>
  </aside>
  {#if drawerOpen}
    <!-- The pointer's target only. The close button and Escape are the keyboard
         and screen-reader routes, so this is hidden from both rather than being a
         second control with the same name. -->
    <button
      type="button"
      class="scrim"
      tabindex="-1"
      aria-hidden="true"
      onclick={() => closeNav(true)}
    ></button>
  {/if}
  <main class="content" data-pw="app-main" inert={drawerOpen} use:scrollRegions={scrollOptions}>
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
    /* minmax(0, 1fr) rather than 1fr: a grid track's automatic minimum is its
       content's min-content width, so a wide code block or prop table widens the
       track instead of scrolling inside it, and the whole page scrolls sideways. */
    grid-template-columns: 260px minmax(0, 1fr);
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
    color: var(--doc-accent-text);
    font-weight: 600;
  }

  .content {
    box-sizing: border-box;
    padding: 32px 40px;
    max-width: 900px;
  }

  .icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 1px solid var(--doc-btn-border);
    border-radius: 8px;
    background: var(--doc-btn-bg);
    color: var(--doc-text-primary);
    cursor: pointer;
  }

  .icon-button:hover {
    background: var(--doc-btn-hover-bg);
  }

  .icon-button:focus-visible {
    outline: 2px solid var(--doc-accent);
    outline-offset: 2px;
  }

  /* Present only in the compact layout, below. This must come AFTER the
     `.icon-button` rule: the close button is an `.icon-button` too, and at equal
     specificity the later `display` wins -- declared first, it stayed visible in
     the desktop sidebar and pushed the theme switcher 22px past its edge. */
  .topbar,
  .close-button,
  .scrim {
    display: none;
  }

  /*
   * Compact layout. Keep the max-width equal to COMPACT_QUERY in the script.
   *
   * The sidebar is the same element at every width: a persistent column above,
   * an off-canvas drawer here. It is hidden with `visibility`, not `display`, so
   * the slide can animate while a closed drawer stays out of the Tab order and the
   * accessibility tree -- its links must not be focusable behind the page.
   */
  @media (max-width: 1023.98px) {
    :global(html) {
      /* Anchor jumps (the docs' own `#props` links) would otherwise land under
         the sticky top bar. */
      scroll-padding-top: 72px;
    }

    /* A block, not a grid: a sticky grid item is confined to its own grid area,
       so the top bar would scroll away with the first row. */
    .app-layout {
      display: block;
    }

    .topbar {
      display: flex;
      align-items: center;
      gap: 12px;
      position: sticky;
      top: 0;
      z-index: 30;
      box-sizing: border-box;
      padding: 8px 12px;
      border-bottom: 1px solid var(--doc-border);
      background: var(--doc-bg);
    }

    .topbar-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--doc-text-heading);
      white-space: nowrap;
    }

    .sidebar {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: 50;
      width: min(320px, 85vw);
      height: 100vh;
      height: 100dvh;
      overscroll-behavior: contain;
      transform: translateX(-100%);
      visibility: hidden;
      transition:
        transform 0.22s ease,
        visibility 0s linear 0.22s,
        background 0.2s,
        border-color 0.2s;
    }

    .sidebar.open {
      transform: none;
      visibility: visible;
      transition-delay: 0s;
      box-shadow: 0 0 32px rgb(0 0 0 / 0.35);
    }

    .sidebar-header {
      flex-wrap: wrap;
      row-gap: 12px;
    }

    .close-button {
      display: inline-flex;
    }

    .theme-switcher-slot {
      flex: 0 0 100%;
    }

    .scrim {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 40;
      padding: 0;
      border: 0;
      background: rgb(0 0 0 / 0.5);
      cursor: default;
    }

    .content {
      padding: 20px 16px 32px;
      max-width: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sidebar {
      transition: none;
    }
  }
</style>
