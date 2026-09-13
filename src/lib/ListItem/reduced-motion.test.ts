import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// SOURCE-LEVEL CHECK, not a behavioural one -- see Button/reduced-motion.test.ts
// for the full explanation of why (jsdom does not evaluate `@media` conditions,
// and this guard is pure CSS with no JS branch for a rendered-component test to
// observe). This proves the raw .svelte source contains a
// `prefers-reduced-motion: reduce` rule that targets the same selector as the
// loader animation, comes after it in source order (so it actually wins the
// cascade tie rather than losing to source order), and does not fall back to a
// bare `animation: none` -- which would freeze the bar at its base
// `width: 100%` and read as "finished" for the whole
// `--list-item-loader-duration` it is actually still counting through, same
// hazard as Button's progress bar.
const source = readFileSync(join(import.meta.dirname, 'ListItem.svelte'), 'utf8');

describe('ListItem loader overlay — prefers-reduced-motion guard (source-level check)', () => {
  it('has the base fill animation, and it is width-based (the hazard the guard exists for)', () => {
    expect(source).toMatch(/\.item-loader\s*{[^}]*animation:\s*fill-loader[^}]*}/);
    expect(source).toMatch(/\.item-loader\s*{[^}]*width:\s*100%[^}]*}/);
  });

  it('is guarded by a same-selector rule inside @media (prefers-reduced-motion: reduce), declared after the base rule', () => {
    const mediaIndex = source.indexOf('@media (prefers-reduced-motion: reduce)');
    const baseIndex = source.indexOf('.item-loader {');

    expect(mediaIndex).toBeGreaterThan(-1);
    expect(baseIndex).toBeGreaterThan(-1);
    expect(mediaIndex).toBeGreaterThan(baseIndex);

    const mediaBlock = source.slice(mediaIndex);
    expect(mediaBlock).toMatch(/\.item-loader\s*{/);
  });

  it('thins the motion to discrete steps instead of stopping it outright, so the bar cannot claim to be further along than it is', () => {
    const mediaBlock = source.slice(source.indexOf('@media (prefers-reduced-motion: reduce)'));

    expect(mediaBlock).not.toMatch(/animation(-name)?:\s*none/);
    expect(mediaBlock).toMatch(/animation-timing-function:\s*steps\(/);
  });

  it('uses a literal step count, so a consumer cannot switch the guard off by accident', () => {
    // See the matching note in Button's spec: an invalid `steps()` value drops
    // the declaration and restores the continuous slide, so a tunable here would
    // let `--…-steps: 0` disable the guard silently.
    expect(source).toMatch(/animation-timing-function:\s*steps\(5,\s*jump-end\)/);
    expect(source).not.toMatch(/steps\(\s*var\(/);
  });

  it('neutralises the image transition it hands to the Img child', () => {
    // `--image-transition` is not a transition on this element: it is a custom
    // property passed DOWN, and a custom property is the only thing that crosses
    // that boundary. `transition: none` here would never reach the image, so the
    // property itself has to be set.
    const mediaBlocks = source.slice(source.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(mediaBlocks).toMatch(/--image-transition:\s*none/);
    expect(mediaBlocks).toMatch(/\.item\s*\{[\s\S]*?transition:\s*none/);
  });
});
