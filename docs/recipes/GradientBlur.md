# GradientBlur recipe

Recipe for a layered radial-gradient blur backdrop — typical use is the hero / feature area of a marketing or onboarding surface where text needs to sit on top of a soft chromatic background without an actual image.

This is a pure CSS pattern, not a component. The library philosophy (GUIDELINES §3) is that static decorative pieces with no reactivity and no slots belong in consumer CSS, not in a Svelte component. PR [#199](https://github.com/juspay/svelte-ui-components/pull/199) was closed in favour of this recipe.

## Markup

```svelte
<div class="gradient-blur">
  <span class="blob blob-a" aria-hidden="true"></span>
  <span class="blob blob-b" aria-hidden="true"></span>
  <span class="blob blob-c" aria-hidden="true"></span>

  <!-- your content -->
</div>
```

Three blobs is enough for most surfaces. Add or remove as needed; the recipe scales linearly.

## Styles

```css
.gradient-blur {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: var(--gradient-blur-bg, #0b0b14);
}

.gradient-blur .blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(var(--gradient-blur-radius, 80px));
  opacity: var(--gradient-blur-opacity, 0.55);
  pointer-events: none;
  z-index: -1;
}

.gradient-blur .blob-a {
  top: -10%;
  left: -10%;
  width: var(--gradient-blur-size-a, 360px);
  height: var(--gradient-blur-size-a, 360px);
  background: var(--gradient-blur-color-a, #ff5fa2);
}

.gradient-blur .blob-b {
  top: 30%;
  right: -8%;
  width: var(--gradient-blur-size-b, 280px);
  height: var(--gradient-blur-size-b, 280px);
  background: var(--gradient-blur-color-b, #5fa2ff);
}

.gradient-blur .blob-c {
  bottom: -15%;
  left: 30%;
  width: var(--gradient-blur-size-c, 320px);
  height: var(--gradient-blur-size-c, 320px);
  background: var(--gradient-blur-color-c, #b45fff);
}
```

## Why no component?

A `GradientBlur` component would expose props that map 1:1 to the CSS variables above. The component itself would have no state, no slots, and no callbacks — it would just be a verbose wrapper around a CSS class. Inverting it, anything a `GradientBlur` component could do is one class away in user space:

```svelte
<div class="gradient-blur hero-blur">…</div>

<style>
  .hero-blur {
    --gradient-blur-color-a: #f59e0b;
    --gradient-blur-color-b: #ef4444;
    --gradient-blur-color-c: #a855f7;
  }
</style>
```

If you need a different blob count, add or remove `<span>`s. If you need a different position, override the per-blob class. The pattern stays additive.

## Accessibility

The blobs are `aria-hidden="true"` because they convey no information. The container's contrast and focus visibility are the responsibility of the content placed inside it — verify against WCAG AA for any text rendered on top.

## Performance

`filter: blur()` is GPU-accelerated in modern engines but expensive on low-end devices. Three blobs is a safe budget; if you push past five, profile on a mid-range Android device before shipping.
