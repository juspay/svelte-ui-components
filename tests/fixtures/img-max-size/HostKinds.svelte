<script lang="ts">
  import Img from '$lib/Img/Img.svelte';

  type Props = { rasterSrc: string; svgSrc: string };
  const { rasterSrc, svgSrc }: Props = $props();

  // Where the image sits decides how a max-width can reach it: a flex item and a grid
  // item have an automatic minimum size, a table cell and a float and an absolutely
  // positioned box shrink to their content, and a percentage cap on any of them
  // resolves against a box the image itself helps to size. Each kind below is 200px
  // wide where it can be, so a 400x200 image does not fit and any cap that leaked in
  // would move it.
  const KINDS = [
    'flex-row',
    'flex-column',
    'grid-track',
    'table-cell',
    'float',
    'absolute'
  ] as const;
  const PATHS = ['img', 'svg'] as const;
  const SIZES: ReadonlyArray<{ id: string; tokens: string }> = [
    { id: 'default', tokens: '' },
    { id: 'intrinsic', tokens: '--image-width: auto; --image-height: auto;' },
    { id: 'fill', tokens: '--image-width: 100%; --image-height: 100%;' }
  ];
  const ROLES = ['component', 'twin'] as const;

  const cases = KINDS.flatMap((kind) =>
    PATHS.flatMap((path) =>
      SIZES.flatMap((size) =>
        ROLES.map((role) => ({
          kind,
          path,
          role,
          tokens: size.tokens,
          id: `${kind}-${path}-${size.id}`
        }))
      )
    )
  );
</script>

{#snippet picture(path: 'img' | 'svg', role: 'component' | 'twin', id: string)}
  {#if role === 'component'}
    <Img
      src={path === 'svg' ? svgSrc : rasterSrc}
      alt=""
      inlineSvg={path === 'svg'}
      testId="{id}-component"
    />
  {:else if path === 'img'}
    <img src={rasterSrc} alt="" class="base-equivalent" data-pw="{id}-twin" />
  {:else}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 200"
      width="400"
      height="200"
      class="base-equivalent"
      data-pw="{id}-twin"
    >
      <rect width="400" height="200" fill="#888" />
    </svg>
  {/if}
{/snippet}

<!-- Each component is paired with a bare element of the same size, in a box of the same kind. -->
{#each cases as scenario (`${scenario.id}-${scenario.role}`)}
  <div class="arena" data-pw="arena-{scenario.id}-{scenario.role}" style={scenario.tokens}>
    {#if scenario.kind === 'table-cell'}
      <div class="table">
        <div class="table-cell" data-pw="host-{scenario.id}-{scenario.role}">
          {@render picture(scenario.path, scenario.role, scenario.id)}
        </div>
      </div>
    {:else}
      <div class={scenario.kind} data-pw="host-{scenario.id}-{scenario.role}">
        {@render picture(scenario.path, scenario.role, scenario.id)}
      </div>
    {/if}
  </div>
{/each}

<style>
  .arena {
    position: relative;
    display: flow-root;
    width: 200px;
    height: 230px;
    margin: 0 0 8px;
  }

  .flex-row,
  .flex-column,
  .grid-track {
    width: 200px;
    height: 100px;
  }

  .flex-row {
    display: flex;
    flex-direction: row;
  }

  .flex-column {
    display: flex;
    flex-direction: column;
  }

  .grid-track {
    display: grid;
    grid-template-columns: 1fr;
  }

  .table {
    display: table;
    width: 200px;
  }

  .table-cell {
    display: table-cell;
  }

  .float {
    float: left;
  }

  .absolute {
    position: absolute;
    top: 0;
    left: 0;
  }

  /* The rules Img applied before the caps existed, written out for the bare element. */
  .base-equivalent {
    height: var(--image-height, 24px);
    width: var(--image-width, 24px);
  }
</style>
