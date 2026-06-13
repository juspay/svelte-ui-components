<script lang="ts">
  import type { RadioGroupProperties } from './properties';
  import Radio from '../Radio/Radio.svelte';

  let {
    options,
    value = $bindable(),
    name,
    ariaLabel,
    ariaLabelledBy,
    disabled: groupDisabled = false,
    testId,
    classes,
    onchange
  }: RadioGroupProperties = $props();

  let inputRefs = $state<Array<HTMLInputElement | null>>(
    Array.from({ length: options.length }, () => null)
  );

  let firstEnabledIndex = $derived(options.findIndex((option) => option.disabled !== true));

  function isOptionDisabled(optionDisabled: boolean): boolean {
    return groupDisabled || optionDisabled;
  }

  function getTabIndex(option: { value: string }, index: number): number {
    if (value === option.value) {
      return 0;
    }
    const noneSelected = !options.some((opt) => opt.value === value);
    if (noneSelected && index === firstEnabledIndex) {
      return 0;
    }
    return -1;
  }

  function selectOption(optionValue: string): void {
    value = optionValue;
    onchange?.(optionValue);
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (
      event.key !== 'ArrowRight' &&
      event.key !== 'ArrowDown' &&
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowUp'
    ) {
      return;
    }

    const enabledIndices = options
      .map((option, index) => ({ option, index }))
      .filter(({ option }) => !isOptionDisabled(option.disabled ?? false))
      .map(({ index }) => index);

    if (enabledIndices.length === 0) {
      return;
    }

    const currentIndex = options.findIndex((option) => option.value === value);
    const positionInEnabled = enabledIndices.indexOf(currentIndex);

    event.preventDefault();

    let nextIndex: number;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      const nextPosition =
        positionInEnabled < 0 ? 0 : (positionInEnabled + 1) % enabledIndices.length;
      nextIndex = enabledIndices[nextPosition];
    } else {
      const prevPosition =
        positionInEnabled <= 0 ? enabledIndices.length - 1 : positionInEnabled - 1;
      nextIndex = enabledIndices[prevPosition];
    }

    const targetOption = options.at(nextIndex);
    if (typeof targetOption !== 'object' || targetOption === null) {
      return;
    }

    selectOption(targetOption.value);

    const targetRef = inputRefs[nextIndex];
    if (targetRef !== null) {
      targetRef.focus();
    }
  }
</script>

<div
  class="radio-group {classes ?? ''}"
  role="radiogroup"
  tabindex="-1"
  aria-label={typeof ariaLabel === 'string' ? ariaLabel : null}
  aria-labelledby={typeof ariaLabelledBy === 'string' ? ariaLabelledBy : null}
  data-pw={typeof testId === 'string' ? testId : null}
  onkeydown={handleKeydown}
>
  {#each options as option, index (option.value)}
    <div
      class="radio-group-item"
      data-pw={typeof option.testId === 'string' ? option.testId : null}
    >
      <Radio
        {name}
        value={option.value}
        selectedValue={value}
        text={option.label}
        subtitle={option.subtitle}
        disabled={isOptionDisabled(option.disabled ?? false)}
        bind:inputRef={inputRefs[index]}
        onchange={selectOption}
        tabIndex={getTabIndex(option, index)}
      />
    </div>
  {/each}
</div>

<style>
  .radio-group {
    display: flex;
    flex-direction: var(--radio-group-direction, column);
    gap: var(--radio-group-gap, 0);
    padding: var(--radio-group-padding, 0);
    background: var(--radio-group-background, transparent);
    border-radius: var(--radio-group-radius, 0);
  }

  .radio-group-item {
    display: flex;
  }
</style>
