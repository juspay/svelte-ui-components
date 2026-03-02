# @juspay/svelte-ui-components

A themeable Svelte 5 component library where **every visual property is a CSS custom property**. Build any design system on top — no source changes needed.

```bash
npm install @juspay/svelte-ui-components
```

Requires `svelte ^5.41.2` and `type-decoder ^2.1.0` as peer dependencies.

---

## Why This Library?

Most component libraries ship with a fixed look. Changing it means fighting overrides, patching internals, or forking.

This library takes a different approach: **components are unstyled by default** and expose every visual decision — colors, spacing, typography, borders, shadows, radii — as CSS custom properties. You define the design system. The components render it.

```svelte
<!-- A button that looks however you want -->
<div class="my-theme">
  <Button text="Continue" onclick={handleClick} />
</div>

<style>
  .my-theme {
    --button-color: #000;
    --button-text-color: #fff;
    --button-border-radius: 8px;
    --button-padding: 12px 24px;
    --button-font-size: 14px;
    --button-font-weight: 600;
    --button-hover-color: #222;
    --button-border: 1px solid #333;
  }
</style>
```

---

## Quick Start

```svelte
<script lang="ts">
  import { Button, Input, Toggle, Toast } from '@juspay/svelte-ui-components';
</script>

<!-- Basic button -->
<Button text="Submit" onclick={() => console.log('clicked')} />

<!-- Input with validation -->
<Input
  value=""
  placeholder="Enter email"
  dataType="email"
  onStateChange={(state) => console.log(state)}
/>

<!-- Toggle switch -->
<Toggle checked={false} text="Dark mode" onclick={(val) => console.log(val)} />
```

---

## Components

### Inputs & Form Controls

| Component       | Description                                                                                                                        | Docs                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **Button**      | Action trigger with circular loader, progress bar, icon/children snippets, and aria-expanded support.                              | [docs](docs/Button.md)      |
| **Input**       | Text field with built-in validation for email, phone, password, and custom patterns. Supports text transformers and textarea mode. | [docs](docs/Input.md)       |
| **InputButton** | Input field fused with action buttons — for search bars, OTP entry, coupon codes.                                                  | [docs](docs/InputButton.md) |
| **Select**      | Dropdown picker with single-select (with search), multi-select (checkboxes + Select All + Apply), and custom content slots.        | [docs](docs/Select.md)      |
| **Toggle**      | Labeled on/off switch with sliding ball animation.                                                                                 | [docs](docs/Toggle.md)      |
| **Checkbox**    | Styled checkbox input with custom SVG checkmark.                                                                                   | [docs](docs/Checkbox.md)    |
| **Radio**       | Styled radio button with custom circular indicator.                                                                                | [docs](docs/Radio.md)       |
| **Slider**      | Range slider with configurable min, max, step, and optional value display.                                                         | [docs](docs/Slider.md)      |
| **Choicebox**   | Selectable option group with single-select (radio) or multi-select (checkbox) behavior and custom content.                         | [docs](docs/Choicebox.md)   |

### Display & Data

| Component        | Description                                                                                     | Docs                         |
| ---------------- | ----------------------------------------------------------------------------------------------- | ---------------------------- |
| **Avatar**       | Circular avatar with image (Img with fallback) or text initial.                                 | [docs](docs/Avatar.md)       |
| **Badge**        | Icon with a numeric/text badge overlay in the corner.                                           | [docs](docs/Badge.md)        |
| **GridItem**     | Grid cell with icon, label, and loading overlay animation.                                      | [docs](docs/GridItem.md)     |
| **Icon**         | Clickable icon with optional text label.                                                        | [docs](docs/Icon.md)         |
| **IconStack**    | Layered horizontal stack of overlapping circular icons/avatars.                                 | [docs](docs/IconStack.md)    |
| **Img**          | Image with automatic fallback on load error.                                                    | [docs](docs/Img.md)          |
| **ListItem**     | Multi-section list row with images, labels, and accordion expansion.                            | [docs](docs/ListItem.md)     |
| **Pill**         | Compact label/tag for status or categories, optionally clickable with a11y.                     | [docs](docs/Pill.md)         |
| **Status**       | Full-screen status display for success/failure screens.                                         | [docs](docs/Status.md)       |
| **Table**        | Sortable data table with sticky headers and per-cell scrolling.                                 | [docs](docs/Table.md)        |
| **RelativeTime** | Auto-updating relative time display ("5 minutes ago") with locale support and optional tooltip. | [docs](docs/RelativeTime.md) |

### Feedback & Loading

| Component       | Description                                                                                     | Docs                        |
| --------------- | ----------------------------------------------------------------------------------------------- | --------------------------- |
| **Banner**      | Sticky notification banner with icon snippet, dismiss button, link text, and click interaction. | [docs](docs/Banner.md)      |
| **BrandLoader** | Full-screen branded splash/loading animation.                                                   | [docs](docs/BrandLoader.md) |
| **Loader**      | Circular spinner with gradient foreground.                                                      | [docs](docs/Loader.md)      |
| **LoadingDots** | Animated inline dot sequence with bounce/pulse animations.                                      | [docs](docs/LoadingDots.md) |
| **Shimmer**     | Loading placeholder with animated shimmer effect. All visuals via CSS variables.                | [docs](docs/Shimmer.md)     |
| **Toast**       | Animated slide-in notification with type variants and auto-dismiss.                             | [docs](docs/Toast.md)       |
| **Progress**    | Horizontal progress bar with animated fill.                                                     | [docs](docs/Progress.md)    |
| **Gauge**       | Semicircular gauge/meter with configurable segments and animated value.                         | [docs](docs/Gauge.md)       |

### Overlays & Panels

| Component            | Description                                                                                                   | Docs                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **Modal**            | Dialog overlay with configurable size, alignment, header, footer, transitions, and back-press support.        | [docs](docs/Modal.md)            |
| **ModalAnimation**   | Fly/fade transition wrapper for modal content.                                                                | [docs](docs/ModalAnimation.md)   |
| **OverlayAnimation** | Fade transition wrapper for overlay backgrounds.                                                              | [docs](docs/OverlayAnimation.md) |
| **Sheet**            | Slide-in panel from any edge (left/right/top/bottom) with header, scrollable content, footer, and focus trap. | [docs](docs/Sheet.md)            |
| **CommandMenu**      | Command palette (Ctrl+K) with fuzzy search, grouped commands, and keyboard navigation.                        | [docs](docs/CommandMenu.md)      |
| **ContextMenu**      | Right-click context menu with nested submenus, separators, and keyboard navigation.                           | [docs](docs/ContextMenu.md)      |
| **Menu**             | Dropdown action menu with keyboard navigation, typeahead, disabled/danger items, and separators.              | [docs](docs/Menu.md)             |
| **Tooltip**          | Hover-triggered tooltip with configurable position and delay.                                                 | [docs](docs/Tooltip.md)          |

### Navigation & Structure

| Component         | Description                                                                                    | Docs                          |
| ----------------- | ---------------------------------------------------------------------------------------------- | ----------------------------- |
| **Accordion**     | Expandable/collapsible container with CSS grid animation.                                      | [docs](docs/Accordion.md)     |
| **Carousel**      | Horizontal content slider with swipe and pagination dots.                                      | [docs](docs/Carousel.md)      |
| **CheckListItem** | Checklist row with checkbox, label, and toggleable checked state.                              | [docs](docs/CheckListItem.md) |
| **Pagination**    | Page navigation with previous/next buttons and numbered page links.                            | [docs](docs/Pagination.md)    |
| **Scroller**      | Overflowing item list with arrow navigation, gradient edges, drag-to-scroll, and snap support. | [docs](docs/Scroller.md)      |
| **Stepper**       | Multi-step progress indicator with completed, active, and pending states.                      | [docs](docs/Stepper.md)       |
| **Step**          | Individual step within a Stepper — renders number, label, and connector.                       | [docs](docs/Step.md)          |
| **Tabs**          | Tabbed interface with animated active indicator.                                               | [docs](docs/Tabs.md)          |
| **Toolbar**       | Fixed header bar with back button, title, and customizable content areas.                      | [docs](docs/Toolbar.md)       |

### Actions

| Component         | Description                                                               | Docs                          |
| ----------------- | ------------------------------------------------------------------------- | ----------------------------- |
| **Snippet**       | Copyable command-line snippet with prompt prefix and copy button.         | [docs](docs/Snippet.md)       |
| **SplitButton**   | Primary action button with dropdown secondary actions via Menu component. | [docs](docs/SplitButton.md)   |
| **KeyboardInput** | Keyboard shortcut display with styled key caps.                           | [docs](docs/KeyboardInput.md) |
| **ThemeSwitcher** | Segmented control for light/dark/system theme switching.                  | [docs](docs/ThemeSwitcher.md) |

### Decorative

| Component   | Description                                      | Docs                    |
| ----------- | ------------------------------------------------ | ----------------------- |
| **Book**    | 3D book display with animated page turning.      | [docs](docs/Book.md)    |
| **Browser** | Browser window chrome frame for content display. | [docs](docs/Browser.md) |
| **Phone**   | Smartphone device frame for app previews.        | [docs](docs/Phone.md)   |

---

## Theming

### How It Works

Every component reads its visual properties from CSS custom properties with sensible defaults. To create a theme, define the variables on any ancestor element:

```css
/* theme.css */
.my-design-system {
  /* Button */
  --button-color: #0070f3;
  --button-text-color: #fff;
  --button-border-radius: 6px;
  --button-padding: 10px 20px;
  --button-font-family: 'Inter', sans-serif;
  --button-font-size: 14px;
  --button-hover-color: #0060df;

  /* Input */
  --input-background: #fafafa;
  --input-border: 1px solid #eaeaea;
  --input-radius: 6px;
  --input-font-family: 'Inter', sans-serif;
  --input-focus-border: 1px solid #0070f3;

  /* Toast */
  --toast-border-radius: 8px;
  --toast-font-family: 'Inter', sans-serif;
  --toast-success-background-color: #0070f3;

  /* Modal */
  --modal-border-radius: 12px;
  --modal-content-background-color: #fff;
  --background-color: #00000066;
}
```

```svelte
<div class="my-design-system">
  <Button text="Save" onclick={save} />
  <Input value="" placeholder="Search..." />
</div>
```

### Scoped Theming

Because CSS variables cascade, you can scope different themes to different parts of your app:

```svelte
<div class="light-theme">
  <Button text="Light" onclick={handleClick} />
</div>

<div class="dark-theme">
  <Button text="Dark" onclick={handleClick} />
</div>

<style>
  .light-theme {
    --button-color: #fff;
    --button-text-color: #000;
    --button-border: 1px solid #eaeaea;
  }
  .dark-theme {
    --button-color: #111;
    --button-text-color: #fff;
    --button-border: 1px solid #333;
  }
</style>
```

### CSS Variable Reference

Each component documents its full set of CSS variables in the [docs/](docs/) directory. The variable naming convention follows the pattern:

```
--{component}-{element}-{property}
```

For example:

- `--button-color` — button background color
- `--input-error-msg-text-color` — input error message text color
- `--modal-footer-primary-button-border-radius` — border radius of the primary button inside a modal footer
- `--toast-success-background-color` — background color for success variant toasts

---

## Props & Types

Components use a typed props pattern split into mandatory, optional, and event properties:

```typescript
// Every component follows this pattern
type ButtonProperties = OptionalButtonProperties & ButtonEventProperties;

type OptionalButtonProperties = {
  text?: string;
  enable?: boolean;
  disabled?: boolean;
  showLoader?: boolean;
  loaderType?: 'Circular' | 'ProgressBar';
  type?: 'submit' | 'reset' | 'button';
  icon?: Snippet;
  children?: Snippet;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  // ...
};

type ButtonEventProperties = {
  onclick?: (event: MouseEvent) => void;
  onkeyup?: (event: KeyboardEvent) => void;
};
```

All types are exported from the package:

```typescript
import type {
  ButtonProperties,
  InputProperties,
  ModalProperties,
  SelectProperties,
  ToastProperties,
  MenuItem,
  SheetSide
  // ...
} from '@juspay/svelte-ui-components';
```

---

## Svelte 5 Patterns

This library is built on Svelte 5 and uses its modern APIs:

- **`$props()`** for declaring component properties
- **`$state()`** and **`$derived()`** for reactive state
- **`$bindable()`** for two-way bound props (e.g., `Sheet.open`, `Banner.visible`, `Button.showProgressBar`)
- **`Snippet`** for composable content slots (e.g., `Button.icon`, `Sheet.content`, `Banner.rightContent`)

```svelte
<script lang="ts">
  import { Sheet } from '@juspay/svelte-ui-components';

  let open = $state(false);
</script>

<button onclick={() => (open = true)}>Open</button>

<Sheet bind:open title="Settings" side="right">
  {#snippet content()}
    <p>Sheet body goes here.</p>
  {/snippet}
  {#snippet footer()}
    <button onclick={() => (open = false)}>Done</button>
  {/snippet}
</Sheet>
```

---

## MCP Server

An MCP (Model Context Protocol) server ships as a separate package for AI-assisted development:

```bash
npm install @juspay/svelte-ui-components-mcp
```

It provides full component documentation — props, events, CSS variables, type references — through a standard MCP tool interface. Useful for integrating component knowledge into AI coding assistants.

---

## Development

```bash
pnpm install       # install dependencies
pnpm dev           # start dev server with hot reload
pnpm build         # build the library (vite + svelte-package + publint)
pnpm test          # run integration + unit tests
pnpm lint          # check formatting and lint rules
pnpm format        # auto-format source files
```

### Project Structure

```
src/lib/
  {Component}/
    {Component}.svelte     # component implementation
    properties.ts          # prop type definitions
  types.ts                 # shared types (ValidationState, InputDataType, etc.)
  utils.ts                 # shared utilities (validateInput, createDebouncer)
  index.ts                 # public exports

docs/                      # component documentation (one markdown file per component)
mcp/                       # MCP server package (separate npm package)
```

---

## Release

Pushing to the `release` branch triggers an automated CI pipeline:

1. Lints the codebase
2. Determines semver bump from conventional commit message (`feat:` = minor, `fix:` = patch, `!` = major)
3. Bumps `package.json` version and generates a changelog
4. Builds the package
5. Creates a GitHub release with a git tag
6. Publishes to npm (`--access public`)

---

## License

MIT
