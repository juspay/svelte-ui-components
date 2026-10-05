<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/Button/Button.svelte';

  const longLabel =
    'A very long button label that is far wider than the 240px column it is placed in';
  const unbreakableLabel = 'Supercalifragilisticexpialidocious'.repeat(3);
  const imageIcon =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' fill='%23888'/%3E%3C/svg%3E";

  const parentKinds = ['flex', 'block', 'grid', 'stretch'] as const;
  const modes = ['on', 'off'] as const;
  // `grid` above is the 1fr track; these are the other tracks a grid parent can have.
  const gridTracks = ['grid-auto', 'grid-minmax', 'grid-fixed'] as const;
  const alignments = ['normal', 'start', 'center', 'end'] as const;
  const labelLengths = ['short', 'long'] as const;

  onMount(() => {
    document.documentElement.dataset.fixtureReady = 'true';
  });
</script>

<h1>Button shrinkable</h1>

<!-- Every parent is 240px wide and every long label is far wider than that. -->
{#each parentKinds as kind (kind)}
  {#each modes as mode (mode)}
    <div class="parent parent-{kind}" data-pw="shrink-parent-{kind}-{mode}">
      <Button text={longLabel} shrinkable={mode === 'on'} testId="shrink-button-{kind}-{mode}" />
    </div>
  {/each}
{/each}

{#each gridTracks as kind (kind)}
  {#each modes as mode (mode)}
    <div class="parent parent-{kind}" data-pw="shrink-parent-{kind}-{mode}">
      <Button text={longLabel} shrinkable={mode === 'on'} testId="shrink-button-{kind}-{mode}" />
    </div>
  {/each}
{/each}

<!-- Every grid track against every justify-items value, with a label that fits and one that does not. -->
{#each ['grid', ...gridTracks] as track (track)}
  {#each alignments as alignment (alignment)}
    {#each labelLengths as length (length)}
      <div
        class="parent parent-{track} parent-justify-{alignment}"
        data-pw="shrink-aligned-{track}-{alignment}-{length}"
      >
        <Button text={length === 'long' ? longLabel : 'Save'} shrinkable />
      </div>
    {/each}
  {/each}
{/each}

{#each ['start', 'center', 'end'] as alignment (alignment)}
  {#each labelLengths as length (length)}
    <div class="parent parent-grid" data-pw="shrink-self-{alignment}-{length}">
      <Button
        text={length === 'long' ? longLabel : 'Save'}
        shrinkable
        style="justify-self: {alignment};"
      />
    </div>
  {/each}
{/each}

<!-- A root centred with auto margins: a box that stretched across the parent could not be centred. -->
<div class="parent parent-block" data-pw="shrink-centered">
  <Button text="Save" shrinkable classes="fixture-centered" />
</div>

{#each modes as mode (mode)}
  <div class="parent parent-flex" data-pw="shrink-short-{mode}">
    <Button text="Save" shrinkable={mode === 'on'} testId="shrink-short-button-{mode}" />
  </div>
{/each}

<div class="parent parent-flex" data-pw="shrink-icon-svg">
  <Button text={longLabel} shrinkable>
    {#snippet icon()}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <line x1="8" y1="3" x2="8" y2="13" />
        <line x1="3" y1="8" x2="13" y2="8" />
      </svg>
    {/snippet}
  </Button>
</div>

<div class="parent parent-flex" data-pw="shrink-icon-img">
  <Button text={longLabel} shrinkable>
    {#snippet icon()}
      <img src={imageIcon} width="24" height="24" alt="" />
    {/snippet}
  </Button>
</div>

<div class="parent parent-flex" data-pw="shrink-icon-img-off">
  <Button text={longLabel}>
    {#snippet icon()}
      <img src={imageIcon} width="24" height="24" alt="" />
    {/snippet}
  </Button>
</div>

<div class="parent parent-flex parent-narrow" data-pw="shrink-icon-only-img">
  <Button iconOnly ariaLabel="Add" shrinkable>
    {#snippet icon()}
      <img src={imageIcon} width="24" height="24" alt="" />
    {/snippet}
  </Button>
</div>

<div class="parent parent-flex" data-pw="shrink-pair">
  <Button text={longLabel} shrinkable />
  <Button text={longLabel} shrinkable variant="secondary" />
</div>

<div class="parent parent-flex" data-pw="shrink-mixed">
  <Button text="Save" shrinkable testId="shrink-mixed-short" />
  <Button text={longLabel} shrinkable testId="shrink-mixed-long" />
</div>

<!-- 100px is narrower than the two labels together, so one of them has to give. -->
<div class="parent parent-flex parent-tight" data-pw="shrink-tight">
  <Button text="Save" shrinkable testId="shrink-tight-short" />
  <Button text="Cancel" shrinkable testId="shrink-tight-other" />
</div>

<div class="parent parent-flex parent-tight" data-pw="shrink-tight-kept">
  <Button text="Save" shrinkable classes="fixture-keep-size" testId="shrink-tight-kept-short" />
  <Button text="Cancel" shrinkable testId="shrink-tight-kept-other" />
</div>

{#each modes as mode (mode)}
  <div class="parent parent-flex" data-pw="shrink-grow-{mode}">
    <Button
      text="Save"
      shrinkable={mode === 'on'}
      classes="fixture-grow"
      testId="shrink-grow-button-{mode}"
    />
  </div>
{/each}

<div class="parent parent-flex" data-pw="shrink-fullwidth-short">
  <Button text="Save" shrinkable fullWidth testId="shrink-fullwidth-short-button" />
</div>

<div class="parent parent-flex" data-pw="shrink-fullwidth-long">
  <Button text={longLabel} shrinkable fullWidth testId="shrink-fullwidth-long-button" />
</div>

<div class="parent parent-flex" data-pw="shrink-capped">
  <Button text={longLabel} shrinkable classes="fixture-capped" testId="shrink-capped-button" />
</div>

{#each parentKinds as kind (kind)}
  <div class="parent parent-{kind}" data-pw="shrink-token-only-{kind}">
    <Button text={longLabel} classes="fixture-full-cap" testId="shrink-token-only-button-{kind}" />
  </div>
{/each}

<div class="parent parent-block" data-pw="shrink-width-token-capped">
  <Button
    text="Save"
    classes="fixture-width-token fixture-half-cap"
    testId="shrink-width-token-capped-button"
  />
</div>

<div class="parent parent-block" data-pw="shrink-fullwidth-capped">
  <Button
    text="Save"
    fullWidth
    classes="fixture-half-cap"
    testId="shrink-fullwidth-capped-button"
  />
</div>

{#each modes as mode (mode)}
  <div class="parent parent-flex" data-pw="shrink-unbreakable-{mode}">
    <Button
      text={unbreakableLabel}
      shrinkable={mode === 'on'}
      classes="fixture-wrap"
      testId="shrink-unbreakable-button-{mode}"
    />
  </div>
{/each}

<div class="parent parent-flex parent-anywhere" data-pw="shrink-unbreakable-anywhere">
  <Button
    text={unbreakableLabel}
    shrinkable
    classes="fixture-wrap"
    testId="shrink-unbreakable-anywhere-button"
  />
</div>

{#each modes as mode (mode)}
  <div class="parent parent-flex" data-pw="shrink-wrap-{mode}">
    <Button
      text={longLabel}
      shrinkable={mode === 'on'}
      classes="fixture-wrap"
      testId="shrink-wrap-button-{mode}"
    />
  </div>
{/each}

{#each modes as mode (mode)}
  <div class="parent parent-flex parent-narrow" data-pw="shrink-icon-only-{mode}">
    <Button
      iconOnly
      ariaLabel="Add"
      shrinkable={mode === 'on'}
      testId="shrink-icon-only-button-{mode}"
    >
      {#snippet icon()}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <line x1="8" y1="3" x2="8" y2="13" />
          <line x1="3" y1="8" x2="13" y2="8" />
        </svg>
      {/snippet}
    </Button>
  </div>
{/each}

{#each modes as mode (mode)}
  <div class="parent parent-flex" data-pw="shrink-root-cap-{mode}">
    <Button
      text={longLabel}
      shrinkable={mode === 'on'}
      classes="fixture-root-cap"
      testId="shrink-root-cap-button-{mode}"
    />
  </div>
{/each}

<div class="parent parent-flex" data-pw="shrink-children-unmanaged">
  <Button shrinkable testId="shrink-children-unmanaged-button">
    <span class="child-label">{longLabel}</span>
  </Button>
</div>

<div class="parent parent-flex" data-pw="shrink-children-managed">
  <Button shrinkable testId="shrink-children-managed-button">
    <span class="child-label child-label-managed">{longLabel}</span>
  </Button>
</div>

<!-- all: unset on the root leaves it display: inline. -->
<div class="parent parent-block" data-pw="shrink-reset-default">
  <Button text={longLabel} classes="fixture-reset-root" testId="shrink-reset-default-button" />
</div>

<div class="parent parent-block" data-pw="shrink-reset-token">
  <Button
    text={longLabel}
    classes="fixture-reset-root fixture-full-cap"
    testId="shrink-reset-token-button"
  />
</div>

<div class="parent parent-block" data-pw="shrink-reset-shrinkable">
  <Button
    text={longLabel}
    shrinkable
    classes="fixture-reset-root"
    testId="shrink-reset-shrinkable-button"
  />
</div>

<div class="parent parent-flex" data-pw="shrink-reset-flex-token">
  <Button
    text={longLabel}
    classes="fixture-reset-root fixture-full-cap"
    testId="shrink-reset-flex-token-button"
  />
</div>

<div class="parent parent-flex" data-pw="shrink-reset-flex-shrinkable">
  <Button
    text={longLabel}
    shrinkable
    classes="fixture-reset-root"
    testId="shrink-reset-flex-shrinkable-button"
  />
</div>

<style>
  /* The near-universal reset that squeezes an image icon inside a shrinking box. */
  :global(img) {
    max-width: 100%;
  }

  .parent {
    width: 240px;
    margin-bottom: 16px;
    outline: 1px dashed #999;
  }

  .parent-flex {
    display: flex;
    gap: 8px;
  }

  .parent-grid {
    display: grid;
    grid-template-columns: 1fr;
  }

  .parent-grid-auto {
    display: grid;
    grid-template-columns: auto;
  }

  .parent-grid-minmax {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .parent-grid-fixed {
    display: grid;
    grid-template-columns: 240px;
  }

  .parent-justify-start {
    justify-items: start;
  }

  .parent-justify-center {
    justify-items: center;
  }

  .parent-justify-end {
    justify-items: end;
  }

  .parent-stretch {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .parent-narrow {
    width: 24px;
  }

  .parent-tight {
    width: 100px;
  }

  .parent-anywhere {
    overflow-wrap: anywhere;
  }

  .child-label-managed {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :global(.fixture-keep-size) {
    flex-shrink: 0;
  }

  :global(.fixture-grow) {
    flex-grow: 1;
  }

  :global(.fixture-centered) {
    margin-inline: auto;
  }

  :global(.fixture-capped) {
    --button-max-width: 120px;
  }

  :global(.fixture-full-cap) {
    --button-max-width: 100%;
  }

  :global(.fixture-half-cap) {
    --button-max-width: 50%;
  }

  :global(.fixture-root-cap) {
    max-width: 120px;
  }

  :global(.fixture-width-token) {
    --button-width: 200px;
  }

  :global(.fixture-wrap) {
    --button-white-space: normal;
  }

  :global(.fixture-reset-root) {
    all: unset;
  }
</style>
