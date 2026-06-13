# Breadcrumb

A navigation trail component that renders a semantic `<nav>` containing an `<ol>` of breadcrumb items. The component enforces `<nav aria-label>` + `<ol><li>` semantics; all visual rendering of each crumb is delegated to the required `item` snippet, keeping the API open for icons, dropdown crumbs, and overflow menus.

## Usage

### Basic hyperlink trail

```svelte
<script>
  import { Breadcrumb } from '@juspay/svelte-ui-components';

  const items = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '', label: 'Laptops' }
  ];
</script>

<Breadcrumb {items} ariaLabel="Page navigation">
  {#snippet item(ctx)}
    {#if ctx.isLast}
      <span aria-current="page">{ctx.label}</span>
    {:else}
      <a href={ctx.href}>{ctx.label}</a>
    {/if}
  {/snippet}
</Breadcrumb>
```

### Icon inside a crumb

```svelte
<Breadcrumb {items} ariaLabel="Order navigation">
  {#snippet item(ctx)}
    {#if ctx.index === 0}
      <a href={ctx.href} style="display:inline-flex;align-items:center;gap:4px;">
        <HomeIcon />
        {ctx.label}
      </a>
    {:else if ctx.isLast}
      <span aria-current="page">{ctx.label}</span>
    {:else}
      <a href={ctx.href}>{ctx.label}</a>
    {/if}
  {/snippet}
</Breadcrumb>
```

### Custom separator snippet

```svelte
<Breadcrumb {items} ariaLabel="Page navigation">
  {#snippet item(ctx)}
    {#if ctx.isLast}
      <span aria-current="page">{ctx.label}</span>
    {:else}
      <a href={ctx.href}>{ctx.label}</a>
    {/if}
  {/snippet}
  {#snippet separator()}
    <ChevronRightIcon />
  {/snippet}
</Breadcrumb>
```

## Props

| Prop      | Type                               | Required | Default     | Description                                                                                                                                                |
| --------- | ---------------------------------- | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| items     | `readonly BreadcrumbItemData[]`    | Yes      | —           | Ordered array of `{ href, label }` data objects. The component renders one `<li>` per entry.                                                               |
| item      | `Snippet<[BreadcrumbItemContext]>` | Yes      | —           | Snippet called once per item. Receives `{ href, label, isLast, index }`. Consumer applies `aria-current="page"` on the last item.                          |
| ariaLabel | `string`                           | Yes      | —           | Value for the `<nav aria-label>` attribute. Provide an i18n-correct string (e.g. `"Breadcrumb"` or translated equivalent). No English default is baked in. |
| separator | `Snippet`                          | No       | `/` text    | Optional snippet rendered between items inside an `aria-hidden` `<li>`. Defaults to a plain `/` text node.                                                 |
| classes   | `string`                           | No       | `undefined` | Extra CSS classes appended to the `<nav>` element for consumer theming.                                                                                    |
| testId    | `string`                           | No       | `undefined` | Value for the `data-pw` attribute on the root `<nav>` element. Used for automated test selectors.                                                          |

### BreadcrumbItemData shape

| Field | Type     | Required | Description                                                         |
| ----- | -------- | -------- | ------------------------------------------------------------------- |
| href  | `string` | Yes      | URL for the crumb link. Pass `""` for the current page (last item). |
| label | `string` | Yes      | Display text for this breadcrumb entry.                             |

### BreadcrumbItemContext (snippet parameter)

| Field  | Type      | Description                                                                            |
| ------ | --------- | -------------------------------------------------------------------------------------- |
| href   | `string`  | The `href` value from the corresponding `BreadcrumbItemData`.                          |
| label  | `string`  | The `label` value from the corresponding `BreadcrumbItemData`.                         |
| isLast | `boolean` | `true` when this is the final item. Use to apply `aria-current="page"` in the snippet. |
| index  | `number`  | Zero-based position in the list. Useful for icon-on-first-item patterns.               |

## Snippets

| Snippet     | Parameters              | Description                                                                                                                                                                                                                            |
| ----------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `item`      | `BreadcrumbItemContext` | **Required.** Renders the content of each `<li>`. The snippet receives `{ href, label, isLast, index }`. The consumer is responsible for rendering an `<a href>` for non-last items and adding `aria-current="page"` to the last item. |
| `separator` | —                       | **Optional.** Renders the content of each inter-item separator `<li aria-hidden="true">`. Defaults to a `/` text node. Useful for chevron icons or custom glyphs.                                                                      |

## CSS Variables

| Variable                       | Default        | CSS Property | Description                                                                                                                           |
| ------------------------------ | -------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `--breadcrumb-list-gap`        | (unset)        | gap          | Gap between items and separators in the flex row. When unset the browser default (0) applies.                                         |
| `--breadcrumb-flex-wrap`       | `nowrap`       | flex-wrap    | Whether the trail wraps onto multiple lines.                                                                                          |
| `--breadcrumb-separator-color` | `currentColor` | color        | Color of the separator `<li>`. Only applies when using the default `/` text separator; custom separator snippets own their own color. |

## Consumer recipe — `aria-current="page"`

The component does not bake `aria-current="page"` onto any element — the `isLast` flag in the snippet context lets each consumer wire it on the exact element they render:

```svelte
{#snippet item(ctx)}
  {#if ctx.isLast}
    <!-- consumer adds aria-current here -->
    <span aria-current="page">{ctx.label}</span>
  {:else}
    <a href={ctx.href}>{ctx.label}</a>
  {/if}
{/snippet}
```

## Web Component

Tag: `<sui-breadcrumb>`

The web component exposes a built-in default item renderer (link for non-last items, `aria-current="page"` span for the last). For custom rendering, use the Svelte component directly.

```html
<sui-breadcrumb aria-label="Page navigation"></sui-breadcrumb>
<script>
  const el = document.querySelector('sui-breadcrumb');
  el.items = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '', label: 'Laptops' }
  ];
</script>
```
