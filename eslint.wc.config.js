/*
 * Dead-import linting for the web-component wrappers.
 *
 * `eslint.config.js` ignores `src/wc/**` wholesale (added with the wrapper build
 * in b209cb7, with no stated reason). Running the main config over that
 * directory today reports 106 errors -- mostly `no-restricted-syntax` and
 * type-assertion rules the wrappers were never written against -- so simply
 * un-ignoring it is not a small change.
 *
 * What the exclusion cost, though, is concrete: a dead `AnimatedNumber` import
 * survived a refactor in these wrappers until a reviewer read the diff, because
 * `unused-imports/no-unused-imports` never ran on the file.
 *
 * So this config runs THAT ONE RULE, and nothing else, over the directory the
 * main config skips. It is deliberately not a step toward linting `src/wc/**`
 * properly; it is the narrow rule that pays for itself today.
 *
 * No `--no-ignore` is needed to reach the directory, though the first version of
 * this carried one: `--config` REPLACES the main config, so its `src/wc/**`
 * ignore is never loaded in the first place. Measured both ways against an
 * injected dead import -- identical output -- so the flag only widened what
 * eslint would descend into, and is gone.
 */
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import unusedImports from 'eslint-plugin-unused-imports';
import svelteConfig from './svelte.config.js';

export default [
  {
    // Those inline disables are unused HERE only because this config enables a
    // single rule; they are load-bearing under the main config. Reporting them
    // would be an artefact of the narrowing, not a finding.
    //
    // This holds only while this config stays single-rule. Enable anything else
    // here and a genuinely stale disable comment starts passing silently, so
    // turn this back on at the same time.
    linterOptions: { reportUnusedDisableDirectives: 'off' }
  },
  {
    files: ['src/wc/**/*.ts'],
    languageOptions: { parser: ts.parser },
    // The ts plugin is registered but its rules are left off: the wrappers carry
    // inline `eslint-disable` comments for @typescript-eslint rules, and eslint
    // errors on a disable comment naming a rule it does not know about.
    plugins: { 'unused-imports': unusedImports, '@typescript-eslint': ts.plugin },
    rules: { 'unused-imports/no-unused-imports': 'error' }
  },
  ...svelte.configs.base.map((config) => ({ ...config, files: ['src/wc/**/*.svelte'] })),
  {
    files: ['src/wc/**/*.svelte'],
    languageOptions: { parserOptions: { parser: ts.parser, svelteConfig } },
    plugins: { 'unused-imports': unusedImports, '@typescript-eslint': ts.plugin },
    rules: { 'unused-imports/no-unused-imports': 'error' }
  }
];
