# Code Guidelines

Guidelines for writing TypeScript and Svelte code in this project. These rules apply to all components, utilities, and modules.

---

## 1. No Double-Bang (`!!`) Coercion

Do not use `!!` to convert values to booleans. It obscures intent and bypasses proper type narrowing.

```ts
// Bad
let showImage = $derived(!!src && !imageError);

// Good
let showImage = $derived(typeof src === 'string' && src.length > 0 && !imageError);
```

---

## 2. Safe Index Access

### Arrays and strings: use `.at()` instead of bracket notation with numeric literals

`.at()` returns `T | undefined`, making the caller handle the missing case explicitly. It also supports negative indices for end-relative access.

```ts
// Bad
const first = words[0];
const last = words[words.length - 1];

// Good
const first = words.at(0);
const last = words.at(-1);
```

### DOM lists (`NodeList`, `TouchList`, etc.): use `.item()` instead of bracket notation

These types do not support `.at()`. The `.item()` method returns `T | null`, which makes the null case explicit.

```ts
// Bad
const el = focusable[0];
const touch = event.touches[0];

// Good
const el = focusable.item(0);
const touch = event.touches.item(0);
```

### String character access: use `.charAt()` instead of bracket notation

`.charAt()` returns `''` for out-of-bounds access instead of `undefined`, making the behavior predictable.

```ts
// Bad
const initial = word[0];

// Good
const initial = word.charAt(0);
```

---

## 3. No Falsy/Truthy Checks for Non-Boolean Values

Do not rely on JavaScript's implicit falsy coercion (`if (x)`, `if (!x)`, `x || default`, `x && expr`) for values that are not booleans. Use explicit type narrowing with `typeof` instead.

Do **not** use `=== undefined` or `!== undefined` — always prefer `typeof` checks, which are safer (no risk of `undefined` being shadowed) and express the expected type clearly.

### Strings (`string | undefined`)

```ts
// Bad
if (!name) { ... }
if (title) { ... }
aria-label={title || 'Sheet'}

// Good
if (typeof name !== 'string' || name.length === 0) { ... }
if (typeof title === 'string') { ... }
aria-label={title ?? 'Sheet'}
```

### Functions (`(() => void) | undefined`)

```ts
// Bad
{#if onclick}

// Good
{#if typeof onclick === 'function'}
```

### Objects / Snippets (`T | undefined`)

Use `typeof` to check for the expected type rather than comparing against `undefined`. Snippets are functions at runtime; objects are `'object'`.

```ts
// Bad
{#if footer}
{#if previousIcon}
{#if view.properties}
{#if footer !== undefined}
{#if previousIcon !== undefined}

// Good — snippets are functions
{#if typeof footer === 'function'}
{#if typeof previousIcon === 'function'}

// Good — objects / records
{#if typeof view.properties === 'object'}
```

### DOM references (`HTMLElement | null`)

```ts
// Bad
if (sheetPanel) { ... }

// Good
if (sheetPanel !== null) { ... }
```

### Numeric values (array `.length`, counts, etc.)

```ts
// Bad
{#if views.length}

// Good
{#if views.length > 0}
```

### When `||` vs `??` matters

Use `??` (nullish coalescing) when the intent is to fall back only for `null` / `undefined`. Use `||` only when you genuinely want to fall back for all falsy values (including `0`, `''`, `false`).

```ts
// Bad - falls back for '' which may be a valid value
const label = title || 'Default';

// Good - falls back only for null/undefined
const label = title ?? 'Default';
```

---

## 4. Reuse Existing Components

Before implementing behaviour that already exists in the component library (error handling, fallback rendering, loading states, etc.), check if an existing component already handles it. Compose components rather than duplicating logic.

**Example:** The `Img` component handles image error-based fallback rendering. The `Avatar` component should reuse `Img` instead of implementing its own `<img onerror={...}>` logic.

```svelte
<!-- Bad - duplicating Img's error handling logic -->
<img {src} {alt} onerror={handleError} />

<!-- Good - reusing the Img component -->
<Img {src} {alt} onerror={handleImageError} />
```

When a child component does not expose the exact hook you need, extend its interface (e.g. add an `onerror` callback prop) rather than bypassing it with a raw HTML element.

---

## 5. Remove Redundant Guards

Do not guard against conditions that are already guaranteed by the type system or the runtime.

```ts
// Bad - event parameter is always provided by the handler
if (event && Object.keys(event).length > 0 && typeof event.clientX !== 'undefined') {

// Good - MouseEvent always has clientX
if (typeof event.clientX !== 'undefined') {
```

```ts
// Bad - TouchList is always present on TouchEvent
if (event.touches && Object.keys(event.touches).length > 0) {

// Good
if (event.touches.length > 0) {
```

```ts
// Bad - redundant null check before strict equality
if (event.target && event.target === overlayDiv) {

// Good - strict equality already handles null
if (event.target === overlayDiv) {
```

---

## 6. Reuse the `Button` Component for Generic Action Buttons

Replace raw `<button>` elements with the reusable `Button` component for generic action buttons: submit, dismiss, close, copy, action, navigation arrows, and similar.

**Do not replace** specialized interactive elements: calendar day cells, pagination page buttons, tab items, command menu items, theme switcher segments, emotion selector buttons, page indicator dots.

### CSS Variable Bridging

When replacing `<button>` with `<Button>`, wrap `<Button>` in a `<div>` with the original class name, and set `--button-*` CSS variables on that div to map to the component-specific CSS variables. This preserves the existing CSS variable API for consumers.

```svelte
<!-- Before -->
<button class="close-btn" onclick={onclose} aria-label="Close">
  {@render closeIcon()}
</button>

<!-- After -->
<div class="close-btn">
  <Button onclick={onclose} ariaLabel="Close">
    {#snippet children()}
      {@render closeIcon()}
    {/snippet}
  </Button>
</div>

<style>
  .close-btn {
    --button-background: var(--sheet-close-bg, transparent);
    --button-border: none;
    --button-color: var(--sheet-close-color, #666);
    --button-hover-background: var(--sheet-close-hover-bg, #f0f0f0);
  }
</style>
```

### Props Available on `Button`

- `text` — Optional label text
- `icon` — Snippet for an icon
- `children` — Snippet for arbitrary content (use instead of `text` + `icon` for custom layouts)
- `ariaLabel` — Maps to `aria-label` on the underlying `<button>`
- `disabled` — Disables the button (reconciled with legacy `enable` prop)
- `onclick` / `onkeyup` — Event handlers
- `type` — Button type (`'button'` / `'submit'` / `'reset'`)
- `testId` — Maps to `data-pw` for test automation

---

## 7. `$bindable` Usage

Use `$bindable` only when the component **internally mutates** the prop (e.g., `open = false` in a close handler, `checked = !checked` on click). This is Svelte 5's intended mechanism for components that self-manage state transitions. Components should be **self-sufficient** — they work out of the box without requiring the parent to wire up callbacks.

**Do not use `$bindable`** for props that the component only reads. If the component never assigns to the prop, a regular prop is sufficient.

```svelte
<!-- Good — component internally sets open = false on close -->
let {((open = $bindable(false)), onclose)}: Props = $props();

<!-- Bad — component never assigns to initialPage, only reads it -->
let {(initialPage = $bindable(0))}: Props = $props();
```

When `$bindable` is used, also provide a corresponding callback prop (`onclose`, `onchange`, `ontoggle`, `onPageChange`, etc.) so the parent can react to state changes without relying on two-way binding. Both patterns are supported — consumers choose one:

- **`bind:`** — parent observes state reactively, no callback needed
- **callback** — parent reacts imperatively in a handler, no `bind:` needed

**Warning:** Consumers should avoid using **both** `bind:prop` and a callback that sets the same prop, as this creates two mutation channels for the same value and risks infinite update loops.

---

## 8. No `auto` for Layout/Spacing CSS Properties

Do not use `auto` as a value or CSS variable default for `margin`, `padding`, `width`, `height`, `top`, `bottom`, `left`, or `right`. The meaning of `auto` varies by property and layout context, making it unpredictable.

**Allowed:** `auto` is permitted for `overflow`, `overflow-x`, `overflow-y`, `pointer-events`, and `cursor`, where its behavior is well-defined and has no equivalent replacement.

### Replacements

| Instead of                                   | Use                                                                                                                  |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `width: auto` / `height: auto`               | `fit-content`                                                                                                        |
| `margin-left: auto` (flex push-right)        | `flex: 1` on the preceding sibling                                                                                   |
| `margin: auto` (centering)                   | `top: 50%; left: 50%; transform: translate(-50%, -50%)` for absolute positioning, or flexbox centering on the parent |
| `bottom: auto` / `right: auto` (positioning) | Remove the declaration entirely — only set the sides that apply                                                      |

```css
/* Bad */
width: var(--toast-width, auto);
margin-left: auto;
bottom: var(--menu-dropdown-bottom, auto);

/* Good */
width: var(--toast-width, fit-content);
/* preceding sibling has flex: 1, pushing this element right */
/* only declare the sides that apply */
top: var(--menu-dropdown-top, 100%);
left: var(--menu-dropdown-left, 0);
```

---

## 9. Custom Classes via `classes` Prop

Every component exposes a `classes` prop (`classes?: string`) that attaches directly to the topmost container element. This allows consumers to apply custom CSS classes without wrapper elements.

```svelte
<!-- Usage -->
<Button classes="my-custom-class another-class" text="Click me" />

<!-- Renders as -->
<div class="button-container my-custom-class another-class">
  <button>Click me</button>
</div>
```

### Implementation Pattern

In the component template, append `{classes ?? ''}` to the topmost element's class attribute:

```svelte
<!-- Single top-level element -->
<div class="container {classes ?? ''}">...</div>

<!-- Conditional top-level elements (e.g., Avatar) — add to ALL branches -->
{#if typeof onclick === 'function'}
  <button class="avatar {classes ?? ''}">...</button>
{:else}
  <div class="avatar {classes ?? ''}">...</div>
{/if}
```

In `properties.ts`, add `classes?: string` to the optional properties sub-type.

### Theming with Classes

The `classes` prop is the recommended way to implement theme variants (primary, secondary, danger, etc.). Define CSS classes that set the component's CSS variables, then pass the class name via `classes`:

```css
/* app.css or a shared stylesheet */
.btn-primary {
  --button-color: #0070f3;
  --button-text-color: white;
  --button-hover-color: #0060df;
  --button-border-radius: 6px;
}

.btn-secondary {
  --button-color: transparent;
  --button-text-color: #0070f3;
  --button-border: 1px solid #0070f3;
  --button-hover-color: #f0f7ff;
}

.btn-danger {
  --button-color: #e00;
  --button-text-color: white;
  --button-hover-color: #c00;
}

.banner-success {
  --banner-background: #e6f9ed;
  --banner-color: #1a7f37;
  --banner-icon-color: #1a7f37;
}

.banner-warning {
  --banner-background: #fff8e6;
  --banner-color: #9a6700;
  --banner-icon-color: #9a6700;
}
```

```svelte
<!-- Usage — apply theme variants via classes -->
<Button classes="btn-primary" text="Save" />
<Button classes="btn-secondary" text="Cancel" />
<Button classes="btn-danger" text="Delete" />

<Banner classes="banner-success" text="Deployment complete" />
<Banner classes="banner-warning" text="API rate limit approaching" />
```

This approach keeps components free from hardcoded design presets while giving consumers full control over theming. Multiple variant systems can coexist, and variants compose naturally with space-separated class names.
