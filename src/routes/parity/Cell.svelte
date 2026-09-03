<script lang="ts">
  // Each cell owns its own <svelte:boundary>. Two boundaries cannot live in one
  // component: `failed` is the reserved snippet name and Svelte hoists snippet
  // declarations to component scope, so a second one collides with the first.
  // Extracting the cell is what lets a render failure on one side be contained
  // instead of taking down the page — and a contained failure IS a result here,
  // since a component that throws on a fixture the other side renders is itself
  // a parity difference worth seeing.
  import type { Component } from 'svelte';

  // Typed as a Component at the boundary rather than taken as `unknown` and cast
  // at the render site: the caller has already narrowed it with a type predicate,
  // so the assertion this repo forbids is unnecessary here.
  let {
    component: Cmp,
    props = {},
    side,
    name
  }: {
    component: Component<Record<string, unknown>>;
    props?: Record<string, unknown>;
    side: 'sui' | 'poly';
    name: string;
  } = $props();
</script>

<div class="cell" data-pw="cell-{side}" data-side={side}>
  <span class="tag" class:alt={side === 'poly'}>{side === 'sui' ? 'SUI' : 'polymorph'}</span>
  <div class="stage" data-pw="stage-{side}-{name}">
    <svelte:boundary>
      <Cmp {...props} />
      {#snippet failed(error)}
        <span class="err" data-pw="render-failed">{String(error)}</span>
      {/snippet}
    </svelte:boundary>
  </div>
</div>

<style>
  .cell {
    border: 1px solid #e6e6e6;
    border-radius: 4px;
    padding: 10px;
    background: #fff;
    min-width: 0;
  }
  .tag {
    display: inline-block;
    font:
      600 9px/1 ui-monospace,
      monospace;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background: #e4efe9;
    color: #17603f;
    padding: 3px 5px;
    border-radius: 2px;
    margin-bottom: 8px;
  }
  .tag.alt {
    background: #eae4f2;
    color: #4a2c6b;
  }
  .stage {
    min-height: 40px;
    overflow-x: auto;
  }
  .err {
    font:
      11px/1.4 ui-monospace,
      monospace;
    color: #9d3227;
  }
</style>
