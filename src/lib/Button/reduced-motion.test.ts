import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// SOURCE-LEVEL CHECK, not a behavioural one. jsdom does not evaluate `@media`
// conditions (see prefers-reduced-motion.test.ts for the JS-level pattern this
// repo uses when a component branches in script, and
// tests/typewriter-text-reduced-motion.test.ts for the Playwright
// page.emulateMedia() pattern it uses when a real browser is available) --
// rendering this component in jsdom and reading computed style would pass or
// fail independent of whether the guard below is even present. The button's
// progress-bar loader is pure CSS with no JS branch, so neither of those
// applies here.
//
// What this file actually proves: the raw .svelte source contains a
// `prefers-reduced-motion: reduce` rule that (a) targets the exact same
// selector as the animation it must override, so it isn't silently outranked
// the way BrandLoader's per-dot animation was by its `:nth-child()` selectors,
// (b) appears AFTER the base rule in source order, which is what lets an
// equal-specificity override actually win the cascade in a real browser, and
// (c) does not fall back to a bare `animation: none` -- which would freeze the
// bar at its base `width: 100%` and read as "finished" for the whole
// `--button-progress-loader-duration` it is actually still counting through.
// It cannot prove a real browser stops the animation; it can only prove the
// guard text a future diff might accidentally delete, weaken, or reorder is
// present and correctly targeted.
const source = readFileSync(join(import.meta.dirname, 'Button.svelte'), 'utf8');

describe('Button progress-bar loader — prefers-reduced-motion guard (source-level check)', () => {
  it('has the base fill animation, and it is width-based (the hazard the guard exists for)', () => {
    expect(source).toMatch(/\.button-progress-bar\s*{[^}]*animation:\s*fill-loader[^}]*}/);
    expect(source).toMatch(/\.button-progress-bar\s*{[^}]*width:\s*100%[^}]*}/);
  });

  it('is guarded by a same-selector rule inside @media (prefers-reduced-motion: reduce), declared after the base rule', () => {
    const mediaIndex = source.indexOf('@media (prefers-reduced-motion: reduce)');
    const baseIndex = source.indexOf('.button-progress-bar {');

    expect(mediaIndex).toBeGreaterThan(-1);
    expect(baseIndex).toBeGreaterThan(-1);
    // Equal-specificity ties break on source order in the cascade -- a guard
    // declared BEFORE the rule it must override would silently lose.
    expect(mediaIndex).toBeGreaterThan(baseIndex);

    const mediaBlock = source.slice(mediaIndex);
    // Same bare class selector as the base rule, not a weaker or different one.
    expect(mediaBlock).toMatch(/\.button-progress-bar\s*{/);
  });

  it('thins the motion to discrete steps instead of stopping it outright, so the bar cannot claim to be further along than it is', () => {
    const mediaBlock = source.slice(source.indexOf('@media (prefers-reduced-motion: reduce)'));

    // A bare `animation: none` (or `animation-name: none`) would freeze the bar
    // at the base rule's width: 100% -- exactly the "reads as finished" hazard
    // this test exists to catch.
    expect(mediaBlock).not.toMatch(/animation(-name)?:\s*none/);
    expect(mediaBlock).toMatch(/animation-timing-function:\s*steps\(/);
  });

  it('uses a literal step count, so a consumer cannot switch the guard off by accident', () => {
    // `steps()` is invalid below 1, and an invalid value does not degrade to a
    // safer stepped default -- the declaration is dropped and the property takes
    // the base rule's easing, restoring exactly the continuous slide the guard
    // removes. Behind a custom property, `--…-steps: 0` would therefore disable
    // the accessibility guard silently, for every user who asked for reduced
    // motion. A guard that fails OPEN without saying so is worse than no guard.
    expect(source).toMatch(/animation-timing-function:\s*steps\(5,\s*jump-end\)/);
    expect(source).not.toMatch(/steps\(\s*var\(/);
  });

  it('also guards the consumer-configurable transition, not only the loader', () => {
    // `--button-transition` defaults to `none`, so the rule is inert until a
    // consumer opts in -- and the documented way to opt in is a hover/press
    // animation, which is precisely what a reduced-motion user is asking not to
    // have. The first sweep of this file stopped at the one animation it was
    // pointed at.
    const mediaBlock = source.slice(source.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(mediaBlock).toMatch(/\.button-el[\s\S]*?transition:\s*none/);
  });
});
