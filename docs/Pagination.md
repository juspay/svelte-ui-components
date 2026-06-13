# Pagination

Page-level navigation with numbered page buttons, prev/next controls, and ellipsis for large page ranges. The `currentPage` prop is bindable and `siblingCount` controls how many pages are shown around the active page. Ellipsis indicators appear automatically when pages are truncated. The `hasMore` prop supports cursor-based APIs where the total page count is unknown — when true, the next button stays enabled even when `currentPage` reaches `totalPages`. Individual prev/next buttons can be targeted in tests via `prevButtonTestId` and `nextButtonTestId`.

## Usage

```svelte
<script>
  import { Pagination } from '@juspay/svelte-ui-components';
</script>

<Pagination totalPages={10} />
```

## Props

| Prop             | Type      | Required | Default | Description                                                                                                                                                                                                                                                                                                            |
| ---------------- | --------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| totalPages       | `number`  | Yes      | `-`     | The total number of pages available. Determines the range of page buttons rendered.                                                                                                                                                                                                                                    |
| currentPage      | `number`  | No       | `1`     | Bindable. The currently active page number. Controls which page button is highlighted and determines prev/next button disabled states.                                                                                                                                                                                 |
| siblingCount     | `number`  | No       | `1`     | Number of page buttons to show on each side of the current page. For example, siblingCount=1 with currentPage=5 shows pages 4, 5, 6. Higher values show more surrounding pages.                                                                                                                                        |
| disabled         | `boolean` | No       | `false` | Whether the entire pagination is disabled. When true, all buttons become non-interactive, the container dims (opacity 0.5), and the cursor changes to not-allowed.                                                                                                                                                     |
| testId           | `string`  | No       | `-`     | Value for the `data-pw` attribute on the nav container, used for end-to-end testing selectors.                                                                                                                                                                                                                         |
| classes          | `string`  | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                                                                                                                 |
| hasMore          | `boolean` | No       | `false` | Cursor / load-more mode. When `true`, the next button stays enabled past `currentPage >= totalPages`; on the last known page it becomes a load-more CTA (see `onLoadMore`). `totalPages` precedence: the plain next-button is enabled only if `hasMore` is `true` OR `currentPage < totalPages`. |
| prevButtonTestId | `string`  | No       | `-`     | Value for the `data-pw` attribute on the previous-page button, used for end-to-end testing selectors.                                                                                                                                                                                                                  |
| nextButtonTestId | `string`  | No       | `-`     | Value for the `data-pw` attribute on the next-page button (and the load-more CTA in cursor mode), used for end-to-end testing selectors.                                                                                                                                                                                |

## Events

| Event      | Type                     | Description                                                                                                                                                                                                                      |
| ---------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onchange   | `(page: number) => void` | Fires when a new page is selected via page button or prev/next click. Receives the new page number. Does NOT fire when clicking the already-active page, when disabled, or when clicking prev on page 1 / next on the last page. |
| onLoadMore | `() => void`             | Fires when the load-more CTA is clicked (cursor mode). Use this to fetch the next page of data and increment `totalPages`.                                                                                                       |

## CSS Variables

Override these custom properties to theme the component.

### Container

| Variable                   | Default  | CSS Property | Description                                                  |
| -------------------------- | -------- | ------------ | ------------------------------------------------------------ |
| `--pagination-display`     | `flex`   | display      | Display mode of the pagination container.                    |
| `--pagination-gap`         | `4px`    | gap          | Gap between page buttons, ellipsis, and prev/next controls.  |
| `--pagination-align-items` | `center` | align-items  | Vertical alignment of items within the pagination container. |

### Page Buttons

| Variable                            | Default             | CSS Property  | Description                        |
| ----------------------------------- | ------------------- | ------------- | ---------------------------------- |
| `--pagination-button-padding`       | `6px 10px`          | padding       | Inner padding of each page button. |
| `--pagination-button-font-size`     | `14px`              | font-size     | Font size of page button labels.   |
| `--pagination-button-font-weight`   | `400`               | font-weight   | Font weight of page button labels. |
| `--pagination-button-font-family`   | `inherit`           | font-family   | Font family of page button labels. |
| `--pagination-button-color`         | `#3a4550`           | color         | Text color of page buttons.        |
| `--pagination-button-background`    | `transparent`       | background    | Background color of page buttons.  |
| `--pagination-button-border`        | `1px solid #d1d5db` | border        | Border style of page buttons.      |
| `--pagination-button-border-radius` | `4px`               | border-radius | Corner rounding of page buttons.   |
| `--pagination-button-cursor`        | `pointer`           | cursor        | Cursor style on page buttons.      |
| `--pagination-button-min-width`     | `36px`              | min-width     | Minimum width of each page button. |
| `--pagination-button-height`        | `36px`              | height        | Height of each page button.        |

### Active Page

| Variable                          | Default             | CSS Property | Description                                            |
| --------------------------------- | ------------------- | ------------ | ------------------------------------------------------ |
| `--pagination-active-color`       | `#ffffff`           | color        | Text color of the currently active page button.        |
| `--pagination-active-background`  | `#3a4550`           | background   | Background color of the currently active page button.  |
| `--pagination-active-border`      | `1px solid #3a4550` | border       | Border style of the currently active page button.      |
| `--pagination-active-font-weight` | `600`               | font-weight  | Font weight of the currently active page button label. |

### Hover State

| Variable                               | Default   | CSS Property | Description                                                           |
| -------------------------------------- | --------- | ------------ | --------------------------------------------------------------------- |
| `--pagination-button-hover-color`      | `#111827` | color        | Text color of page buttons on hover (non-active, non-disabled).       |
| `--pagination-button-hover-background` | `#f3f4f6` | background   | Background color of page buttons on hover (non-active, non-disabled). |

### Disabled State

| Variable                        | Default       | CSS Property | Description                                                                                    |
| ------------------------------- | ------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `--pagination-disabled-opacity` | `0.5`         | opacity      | Opacity applied to the pagination container when disabled, and to individual disabled buttons. |
| `--pagination-disabled-cursor`  | `not-allowed` | cursor       | Cursor shown on the pagination container when disabled, and on individual disabled buttons.    |

### Ellipsis

| Variable                          | Default   | CSS Property | Description                                               |
| --------------------------------- | --------- | ------------ | --------------------------------------------------------- |
| `--pagination-ellipsis-color`     | `#6b7280` | color        | Text color of the ellipsis indicator between page ranges. |
| `--pagination-ellipsis-font-size` | `14px`    | font-size    | Font size of the ellipsis indicator.                      |

### Load-more Button

| Variable                                  | Default       | CSS Property   | Description                                               |
| ----------------------------------------- | ------------- | -------------- | --------------------------------------------------------- |
| `--pagination-load-more-width`            | `auto`        | width          | Width of the load-more CTA button.                        |
| `--pagination-load-more-padding`          | `6px 14px`    | padding        | Padding of the load-more CTA button.                      |
| `--pagination-load-more-color`            | `#3a4550`     | color          | Text color of the load-more CTA button.                   |
| `--pagination-load-more-background`       | `transparent` | background     | Background of the load-more CTA button.                   |
| `--pagination-load-more-border-color`     | `#d1d5db`     | border-color   | Border color of the load-more CTA button.                 |
| `--pagination-load-more-hover-color`      | `#111827`     | color (hover)  | Text color of the load-more CTA button on hover.          |
| `--pagination-load-more-hover-background` | `#f3f4f6`     | background (hover) | Background of the load-more CTA button on hover.      |

### Transition

| Variable                  | Default                                   | CSS Property | Description                                                        |
| ------------------------- | ----------------------------------------- | ------------ | ------------------------------------------------------------------ |
| `--pagination-transition` | `background 0.15s ease, color 0.15s ease` | transition   | Transition applied to page buttons for hover/active state changes. |

## Cursor / Load-more mode

Set `hasMore` to `true` when your data source uses cursor-based pagination and you do not yet know the total page count. When the user reaches the last known page, the next-button is replaced by a load-more CTA (styled via `--pagination-load-more-*` CSS variables). Clicking it fires `onLoadMore`; your handler fetches the next batch and increments `totalPages`.

```svelte
<script>
  import { Pagination } from '@juspay/svelte-ui-components';

  let currentPage = $state(1);
  let totalPages = $state(3);
  let hasMore = $state(true);

  async function handleLoadMore() {
    const nextBatch = await fetchNextPage();
    totalPages = totalPages + 1;
    if (!nextBatch.hasNextPage) {
      hasMore = false;
    }
  }
</script>

<Pagination
  {totalPages}
  bind:currentPage
  {hasMore}
  onLoadMore={handleLoadMore}
/>
```

## Consumer recipes

Features like a page-size selector and an item-range summary ("Showing X–Y of N") are intentionally not built into this component — they are consumer recipes that sit around `<Pagination>` and do not require library primitives. The following pattern shows a complete data-table paginator with those features:

```svelte
<script>
  import { Pagination, Select } from '@juspay/svelte-ui-components';

  let currentPage = $state(1);
  let pageSize = $state(10);
  const totalItems = 237;
  let totalPages = $derived(Math.max(1, Math.ceil(totalItems / pageSize)));

  const pageSizeItems = [5, 10, 25, 50].map((n) => ({ id: String(n), label: String(n) }));

  function handlePageSizeChange(value) {
    const next = parseInt(value?.[0] ?? '', 10);
    if (!Number.isNaN(next) && next > 0) {
      pageSize = next;
      currentPage = 1;
    }
  }

  let rangeStart = $derived((currentPage - 1) * pageSize + 1);
  let rangeEnd = $derived(Math.min(currentPage * pageSize, totalItems));
</script>

<div class="paginator-bar">
  <span class="paginator-summary">
    Showing
    <Select items={pageSizeItems} value={[String(pageSize)]} onchange={handlePageSizeChange} />
    of {totalItems}
  </span>
  <Pagination {totalPages} bind:currentPage />
</div>

<!-- Item-range only (no selector) -->
<div class="paginator-bar">
  <span class="paginator-summary">Showing {rangeStart}–{rangeEnd} of {totalItems}</span>
  <Pagination {totalPages} bind:currentPage />
</div>
```

## Web Component

Tag: `<sui-pagination>`

```html
<sui-pagination total-pages="10" current-page="1"></sui-pagination>

<!-- cursor / load-more mode with test IDs -->
<sui-pagination
  total-pages="3"
  current-page="1"
  has-more="true"
  prev-button-test-id="prev-btn"
  next-button-test-id="next-btn"
></sui-pagination>
```
