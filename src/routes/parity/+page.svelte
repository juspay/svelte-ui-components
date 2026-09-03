<script lang="ts">
  import type { Component } from 'svelte';
  import * as sui from '$lib/index.js';
  import * as poly from 'polymorph-ui-components';
  import { FIXTURES, NON_COMPONENTS } from './fixtures.js';
  import Cell from './Cell.svelte';

  type Renderable = Component<Record<string, unknown>>;

  // This repo bans both type assertions and type predicates, so the narrowing
  // has to happen at the type boundary instead of at the use site.
  // `Object.entries` on a plain object yields `any` values, which assign to the
  // declared return type without an `as` — and the runtime filter below is then
  // an ordinary boolean check rather than a predicate.
  const toBag = (module: object): Record<string, Renderable> =>
    Object.fromEntries(Object.entries(module));

  const isRenderable = (value: Renderable): boolean => typeof value === 'function';

  const suiBag = toBag(sui);
  const polyBag = toBag(poly);

  // Only names exported by BOTH barrels can be compared visually. A name in one
  // barrel and not the other is a capability difference, which is a separate
  // question and already answered by the inventory.
  const pairs = Object.keys(polyBag)
    .filter((name) => name in suiBag && !NON_COMPONENTS.has(name))
    .sort()
    .map((name) => ({
      name,
      Sui: suiBag[name],
      Poly: polyBag[name],
      props: FIXTURES[name] ?? {}
    }))
    .filter((pair) => isRenderable(pair.Sui) && isRenderable(pair.Poly));
</script>

<svelte:head><title>Visual parity — SUI vs polymorph</title></svelte:head>

<h1 data-pw="parity-heading">Visual parity: {pairs.length} shared components</h1>
<p class="note">
  Each row renders the same component from both libraries with an identical fixture, so any
  difference is the component's and not the input's.
</p>

{#each pairs as pair (pair.name)}
  <section class="row" data-pw="parity-row" data-component={pair.name}>
    <h2>{pair.name}</h2>
    <div class="cells">
      <Cell component={pair.Sui} props={pair.props} side="sui" name={pair.name} />
      <Cell component={pair.Poly} props={pair.props} side="poly" name={pair.name} />
    </div>
  </section>
{/each}

<style>
  h1 {
    font:
      600 20px/1.3 system-ui,
      sans-serif;
    margin: 24px 16px 4px;
  }
  .note {
    font:
      14px/1.5 system-ui,
      sans-serif;
    color: #555;
    margin: 0 16px 20px;
    max-width: 70ch;
  }
  .row {
    border-top: 1px solid #e2e2e2;
    padding: 14px 16px;
  }
  .row h2 {
    font:
      600 13px/1 ui-monospace,
      monospace;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #666;
    margin: 0 0 10px;
  }
  .cells {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
</style>
