<script lang="ts">
  import { page } from '$app/stores';
  import { base } from '$app/paths';
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

  /**
   * GitHub's heading-slug convention, which is the one every doc author here
   * has already been writing against.
   */
  function slugify(text: string): string {
    return (
      text
        .replace(/<[^>]+>/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        // One hyphen per whitespace CHARACTER, not per run. GitHub does not
        // collapse: `Sparse Series — Gap Points` loses the em dash and keeps both
        // surrounding spaces, so its slug is `sparse-series--gap-points` with two
        // hyphens. Collapsing produced one, which made this function disagree with
        // the convention it claims to implement for 40 headings -- every heading
        // here that separates a phrase with a dash.
        .replace(/\s/g, '-')
    );
  }

  /**
   * `marked` emits no heading ids, so every `](#a-heading)` link written in
   * docs/ pointed at a target that did not exist -- and SvelteKit's prerenderer
   * fails the build on a missing id, which is how this surfaced four separate
   * times in one day and read each time as an author being careless.
   *
   * They were not. Both links that broke the build resolved to exactly the
   * right GitHub slug: `#props` for `## Props`, and
   * `#dictation-tri-state-recording-escape-to-cancel-caller-supplied-status`
   * for that heading verbatim. The author's mental model was correct and the
   * renderer simply did not implement it. Emitting the ids makes the model true
   * rather than asking every author to hand-write an anchor they cannot see is
   * missing.
   */
  /**
   * A link to another doc has to work in three places at once: on GitHub, through
   * the MCP server that serves `docs/`, and in this app. A relative `./PieChart.md`
   * is right for the first two and wrong here -- the browser resolves it against
   * the current route, asks for `/components/PieChart.md`, and SvelteKit's
   * prerenderer FAILS THE BUILD on the 404. That is not hypothetical: eight such
   * links shipped and `npm run build` has been broken by them since.
   *
   * So the markdown stays portable and the renderer resolves it. A doc with a demo
   * route becomes that route; one of the thirteen docs with no route at all
   * (CHART_INPUT_POLICY, GUIDELINES, MIGRATION_4.0 …) becomes its GitHub URL,
   * which is where a reader can actually read it.
   */
  const GITHUB_DOCS = 'https://github.com/juspay/svelte-ui-components/blob/release/docs';

  const nameToSlug: Record<string, string> = {};
  for (const group of componentNav) {
    for (const item of group.items) {
      nameToSlug[item.name] = item.slug;
    }
  }

  function resolveDocHref(href: string): string {
    const match = /^\.\/([A-Za-z0-9_.-]+)\.md(#.*)?$/.exec(href);
    if (match === null) {
      return href;
    }
    const [, name, hash] = match;
    const slug = nameToSlug[name];
    if (typeof slug === 'string') {
      // `base` is '' locally and '/svelte-ui-components' on Pages, so an href
      // without it prerenders fine here and fails the deployed build -- which is
      // exactly how it shipped: the prerenderer rejects a link that does not begin
      // with `paths.base`, and only the Pages job sets BASE_PATH.
      return `${base}/components/${slug}${hash ?? ''}`;
    }
    return `${GITHUB_DOCS}/${name}.md${hash ?? ''}`;
  }

  function renderMarkdown(md: string): string {
    const renderer = new marked.Renderer();
    const renderLink = renderer.link.bind(renderer);
    renderer.link = function link(token) {
      return renderLink({ ...token, href: resolveDocHref(token.href) });
    };
    const renderHeading = renderer.heading.bind(renderer);
    renderer.heading = function heading(token) {
      const id = slugify(this.parser.parseInline(token.tokens));
      return renderHeading(token).replace(/^<h([1-6])>/, `<h$1 id="${id}">`);
    };
    const result = marked.parse(md, { renderer });
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
    /* A prop table's last column holds unbreakable strings -- type unions, URLs --
       whose min-content width can exceed the column. Without a scroll container
       the table widens the page instead, so the whole document scrolls sideways
       to reveal a few pixels of one cell. */
    display: block;
    overflow-x: auto;
    width: 100%;
    max-width: 100%;
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
