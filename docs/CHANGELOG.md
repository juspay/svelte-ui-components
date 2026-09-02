# Changelog All notable changes to this project will be documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/juspay/svelte-ui-components/compare/HEAD..3.1.0)

Review comments that arrived on #494-#499 after I reported each PR done, and
were never addressed before merge. All verified against the merged code before
anything was changed; three turned out not to hold and are left alone.

Fixed:

1. The codemod rewrote Stepper consumers onto a deprecated prop (#495, MAJOR).
`StepperProperties` marks `onhandleStepClick` "@deprecated Use onstepclick
instead", and the map targeted it. The cause is in the map's derivation
rule: pairs were accepted when lower(sui) === lower(poly), which is
deprecation-blind, so an alias whose lowercase spelling matches the fork's
outranks the canonical prop and wins the pair. A consumer running the
codemod landed on the one spelling of that event scheduled for removal.
Stepper is the only affected pair of the 28. The target is now `onstepclick`,
with `onhandleStepClick` still recognised as a source in the to-poly
direction so a SUI consumer on either spelling converts.

map.ts had no test at all, which is how this got through. map.test.ts now
asserts no target is @deprecated, every target is really declared, and a
pair may only differ by more than case in order to step over a deprecated
alias. It fails on the old map.

2. Two visual-suite stabilisers gave up silently (#496, MAJOR). This one found
a real bug underneath it:

- fitViewportToContent returned after 4 attempts whether or not the height
had settled. Two demos never settle, because the shell is min-height:100vh
and they add their own full-height element -- every pixel the viewport
gains comes back as content. Measured: `table` is 36388px at every
viewport, `brand-loader` grows 1x the viewport gain, `status` grows 3x.
The loop was running out of attempts and capturing at whatever size the
budget left, which is why brand-loader kept flaking. status was the
clearest symptom: its baseline had inflated to 60209px, ~92% stretched
empty space. Growth that tracks the viewport is now detected and the page
pinned to the default viewport. Anything moving for a third reason throws
instead of being captured mid-scroll.

Both baselines are regenerated. status drops to 2609px, 84% smaller, with
all seven demo variants still in frame (checked by eye, not by size).

- waitForImages snapshotted document.images once, so an image appended while
the first batch settled was never awaited. It rescans each round.

3. docs/Img.md claimed child elements are "inlined as-is" (#498). True before
that PR, false after it -- sanitizeInlinedSubtree was added precisely
because the root allowlist alone was bypassable, and the sentence describing
the old behaviour was left behind. Documentation understating a security
boundary is worth more than the minor it was filed as: a reader deciding
whether to inline a third-party SVG would have concluded it is not safe. Now
states what is actually stripped.

4. The ci.yml comment still asserted the "11 consecutive green runs" figure
(#494). That was withdrawn during review of #494 itself, when the first run
with the gate enabled caught a failing spec -- but only the PR body was
corrected, and the workflow is the copy that outlives the PR. The field was
backwards too: continue-on-error rewrites the step's `conclusion` to
success, so `outcome` is what survives it.

5. scripts/visual-test.sh documented `--update` in its own usage block (#496).
`playwright test --update` exits with "unknown option". package.json already
used --update-snapshots, so only the path through the script's header was
broken.

6. Nothing enforced the container/package lockstep in CI (#496). visual.yml
only asked for it in a comment. It now checks that the image ships the
browser Playwright expects and names the three files to update. Deliberately
a check and not `playwright install`, which was the suggested fix: installing
inside the container shadows the image's pinned browser, so CI would
silently rasterise differently from every laptop -- the exact drift these
pinned baselines exist to catch.

Not changed, having checked:

- The image tag version parse handles the tag shape it was reported to break
on: %%-* strips from the first hyphen, so v1.60.0-jammy-amd64 yields 1.60.0.
- Route discovery was reported to miss demos against a 97-directory tree with a
SKIP_SLUGS filter. There are 94 directories and no such constant; the filter
is EXCLUDED, which emits visible skipped tests. 92 baselined + 2 excluded
accounts for all 94. Deriving the list from _nav.ts instead would weaken the
guarantee, since a demo on disk but missing from the nav would go
unscreenshotted.
- A workflow-level env for the pnpm version is per-workflow, so it cannot
deduplicate a version pinned in both ci.yml and visual.yml, and would make
visual.yml diverge from ci.yml. The fix that would collapse both is a
packageManager field, which changes local resolution for everyone and is not
a review-sweep edit.

Also carries the five findings from #499 that opened this PR: semver range
intersection for the peer check, AST-literal detection for showBackButton
(JSON.stringify matched "computed":false on any MemberExpression, so a bound
guard read as disabled and its affected usage went unreported), the CSS
selector line offset, JSON.stringify on --target, and file-URL entrypoint
detection for Windows.

Verified: 97/97 in scripts/codemod (was 96, and map.ts had no test file),
36/36 in scripts/migrate, 285/285 unit, lint and check clean. Visual suite run
in the pinned container twice end to end.

---

Second round: seven review comments on this PR itself, all verified.

7. isFalseLiteral read only the bare ExpressionTag shape (MAJOR). Svelte types
an attribute value as `true | ExpressionTag | Array&lt;Text | ExpressionTag&gt;`,
and quoting a single expression -- showBackButton="{false}" -- produces the
one-element array. So a Toolbar whose control genuinely never renders was
reported as affected. This one errs the safe way, unlike the false negative
it replaced: it over-reports rather than under-reports. Test written first
and watched fail.

8. The viewport-relative heuristic could misclassify legitimate growth, on code
added earlier in this same PR. `height - previousHeight &gt;= viewportGain - 1`
treats any growth past the viewport gain as viewport-relative, so a page
that reveals a large section when given room would be pinned to the default
viewport and lose everything below the fold.

The suggested fix was an allowlist of the two known routes. Not taken: that
hardcodes the answer, so a future viewport-relative demo regresses silently
to the old behaviour. The classification is now confirmed rather than
inferred -- shrink the viewport and check the content follows it down.
Content sized against the viewport shrinks with it; content that was merely
revealed does not. Pinned routes are logged, which was the good half of the
suggestion.

Verified: the full suite pins exactly 2 routes and leaves the other 90
alone. A single delta could not have told those apart.

9. The entrypoint guard used `undefined`, which the repo's ESLint config bans.
It only escaped because `lint` covers `src` alone -- the same gap reported
on #495 and still open.

10. The --target injection test asserted the manifest was uncorrupted but never
that the apply happened, so a refusal would have satisfied every assertion
in it. Now asserts exitCode and applied.

11. waitForImages re-added listeners to an image still pending on the next
round. Watches are memoised in a WeakMap.

12. docBlockFor interpolated a prop name into a regex unescaped. Every current
name is a plain identifier, and the first test in the file asserts each one
resolves, so a miss would already fail loudly -- escaped anyway.

Kept, with evidence: `intersects(..., { loose: true })` was reported as
possibly accepting prereleases unexpectedly. Measured across 18 ranges, loose
changes the answer for exactly one -- ^05.41.2, where strict parsing throws and
would report a blocker that does not exist. Both prerelease examples named in
the review resolve identically either way. The mode is safer, not looser; now
documented and pinned by a test.

Final: 286/286 unit, 134/134 across scripts/, lint and check clean, visual 92
passed / 2 skipped / 0 failed in the pinned container.

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
