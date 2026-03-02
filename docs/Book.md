# Book

A page-flip presentation component that displays content in a book-like format with page navigation. Pages are provided as an array of `BookPage` objects or as `children` snippet content. Supports previous/next arrow navigation, clickable page indicator dots, keyboard navigation (ArrowLeft/ArrowRight), and optional swipe/drag gestures. The `currentPage` prop is bindable for two-way page tracking. Transitions between pages can be "slide" (default), "fade", or "none".

## Usage

```svelte
<script>
  import { Book } from '@juspay/svelte-ui-components';
</script>

<Book
  pages={[
    { content: myPageSnippet1, title: 'Introduction' },
    { content: myPageSnippet2, title: 'Details' }
  ]}
/>
```

## Props

| Prop              | Type             | Required | Default   | Description                                                                                                                                                                                                                |
| ----------------- | ---------------- | -------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pages             | `BookPage[]`     | Yes      | `-`       | Array of BookPage objects. Each contains a Snippet for the page content and an optional title string.                                                                                                                      |
| currentPage       | `number`         | No       | `0`       | The 0-indexed page currently displayed. Bindable for two-way sync with parent.                                                                                                                                             |
| transition        | `BookTransition` | No       | `'slide'` | Animation style when changing pages. "slide" translates horizontally, "fade" cross-fades, "none" switches instantly.                                                                                                       |
| showNavigation    | `boolean`        | No       | `true`    | When true, shows previous/next arrow buttons on the left and right sides of the book.                                                                                                                                      |
| showPageIndicator | `boolean`        | No       | `true`    | When true, shows clickable dot indicators below the book for direct page navigation.                                                                                                                                       |
| enableSwipe       | `boolean`        | No       | `false`   | When true, enables touch swipe and mouse drag gestures (20px threshold) to navigate between pages.                                                                                                                         |
| testId            | `string`         | No       | `-`       | Test identifier applied as `data-pw` on the root element.                                                                                                                                                                  |
| classes           | `string`         | No       | `-`       | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides (e.g., `.btn-primary { --button-color: #0070f3; }`) and pass them to create variant styles. |

## Events

| Event        | Type                     | Description                                                                   |
| ------------ | ------------------------ | ----------------------------------------------------------------------------- |
| onpagechange | `(page: number) => void` | Fires after the current page changes. Receives the new 0-indexed page number. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                      | Default               | CSS Property        | Description                                               |
| ----------------------------- | --------------------- | ------------------- | --------------------------------------------------------- |
| `--book-width`                | `100%`                | width               | Width of the book container.                              |
| `--book-height`               | `400px`               | height              | Height of the page content area.                          |
| `--book-background`           | `#ffffff`             | background-color    | Background color of the book container.                   |
| `--book-border-radius`        | `8px`                 | border-radius       | Corner rounding of the book container.                    |
| `--book-border`               | `1px solid #e0e0e0`   | border              | Border of the book container.                             |
| `--book-overflow`             | `hidden`              | overflow            | Overflow behavior of the page content area.               |
| `--book-transition-duration`  | `0.3s`                | transition-duration | Duration of the page transition animation.                |
| `--book-nav-size`             | `36px`                | width/height        | Size of the navigation arrow buttons.                     |
| `--book-nav-background`       | `rgba(0, 0, 0, 0.05)` | background-color    | Background color of the navigation arrow buttons.         |
| `--book-nav-hover-background` | `rgba(0, 0, 0, 0.1)`  | background-color    | Background color of the navigation arrows on hover.       |
| `--book-nav-color`            | `#333333`             | stroke              | Color of the navigation arrow SVG icons.                  |
| `--book-nav-border-radius`    | `50%`                 | border-radius       | Corner rounding of the navigation arrow buttons.          |
| `--book-nav-disabled-opacity` | `0.3`                 | opacity             | Opacity of navigation arrows when at the first/last page. |
| `--book-dot-size`             | `8px`                 | width/height        | Size of each page indicator dot.                          |
| `--book-dot-gap`              | `8px`                 | gap                 | Gap between page indicator dots.                          |
| `--book-dot-color`            | `#cccccc`             | background-color    | Color of inactive page indicator dots.                    |
| `--book-dot-active-color`     | `#333333`             | background-color    | Color of the active page indicator dot.                   |
| `--book-dot-border-radius`    | `50%`                 | border-radius       | Corner rounding of page indicator dots.                   |
| `--book-indicator-padding`    | `12px 0`              | padding             | Padding around the page indicator dots container.         |

## Type Reference

Custom types used by this component's props and events:

### BookPage

```typescript
type BookPage = { content: Snippet; title?: string };
```

### BookTransition

```typescript
type BookTransition = 'slide' | 'fade' | 'none';
```
