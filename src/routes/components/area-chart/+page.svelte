<script lang="ts">
  import AreaChart from '$lib/AreaChart/AreaChart.svelte';

  const singleSeries = [
    {
      name: 'Traffic',
      data: [
        { x: 1, y: 120 },
        { x: 2, y: 180 },
        { x: 3, y: 150 },
        { x: 4, y: 220 },
        { x: 5, y: 200 },
        { x: 6, y: 280 },
        { x: 7, y: 260 },
        { x: 8, y: 310 }
      ]
    }
  ];

  const stackedSeries = [
    {
      name: 'Direct',
      data: [
        { x: 1, y: 40 },
        { x: 2, y: 50 },
        { x: 3, y: 45 },
        { x: 4, y: 60 },
        { x: 5, y: 55 },
        { x: 6, y: 70 }
      ]
    },
    {
      name: 'Organic',
      data: [
        { x: 1, y: 30 },
        { x: 2, y: 40 },
        { x: 3, y: 35 },
        { x: 4, y: 45 },
        { x: 5, y: 50 },
        { x: 6, y: 55 }
      ]
    },
    {
      name: 'Referral',
      data: [
        { x: 1, y: 20 },
        { x: 2, y: 25 },
        { x: 3, y: 22 },
        { x: 4, y: 30 },
        { x: 5, y: 28 },
        { x: 6, y: 35 }
      ]
    }
  ];

  // ── Negative value in a stack ─────────────────────────────
  // Plain `stacked` (not stackNormalize) still routes through
  // computeStackedValues, which clamps a negative y to a ZERO-height
  // contribution rather than inverting the stack. "Returns" dips negative
  // at x=3 and x=6 below -- its top edge lands flush with "Revenue"'s own
  // flat 100 top edge at those two points, instead of pulling the stack
  // under it.
  const stackedNegativeSeries = [
    {
      name: 'Revenue',
      data: [
        { x: 1, y: 100 },
        { x: 2, y: 100 },
        { x: 3, y: 100 },
        { x: 4, y: 100 },
        { x: 5, y: 100 },
        { x: 6, y: 100 }
      ]
    },
    {
      name: 'Returns',
      data: [
        { x: 1, y: 20 },
        { x: 2, y: 30 },
        { x: 3, y: -40 },
        { x: 4, y: 10 },
        { x: 5, y: 25 },
        { x: 6, y: -15 }
      ]
    }
  ];

  // ── Cross-series alignment demo ───────────────────────────
  // "This week" is missing x=3; "Last week" is missing x=6. Hover at any x
  // and each series reports its OWN sample there -- never a value borrowed
  // from the other series' array index.
  const misalignedSeries = [
    {
      name: 'This week',
      data: [
        { x: 1, y: 24 },
        { x: 2, y: 30 },
        { x: 4, y: 28 },
        { x: 5, y: 34 },
        { x: 6, y: 40 }
      ]
    },
    {
      name: 'Last week',
      data: [
        { x: 1, y: 18 },
        { x: 2, y: 22 },
        { x: 3, y: 20 },
        { x: 4, y: 25 },
        { x: 5, y: 21 }
      ]
    }
  ];

  // ── Gap points demo ────────────────────────────────────────
  const gapSeries = [
    {
      name: 'Sales',
      // x=4 and x=8 had no reading -- NaN marks a gap, not a fabricated 0,
      // and no longer poisons the whole y-axis the way a bare Math.min/max
      // over every value (including the NaN) used to.
      data: [
        { x: 1, y: 120 },
        { x: 2, y: 150 },
        { x: 3, y: 135 },
        { x: 4, y: Number.NaN },
        { x: 5, y: 160 },
        { x: 6, y: 175 },
        { x: 7, y: 168 },
        { x: 8, y: Number.NaN },
        { x: 9, y: 190 }
      ]
    }
  ];
</script>

<div class="page-header">
  <span class="category-badge">Data Visualization</span>
  <h1>AreaChart</h1>
</div>

<h3>Basic Area</h3>
<div class="demo-row">
  <AreaChart series={singleSeries} />
</div>

<h3>With Dots</h3>
<div class="demo-row">
  <AreaChart series={singleSeries} showDots />
</div>

<h3>Stacked Area</h3>
<div class="demo-row">
  <AreaChart series={stackedSeries} stacked showLegend />
</div>

<h3>Stacked Area — negative value clamps to zero</h3>
<p>
  A negative y-value in a stacked series contributes <strong>zero height</strong>, not a negative
  one — it never inverts the stack. "Returns" goes negative at x=3 and x=6 below; watch its top edge
  land flush with "Revenue"'s flat 100 top edge at those two points instead of dipping under it. See
  <code>docs/CHART_INPUT_POLICY.md</code> for the full input-shape table.
</p>
<div class="demo-row">
  <AreaChart
    series={stackedNegativeSeries}
    stacked
    showLegend
    showDots
    testId="area-stacked-negative-chart"
  />
</div>

<h3>Higher Fill Opacity</h3>
<div class="demo-row">
  <AreaChart series={singleSeries} fillOpacity={0.6} />
</div>

<h3>Cross-Series Alignment — mismatched x coverage</h3>
<p>
  "This week" has no sample at x=3; "Last week" has none at x=6. Series are joined by their
  <strong>x value</strong>, not by array position, so hovering anywhere reports each series' own
  value at that x (or omits it entirely) — never a value borrowed from the other series' array
  index. See <code>docs/CHART_INPUT_POLICY.md</code> for the full input-shape table.
</p>
<div class="demo-row">
  <AreaChart series={misalignedSeries} showLegend showDots testId="area-alignment-chart" />
</div>

<h3>Sparse Series — Gap Points</h3>
<p>
  A non-finite y (<code>NaN</code>) marks a gap: the area breaks around x=4 and x=8 below and
  resumes at the next finite point, instead of one poisoned path or a fabricated 0.
</p>
<div class="demo-row">
  <AreaChart series={gapSeries} showDots testId="area-gap-chart" />
</div>

<h3>Legend aggregates (<code>aggregate</code> + <code>aggregateFormat</code>)</h3>
<p>
  Aggregates are always per-series, even when <code>stacked</code> — the legend total for "Direct" below
  is the sum of its own six points, never the per-category stack total.
</p>
<div class="demo-row">
  <AreaChart
    series={[
      { ...stackedSeries[0], aggregate: 'sum', aggregateFormat: (v) => `${v} visits` },
      { ...stackedSeries[1], aggregate: 'average' },
      stackedSeries[2]
    ]}
    stacked
    showLegend
    testId="area-legend-aggregate-chart"
  />
</div>
