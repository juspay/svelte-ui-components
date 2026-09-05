# Component Roadmap

> Building a comprehensive, themeable UI component library in Svelte 5.

---

## Inputs & Form Controls

| #   | Component    | Status             | Description                                                             |
| --- | ------------ | ------------------ | ----------------------------------------------------------------------- |
| 1   | Button       | :white_check_mark: | Trigger actions like form submissions or dialogs                        |
| 2   | Input        | :white_check_mark: | Single-line text input with validation                                  |
| 3   | Textarea     | :white_check_mark: | Multi-line text input (via `Input` with `useTextArea`)                  |
| 4   | Select       | :white_check_mark: | Dropdown list for picking a single option                               |
| 5   | Toggle       | :white_check_mark: | Boolean on/off switch                                                   |
| 6   | Checkbox     | :white_check_mark: | Check/uncheck control for boolean or multi-select choices               |
| 7   | Radio        | :white_check_mark: | Single selection from a group of options                                |
| 8   | Choicebox    | :white_check_mark: | Large-target radio/checkbox with extended tap area and detail text      |
| 9   | Combobox     | :white_check_mark: | Filterable dropdown with typeahead search                               |
| 10  | Multi Select | :white_check_mark: | Keyboard-navigable dropdown for selecting multiple items (via `Select`) |
| 11  | Slider       | :white_check_mark: | Range input for selecting a value within a min/max range                |
| 12  | Split Button | :white_check_mark: | Primary action button with a dropdown for secondary actions             |
| 13  | Feedback     | :x:                | Inline feedback collector with text input and emotion selector          |

---

## Display & Data

| #   | Component          | Status             | Description                                                      |
| --- | ------------------ | ------------------ | ---------------------------------------------------------------- |
| 14  | Badge              | :white_check_mark: | Label to highlight status or categorize items                    |
| 15  | Status             | :white_check_mark: | Colored dot indicator for deployment or process status           |
| 16  | Table              | :white_check_mark: | Semantic HTML table with sortable columns and row actions        |
| 17  | Avatar             | :white_check_mark: | User or team image with fallback initials and stacking support   |
| 18  | Code Block         | :x:                | Syntax-highlighted, copyable code display                        |
| 19  | Description        | :x:                | Heading + subheading block for contextual information            |
| 20  | Entity             | :x:                | Two-column row with content on the left and actions on the right |
| 21  | Gauge              | :white_check_mark: | Circular visual indicator for percentages                        |
| 22  | Pill               | :white_check_mark: | Small rounded label for categorization or filtering              |
| 23  | Snippet            | :white_check_mark: | Copyable command-line code snippet                               |
| 24  | Keyboard Input     | :white_check_mark: | Renders keyboard shortcut badges (e.g. `Ctrl+K`)                 |
| 25  | Relative Time Card | :white_check_mark: | Popover showing a date in the user's local timezone              |

---

## Feedback & Loading

| #   | Component    | Status             | Description                                             |
| --- | ------------ | ------------------ | ------------------------------------------------------- |
| 26  | Banner       | :white_check_mark: | Informational notice requiring user attention           |
| 27  | Loader       | :white_check_mark: | Spinner animation for background activity               |
| 28  | Toast        | :white_check_mark: | Temporary message notification                          |
| 29  | Error        | :x:                | Structured error message with clear guidance            |
| 30  | Loading Dots | :white_check_mark: | Animated dot sequence for inline loading indication     |
| 31  | Progress     | :white_check_mark: | Linear bar showing task completion or usage limits      |
| 32  | Skeleton     | :white_check_mark: | Placeholder shimmer while content loads (via `Shimmer`) |

---

## Overlays & Panels

| #   | Component    | Status             | Description                                                 |
| --- | ------------ | ------------------ | ----------------------------------------------------------- |
| 33  | Modal        | :white_check_mark: | Popup dialog for focused content or confirmations           |
| 34  | Command Menu | :white_check_mark: | Full-screen action palette triggered by keyboard shortcut   |
| 35  | Context Menu | :white_check_mark: | Right-click or long-press contextual action list            |
| 36  | Drawer       | :x:                | Panel that slides in from a screen edge                     |
| 37  | Menu         | :white_check_mark: | Dropdown action menu with typeahead and keyboard navigation |
| 38  | Sheet        | :white_check_mark: | Side panel sliding from left or right screen edge           |

---

## Navigation & Structure

| #   | Component  | Status             | Description                                       |
| --- | ---------- | ------------------ | ------------------------------------------------- |
| 39  | Accordion  | :white_check_mark: | Vertically stacked collapsible content sections   |
| 40  | Tabs       | :white_check_mark: | Tabbed content switcher with active state         |
| 41  | Pagination | :white_check_mark: | Page-level navigation with previous/next controls |
| 42  | Scroller   | :white_check_mark: | Overflowing horizontal or vertical item list      |
| 43  | Show More  | :x:                | Expand/collapse toggle for long content           |
| 44  | Calendar   | :white_check_mark: | Date or date-range picker                         |

---

## Layout & Containers

| #   | Component      | Status             | Description                                        |
| --- | -------------- | ------------------ | -------------------------------------------------- |
| 45  | Grid           | :white_check_mark: | Grid layout system (partially via `GridItem`)      |
| 46  | Material       | :x:                | Elevated surface with shadow and blur effects      |
| 47  | Empty State    | :white_check_mark: | Placeholder for areas with no content yet          |
| 48  | Project Banner | :x:                | Project-wide notification bar requiring resolution |
| 49  | Book           | :white_check_mark: | Responsive page-flip presentation component        |

---

## Tooltip & Contextual Info

| #   | Component    | Status             | Description                                 |
| --- | ------------ | ------------------ | ------------------------------------------- |
| 50  | Tooltip      | :white_check_mark: | Contextual info popover on hover or focus   |
| 51  | Context Card | :x:                | Rich popover card with detailed information |

---

## Device Frames

| #   | Component | Status             | Description                                      |
| --- | --------- | ------------------ | ------------------------------------------------ |
| 52  | Browser   | :white_check_mark: | Browser chrome wrapper for embedding screenshots |
| 53  | Phone     | :white_check_mark: | Phone frame wrapper for mobile screenshots       |

---

## Theming

| #   | Component      | Status             | Description                                 |
| --- | -------------- | ------------------ | ------------------------------------------- |
| 54  | Theme Switcher | :white_check_mark: | Toggle between light and dark color schemes |

---

## Summary

| Metric                              | Count |
| ----------------------------------- | ----- |
| **Total Components (this roadmap)** | 54    |
| **Available**                       | 44    |
| **To Build**                        | 10    |

---

## Existing Components (No Roadmap Changes)

These components predate this roadmap's scope and are retained as-is:

| Component          | Description                                |
| ------------------ | ------------------------------------------ |
| `Carousel`         | Image/content carousel slider              |
| `CheckListItem`    | Checklist row with completion status       |
| `Icon`             | SVG icon renderer                          |
| `IconStack`        | Layered icon display                       |
| `Img`              | Image with loading and error states        |
| `InputButton`      | Input field combined with an action button |
| `ListItem`         | Configurable list row with slots           |
| `ModalAnimation`   | Modal transition helper                    |
| `OverlayAnimation` | Overlay transition helper                  |
| `Step`             | Single step within a stepper               |
| `Stepper`          | Multi-step progress indicator              |
| `Toolbar`          | Grouped action bar                         |

---

## Shipped Since This Roadmap Was Written

This roadmap was added in the same commit as the MCP server (`2eec1ad`, 2026-02-18) and,
until this update, had not been touched since — including through `BZ-49010` two weeks
later, which alone shipped 27 of the components marked "to build" above. These 36
components exist and ship today but were never added to this file:

**Charts:** `AreaChart`, `BarChart`, `DualAxisBarChart`, `FunnelChart`, `LineChart`, `PieChart`, `SankeyChart`

**Chat & agent UX:** `Chat`, `ChatBubble`, `ChatComposer`, `ChatHeader`, `ChatMessage`, `ChatMessageList`, `ChatSuggestions`, `ChatToolStatus`, `AttachmentChipRow`, `ChipInput`, `FileDropzoneTrigger`, `HITL`, `TaskList`, `ThinkingIndicator`, `ToolCallLog`, `TypewriterText`

**Other:** `BrandLoader`, `Breadcrumb`, `Card`, `ColorPicker`, `DateRangePicker`, `DeltaIndicator`, `FileInput`, `IframeViewer`, `LottiePlayer`, `ProportionBar`, `Resizable`, `SplitInput`, `StatCard`

Also shipped and documented, but not single-file Svelte components in the traditional
sense (utility/service modules rather than markup): `SoundKit`, `SpeechToText`.

Every documented component now has an entry in `docs/_index.json`, and a unit test
(`src/lib/docs-index.test.ts`) fails the build if a `docs/<Component>.md` for an exported
component is ever left out again — the MCP server's `get_component_docs` tool can only
surface what is indexed.

**Added during the 2026-08-31 → 09-04 gap review:** `Draggable`, `Gallery`,
`MediaPlayer`, `MediaUpload`; `Modal.lockScroll` / `Modal.autoDismissAfter`;
`Choicebox.showIndicator`. `MarkdownText` and `Resizable` also ship and are documented.
