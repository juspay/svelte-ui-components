# Recipe: Divider

A horizontal or vertical rule that separates content. Pure CSS — no component required.

This recipe lives here because a typed Svelte `Divider` primitive would be a thin wrapper around `<hr>` (or a styled `<div role="separator">`) that the library philosophy declines to absorb — same family as the `GradientBlur` and `RangePicker` recipes. Issue [#237](https://github.com/juspay/svelte-ui-components/issues/237) closes via this recipe.

## Horizontal divider

Use the native `<hr>` element — it carries the `separator` role implicitly and inherits text color by default. Theme via CSS variables on the consumer side.

```svelte
<style>
  hr.divider {
    border: none;
    border-top: var(--divider-thickness, 1px) var(--divider-style, solid) var(--divider-color, currentColor);
    opacity: var(--divider-opacity, 0.12);
    margin: var(--divider-spacing, 16px 0);
  }
</style>

<section>
  <p>First block of content</p>
  <hr class="divider" />
  <p>Second block of content</p>
</section>
```

### Theming

```css
.surface-muted hr.divider {
  --divider-color: var(--text-color-secondary);
  --divider-opacity: 1;
}

.surface-dashed hr.divider {
  --divider-style: dashed;
  --divider-opacity: 0.3;
}

.surface-thick hr.divider {
  --divider-thickness: 2px;
  --divider-spacing: 24px 0;
}
```

## Vertical divider

`<hr>` is conventionally horizontal — for a vertical rule, use a `<div role="separator" aria-orientation="vertical">`:

```svelte
<style>
  .v-divider {
    align-self: stretch;
    border-left: var(--v-divider-thickness, 1px) var(--v-divider-style, solid) var(--v-divider-color, currentColor);
    opacity: var(--v-divider-opacity, 0.12);
    margin: var(--v-divider-spacing, 0 12px);
  }
</style>

<div class="toolbar">
  <button>Cut</button>
  <button>Copy</button>
  <button>Paste</button>
  <div class="v-divider" role="separator" aria-orientation="vertical" />
  <button>Undo</button>
  <button>Redo</button>
</div>
```

The explicit `role="separator"` + `aria-orientation="vertical"` is the only piece a primitive would enforce, and it's a single attribute pair the consumer can copy without a library dependency.

## Decorative-only (skip from a11y tree)

If the divider is purely cosmetic (e.g. between sections that already have heading semantics), mark it `aria-hidden`:

```svelte
<hr class="divider" aria-hidden="true" />
```

## When to reach for this recipe

- You want a thin separator between blocks of content.
- You want a vertical separator inside a row of controls (toolbars, breadcrumbs, action bars).
- You want the separator color/thickness/spacing to follow the rest of your theme — drop the CSS variables into your stylesheet alongside the existing tokens.

## When NOT to reach for this recipe

- You need a separator that *participates in keyboard navigation* (e.g. a draggable splitter between two panels). That's a different primitive — see `Slider` for axis-bound interactive splitters.
- You need a separator with *labels* embedded in it (e.g. "OR" between two auth options). Use a `<div>` with flex-aligned text + two `<hr>`s on either side — also pure CSS, but distinct shape.
