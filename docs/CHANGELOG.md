# Changelog All notable changes to this project will be documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/juspay/svelte-ui-components/compare/HEAD..2.86.0)

Brings BarChart, LineChart, AreaChart, FunnelChart, and DualAxisBarChart
up to Highcharts conventions for label rendering, tooltip positioning,
and interaction, while preserving current visual designs. All changes
are additive to the public API.

Shared _chart primitives:
- measure.ts: cached text measurement (measureText)
- labels.ts: Highcharts-style label placement chain (outside -&gt; inside
with contrast+outline -&gt; hidden), collision detection, truncation
- geometry.ts: computeAutoLayout for measured margins from tick-label
widths, plus stacked-value helpers
- tooltipPosition.ts: anchored tooltip positioning with flip-then-clamp
behavior at viewport/container edges
- scales.ts: integer tick mode for category axes (prevents fractional
tick steps from producing duplicate/misaligned labels)
- interactions.ts: shared pointer helpers (pointerPositionIn,
dismissOnOutsidePointerDown) used by all five charts
- Axis.svelte: auto tick rotation (-45deg) and thinning under crowding
- ChartTooltip.svelte: v2 with portal-mode support (tooltipPortal prop)
- Legend.svelte: toggleable legend items with aria-pressed

Per-chart behavior:
- BarChart: overlap-safe value labels (outside/inside flip), auto
layout, interactive legend with rescale, pointer/keyboard/touch
interactions, tooltip clamping
- LineChart: shared tooltip mode across series, hover halo, category
tick formatting via integer ticks, interactive legend (hidden series
excluded from axis domain calculation so scales rescale)
- AreaChart: auto layout, point label placement (respects
stackNormalize so labels don't show raw values next to a
percent-scaled chart), minHeight/maxHeight clamping
- FunnelChart: dynamic label-area sizing, fitted category/value labels
with a full -&gt; compact -&gt; hidden crop chain, theme-aware connector
color, cursor-follow tooltip (documented exception for extent-type
charts)
- DualAxisBarChart: sign-dependent bar rounding, shared tooltip anchor
computation across dual axes, keyboard-focusable category hit areas
with aria-labels that include series values (not just category name)

Dark/light mode: all new chart tokens resolve through CSS light-dark()
with override support; no light-dark()/var() in SVG presentation
attributes (kept to style= where required).

Deliberate improved-defaults (documented in each component's props
table): hideLegendBelow defaults to 360 (legend sheds on narrow
charts); LineChart sharedTooltip defaults on for multi-series;
AreaChart now clamps height at 420px for LineChart parity.

Also repairs three stale test/demo contracts that pre-dated this
branch: the tooltip demo page now exposes the tooltip-container test
hook its spec expects, the delayed-tooltip spec scrolls its
below-the-fold trigger into view before raw mouse moves, and the
date-range-picker toggle spec locates the trigger by stable class
instead of an accessible name that flips while open.

Testing: 92 Vitest unit tests across the shared _chart primitives
plus a Playwright functional suite (tests/chart-behaviors.spec.ts)
covering interactive legend rescale, label flip, tooltip clamping,
axis crowding/thinning, shared-tooltip hover, keyboard activation,
and touch tap/dismiss. Full suite green: 92/92 functional tests.

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
