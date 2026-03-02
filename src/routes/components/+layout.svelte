<script lang="ts">
  import { page } from '$app/stores';
  import { marked } from 'marked';
  import type { Snippet } from 'svelte';
  import { componentNav } from './_nav';

  let { children }: { children: Snippet } = $props();

  const rawDocs: Record<string, string> = import.meta.glob('../../../docs/*.md', {
    query: '?raw',
    import: 'default',
    eager: true
  });

  const docs: Record<string, string> = {};
  for (const [path, content] of Object.entries(rawDocs)) {
    const filename = path.split('/').pop()?.replace('.md', '') ?? '';
    docs[filename] = content;
  }

  const slugToName: Record<string, string> = {};
  for (const group of componentNav) {
    for (const item of group.items) {
      slugToName[item.slug] = item.name;
    }
  }

  function renderMarkdown(md: string): string {
    const result = marked.parse(md);
    if (typeof result === 'string') {
      return result;
    }
    return '';
  }

  let currentSlug = $derived($page.url.pathname.split('/').pop() ?? '');
  let docName = $derived(slugToName[currentSlug] ?? '');
  let rawMarkdown = $derived(docs[docName] ?? '');
  let cleanMarkdown = $derived(rawMarkdown.replace(/^# .+\n+/, ''));
  let renderedHtml = $derived(cleanMarkdown ? renderMarkdown(cleanMarkdown) : '');
</script>

{@render children()}

{#if renderedHtml}
  <section class="docs-section">
    <hr class="docs-divider" />
    <h2 class="docs-title">Documentation</h2>
    <div class="markdown-body">
      <!-- eslint-disable svelte/no-at-html-tags -->
      {@html renderedHtml}
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

  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    margin: 12px 0;
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
