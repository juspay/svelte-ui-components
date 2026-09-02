# Changelog All notable changes to this project will be documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/juspay/svelte-ui-components/compare/HEAD..3.1.1)

`lint` ran `prettier --check src && eslint src`, so `scripts/` and `tests/`
were never checked at all. That gap was reported on #495 and is the reason a
banned `undefined` reached review on #500 instead of failing locally. Extending
the script to `src scripts tests` surfaced 31 real violations of rules this
repo already enforces everywhere else.

Lint coverage:

- analyze.ts asserted `value as UnknownRecord`, which `consistent-type-assertions`
bans outside test files. Type predicates are banned too, so there is no way to
tell the compiler a narrowed `object` is keyed by string. `asRecord` now copies
the own enumerable keys instead. The copy is shallow, so nested nodes keep
their identity and the AST walk is unchanged -- verified against lighthouse
below.
- `undefined` is banned repo-wide; signatures.ts returned `string | undefined`,
casing.ts took `string | undefined`, and map.test.ts (added last change) used
it in four places. readSignature returns `string | null`; forwardsDomEvent and
deriveEventName take `unknown`, which is what their bodies already narrowed.
- check-event-casing.js was missing `curly` braces in four places and was not
Prettier-formatted.
- tests/ had six unformatted files, six more `undefined` comparisons, an
unnecessary escape, and an unused locator.

Three findings from #495, all still open:

- transformModuleSpecifiers matched with a context-anchored regex, reasoning
that a specifier only follows `from`, `import`, `import(` or `require(`. True,
but those words appear just as readily in a comment or inside a quoted string,
and the regex rewrote those too: a fixture with the package named in a line
comment, a block comment, a string literal and one real import rewrote all
four. It now parses with TypeScript, which is already a devDependency and
already type-checks this directory, and replaces only the literal's interior
so the quote style survives. Static, re-export, dynamic, `require` and
`import()`-in-type-position are all covered by tests.
- cli.test.ts kept `dir` and `lines` as module-level mutable state. Each test
now builds its own project, cleaned up through `onTestFinished` so removal
happens whether the test passes or throws. (The reported reason -- that
afterEach would not run on a throw -- is not accurate; vitest runs it either
way. The shared mutable state was worth removing on its own.)
- Both script tsconfigs included `./*.ts`, so a nested file would have escaped
`check:codemod` / `check:migrate`. Now `./**/*.ts`.

Verified: 288/288 unit, 136/136 across scripts/ (was 133), lint and check clean
under the widened scope. The migrate CLI re-run against lighthouse reports 385
.svelte files, 0 blockers, 0 findings -- identical to before the asRecord
rewrite. Checked against a control, since a zero from a broken detector looks
the same: a fixture with `showBackButton={false}`, `showBackButton="{false}"`,
a bound guard and a bare Toolbar flags exactly the last two.

---

Review on this PR found four more, including a regression this PR introduced.

- `import X = require('x')` stopped being rewritten. Its specifier hangs off an
ExternalModuleReference rather than a call expression, and the regex being
replaced had matched it by accident through the bare `require(` context. The
parser walk did not look for it, so switching to a parser silently dropped
syntax that used to work. Handled now, with a test.

- asRecord could be fed dependencies through `__proto__`. `JSON.parse` makes it
an ordinary own key, and assigning it re-points the copy's prototype instead
of adding a field, so a manifest declaring neither svelte nor the library
still answered for `dependencies` through the chain -- reported as satisfying
the peer when nothing was declared. Copied with `defineProperty` now, which
creates an own data property instead of invoking the setter.

- readSignature interpolated the prop name into a regex unescaped, the same
hole already fixed in map.test.ts. Escaped.

- Documented why `Reflect.get` and `defineProperty` are used rather than plain
indexing and assignment, and that only string keys are copied.

Verified after: 290/290 unit, 138/138 across scripts/, lint and check clean.
lighthouse unchanged at 385 files / 0 findings, and the four-case control still
flags exactly the bound and bare Toolbars.

## [3.1.1](https://github.com/juspay/svelte-ui-components/compare/3.1.1..3.1.0) - 2 September 2026

## [3.1.0](https://github.com/juspay/svelte-ui-components/compare/3.1.0..3.0.0) - 2 September 2026

## [3.0.0](https://github.com/juspay/svelte-ui-components/compare/3.0.0..2.136.12) - 2 September 2026

## [2.136.12](https://github.com/juspay/svelte-ui-components/compare/2.136.12..2.136.11) - 2 September 2026

## [2.136.11](https://github.com/juspay/svelte-ui-components/compare/2.136.11..2.136.10) - 2 September 2026

## [2.136.10](https://github.com/juspay/svelte-ui-components/compare/2.136.10..2.136.9) - 2 September 2026

## [2.136.9](https://github.com/juspay/svelte-ui-components/compare/2.136.9..2.136.8) - 1 September 2026

## [2.136.8](https://github.com/juspay/svelte-ui-components/compare/2.136.8..2.136.7) - 1 September 2026

## [2.136.7](https://github.com/juspay/svelte-ui-components/compare/2.136.7..2.136.6) - 1 September 2026

## [2.136.6](https://github.com/juspay/svelte-ui-components/compare/2.136.6..2.136.5) - 1 September 2026

## [2.136.5](https://github.com/juspay/svelte-ui-components/compare/2.136.5..2.136.4) - 1 September 2026

## [2.136.4](https://github.com/juspay/svelte-ui-components/compare/2.136.4..2.136.3) - 1 September 2026

## [2.136.3](https://github.com/juspay/svelte-ui-components/compare/2.136.3..2.136.2) - 1 September 2026

## [2.136.2](https://github.com/juspay/svelte-ui-components/compare/2.136.2..2.136.1) - 1 September 2026

## [2.136.1](https://github.com/juspay/svelte-ui-components/compare/2.136.1..2.136.0) - 1 September 2026

## [2.136.0](https://github.com/juspay/svelte-ui-components/compare/2.136.0..2.135.0) - 1 September 2026

## [2.135.0](https://github.com/juspay/svelte-ui-components/compare/2.135.0..2.134.1) - 1 September 2026

## [2.134.1](https://github.com/juspay/svelte-ui-components/compare/2.134.1..2.134.0) - 1 September 2026

## [2.134.0](https://github.com/juspay/svelte-ui-components/compare/2.134.0..2.133.1) - 31 August 2026

## [2.133.1](https://github.com/juspay/svelte-ui-components/compare/2.133.1..2.133.0) - 31 August 2026

## [2.133.0](https://github.com/juspay/svelte-ui-components/compare/2.133.0..2.132.0) - 31 August 2026

## [2.132.0](https://github.com/juspay/svelte-ui-components/compare/2.132.0..2.131.0) - 30 August 2026

## [2.131.0](https://github.com/juspay/svelte-ui-components/compare/2.131.0..2.130.1) - 27 August 2026

## [2.130.1](https://github.com/juspay/svelte-ui-components/compare/2.130.1..2.130.0) - 27 August 2026

## [2.130.0](https://github.com/juspay/svelte-ui-components/compare/2.130.0..2.129.1) - 26 August 2026

## [2.129.1](https://github.com/juspay/svelte-ui-components/compare/2.129.1..2.129.0) - 26 August 2026

## [2.129.0](https://github.com/juspay/svelte-ui-components/compare/2.129.0..2.128.1) - 26 August 2026

## [2.128.1](https://github.com/juspay/svelte-ui-components/compare/2.128.1..2.128.0) - 26 August 2026

## [2.128.0](https://github.com/juspay/svelte-ui-components/compare/2.128.0..2.127.0) - 25 August 2026

## [2.127.0](https://github.com/juspay/svelte-ui-components/compare/2.127.0..2.126.0) - 25 August 2026

## [2.126.0](https://github.com/juspay/svelte-ui-components/compare/2.126.0..2.125.0) - 24 August 2026

## [2.125.0](https://github.com/juspay/svelte-ui-components/compare/2.125.0..2.124.0) - 21 August 2026

## [2.124.0](https://github.com/juspay/svelte-ui-components/compare/2.124.0..2.123.0) - 19 August 2026

## [2.123.0](https://github.com/juspay/svelte-ui-components/compare/2.123.0..2.122.0) - 19 August 2026

## [2.122.0](https://github.com/juspay/svelte-ui-components/compare/2.122.0..2.121.0) - 17 August 2026

## [2.121.0](https://github.com/juspay/svelte-ui-components/compare/2.121.0..2.120.3) - 15 August 2026

## [2.120.3](https://github.com/juspay/svelte-ui-components/compare/2.120.3..2.120.2) - 15 August 2026

## [2.120.2](https://github.com/juspay/svelte-ui-components/compare/2.120.2..2.120.1) - 12 August 2026

## [2.120.1](https://github.com/juspay/svelte-ui-components/compare/2.120.1..2.120.0) - 7 August 2026

## [2.120.0](https://github.com/juspay/svelte-ui-components/compare/2.120.0..2.119.0) - 6 August 2026

## [2.119.0](https://github.com/juspay/svelte-ui-components/compare/2.119.0..2.118.1) - 6 August 2026

## [2.118.1](https://github.com/juspay/svelte-ui-components/compare/2.118.1..2.118.0) - 5 August 2026

## [2.118.0](https://github.com/juspay/svelte-ui-components/compare/2.118.0..2.117.1) - 5 August 2026

## [2.117.1](https://github.com/juspay/svelte-ui-components/compare/2.117.1..2.117.0) - 5 August 2026

## [2.117.0](https://github.com/juspay/svelte-ui-components/compare/2.117.0..2.116.1) - 5 August 2026

## [2.116.1](https://github.com/juspay/svelte-ui-components/compare/2.116.1..2.116.0) - 5 August 2026

## [2.116.0](https://github.com/juspay/svelte-ui-components/compare/2.116.0..2.115.0) - 5 August 2026

## [2.115.0](https://github.com/juspay/svelte-ui-components/compare/2.115.0..2.114.1) - 5 August 2026

## [2.114.1](https://github.com/juspay/svelte-ui-components/compare/2.114.1..2.114.0) - 4 August 2026

## [2.114.0](https://github.com/juspay/svelte-ui-components/compare/2.114.0..2.113.0) - 3 August 2026

## [2.113.0](https://github.com/juspay/svelte-ui-components/compare/2.113.0..2.112.0) - 3 August 2026

## [2.112.0](https://github.com/juspay/svelte-ui-components/compare/2.112.0..2.111.4) - 3 August 2026

## [2.111.4](https://github.com/juspay/svelte-ui-components/compare/2.111.4..2.111.3) - 1 August 2026

## [2.111.3](https://github.com/juspay/svelte-ui-components/compare/2.111.3..2.111.2) - 30 July 2026

## [2.111.2](https://github.com/juspay/svelte-ui-components/compare/2.111.2..2.111.1) - 27 July 2026

## [2.111.1](https://github.com/juspay/svelte-ui-components/compare/2.111.1..2.111.0) - 25 July 2026

## [2.111.0](https://github.com/juspay/svelte-ui-components/compare/2.111.0..2.110.0) - 17 July 2026

## [2.110.0](https://github.com/juspay/svelte-ui-components/compare/2.110.0..2.109.0) - 17 July 2026

## [2.109.0](https://github.com/juspay/svelte-ui-components/compare/2.109.0..2.108.1) - 17 July 2026

## [2.108.1](https://github.com/juspay/svelte-ui-components/compare/2.108.1..2.108.0) - 17 July 2026

## [2.108.0](https://github.com/juspay/svelte-ui-components/compare/2.108.0..2.107.1) - 16 July 2026

## [2.107.1](https://github.com/juspay/svelte-ui-components/compare/2.107.1..2.107.0) - 16 July 2026

## [2.107.0](https://github.com/juspay/svelte-ui-components/compare/2.107.0..2.106.2) - 16 July 2026

## [2.106.2](https://github.com/juspay/svelte-ui-components/compare/2.106.2..2.106.1) - 16 July 2026

## [2.106.1](https://github.com/juspay/svelte-ui-components/compare/2.106.1..2.106.0) - 16 July 2026

## [2.106.0](https://github.com/juspay/svelte-ui-components/compare/2.106.0..2.105.0) - 16 July 2026

## [2.105.0](https://github.com/juspay/svelte-ui-components/compare/2.105.0..2.104.0) - 16 July 2026

## [2.104.0](https://github.com/juspay/svelte-ui-components/compare/2.104.0..2.103.0) - 16 July 2026

## [2.103.0](https://github.com/juspay/svelte-ui-components/compare/2.103.0..2.102.0) - 15 July 2026

## [2.102.0](https://github.com/juspay/svelte-ui-components/compare/2.102.0..2.101.0) - 15 July 2026

## [2.101.0](https://github.com/juspay/svelte-ui-components/compare/2.101.0..2.100.2) - 15 July 2026

## [2.100.2](https://github.com/juspay/svelte-ui-components/compare/2.100.2..2.100.1) - 15 July 2026

## [2.100.1](https://github.com/juspay/svelte-ui-components/compare/2.100.1..2.100.0) - 15 July 2026

## [2.100.0](https://github.com/juspay/svelte-ui-components/compare/2.100.0..2.99.0) - 14 July 2026

## [2.99.0](https://github.com/juspay/svelte-ui-components/compare/2.99.0..2.98.2) - 14 July 2026

## [2.98.2](https://github.com/juspay/svelte-ui-components/compare/2.98.2..2.98.1) - 14 July 2026

## [2.98.1](https://github.com/juspay/svelte-ui-components/compare/2.98.1..2.98.0) - 14 July 2026

## [2.98.0](https://github.com/juspay/svelte-ui-components/compare/2.98.0..2.97.2) - 14 July 2026

## [2.97.2](https://github.com/juspay/svelte-ui-components/compare/2.97.2..2.97.1) - 14 July 2026

## [2.97.1](https://github.com/juspay/svelte-ui-components/compare/2.97.1..2.97.0) - 14 July 2026

## [2.97.0](https://github.com/juspay/svelte-ui-components/compare/2.97.0..2.96.2) - 14 July 2026

## [2.96.2](https://github.com/juspay/svelte-ui-components/compare/2.96.2..2.96.1) - 14 July 2026

## [2.96.1](https://github.com/juspay/svelte-ui-components/compare/2.96.1..2.96.0) - 13 July 2026

## [2.96.0](https://github.com/juspay/svelte-ui-components/compare/2.96.0..2.95.1) - 12 July 2026

## [2.95.1](https://github.com/juspay/svelte-ui-components/compare/2.95.1..2.95.0) - 12 July 2026

## [2.95.0](https://github.com/juspay/svelte-ui-components/compare/2.95.0..2.94.0) - 12 July 2026

## [2.94.0](https://github.com/juspay/svelte-ui-components/compare/2.94.0..2.93.0) - 11 July 2026

## [2.93.0](https://github.com/juspay/svelte-ui-components/compare/2.93.0..2.92.0) - 11 July 2026

## [2.92.0](https://github.com/juspay/svelte-ui-components/compare/2.92.0..2.91.1) - 11 July 2026

## [2.91.1](https://github.com/juspay/svelte-ui-components/compare/2.91.1..2.91.0) - 11 July 2026

## [2.91.0](https://github.com/juspay/svelte-ui-components/compare/2.91.0..2.90.1) - 11 July 2026

## [2.90.1](https://github.com/juspay/svelte-ui-components/compare/2.90.1..2.90.0) - 10 July 2026

## [2.90.0](https://github.com/juspay/svelte-ui-components/compare/2.90.0..2.89.2) - 10 July 2026

## [2.89.2](https://github.com/juspay/svelte-ui-components/compare/2.89.2..2.89.1) - 10 July 2026

## [2.89.1](https://github.com/juspay/svelte-ui-components/compare/2.89.1..2.89.0) - 9 July 2026

## [2.89.0](https://github.com/juspay/svelte-ui-components/compare/2.89.0..2.88.0) - 8 July 2026

## [2.88.0](https://github.com/juspay/svelte-ui-components/compare/2.88.0..2.87.0) - 8 July 2026

## [2.87.0](https://github.com/juspay/svelte-ui-components/compare/2.87.0..2.86.0) - 7 July 2026

## [2.86.0](https://github.com/juspay/svelte-ui-components/compare/2.86.0..2.85.0) - 7 July 2026

## [2.85.0](https://github.com/juspay/svelte-ui-components/compare/2.85.0..2.84.1) - 7 July 2026

## [2.84.1](https://github.com/juspay/svelte-ui-components/compare/2.84.1..2.84.0) - 7 July 2026

## [2.84.0](https://github.com/juspay/svelte-ui-components/compare/2.84.0..2.83.0) - 7 July 2026

## [2.83.0](https://github.com/juspay/svelte-ui-components/compare/2.83.0..2.82.0) - 7 July 2026

## [2.82.0](https://github.com/juspay/svelte-ui-components/compare/2.82.0..2.81.3) - 7 July 2026

## [2.81.3](https://github.com/juspay/svelte-ui-components/compare/2.81.3..2.81.2) - 7 July 2026

## [2.81.2](https://github.com/juspay/svelte-ui-components/compare/2.81.2..2.81.1) - 6 July 2026

## [2.81.1](https://github.com/juspay/svelte-ui-components/compare/2.81.1..2.81.0) - 5 July 2026

## [2.81.0](https://github.com/juspay/svelte-ui-components/compare/2.81.0..2.80.10) - 5 July 2026

## [2.80.10](https://github.com/juspay/svelte-ui-components/compare/2.80.10..2.80.9) - 4 July 2026

## [2.80.9](https://github.com/juspay/svelte-ui-components/compare/2.80.9..2.80.8) - 3 July 2026

## [2.80.8](https://github.com/juspay/svelte-ui-components/compare/2.80.8..2.80.7) - 3 July 2026

## [2.80.7](https://github.com/juspay/svelte-ui-components/compare/2.80.7..2.80.6) - 3 July 2026

## [2.80.6](https://github.com/juspay/svelte-ui-components/compare/2.80.6..2.80.5) - 2 July 2026

## [2.80.5](https://github.com/juspay/svelte-ui-components/compare/2.80.5..2.80.4) - 1 July 2026

## [2.80.4](https://github.com/juspay/svelte-ui-components/compare/2.80.4..2.80.3) - 1 July 2026

## [2.80.3](https://github.com/juspay/svelte-ui-components/compare/2.80.3..2.80.2) - 30 June 2026

## [2.80.2](https://github.com/juspay/svelte-ui-components/compare/2.80.2..2.80.1) - 29 June 2026

## [2.80.1](https://github.com/juspay/svelte-ui-components/compare/2.80.1..2.80.0) - 29 June 2026

## [2.80.0](https://github.com/juspay/svelte-ui-components/compare/2.80.0..2.79.0) - 28 June 2026

## [2.79.0](https://github.com/juspay/svelte-ui-components/compare/2.79.0..2.78.0) - 28 June 2026

## [2.78.0](https://github.com/juspay/svelte-ui-components/compare/2.78.0..2.77.0) - 28 June 2026

## [2.77.0](https://github.com/juspay/svelte-ui-components/compare/2.77.0..2.76.1) - 28 June 2026

## [2.76.1](https://github.com/juspay/svelte-ui-components/compare/2.76.1..2.76.0) - 25 June 2026

## [2.76.0](https://github.com/juspay/svelte-ui-components/compare/2.76.0..2.75.0) - 25 June 2026

## [2.75.0](https://github.com/juspay/svelte-ui-components/compare/2.75.0..2.74.0) - 24 June 2026

## [2.74.0](https://github.com/juspay/svelte-ui-components/compare/2.74.0..2.73.2) - 22 June 2026

## [2.73.2](https://github.com/juspay/svelte-ui-components/compare/2.73.2..2.73.1) - 22 June 2026

## [2.73.1](https://github.com/juspay/svelte-ui-components/compare/2.73.1..2.73.0) - 21 June 2026

## [2.73.0](https://github.com/juspay/svelte-ui-components/compare/2.73.0..2.72.0) - 18 June 2026

## [2.72.0](https://github.com/juspay/svelte-ui-components/compare/2.72.0..2.71.0) - 18 June 2026

## [2.71.0](https://github.com/juspay/svelte-ui-components/compare/2.71.0..2.70.0) - 18 June 2026

## [2.70.0](https://github.com/juspay/svelte-ui-components/compare/2.70.0..2.69.3) - 18 June 2026

## [2.69.3](https://github.com/juspay/svelte-ui-components/compare/2.69.3..2.69.2) - 18 June 2026

## [2.69.2](https://github.com/juspay/svelte-ui-components/compare/2.69.2..2.69.1) - 18 June 2026

## [2.69.1](https://github.com/juspay/svelte-ui-components/compare/2.69.1..2.69.0) - 18 June 2026

## [2.69.0](https://github.com/juspay/svelte-ui-components/compare/2.69.0..2.68.0) - 18 June 2026

## [2.68.0](https://github.com/juspay/svelte-ui-components/compare/2.68.0..2.67.0) - 18 June 2026

## [2.67.0](https://github.com/juspay/svelte-ui-components/compare/2.67.0..2.66.0) - 18 June 2026

## [2.66.0](https://github.com/juspay/svelte-ui-components/compare/2.66.0..2.65.0) - 18 June 2026

## [2.65.0](https://github.com/juspay/svelte-ui-components/compare/2.65.0..2.64.1) - 18 June 2026

## [2.64.1](https://github.com/juspay/svelte-ui-components/compare/2.64.1..2.64.0) - 17 June 2026

## [2.64.0](https://github.com/juspay/svelte-ui-components/compare/2.64.0..2.63.1) - 17 June 2026

## [2.63.1](https://github.com/juspay/svelte-ui-components/compare/2.63.1..2.63.0) - 17 June 2026

## [2.63.0](https://github.com/juspay/svelte-ui-components/compare/2.63.0..2.62.1) - 17 June 2026

## [2.62.1](https://github.com/juspay/svelte-ui-components/compare/2.62.1..2.62.0) - 17 June 2026

## [2.62.0](https://github.com/juspay/svelte-ui-components/compare/2.62.0..2.61.0) - 17 June 2026

## [2.61.0](https://github.com/juspay/svelte-ui-components/compare/2.61.0..2.60.0) - 16 June 2026

## [2.60.0](https://github.com/juspay/svelte-ui-components/compare/2.60.0..2.59.0) - 16 June 2026

## [2.59.0](https://github.com/juspay/svelte-ui-components/compare/2.59.0..2.58.0) - 16 June 2026

## [2.58.0](https://github.com/juspay/svelte-ui-components/compare/2.58.0..2.57.0) - 16 June 2026

## [2.57.0](https://github.com/juspay/svelte-ui-components/compare/2.57.0..2.56.0) - 16 June 2026

## [2.56.0](https://github.com/juspay/svelte-ui-components/compare/2.56.0..2.55.0) - 16 June 2026

## [2.55.0](https://github.com/juspay/svelte-ui-components/compare/2.55.0..2.54.0) - 16 June 2026

## [2.54.0](https://github.com/juspay/svelte-ui-components/compare/2.54.0..2.53.0) - 16 June 2026

## [2.53.0](https://github.com/juspay/svelte-ui-components/compare/2.53.0..2.52.0) - 16 June 2026

## [2.52.0](https://github.com/juspay/svelte-ui-components/compare/2.52.0..2.51.0) - 16 June 2026

## [2.51.0](https://github.com/juspay/svelte-ui-components/compare/2.51.0..2.50.0) - 16 June 2026

## [2.50.0](https://github.com/juspay/svelte-ui-components/compare/2.50.0..2.49.0) - 16 June 2026

## [2.49.0](https://github.com/juspay/svelte-ui-components/compare/2.49.0..2.48.0) - 16 June 2026

## [2.48.0](https://github.com/juspay/svelte-ui-components/compare/2.48.0..2.47.0) - 16 June 2026

## [2.47.0](https://github.com/juspay/svelte-ui-components/compare/2.47.0..2.46.0) - 16 June 2026

## [2.46.0](https://github.com/juspay/svelte-ui-components/compare/2.46.0..2.45.1) - 16 June 2026

## [2.45.1](https://github.com/juspay/svelte-ui-components/compare/2.45.1..2.45.0) - 16 June 2026

## [2.45.0](https://github.com/juspay/svelte-ui-components/compare/2.45.0..2.44.0) - 16 June 2026

## [2.44.0](https://github.com/juspay/svelte-ui-components/compare/2.44.0..2.43.0) - 16 June 2026

## [2.43.0](https://github.com/juspay/svelte-ui-components/compare/2.43.0..2.42.0) - 16 June 2026

## [2.42.0](https://github.com/juspay/svelte-ui-components/compare/2.42.0..2.41.0) - 16 June 2026

## [2.41.0](https://github.com/juspay/svelte-ui-components/compare/2.41.0..2.40.0) - 16 June 2026

## [2.40.0](https://github.com/juspay/svelte-ui-components/compare/2.40.0..2.39.0) - 16 June 2026

## [2.39.0](https://github.com/juspay/svelte-ui-components/compare/2.39.0..2.38.0) - 16 June 2026

## [2.38.0](https://github.com/juspay/svelte-ui-components/compare/2.38.0..2.37.0) - 16 June 2026

## [2.37.0](https://github.com/juspay/svelte-ui-components/compare/2.37.0..2.36.0) - 16 June 2026

## [2.36.0](https://github.com/juspay/svelte-ui-components/compare/2.36.0..2.35.0) - 16 June 2026

## [2.35.0](https://github.com/juspay/svelte-ui-components/compare/2.35.0..2.34.0) - 16 June 2026

## [2.34.0](https://github.com/juspay/svelte-ui-components/compare/2.34.0..2.33.0) - 16 June 2026

## [2.33.0](https://github.com/juspay/svelte-ui-components/compare/2.33.0..2.32.1) - 15 June 2026

## [2.32.1](https://github.com/juspay/svelte-ui-components/compare/2.32.1..2.32.0) - 15 June 2026

## [2.32.0](https://github.com/juspay/svelte-ui-components/compare/2.32.0..2.31.0) - 15 June 2026

## [2.31.0](https://github.com/juspay/svelte-ui-components/compare/2.31.0..2.30.0) - 15 June 2026

## [2.30.0](https://github.com/juspay/svelte-ui-components/compare/2.30.0..2.29.0) - 15 June 2026

## [2.29.0](https://github.com/juspay/svelte-ui-components/compare/2.29.0..2.28.3) - 15 June 2026

## [2.28.3](https://github.com/juspay/svelte-ui-components/compare/2.28.3..2.28.2) - 14 June 2026

## [2.28.2](https://github.com/juspay/svelte-ui-components/compare/2.28.2..2.28.1) - 13 June 2026

## [2.28.1](https://github.com/juspay/svelte-ui-components/compare/2.28.1..2.28.0) - 13 June 2026

## [2.28.0](https://github.com/juspay/svelte-ui-components/compare/2.28.0..2.27.0) - 13 June 2026

## [2.27.0](https://github.com/juspay/svelte-ui-components/compare/2.27.0..2.26.0) - 13 June 2026

## [2.26.0](https://github.com/juspay/svelte-ui-components/compare/2.26.0..2.25.0) - 13 June 2026

## [2.25.0](https://github.com/juspay/svelte-ui-components/compare/2.25.0..2.24.0) - 13 June 2026

## [2.24.0](https://github.com/juspay/svelte-ui-components/compare/2.24.0..2.23.1) - 13 June 2026

## [2.23.1](https://github.com/juspay/svelte-ui-components/compare/2.23.1..2.23.0) - 8 June 2026

## [2.23.0](https://github.com/juspay/svelte-ui-components/compare/2.23.0..2.22.1) - 8 June 2026

## [2.22.1](https://github.com/juspay/svelte-ui-components/compare/2.22.1..2.22.0) - 4 June 2026

## [2.22.0](https://github.com/juspay/svelte-ui-components/compare/2.22.0..2.21.0) - 4 June 2026

## [2.21.0](https://github.com/juspay/svelte-ui-components/compare/2.21.0..2.20.2) - 3 June 2026

## [2.20.2](https://github.com/juspay/svelte-ui-components/compare/2.20.2..2.20.1) - 3 June 2026

## [2.20.1](https://github.com/juspay/svelte-ui-components/compare/2.20.1..2.20.0) - 2 June 2026

## [2.20.0](https://github.com/juspay/svelte-ui-components/compare/2.20.0..2.19.2) - 31 May 2026

## [2.19.2](https://github.com/juspay/svelte-ui-components/compare/2.19.2..2.19.1) - 5 May 2026

## [2.19.1](https://github.com/juspay/svelte-ui-components/compare/2.19.1..2.19.0) - 4 May 2026

## [2.19.0](https://github.com/juspay/svelte-ui-components/compare/2.19.0..2.18.2) - 1 May 2026

## [2.18.2](https://github.com/juspay/svelte-ui-components/compare/2.18.2..2.18.1) - 1 May 2026

## [2.18.1](https://github.com/juspay/svelte-ui-components/compare/2.18.1..2.18.0) - 1 May 2026

## [2.18.0](https://github.com/juspay/svelte-ui-components/compare/2.18.0..2.17.0) - 17 April 2026

## [2.17.0](https://github.com/juspay/svelte-ui-components/compare/2.17.0..2.16.0) - 17 April 2026

## [2.16.0](https://github.com/juspay/svelte-ui-components/compare/2.16.0..2.15.0) - 14 April 2026

## [2.15.0](https://github.com/juspay/svelte-ui-components/compare/2.15.0..2.14.1) - 5 April 2026

## [2.14.1](https://github.com/juspay/svelte-ui-components/compare/2.14.1..2.14.0) - 24 March 2026

## [2.14.0](https://github.com/juspay/svelte-ui-components/compare/2.14.0..2.13.2) - 24 March 2026

## [2.13.2](https://github.com/juspay/svelte-ui-components/compare/2.13.2..2.13.1) - 24 March 2026

## [2.13.1](https://github.com/juspay/svelte-ui-components/compare/2.13.1..2.13.0) - 19 March 2026

## [2.13.0](https://github.com/juspay/svelte-ui-components/compare/2.13.0..2.12.0) - 19 March 2026

## [2.12.0](https://github.com/juspay/svelte-ui-components/compare/2.12.0..2.11.0) - 16 March 2026

## [2.11.0](https://github.com/juspay/svelte-ui-components/compare/2.11.0..2.10.0) - 2 March 2026

## [2.10.0](https://github.com/juspay/svelte-ui-components/compare/2.10.0..2.9.0) - 17 February 2026

## [2.9.0](https://github.com/juspay/svelte-ui-components/compare/2.9.0..2.8.0) - 21 January 2026

## [2.8.0](https://github.com/juspay/svelte-ui-components/compare/2.8.0..2.7.0) - 7 January 2026

## [2.7.0](https://github.com/juspay/svelte-ui-components/compare/2.7.0..2.6.0) - 26 December 2025

## [2.6.0](https://github.com/juspay/svelte-ui-components/compare/2.6.0..2.5.0) - 26 December 2025

## [2.5.0](https://github.com/juspay/svelte-ui-components/compare/2.5.0..2.4.0) - 23 December 2025

## [2.4.0](https://github.com/juspay/svelte-ui-components/compare/2.4.0..2.3.0) - 23 December 2025

## [2.3.0](https://github.com/juspay/svelte-ui-components/compare/2.3.0..2.2.4) - 25 November 2025

## [2.2.4](https://github.com/juspay/svelte-ui-components/compare/2.2.4..2.2.3) - 11 November 2025

## [2.2.3](https://github.com/juspay/svelte-ui-components/compare/2.2.3..2.2.2) - 10 November 2025

## [2.2.2](https://github.com/juspay/svelte-ui-components/compare/2.2.2..2.2.1) - 10 November 2025

## [2.2.1](https://github.com/juspay/svelte-ui-components/compare/2.2.1..2.2.0) - 5 November 2025

## [2.2.0](https://github.com/juspay/svelte-ui-components/compare/2.2.0..2.1.0) - 5 November 2025

## [2.1.0](https://github.com/juspay/svelte-ui-components/compare/2.1.0..2.0.0) - 4 November 2025

## [2.0.0](https://github.com/juspay/svelte-ui-components/compare/2.0.0..1.34.2) - 27 October 2025

## [1.34.2](https://github.com/juspay/svelte-ui-components/compare/1.34.2..1.34.1) - 27 October 2025

## [1.34.1](https://github.com/juspay/svelte-ui-components/compare/1.34.1..v1.34.1) - 6 August 2025

## [v1.34.1](https://github.com/juspay/svelte-ui-components/compare/v1.34.1..1.34.0) - 6 August 2025

## [1.34.0](https://github.com/juspay/svelte-ui-components/compare/1.34.0..1.33.0) - 22 May 2025

- published version 1.34.0

## [1.33.0](https://github.com/juspay/svelte-ui-components/compare/1.33.0..1.32.0) - 4 May 2025

- released version 1.33.0 to npm

## [1.32.0](https://github.com/juspay/svelte-ui-components/compare/1.32.0..1.31.0) - 28 April 2025

- published package to version 1.32.0

## [1.31.0](https://github.com/juspay/svelte-ui-components/compare/1.31.0..1.30.0) - 24 April 2025

- publishing 1.31.0

## [1.30.0](https://github.com/juspay/svelte-ui-components/compare/1.30.0..1.29.0) - 21 April 2025

- published version 1.30.0

## [1.29.0](https://github.com/juspay/svelte-ui-components/compare/1.29.0..1.28.3) - 3 April 2025

- released version 1.29.0

## [1.28.3](https://github.com/juspay/svelte-ui-components/compare/1.28.3..1.27.0) - 3 April 2025

- added vars to customisation height, width, top, bottom and left
- added vars to customise BrandLoader bg & dimensions
- published changes to version 1.28.3

## [1.27.0](https://github.com/juspay/svelte-ui-components/compare/1.27.0..1.26.0) - 26 March 2025

- published version 1.27.0

## [1.26.0](https://github.com/juspay/svelte-ui-components/compare/1.26.0..1.24.0) - 17 March 2025

- releasing changes on 1.26.0

## [1.24.0](https://github.com/juspay/svelte-ui-components/compare/1.24.0..1.23.0) - 3 March 2025

- release 1.24.0

## [1.23.0](https://github.com/juspay/svelte-ui-components/compare/1.23.0..1.22.0) - 7 February 2025

- released version 1.23.0

## [1.22.0](https://github.com/juspay/svelte-ui-components/compare/1.22.0..1.21.0) - 26 December 2024

- published version 1.22.0

## [1.21.0](https://github.com/juspay/svelte-ui-components/compare/1.21.0..1.20.0) - 23 December 2024

- published version 1.21.0

## [1.20.0](https://github.com/juspay/svelte-ui-components/compare/1.20.0..1.17.0) - 23 December 2024

- published version 1.20.0

## [1.17.0](https://github.com/juspay/svelte-ui-components/compare/1.17.0..1.12.0) - 11 October 2024

- release new version & exposed grid item

## [1.12.0](https://github.com/juspay/svelte-ui-components/compare/1.12.0..1.11.0) - 23 September 2024

- published version 1.12.0

## [1.11.0](https://github.com/juspay/svelte-ui-components/compare/1.11.0..1.10.0) - 29 August 2024

- publishing version 1.11.0

## [1.10.0](https://github.com/juspay/svelte-ui-components/compare/1.10.0..1.9.0) - 19 June 2024

- releasing version 1.10.0
- added formatting changes

## [1.9.0](https://github.com/juspay/svelte-ui-components/compare/1.9.0..1.8.0) - 3 June 2024

- Releasing version 1.9.0
- Updated publish script to force push publish script changes
- Formatted Select.svelte with formatter

## [1.8.0](https://github.com/juspay/svelte-ui-components/compare/1.8.0..1.7.0) - 28 May 2024

- releasing version 1.8.0

## [1.7.0](https://github.com/juspay/svelte-ui-components/compare/1.7.0..1.6.0) - 17 May 2024

- release version 1.7.0

## [1.6.0](https://github.com/juspay/svelte-ui-components/compare/1.6.0..1.5.0) - 8 May 2024

Bumps [vite](https://github.com/vitejs/vite/tree/HEAD/packages/vite) from 4.5.2 to 4.5.3.
- [Release notes](https://github.com/vitejs/vite/releases)
- [Changelog](https://github.com/vitejs/vite/blob/v4.5.3/packages/vite/CHANGELOG.md)
- [Commits](https://github.com/vitejs/vite/commits/v4.5.3/packages/vite)

---
updated-dependencies:
- dependency-name: vite
dependency-type: direct:development
...

Signed-off-by: dependabot[bot] &lt;support@github.com&gt;

## [1.5.0](https://github.com/juspay/svelte-ui-components/compare/1.5.0..1.4.0) - 1 March 2024

- publishing out version 1.5.0

## [1.4.0](https://github.com/juspay/svelte-ui-components/compare/1.4.0..1.3.0) - 1 March 2024

- releasing version 1.4.0 to npm

## [1.3.0](https://github.com/juspay/svelte-ui-components/compare/1.3.0..1.2.0) - 14 January 2024

- releasing version 1.3.0 with support for fallback images in list item left icon

## [1.2.0](https://github.com/juspay/svelte-ui-components/compare/1.2.0..1.1.0) - 15 December 2023

- releasing version 1.2.0

## [1.1.0](https://github.com/juspay/svelte-ui-components/compare/1.1.0..1.0.0) - 13 December 2023

- releasing version: 1.1.0

##
1.0.0 - 17 November 2023

- added publish script for building & pushing the package to npmjs
