<script lang="ts">
  import { onMount } from 'svelte';
  import Scroller from '$lib/Scroller/Scroller.svelte';

  type Scenario = {
    name: string;
    // Classes on the wrapper around the scenario: what an app puts on an ancestor.
    hostClass: string;
    // Classes passed to the Scroller's own root: where an app sets the tokens.
    scrollerClass: string;
    hideScrollbar: boolean;
  };

  const scenarios: readonly Scenario[] = [
    { name: 'plain', hostClass: '', scrollerClass: '', hideScrollbar: false },
    {
      name: 'ancestor-color',
      hostClass: 'sb-ancestor-color',
      scrollerClass: '',
      hideScrollbar: false
    },
    { name: 'root-color', hostClass: '', scrollerClass: 'sb-ancestor-color', hideScrollbar: false },
    { name: 'webkit-rule', hostClass: 'sb-webkit', scrollerClass: '', hideScrollbar: false },
    { name: 'global-reset', hostClass: 'sb-global-reset', scrollerClass: '', hideScrollbar: false },
    {
      name: 'tokens',
      hostClass: '',
      scrollerClass: 'sb-tokens',
      hideScrollbar: false
    },
    {
      name: 'width-only',
      hostClass: 'sb-ancestor-color',
      scrollerClass: 'sb-token-width',
      hideScrollbar: false
    },
    { name: 'color-only', hostClass: '', scrollerClass: 'sb-token-color', hideScrollbar: false },
    {
      name: 'tokens-webkit-rule',
      hostClass: 'sb-webkit',
      scrollerClass: 'sb-tokens',
      hideScrollbar: false
    },
    {
      name: 'tokens-consumer-rule',
      hostClass: 'sb-consumer-rule',
      scrollerClass: 'sb-tokens',
      hideScrollbar: false
    },
    {
      name: 'tokens-global-reset',
      hostClass: 'sb-global-reset',
      scrollerClass: 'sb-tokens',
      hideScrollbar: false
    },
    { name: 'app-layer', hostClass: 'sb-app-layer', scrollerClass: '', hideScrollbar: false },
    {
      name: 'tokens-app-layer',
      hostClass: 'sb-app-layer',
      scrollerClass: 'sb-tokens',
      hideScrollbar: false
    },
    { name: 'hidden', hostClass: '', scrollerClass: '', hideScrollbar: true },
    { name: 'hidden-tokens', hostClass: '', scrollerClass: 'sb-tokens', hideScrollbar: true }
  ];

  onMount(() => {
    document.documentElement.dataset.fixtureReady = 'true';
  });
</script>

<h1>Scroller scrollbar</h1>

<!-- Each scenario is 200px wide with three 150px items, so every scroll container overflows. The
     -ref twin beside it is a plain div that computes what the library's base .scroll-container
     does, inside the same classes, so the two are measured in the same cascade. -->
{#each scenarios as scenario (scenario.name)}
  <div class="sb-host {scenario.hostClass}" data-pw="sb-{scenario.name}">
    <Scroller
      hideScrollbar={scenario.hideScrollbar}
      showArrows={false}
      showGradient={false}
      classes={scenario.scrollerClass}
      testId="sb-{scenario.name}-scroller"
    >
      <div class="sb-item"></div>
      <div class="sb-item"></div>
      <div class="sb-item"></div>
    </Scroller>
    <div class={scenario.scrollerClass}>
      <div
        class="scroll-container sb-ref"
        class:sb-ref-hidden={scenario.hideScrollbar}
        data-pw="sb-{scenario.name}-ref"
      >
        <div class="sb-item"></div>
        <div class="sb-item"></div>
        <div class="sb-item"></div>
      </div>
    </div>
  </div>
{/each}
