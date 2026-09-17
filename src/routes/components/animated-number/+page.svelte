<script lang="ts">
  import AnimatedNumber from '$lib/AnimatedNumber/AnimatedNumber.svelte';

  let counter = $state(99);
  let revenue = $state(1234567);
  let percent = $state(42);
  let money = $state(99.99);
  let statValue = $state('₹1.23Cr');

  const STAT_VALUES = ['₹1.23Cr', '₹1.45Cr', '₹9.80Cr', '₹12.4Cr', '₹98.7L'] as const;
  let statIndex = $state(0);

  const cycleStat = (): void => {
    statIndex = (statIndex + 1) % STAT_VALUES.length;
    statValue = STAT_VALUES[statIndex];
  };

  let signed = $state(-42);

  const burst = (): void => {
    // Finite, synchronous timeouts -- never a repeating interval, which is what
    // put thinking-indicator on the visual suite's permanently-excluded list.
    [40, 80, 120, 160, 200].forEach((delay, step) => {
      setTimeout(() => (counter = 500 + step * 111), delay);
    });
  };

  const randomise = (): void => {
    counter = Math.floor(Math.random() * 10000);
    revenue = Math.floor(Math.random() * 99999999);
    percent = Math.floor(Math.random() * 101);
    money = Math.round(Math.random() * 100000) / 100;
  };
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>AnimatedNumber</h1>
</div>

<p class="intro">
  A per-digit odometer. Each digit is an overflow-clipped column holding the glyphs 0&ndash;9; a
  value change rewrites one CSS custom property per column and a tokenised <code>transition</code>
  does the rest. No <code>requestAnimationFrame</code>, no timer, no
  <code>element.animate()</code>, no <code>$effect</code>.
</p>

<h3>Click to watch it roll</h3>
<div class="demo-row big">
  <AnimatedNumber value={counter} testId="counter" />
</div>
<div class="demo-row">
  <button onclick={() => (counter += 1)}>+1</button>
  <button onclick={() => (counter += 7)}>+7</button>
  <button onclick={() => (counter += 100)}>+100</button>
  <button onclick={() => (counter = Math.max(0, counter - 137))}>&minus;137</button>
  <button onclick={() => (counter = 99)}>reset to 99</button>
</div>
<p class="state-display">
  99 &rarr; 100 is the interesting one: the two existing columns roll, the new leading column mounts
  at rest.
</p>

<h3>Grouping, currency and percent</h3>
<div class="demo-row big">
  <AnimatedNumber
    value={revenue}
    format={{ style: 'currency', currency: 'INR' }}
    testId="revenue"
  />
</div>
<div class="demo-row big">
  <AnimatedNumber value={money} format={{ style: 'currency', currency: 'USD' }} testId="money" />
  <AnimatedNumber value={percent / 100} format={{ style: 'percent' }} testId="percent" />
</div>
<div class="demo-row">
  <button onclick={randomise}>randomise all</button>
  <button onclick={() => (money = 100.01)}>$99.99 &rarr; $100.01</button>
  <button onclick={() => (money = 99.99)}>back to $99.99</button>
</div>

<h3>Indian grouping (the shape changes, not just the digits)</h3>
<div class="demo-row big">
  <AnimatedNumber value={revenue} locale="en-IN" testId="en-in" />
</div>
<p class="state-display">
  en-IN groups 1,00,000 rather than 100,000 &mdash; the separator positions move.
</p>

<h3>Pre-formatted strings &mdash; the StatCard case</h3>
<div class="demo-row big">
  <AnimatedNumber value={statValue} testId="stat" />
</div>
<div class="demo-row">
  <button onclick={cycleStat}>next value</button>
</div>
<p class="state-display">
  No number is passed at all &mdash; just the string <code>StatCard.value</code> already holds.
  <code>₹1.23Cr &rarr; ₹1.45Cr</code> rolls two digits and leaves ₹, 1, . and Cr alone.
  <code>₹12.4Cr &rarr; ₹98.7L</code> is a genuinely different shape and degrades to a swap.
</p>

<h3>Edge cases</h3>
<div class="demo-row big">
  <AnimatedNumber value={signed} testId="signed" />
  <AnimatedNumber value={0} testId="zero" />
  <AnimatedNumber value={Number.NaN} testId="nan" />
  <AnimatedNumber value={Number.POSITIVE_INFINITY} testId="infinity" />
</div>
<div class="demo-row big">
  <AnimatedNumber value={3.14159} format={{ minimumFractionDigits: 5 }} testId="fraction" />
  <AnimatedNumber value={98765432109876} testId="huge" />
  <AnimatedNumber value="N/A" testId="no-digits" />
</div>
<div class="demo-row">
  <button onclick={() => (signed = signed > 0 ? -signed : Math.abs(signed) || 5)}>flip sign</button>
  <button onclick={burst}>burst: 5 changes in 200ms</button>
</div>
<p class="state-display">
  Sign crossing, signed zero, NaN, Infinity, fractions, a 14-digit value, and a string with no
  digits at all. The burst button checks that rapid retargeting settles on the final value rather
  than stranding mid-roll.
</p>

<h3>Theming through the motion tokens</h3>
<div class="demo-row big">
  <span class="slow"><AnimatedNumber value={counter} testId="slow" /></span>
  <span class="snappy"><AnimatedNumber value={counter} testId="snappy" /></span>
</div>
<p class="state-display">
  Left: <code>--motion-duration: 2s</code>. Right:
  <code>--animated-number-digit-transition-duration: 120ms</code>. Same component, same value.
</p>

<style>
  .demo-row {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 0.75rem;
  }
  .demo-row.big {
    font-size: 2.5rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  button {
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    border: 1px solid #c4ccd6;
    background: #fff;
    cursor: pointer;
    font: inherit;
  }
  button:hover {
    background: #eef2f6;
  }
  .slow {
    --motion-duration: 2s;
  }
  .snappy {
    --animated-number-digit-transition-duration: 120ms;
    --animated-number-digit-transition-easing: cubic-bezier(0.2, 0.9, 0.3, 1.3);
  }
  .state-display {
    color: #6b7684;
    font-size: 0.9rem;
    margin: 0 0 1.5rem;
  }
</style>
