<script lang="ts">
  import { onMount } from 'svelte';
  import Banner from '$lib/Banner/Banner.svelte';

  type Scenario = {
    id: string;
    // Custom properties on the host, which is where an app sets them for a banner.
    tokens: string;
    width: number;
    rightContent: boolean;
    dismissible: boolean;
    dir: 'ltr' | 'rtl';
  };

  const scenario = (id: string, overrides: Partial<Omit<Scenario, 'id'>> = {}): Scenario => ({
    id,
    tokens: '',
    width: 480,
    rightContent: true,
    dismissible: false,
    dir: 'ltr',
    ...overrides
  });

  const AUTO = '--banner-right-margin-left: auto;';
  // In a vertical writing mode the row runs top to bottom, so the physical left margin lies across it.
  const VERTICAL = 'writing-mode: vertical-rl; --banner-height: 480px;';

  const scenarios: readonly Scenario[] = [
    scenario('unset'),
    scenario('auto', { tokens: AUTO }),
    scenario('fixed', { tokens: '--banner-right-margin-left: 40px;' }),
    scenario('unset-dismiss', { dismissible: true }),
    scenario('auto-dismiss', { tokens: AUTO, dismissible: true }),
    scenario('auto-justify-start', { tokens: `${AUTO} --banner-justify-content: flex-start;` }),
    scenario('auto-justify-end', { tokens: `${AUTO} --banner-justify-content: flex-end;` }),
    scenario('unset-justify-end', { tokens: '--banner-justify-content: flex-end;' }),
    scenario('unset-gap', { tokens: '--banner-gap: 20px;' }),
    scenario('fixed-gap', { tokens: '--banner-gap: 20px; --banner-right-margin-left: 40px;' }),
    scenario('tight-unset', { width: 200, dismissible: true }),
    scenario('tight-auto', { width: 200, dismissible: true, tokens: AUTO }),
    scenario('no-right-unset', { rightContent: false, dismissible: true }),
    scenario('no-right-auto', { rightContent: false, dismissible: true, tokens: AUTO }),
    scenario('rtl-unset', { dir: 'rtl', dismissible: true }),
    scenario('rtl-auto', { dir: 'rtl', dismissible: true, tokens: AUTO }),
    scenario('vertical-unset', { width: 200, dismissible: true, tokens: VERTICAL }),
    scenario('vertical-auto', { width: 200, dismissible: true, tokens: `${VERTICAL} ${AUTO}` })
  ];

  // An app's own stylesheet can come before the library's or after it, and a rule of the app's
  // that targets the same selector has to win either way, so where it goes is the input:
  // ?css=.banner-right{margin-left:24px}&order=first. The page's own load order puts the
  // library's stylesheet in <head> already, so prepending puts the rule ahead of it.
  const params = new URLSearchParams(window.location.search);
  const consumerCss = params.get('css');
  if (consumerCss !== null) {
    const consumerSheet = document.createElement('style');
    consumerSheet.textContent = consumerCss;
    if (params.get('order') === 'first') {
      document.head.prepend(consumerSheet);
    } else {
      document.head.append(consumerSheet);
    }
  }

  onMount(() => {
    document.documentElement.dataset.fixtureReady = 'true';
  });
</script>

<!--
  Every part of the row has a fixed size, so no box here depends on a font and the
  expected offsets in the spec are exact whatever machine runs it. The body is a
  fixed 120px child; the slot is a fixed 60px child; the icon is the banner's 18px.
-->
{#each scenarios as item (item.id)}
  {#snippet slot()}
    <div data-pw={`brm-${item.id}-right`} style="width: 60px; height: 24px;"></div>
  {/snippet}
  <div
    data-pw={`brm-${item.id}`}
    dir={item.dir}
    style={`width: ${item.width}px; margin-bottom: 12px; ${item.tokens}`}
  >
    <Banner
      dismissible={item.dismissible}
      transitionDuration={0}
      {...item.rightContent ? { rightContent: slot } : {}}
    >
      {#snippet icon()}
        <svg data-pw={`brm-${item.id}-icon`} viewBox="0 0 18 18"><circle cx="9" cy="9" r="8" /></svg
        >
      {/snippet}
      <div data-pw={`brm-${item.id}-body`} style="width: 120px; height: 20px;"></div>
    </Banner>
  </div>
{/each}
