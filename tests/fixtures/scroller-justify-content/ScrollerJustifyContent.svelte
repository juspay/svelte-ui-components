<script lang="ts">
  import { onMount } from 'svelte';
  import AttachmentChipRow from '$lib/AttachmentChipRow/AttachmentChipRow.svelte';
  import Scroller from '$lib/Scroller/Scroller.svelte';

  type ScrollerScenario = {
    name: string;
    // Classes on the wrapper around the scenario: what an app puts on an ancestor.
    hostClass: string;
    // Classes passed to the Scroller's own root: where an app sets the token.
    scrollerClass: string;
    itemCount: number;
    vertical: boolean;
  };

  type ChipScenario = {
    name: string;
    // Classes passed to the AttachmentChipRow: where Lighthouse sets the token.
    chipClass: string;
    chipCount: number;
  };

  const scrollerScenarios: readonly ScrollerScenario[] = [
    { name: 'plain', hostClass: '', scrollerClass: '', itemCount: 3, vertical: false },
    { name: 'end', hostClass: '', scrollerClass: 'jc-end', itemCount: 3, vertical: false },
    { name: 'center', hostClass: '', scrollerClass: 'jc-center', itemCount: 3, vertical: false },
    {
      name: 'low-rule',
      hostClass: 'jc-low-rule',
      scrollerClass: '',
      itemCount: 3,
      vertical: false
    },
    {
      name: 'global-reset',
      hostClass: 'jc-global-reset',
      scrollerClass: '',
      itemCount: 3,
      vertical: false
    },
    {
      name: 'app-layer',
      hostClass: 'jc-app-layer',
      scrollerClass: '',
      itemCount: 3,
      vertical: false
    },
    {
      name: 'end-low-rule',
      hostClass: 'jc-low-rule',
      scrollerClass: 'jc-end',
      itemCount: 3,
      vertical: false
    },
    {
      name: 'end-global-reset',
      hostClass: 'jc-global-reset',
      scrollerClass: 'jc-end',
      itemCount: 3,
      vertical: false
    },
    {
      name: 'end-app-layer',
      hostClass: 'jc-app-layer',
      scrollerClass: 'jc-end',
      itemCount: 3,
      vertical: false
    },
    { name: 'overflow', hostClass: '', scrollerClass: '', itemCount: 8, vertical: false },
    { name: 'overflow-end', hostClass: '', scrollerClass: 'jc-end', itemCount: 8, vertical: false },
    {
      name: 'overflow-safe-end',
      hostClass: '',
      scrollerClass: 'jc-safe-end',
      itemCount: 8,
      vertical: false
    },
    {
      name: 'vertical',
      hostClass: 'jc-host-tall',
      scrollerClass: 'jc-tall',
      itemCount: 3,
      vertical: true
    },
    {
      name: 'vertical-end',
      hostClass: 'jc-host-tall',
      scrollerClass: 'jc-tall jc-end',
      itemCount: 3,
      vertical: true
    }
  ];

  const chipScenarios: readonly ChipScenario[] = [
    { name: 'chips-plain', chipClass: '', chipCount: 2 },
    { name: 'chips-end', chipClass: 'jc-end', chipCount: 2 },
    { name: 'chips-overflow', chipClass: '', chipCount: 8 },
    { name: 'chips-overflow-end', chipClass: 'jc-end', chipCount: 8 },
    { name: 'chips-overflow-safe-end', chipClass: 'jc-safe-end', chipCount: 8 }
  ];

  // A one-pixel image, so a chip renders its thumbnail rather than a broken-image glyph.
  const thumbnailData =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  const range = (count: number): number[] => Array.from({ length: count }, (_, index) => index);

  const imagesFor = (count: number) =>
    range(count).map((index) => ({
      id: `image-${index}`,
      thumbnailData,
      filename: `photo-${index}.png`
    }));

  onMount(() => {
    document.documentElement.dataset.fixtureReady = 'true';
  });
</script>

<h1>Scroller justify-content</h1>

<!-- Each Scroller scenario is 400px wide and holds 80px items, so three items leave room to
     justify and eight overflow. The -ref twin beside a horizontal one is a plain div that
     computes what the library's base .scroll-container does, inside the same classes, so the two
     are measured in the same cascade. -->
{#each scrollerScenarios as scenario (scenario.name)}
  <div class="jc-host {scenario.hostClass}" data-pw="jc-{scenario.name}">
    <Scroller
      direction={scenario.vertical ? 'vertical' : 'horizontal'}
      showArrows={false}
      showGradient={false}
      classes={scenario.scrollerClass}
      testId="jc-{scenario.name}-scroller"
    >
      {#each range(scenario.itemCount) as index (index)}
        <div class="jc-item"></div>
      {/each}
    </Scroller>
    {#if !scenario.vertical}
      <div class={scenario.scrollerClass}>
        <div class="scroll-container jc-ref" data-pw="jc-{scenario.name}-ref">
          {#each range(scenario.itemCount) as index (index)}
            <div class="jc-item"></div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/each}

<!-- The row Lighthouse's chat composer renders: two thumbnails (160px) in a 400px host, then eight
     (664px), which overflow. -->
{#each chipScenarios as scenario (scenario.name)}
  <div class="jc-host" data-pw="jc-{scenario.name}">
    <AttachmentChipRow
      images={imagesFor(scenario.chipCount)}
      classes={scenario.chipClass}
      testId="jc-{scenario.name}-row"
    />
  </div>
{/each}
