import type { LayoutServerLoad } from './$types';
import { marked } from 'marked';
import { parseFragment, type DefaultTreeAdapterTypes } from 'parse5';
import { componentNav, componentSlugFor, type ComponentSlug } from './_nav';
import { documentationName } from './_documentation';
import { routeName } from './_titles';

const documents = import.meta.glob<string>('../../../docs/*.md', {
  query: '?raw',
  import: 'default'
});
const documentationNames = new Set(
  Object.keys(documents).map((path) => path.slice('../../../docs/'.length, -3))
);
// Preserve the spelling of encoded text used by existing heading anchors.
function headingText(node: DefaultTreeAdapterTypes.Node, source: string): string {
  if ('value' in node) {
    const location = node.sourceCodeLocation;
    return typeof location === 'object' && location !== null
      ? source.slice(location.startOffset, location.endOffset)
      : node.value;
  }
  return 'childNodes' in node
    ? node.childNodes.map((child) => headingText(child, source)).join('')
    : '';
}

/**
 * GitHub's heading-slug convention, which is the one every doc author here
 * has already been writing against.
 */
function slugify(text: string): string {
  return (
    headingText(parseFragment(text, { sourceCodeLocationInfo: true }), text)
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

const nameToSlug: Record<string, ComponentSlug> = {};
for (const group of componentNav) {
  for (const item of group.items) {
    nameToSlug[item.name] = item.slug;
    const canonicalName = documentationName(item.name, documentationNames);
    if (canonicalName !== null) {
      nameToSlug[canonicalName] = item.slug;
    }
  }
}

// Every component page is a sibling. Resolve links against the displayed page,
// including when its markup arrived via a deeper __data.json request.
function documentHref(slug: ComponentSlug): string {
  return `./${slug}`;
}

function resolveDocHref(href: string): string {
  // Public demo URLs stay portable in Markdown. In this app they point at
  // this build, including new examples that have not been published yet.
  const demoPrefix = 'https://juspay.github.io/svelte-ui-components/components/';
  if (href.startsWith(demoPrefix)) {
    const url = new URL(href);
    const slug = componentSlugFor(url.pathname.slice('/svelte-ui-components/components/'.length));
    if (slug !== null) {
      return `${documentHref(slug)}${url.search}${url.hash}`;
    }
  }
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
    return `${documentHref(slug)}${hash ?? ''}`;
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
  // A bare <table> cannot be the keyboard-focusable scroll region: giving it a
  // role would replace its table semantics. The wrapper scrolls and is named
  // (see _scroll-regions.ts, attached to <main> in the root layout); the table keeps its own role.
  const renderTable = renderer.table.bind(renderer);
  renderer.table = function table(token) {
    return `<div class="docs-table-scroll">${renderTable(token)}</div>`;
  };
  const result = marked.parse(md, { renderer });
  if (typeof result === 'string') {
    return result;
  }
  return '';
}

export const load: LayoutServerLoad = async ({ route }) => {
  const name = documentationName(routeName(route.id) ?? '', documentationNames);
  if (name === null) {
    return { renderedHtml: '' };
  }
  const markdown = await documents[`../../../docs/${name}.md`]();
  return { renderedHtml: renderMarkdown(markdown.replace(/^# .+\n+/, '')) };
};
