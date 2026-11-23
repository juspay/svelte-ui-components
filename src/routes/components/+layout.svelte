<script lang="ts">
  import type { LayoutProps } from './$types';
  let { data, children }: LayoutProps = $props();
</script>

{@render children()}

{#if data.renderedHtml}
  <section class="docs-section">
    <hr class="docs-divider" />
    <h2 class="docs-title">Documentation</h2>
    <div class="markdown-body">
      <!-- eslint-disable svelte/no-at-html-tags -->
      {@html data.renderedHtml}
    </div>
  </section>
{/if}

<style>
  .docs-section {
    margin-top: 40px;
  }

  .docs-divider {
    border: none;
    border-top: 1px solid var(--doc-border);
    margin-bottom: 24px;
  }

  .docs-title {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--doc-text-heading);
    margin: 0 0 20px;
  }

  .markdown-body :global(h2) {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--doc-text-heading);
    margin: 28px 0 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--doc-border-light);
  }

  .markdown-body :global(h3) {
    font-size: 1rem;
    font-weight: 600;
    color: var(--doc-text-primary);
    margin: 20px 0 8px;
  }

  .markdown-body :global(p) {
    font-size: 14px;
    line-height: 1.6;
    color: var(--doc-text-primary);
    margin: 8px 0;
  }

  /* A prop table's last column holds unbreakable strings -- type unions, URLs --
     whose min-content width can exceed the column. Without a scroll container the
     table widens the page instead, so the whole document scrolls sideways to
     reveal a few pixels of one cell.

     The container is a wrapper div rather than the table itself so that it can be
     a keyboard-focusable named region while the table keeps its table role. */
  .markdown-body :global(.docs-table-scroll) {
    overflow-x: auto;
    max-width: 100%;
    margin: 12px 0;
  }

  .markdown-body :global(table) {
    border-collapse: collapse;
    font-size: 13px;
  }

  .markdown-body :global(th) {
    text-align: left;
    padding: 8px 12px;
    background: var(--doc-table-header-bg);
    border: 1px solid var(--doc-border);
    font-weight: 600;
    color: var(--doc-text-primary);
  }

  .markdown-body :global(td) {
    padding: 8px 12px;
    border: 1px solid var(--doc-border);
    color: var(--doc-text-secondary);
    vertical-align: top;
  }

  .markdown-body :global(tr:hover td) {
    background: var(--doc-demo-bg);
  }

  .markdown-body :global(code) {
    font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, monospace;
    font-size: 12.5px;
    background: var(--doc-code-bg);
    padding: 2px 5px;
    border-radius: 4px;
    color: var(--doc-code-color);
  }

  .markdown-body :global(pre) {
    background: var(--doc-pre-bg);
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    margin: 12px 0;
  }

  .markdown-body :global(pre code) {
    background: none;
    color: var(--doc-pre-color);
    padding: 0;
    font-size: 13px;
    line-height: 1.5;
    /* As wide as its text (never narrower than the block), so the code's own box
       resizes when the font size or content changes -- an inline box never
       reports a size, and then nothing could tell that the block now overflows.
       Measured identical to the inline default in height and scrollWidth in
       Chromium, Firefox and WebKit. */
    display: block;
    width: max-content;
    min-width: 100%;
  }

  /* A block that overflows is focusable (see _scroll-regions.ts, attached to <main> in the root layout), so it needs a
     visible indicator. The offset keeps the ring on the page background, where
     the accent token has contrast in both themes, not on the dark code surface. */
  .markdown-body :global(pre:focus-visible),
  .markdown-body :global(.docs-table-scroll:focus-visible) {
    outline: 2px solid var(--doc-accent);
    outline-offset: 2px;
  }

  .markdown-body :global(ul),
  .markdown-body :global(ol) {
    padding-left: 20px;
    margin: 8px 0;
  }

  .markdown-body :global(li) {
    font-size: 14px;
    color: var(--doc-text-primary);
    line-height: 1.6;
    margin: 4px 0;
  }

  .markdown-body :global(hr) {
    border: none;
    border-top: 1px solid var(--doc-border);
    margin: 24px 0;
  }
</style>
