<script lang="ts">
  import { renderMarkdown } from './markdown';
  import type { MarkdownTextProperties } from './properties';

  let { markdown, breaks = false, testId, classes }: MarkdownTextProperties = $props();

  let html = $derived(renderMarkdown(markdown, { breaks }));
</script>

<div
  class="markdown-text {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html html}
</div>

<style>
  .markdown-text {
    font-size: var(--markdown-text-font-size, inherit);
    line-height: var(--markdown-text-line-height, 1.5);
    color: var(--markdown-text-color, inherit);
    word-wrap: break-word;
    overflow-wrap: anywhere;
  }

  .markdown-text :global(p) {
    margin: var(--markdown-text-paragraph-margin, 0 0 0.5em 0);
  }

  .markdown-text :global(p:last-child) {
    margin-bottom: 0;
  }

  .markdown-text :global(h1),
  .markdown-text :global(h2),
  .markdown-text :global(h3),
  .markdown-text :global(h4),
  .markdown-text :global(h5),
  .markdown-text :global(h6) {
    margin: var(--markdown-text-heading-margin, 0.8em 0 0.4em 0);
    line-height: 1.3;
  }

  .markdown-text :global(h1) {
    font-size: 1.35em;
  }

  .markdown-text :global(h2) {
    font-size: 1.2em;
  }

  .markdown-text :global(h3) {
    font-size: 1.1em;
  }

  .markdown-text :global(h4),
  .markdown-text :global(h5),
  .markdown-text :global(h6) {
    font-size: 1em;
  }

  .markdown-text :global(a) {
    color: var(--markdown-text-link-color, #6d28d9);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .markdown-text :global(code) {
    font-family: var(--markdown-text-code-font-family, ui-monospace, monospace);
    font-size: 0.88em;
    background: var(--markdown-text-code-background, rgba(0, 0, 0, 0.05));
    padding: 1px 5px;
    border-radius: 4px;
  }

  .markdown-text :global(pre) {
    background: var(--markdown-text-pre-background, rgba(0, 0, 0, 0.05));
    padding: 10px 12px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 0.5em 0;
  }

  .markdown-text :global(pre code) {
    background: transparent;
    padding: 0;
  }

  .markdown-text :global(ul),
  .markdown-text :global(ol) {
    margin: var(--markdown-text-list-margin, 0.4em 0);
    padding-left: var(--markdown-text-list-padding, 1.4em);
  }

  .markdown-text :global(li) {
    margin: 0.2em 0;
  }

  .markdown-text :global(blockquote) {
    margin: 0.5em 0;
    padding: 2px 0 2px 12px;
    border-left: 3px solid var(--markdown-text-blockquote-border-color, rgba(0, 0, 0, 0.15));
    color: var(--markdown-text-blockquote-color, inherit);
    opacity: var(--markdown-text-blockquote-opacity, 0.85);
  }

  .markdown-text :global(table) {
    display: block;
    max-width: 100%;
    overflow-x: auto;
    border-collapse: collapse;
    margin: 0.5em 0;
  }

  .markdown-text :global(th),
  .markdown-text :global(td) {
    padding: 5px 10px;
    border: 1px solid var(--markdown-text-table-border-color, rgba(0, 0, 0, 0.12));
    text-align: left;
  }

  .markdown-text :global(th) {
    background: var(--markdown-text-table-header-background, rgba(0, 0, 0, 0.04));
  }

  .markdown-text :global(img) {
    max-width: 100%;
    border-radius: var(--markdown-text-image-border-radius, 8px);
  }

  .markdown-text :global(hr) {
    border: none;
    border-top: 1px solid var(--markdown-text-hr-color, rgba(0, 0, 0, 0.12));
    margin: 0.8em 0;
  }
</style>
