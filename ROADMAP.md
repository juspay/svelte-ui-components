# Component Roadmap

> Building a comprehensive, themeable UI component library in Svelte 5.

---

## Inputs & Form Controls

| # | Component | Status | Description |
| --- | --- | --- | --- |
| 1 | Button | :white_check_mark: | Trigger actions like form submissions or dialogs |
| 2 | Input | :white_check_mark: | Single-line text input with validation |
| 3 | Textarea | :white_check_mark: | Multi-line text input (via `Input` with `useTextArea`) |
| 4 | Select | :white_check_mark: | Dropdown list for picking a single option |
| 5 | Toggle | :white_check_mark: | Boolean on/off switch |
| 6 | Checkbox | :x: | Check/uncheck control for boolean or multi-select choices |
| 7 | Radio | :x: | Single selection from a group of options |
| 8 | Choicebox | :x: | Large-target radio/checkbox with extended tap area and detail text |
| 9 | Combobox | :x: | Filterable dropdown with typeahead search |
| 10 | Multi Select | :x: | Keyboard-navigable dropdown for selecting multiple items |
| 11 | Slider | :x: | Range input for selecting a value within a min/max range |
| 12 | Split Button | :x: | Primary action button with a dropdown for secondary actions |
| 13 | Feedback | :x: | Inline feedback collector with text input and emotion selector |

---

## Display & Data

| # | Component | Status | Description |
| --- | --- | --- | --- |
| 14 | Badge | :white_check_mark: | Label to highlight status or categorize items |
| 15 | Status | :white_check_mark: | Colored dot indicator for deployment or process status |
| 16 | Table | :white_check_mark: | Semantic HTML table with sortable columns and row actions |
| 17 | Avatar | :x: | User or team image with fallback initials and stacking support |
| 18 | Code Block | :x: | Syntax-highlighted, copyable code display |
| 19 | Description | :x: | Heading + subheading block for contextual information |
| 20 | Entity | :x: | Two-column row with content on the left and actions on the right |
| 21 | Gauge | :x: | Circular visual indicator for percentages |
| 22 | Pill | :x: | Small rounded label for categorization or filtering |
| 23 | Snippet | :x: | Copyable command-line code snippet |
| 24 | Keyboard Input | :x: | Renders keyboard shortcut badges (e.g. `Ctrl+K`) |
| 25 | Relative Time Card | :x: | Popover showing a date in the user's local timezone |

---

## Feedback & Loading

| # | Component | Status | Description |
| --- | --- | --- | --- |
| 26 | Banner | :white_check_mark: | Informational notice requiring user attention |
| 27 | Loader | :white_check_mark: | Spinner animation for background activity |
| 28 | Toast | :white_check_mark: | Temporary message notification |
| 29 | Error | :x: | Structured error message with clear guidance |
| 30 | Loading Dots | :x: | Animated dot sequence for inline loading indication |
| 31 | Progress | :x: | Linear bar showing task completion or usage limits |
| 32 | Skeleton | :x: | Placeholder shimmer while content loads |

---

## Overlays & Panels

| # | Component | Status | Description |
| --- | --- | --- | --- |
| 33 | Modal | :white_check_mark: | Popup dialog for focused content or confirmations |
| 34 | Command Menu | :x: | Full-screen action palette triggered by keyboard shortcut |
| 35 | Context Menu | :x: | Right-click or long-press contextual action list |
| 36 | Drawer | :x: | Panel that slides in from a screen edge |
| 37 | Menu | :x: | Dropdown action menu with typeahead and keyboard navigation |
| 38 | Sheet | :x: | Side panel sliding from left or right screen edge |

---

## Navigation & Structure

| # | Component | Status | Description |
| --- | --- | --- | --- |
| 39 | Accordion | :white_check_mark: | Vertically stacked collapsible content sections |
| 40 | Tabs | :x: | Tabbed content switcher with active state |
| 41 | Pagination | :x: | Page-level navigation with previous/next controls |
| 42 | Scroller | :x: | Overflowing horizontal or vertical item list |
| 43 | Show More | :x: | Expand/collapse toggle for long content |
| 44 | Calendar | :x: | Date or date-range picker |

---

## Layout & Containers

| # | Component | Status | Description |
| --- | --- | --- | --- |
| 45 | Grid | :white_check_mark: | Grid layout system (partially via `GridItem`) |
| 46 | Material | :x: | Elevated surface with shadow and blur effects |
| 47 | Empty State | :x: | Placeholder for areas with no content yet |
| 48 | Project Banner | :x: | Project-wide notification bar requiring resolution |
| 49 | Book | :x: | Responsive page-flip presentation component |

---

## Tooltip & Contextual Info

| # | Component | Status | Description |
| --- | --- | --- | --- |
| 50 | Tooltip | :x: | Contextual info popover on hover or focus |
| 51 | Context Card | :x: | Rich popover card with detailed information |

---

## Device Frames

| # | Component | Status | Description |
| --- | --- | --- | --- |
| 52 | Browser | :x: | Browser chrome wrapper for embedding screenshots |
| 53 | Phone | :x: | Phone frame wrapper for mobile screenshots |

---

## Theming

| # | Component | Status | Description |
| --- | --- | --- | --- |
| 54 | Theme Switcher | :x: | Toggle between light and dark color schemes |

---

## Summary

| Metric | Count |
| --- | --- |
| **Total Components** | 54 |
| **Available** | 14 |
| **To Build** | 40 |

---

## Existing Components (No Roadmap Changes)

These components are already in the library and are retained as-is:

| Component | Description |
| --- | --- |
| `BrandLoader` | Branded loading animation |
| `Carousel` | Image/content carousel slider |
| `CheckListItem` | Checklist row with completion status |
| `Icon` | SVG icon renderer |
| `IconStack` | Layered icon display |
| `Img` | Image with loading and error states |
| `InputButton` | Input field combined with an action button |
| `ListItem` | Configurable list row with slots |
| `ModalAnimation` | Modal transition helper |
| `OverlayAnimation` | Overlay transition helper |
| `Step` | Single step within a stepper |
| `Stepper` | Multi-step progress indicator |
| `Toolbar` | Grouped action bar |
