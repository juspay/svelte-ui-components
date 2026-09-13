<script lang="ts">
  import type { AspectRatioProperties } from './properties';

  let { ratio = 1, children, classes, testId }: AspectRatioProperties = $props();

  // `ratio` feeds directly into the CSS `aspect-ratio` declaration below, which is
  // only meaningful for a finite, positive number: zero/negative have no geometric
  // meaning, and NaN/Infinity (e.g. an image's naturalWidth / naturalHeight read
  // before it has decoded) would serialize to an invalid token and drop the whole
  // declaration. Checked independently of the `= 1` default parameter above -- that
  // default only fires when the prop is omitted entirely, so an explicitly passed
  // 0/-2/NaN/Infinity still reaches this component and needs the same fallback.
  let resolvedRatio = $derived(Number.isFinite(ratio) && ratio > 0 ? ratio : 1);
</script>

<div
  class="container {classes ?? ''}"
  style:aspect-ratio="var(--aspect-ratio-container-aspect-ratio, {resolvedRatio})"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {@render children?.()}
</div>

<style>
  /*
   * The CSS `aspect-ratio` property is used unconditionally, with no
   * `padding-bottom` percentage-hack fallback. It has shipped in every
   * evergreen browser since 2021 (Chrome 88, Firefox 89, Safari 15) -- the
   * same generation of CSS this library already relies on elsewhere with no
   * fallback path (Accordion's expand/collapse animates
   * `grid-template-rows` between `0fr` and `1fr`, which needs the same-era
   * interpolation support). A `padding-bottom` fallback would also
   * reintroduce the wrapper-plus-absolutely-positioned-child structure
   * `aspect-ratio` exists to remove, doubling the markup this component
   * would carry for browsers this library does not otherwise support.
   *
   * The ratio itself is set inline (see the `style:aspect-ratio` binding in
   * the markup) rather than here, because its fallback is the per-instance
   * `ratio` prop value, not a fixed default -- but the inline value always
   * routes through the `--aspect-ratio-container-aspect-ratio` custom
   * property first, so a consumer can still override the ratio purely
   * through CSS (e.g. set it on an ancestor, or on this element via
   * `classes`) without touching the prop at all.
   */
  .container {
    display: block;
    width: var(--aspect-ratio-container-width, 100%);
    overflow: var(--aspect-ratio-container-overflow, hidden);
  }
</style>
