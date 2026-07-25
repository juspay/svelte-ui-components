/**
 * Declares the native test-identifier attribute on every DOM element.
 *
 * Test ids have to reach two runners: Playwright reads the `data-pw` attribute,
 * while Appium resolves an element by its native accessibility identifier and
 * never sees `data-pw`. Components therefore emit both from the same value.
 *
 * `data-*` attributes are accepted by Svelte's typings automatically; a bare
 * `testID` is not, so without this augmentation every emission fails
 * `svelte-check` with "'testID' does not exist in type HTMLProps<...>".
 *
 * Spreading an attribute object would dodge the type error, but a spread makes
 * Svelte skip its static a11y analysis for that element — silently disabling
 * real warnings (it turns existing `svelte-ignore` comments into dead code).
 * Declaring the attribute keeps both the type check and the a11y analysis.
 *
 * The declared key is lower-case because Svelte normalises DOM attribute names,
 * as does `setAttribute` on an HTML document; authors still write `testID`.
 *
 * This file ships in `dist`, so consumers get the same typing for their own usage.
 */
/* eslint-disable unused-imports/no-unused-vars -- the type parameter name must match
   svelte/elements' own declaration exactly, or interface merging silently fails. */
declare module 'svelte/elements' {
  export interface HTMLAttributes<T extends EventTarget> {
    /** Native (Appium) test identifier. Mirrors `data-pw`, which Appium cannot read. */
    testid?: string | null;
  }

  export interface SVGAttributes<T extends EventTarget> {
    /** Native (Appium) test identifier. Mirrors `data-pw`, which Appium cannot read. */
    testid?: string | null;
  }
}

export {};
