<script lang="ts">
  /**
   * A minimal stand-in for Sheet's own demo page, which keeps exactly one
   * `<Sheet bind:open>` instance mounted across many open/close cycles
   * (`{#if open}` lives inside Sheet, not around it). testing-library's
   * `rerender()` cannot exercise that shape faithfully: it replaces the
   * whole props object on every call (`{...currentProps, ...nextProps}`),
   * which invalidates every one of Sheet's OTHER props too -- including
   * `side`, which `flyParams`'s non-reduced-motion branch reads -- so that
   * coincidental invalidation forces a recompute on every rerender
   * regardless of whether the reduced-motion read is reactive, masking
   * exactly the bug a regression test here needs to catch. A real
   * `bind:open`, driven only through Sheet's own internal `close()` (via its
   * Close button) and this harness's own `reopen`, sidesteps that
   * entirely -- the same two independent, fine-grained bindings a real
   * parent gets.
   */
  import Sheet from './Sheet.svelte';
  import type { Snippet } from 'svelte';

  let { content }: { content: Snippet } = $props();

  let open = $state(true);

  export function reopen(): void {
    open = true;
  }
</script>

<Sheet bind:open {content} />
