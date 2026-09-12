<script lang="ts">
  import Slider from '$lib/Slider/Slider.svelte';

  let sliderValue = $state(50);

  let volume = $state(40);

  let submitted = $state('');

  function capture(event: SubmitEvent): void {
    event.preventDefault();
    const target = event.target;
    if (!(target instanceof HTMLFormElement)) {
      return;
    }
    submitted = [...new FormData(target)]
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(' ');
  }
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>Slider</h1>
</div>

<div class="demo-row" style="max-width: 400px;">
  <Slider
    bind:value={sliderValue}
    min={0}
    max={100}
    step={1}
    showValue
    ariaLabel="Volume"
    testId="slider-basic"
  />
</div>

<h3>Native form submission and spoken value</h3>
<p class="demo-caption">
  <code>name</code> submits the current value. <code>ariaValueText</code> replaces the raw number for
  assistive technology when the digits do not carry the meaning.
</p>
<form class="demo-row" onsubmit={capture} data-pw="slider-form-demo">
  <Slider
    bind:value={volume}
    name="volume"
    ariaLabel="Output level"
    labelFormatter={(value: number) => `${value}%`}
    testId="slider-form-volume"
  />
  <button type="submit" data-pw="slider-form-submit">Submit</button>
  <span data-pw="slider-form-result">{submitted}</span>
</form>
