<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import Input from '$lib/Input/Input.svelte';
  import Slider from '$lib/Slider/Slider.svelte';
  import SplitInput from '$lib/SplitInput/SplitInput.svelte';
  import swapVerticalSvg from '$lib/assets/swap-vertical.svg?raw';
  import type { ColorPickerProperties } from './properties';
  import {
    hexToHsv,
    hsvToHex,
    hsvToRgb,
    hsvToHsl,
    hslToHsv,
    rgbToHsv,
    isValidHex,
    clampInt
  } from '$lib/utils';

  let {
    value = $bindable('#000000'),
    label,
    disabled = false,
    showValue = false,
    testId,
    onchange: onchangeLegacy,
    onChange,
    oninput: oninputLegacy,
    onInput,
    classes
  }: ColorPickerProperties = $props();

  // Event-casing phase 1: both spellings accepted, the correct one wins.
  const onchange = $derived(onChange ?? onchangeLegacy);
  const oninput = $derived(onInput ?? oninputLegacy);

  // ── Internal state ──────────────────────────────────────────────

  let open = $state(false);
  let containerEl: HTMLDivElement | null = $state(null);

  let hue = $state(0);
  let sat = $state(1);
  let val = $state(1);

  type ColorMode = 'HEX' | 'RGB' | 'HSL';
  const modes: ColorMode[] = ['HEX', 'RGB', 'HSL'];
  let mode: ColorMode = $state('HEX');

  // ── Derived values ──────────────────────────────────────────────

  let hexInputValue = $derived(value);
  let currentRgb = $derived(hsvToRgb(hue, sat, val));
  let currentHsl = $derived(hsvToHsl(hue, sat, val));

  let _syncTrigger = $derived.by(() => {
    const hsv = hexToHsv(value);
    if (hsv !== null) {
      hue = hsv.h;
      sat = hsv.s;
      val = hsv.v;
    }
    return value;
  });

  // ── Color commit ────────────────────────────────────────────────

  function commitColor() {
    const hex = hsvToHex(hue, sat, val);
    if (hex !== value) {
      value = hex;
      oninput?.(value);
      onchange?.(value);
    }
  }

  // ── Popover open/close ──────────────────────────────────────────

  function togglePicker(_event: MouseEvent) {
    if (disabled === false) {
      open = !open;
    }
  }

  function handleWindowClick(e: MouseEvent) {
    if (
      open &&
      containerEl !== null &&
      e.target instanceof Node &&
      containerEl.contains(e.target) === false
    ) {
      open = false;
    }
  }

  // ── Saturation panel drag ───────────────────────────────────────

  let satPanelEl: HTMLDivElement | null = $state(null);
  let draggingSat = $state(false);

  function handleSatDown(e: PointerEvent) {
    if (disabled) {
      return;
    }
    draggingSat = true;
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    updateSatFromPointer(e);
  }

  function handleSatMove(e: PointerEvent) {
    if (draggingSat === false) {
      return;
    }
    updateSatFromPointer(e);
  }

  function handleSatUp() {
    draggingSat = false;
  }

  function updateSatFromPointer(e: PointerEvent) {
    if (satPanelEl === null) {
      return;
    }
    const rect = satPanelEl.getBoundingClientRect();
    sat = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    val = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
    commitColor();
  }

  // ── Hue slider ─────────────────────────────────────────────────

  let hueDegrees = $derived(Math.round(hue * 360));

  function handleHueInput(newHue: number) {
    hue = newHue / 360;
    commitColor();
  }

  // ── Input field handlers ────────────────────────────────────────

  function handleTextInput(newValue: string) {
    if (isValidHex(newValue)) {
      value = newValue;
      oninput?.(value);
      onchange?.(value);
    }
  }

  function handleHexFieldInput(newValue: string) {
    let v = newValue.trim();
    if (v.charAt(0) !== '#') {
      v = '#' + v;
    }
    if (isValidHex(v)) {
      value = v;
      oninput?.(value);
      onchange?.(value);
    }
  }

  function handleRgbInput(vals: string[]) {
    const r = clampInt(vals.at(0) ?? '0', 0, 255);
    const g = clampInt(vals.at(1) ?? '0', 0, 255);
    const b = clampInt(vals.at(2) ?? '0', 0, 255);
    const hsv = rgbToHsv(r, g, b);
    hue = hsv.h;
    sat = hsv.s;
    val = hsv.v;
    commitColor();
  }

  function handleHslInput(vals: string[]) {
    const h = clampInt(vals.at(0) ?? '0', 0, 360);
    const s = clampInt(vals.at(1) ?? '0', 0, 100);
    const l = clampInt(vals.at(2) ?? '0', 0, 100);
    const hsv = hslToHsv(h, s, l);
    hue = hsv.h;
    sat = hsv.s;
    val = hsv.v;
    commitColor();
  }

  function cycleMode() {
    const idx = modes.indexOf(mode);
    mode = modes.at((idx + 1) % modes.length) ?? 'HEX';
  }
</script>

<svelte:window onclick={handleWindowClick} />

<div
  class="color-picker-container {classes ?? ''}"
  class:disabled
  data-pw={testId}
  testID={testId}
  bind:this={containerEl}
>
  {#if typeof label === 'string'}
    <span class="color-picker-label">{label}</span>
  {/if}

  <!-- Trigger: swatch button + optional hex input -->
  <div class="color-picker-row">
    <div class="color-picker-swatch-btn" class:standalone={showValue === false}>
      <Button onclick={togglePicker} {disabled} ariaLabel="Pick a color" ariaExpanded={open}>
        <span class="color-picker-checkerboard">
          <span class="color-picker-swatch" style="background-color: {value};"></span>
        </span>
      </Button>
    </div>
    {#if showValue}
      <div class="color-picker-input-wrap">
        <Input
          bind:value
          disable={disabled}
          maxLength={7}
          classes="color-picker-text-input"
          onInput={handleTextInput}
        />
      </div>
    {/if}
  </div>

  <!-- Popover panel -->
  {#if open}
    <div class="color-picker-popover" role="dialog" aria-label="Color picker">
      <div
        class="cp-sat-panel"
        style="background-color: {hsvToHex(hue, 1, 1)};"
        bind:this={satPanelEl}
        onpointerdown={handleSatDown}
        onpointermove={handleSatMove}
        onpointerup={handleSatUp}
        role="slider"
        aria-label="Saturation and brightness"
        aria-valuenow={Math.round(sat * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext="{Math.round(sat * 100)}% saturation, {Math.round(val * 100)}% brightness"
        tabindex={0}
      >
        <div class="cp-sat-white"></div>
        <div class="cp-sat-black"></div>
        <div class="cp-sat-thumb" style="left: {sat * 100}%; top: {(1 - val) * 100}%;"></div>
      </div>

      <div class="cp-hue-slider">
        <Slider
          value={hueDegrees}
          min={0}
          max={360}
          step={1}
          {disabled}
          classes="cp-hue-track"
          oninput={handleHueInput}
          onchange={handleHueInput}
        />
      </div>

      <div class="cp-inputs">
        <div class="cp-preview" style="background-color: {value};"></div>

        {#if mode === 'HEX'}
          <div class="cp-field-hex">
            <Input
              value={hexInputValue}
              maxLength={7}
              classes="cp-field-input"
              onInput={handleHexFieldInput}
            />
            <span class="cp-field-label">HEX</span>
          </div>
        {:else if mode === 'RGB'}
          <SplitInput
            values={[String(currentRgb.r), String(currentRgb.g), String(currentRgb.b)]}
            fields={[
              { label: 'R', dataType: 'number', min: 0, max: 255 },
              { label: 'G', dataType: 'number', min: 0, max: 255 },
              { label: 'B', dataType: 'number', min: 0, max: 255 }
            ]}
            {disabled}
            classes="cp-split-input"
            oninput={handleRgbInput}
          />
        {:else}
          <SplitInput
            values={[String(currentHsl.h), String(currentHsl.s), String(currentHsl.l)]}
            fields={[
              { label: 'H', dataType: 'number', min: 0, max: 360 },
              { label: 'S', dataType: 'number', min: 0, max: 100 },
              { label: 'L', dataType: 'number', min: 0, max: 100 }
            ]}
            {disabled}
            classes="cp-split-input"
            oninput={handleHslInput}
          />
        {/if}

        <div class="cp-mode-toggle">
          <Button onclick={cycleMode} ariaLabel="Switch color mode">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html swapVerticalSvg}
          </Button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* ── Container ─────────────────────────────────────────────── */

  .color-picker-container {
    display: flex;
    flex-direction: column;
    gap: var(--color-picker-gap, 8px);
    width: var(--color-picker-width, fit-content);
    position: relative;
  }

  .color-picker-container.disabled {
    opacity: var(--color-picker-disabled-opacity, 0.5);
    cursor: not-allowed;
  }

  .color-picker-label {
    font-size: var(--color-picker-label-font-size, 13px);
    font-weight: var(--color-picker-label-font-weight, 500);
    color: var(--color-picker-label-color, #374151);
    letter-spacing: var(--color-picker-label-letter-spacing, 0.01em);
  }

  /* ── Trigger row ───────────────────────────────────────────── */

  .color-picker-row {
    display: flex;
    align-items: center;
    gap: var(--color-picker-row-gap, 0px);
  }

  .color-picker-swatch-btn {
    --button-color: var(--color-picker-swatch-btn-background, #f9fafb);
    --button-border: var(--color-picker-swatch-btn-border, 1px solid #d1d5db);
    --button-border-radius: var(
      --color-picker-swatch-btn-border-radius,
      var(--radius, 4px) 0 0 var(--radius, 4px)
    );
    --button-hover-color: var(--color-picker-swatch-btn-hover-background, #f3f4f6);
    --button-padding: var(--color-picker-swatch-padding, 5px);
    --button-width: fit-content;
    flex-shrink: 0;
  }

  .color-picker-swatch-btn.standalone {
    --button-border-radius: var(--color-picker-swatch-btn-border-radius, var(--radius, 4px));
  }

  .color-picker-checkerboard {
    display: block;
    width: var(--color-picker-swatch-size, 26px);
    height: var(--color-picker-swatch-size, 26px);
    border-radius: var(--color-picker-swatch-border-radius, var(--radius, 4px));
    overflow: hidden;
    background-image:
      linear-gradient(45deg, #ccc 25%, transparent 25%),
      linear-gradient(-45deg, #ccc 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #ccc 75%),
      linear-gradient(-45deg, transparent 75%, #ccc 75%);
    background-size: 8px 8px;
    background-position:
      0 0,
      0 4px,
      4px -4px,
      -4px 0px;
    flex-shrink: 0;
  }

  .color-picker-swatch {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    box-shadow: var(--color-picker-swatch-inner-shadow, inset 0 0 0 1px rgba(0, 0, 0, 0.08));
  }

  .color-picker-input-wrap {
    flex: 1;
    min-width: 0;
  }

  .color-picker-input-wrap :global(.color-picker-text-input) {
    --input-border: 1px solid #d1d5db;
    --input-radius: 0 10px 10px 0;
    --input-margin: 0;
    --input-padding: 8px 12px;
    --input-font-size: 13px;
    --input-font-weight: 500;
    --input-font-family: var(
      --color-picker-mono-font,
      ui-monospace,
      SFMono-Regular,
      Menlo,
      Monaco,
      Consolas,
      monospace
    );
    --input-box-shadow: none;
    --input-width: 100%;
    --input-height: var(--color-picker-input-height, 38px);
    --input-text-transform: var(--color-picker-value-text-transform, none);
    margin-left: -1px;
  }

  /* ── Popover ───────────────────────────────────────────────── */

  .color-picker-popover {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: var(--color-picker-popover-z-index, 50);
    margin-top: 6px;
    width: var(--color-picker-popover-width, 280px);
    padding: var(--color-picker-popover-padding, 12px);
    background: var(--color-picker-popover-background, #ffffff);
    border: var(--color-picker-popover-border, 1px solid #e5e7eb);
    border-radius: var(--color-picker-popover-border-radius, var(--radius, 4px));
    box-shadow: var(
      --color-picker-popover-shadow,
      0 4px 24px rgba(0, 0, 0, 0.12),
      0 1px 4px rgba(0, 0, 0, 0.06)
    );
    display: flex;
    flex-direction: column;
    gap: 12px;
    touch-action: none;
  }

  /* ── Saturation / brightness panel ─────────────────────────── */

  .cp-sat-panel {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 0.7;
    border-radius: var(--color-picker-panel-border-radius, var(--radius, 4px));
    cursor: crosshair;
    overflow: hidden;
    user-select: none;
  }

  .cp-sat-white {
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, #ffffff, transparent);
    border-radius: inherit;
  }

  .cp-sat-black {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent, #000000);
    border-radius: inherit;
  }

  .cp-sat-thumb {
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2.5px solid #ffffff;
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.15),
      0 1px 4px rgba(0, 0, 0, 0.3);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  /* ── Hue slider ────────────────────────────────────────────── */

  .cp-hue-slider {
    --slider-container-padding: 0;
    --slider-track: linear-gradient(
      to right,
      #ff0000 0%,
      #ffff00 16.67%,
      #00ff00 33.33%,
      #00ffff 50%,
      #0000ff 66.67%,
      #ff00ff 83.33%,
      #ff0000 100%
    );
    --slider-track-height: 14px;
    --slider-track-border-radius: 7px;
    --slider-thumb-size: 18px;
    --slider-thumb-background: #ffffff;
    --slider-thumb-border: 2.5px solid #ffffff;
    --slider-thumb-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.25);
  }

  /* ── Input fields ──────────────────────────────────────────── */

  .cp-inputs {
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }

  .cp-preview {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    flex-shrink: 0;
  }

  .cp-field-hex {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    flex: 3;
    min-width: 0;
  }

  .cp-field-hex :global(.cp-field-input) {
    --input-border: 1px solid var(--color-picker-field-border, #d1d5db);
    --input-radius: 6px;
    --input-margin: 0;
    --input-padding: 0 6px;
    --input-font-size: 12px;
    --input-font-weight: 500;
    --input-font-family: var(
      --color-picker-mono-font,
      ui-monospace,
      SFMono-Regular,
      Menlo,
      Monaco,
      Consolas,
      monospace
    );
    --input-text-color: var(--color-picker-field-color, #374151);
    --input-background: var(--color-picker-field-background, #ffffff);
    --input-box-shadow: none;
    --input-width: 100%;
    --input-height: 32px;
    --input-text-align: center;
    --input-focus-border: 1px solid var(--color-picker-field-focus-border, #3b82f6);
    --input-text-transform: var(--color-picker-value-text-transform, none);
  }

  .cp-split-input {
    --field-group-gap: 6px;
    --field-group-border: 1px solid var(--color-picker-field-border, #d1d5db);
    --field-group-border-radius: 6px;
    --field-group-focus-border: 1px solid var(--color-picker-field-focus-border, #3b82f6);
    --field-group-input-height: 32px;
    --field-group-font-size: 12px;
    --field-group-font-weight: 500;
    --field-group-font-family: var(
      --color-picker-mono-font,
      ui-monospace,
      SFMono-Regular,
      Menlo,
      Monaco,
      Consolas,
      monospace
    );
    --field-group-label-color: var(--color-picker-field-label-color, #9ca3af);
    flex: 1;
    min-width: 0;
  }

  .cp-field-label {
    font-size: 10px;
    font-weight: 500;
    color: var(--color-picker-field-label-color, #9ca3af);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .cp-mode-toggle {
    --button-color: var(--color-picker-field-background, #ffffff);
    --button-border: 1px solid var(--color-picker-field-border, #d1d5db);
    --button-border-radius: 6px;
    --button-padding: 0;
    --button-width: 28px;
    --button-height: 32px;
    --button-text-color: var(--color-picker-field-label-color, #9ca3af);
    --button-hover-color: var(--color-picker-field-background, #ffffff);
    --button-hover-border: 1px solid var(--color-picker-field-focus-border, #3b82f6);
    --button-hover-text-color: var(--color-picker-field-color, #374151);
    flex-shrink: 0;
  }
</style>
