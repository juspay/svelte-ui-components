<script module>
  const wait = ['wait', 600];
  const dotTargetChange = 'Slide indicators have a larger 24px interactive target.';
  export const cases = [
    { name: 'default-width-idle' },
    {
      name: 'default-width-navigates-to-second',
      actions: [['click', '[data-pw="default-dot-2"]'], wait],
      knownDifference: 'The 4.57.18 viewport stays on slide one when the width token is omitted.'
    },
    { name: 'three-slides-no-dots' },
    { name: 'three-slides-dots' },
    { name: 'dot-go-to-second', actions: [['click', '[data-pw="dot-2"]'], wait] },
    { name: 'dot-go-to-third', actions: [['click', '[data-pw="dot-3"]'], wait] },
    {
      name: 'dot-back-to-first',
      actions: [['click', '[data-pw="dot-3"]'], wait, ['click', '[data-pw="dot-1"]'], wait]
    },
    {
      name: 'dot-walk-every-slide',
      actions: [
        ['click', '[data-pw="dot-2"]'],
        wait,
        ['click', '[data-pw="dot-3"]'],
        wait,
        ['click', '[data-pw="dot-4"]'],
        wait
      ]
    },
    {
      name: 'dot-keyboard-enter',
      actions: [['focus', '[data-pw="dot-2"]'], ['key', 'Enter'], wait]
    },
    {
      name: 'dot-keyboard-space',
      actions: [['focus', '[data-pw="dot-3"]'], ['key', ' '], wait]
    },
    {
      name: 'dot-keyboard-other-key-calls-onkeydown',
      actions: [
        ['focus', '[data-pw="dot-1"]'],
        ['key', 'ArrowRight']
      ]
    },
    {
      name: 'dot-focus-ring',
      actions: [
        ['focus', '[data-pw="dot-1"]'],
        ['key', 'Tab']
      ]
    },
    { name: 'single-slide-dots' },
    { name: 'empty-views', allowBlank: true },
    { name: 'empty-views-dots', allowBlank: true },
    { name: 'autoplay-disabled-explicit' },
    { name: 'autoplay-disabled-custom-interval' },
    { name: 'scrollable-last' },
    { name: 'grid-item-slides', actions: [['click', '[data-pw="dot-2"]'], wait] },
    { name: 'classes-and-test-ids' },
    { name: 'width-200-height-60', actions: [['click', '[data-pw="dot-2"]'], wait] },
    { name: 'width-viewport-units', actions: [['click', '[data-pw="dot-2"]'], wait] },
    { name: 'css-variables-dots' },
    { name: 'css-variables-frame', actions: [['click', '[data-pw="dot-2"]'], wait] },
    { name: 'css-variables-instant-transition', actions: [['click', '[data-pw="dot-3"]']] },
    { name: 'tall-height-with-dots' }
  ].map((item) =>
    item.name === 'three-slides-no-dots' ||
    item.name === 'empty-views' ||
    item.name === 'empty-views-dots'
      ? item
      : { ...item, knownDifference: item.knownDifference ?? dotTargetChange }
  );
</script>

<script>
  import { Carousel, ListItem, GridItem } from 'sui-under-test';
  import { log, png, svg } from './_kit.js';
  let { name } = $props();

  const slides = [
    { component: ListItem, properties: { label: 'Slide one', leftImageUrl: png } },
    { component: ListItem, properties: { label: 'Slide two', rightImageUrl: svg } },
    { component: ListItem, properties: { label: 'Slide three', rightContentText: 'Third' } }
  ];
  const four = [
    ...slides,
    { component: ListItem, properties: { label: 'Slide four', leftImageUrl: svg } }
  ];
  const gridSlides = [
    { component: GridItem, properties: { icon: png, text: 'Alpha' } },
    { component: GridItem, properties: { icon: svg, text: 'Beta', headerIcon: png } }
  ];
</script>

{#if name === 'default-width-idle' || name === 'default-width-navigates-to-second'}
  <div style="font-family: sans-serif;">
    <Carousel views={slides} showDots dotTestId="default-dot" />
  </div>
{:else}
  <div style="--carousel-width: 300px; font-family: sans-serif;">
    {#if name === 'three-slides-no-dots'}
      <Carousel views={slides} />
    {:else if name === 'three-slides-dots'}
      <Carousel views={slides} showDots />
    {:else if name === 'dot-go-to-second' || name === 'dot-go-to-third' || name === 'dot-back-to-first'}
      <Carousel views={slides} showDots dotTestId="dot" />
    {:else if name === 'dot-walk-every-slide'}
      <Carousel views={four} showDots dotTestId="dot" />
    {:else if name === 'dot-keyboard-enter' || name === 'dot-keyboard-space'}
      <Carousel views={slides} showDots dotTestId="dot" onkeydown={log('onkeydown')} />
    {:else if name === 'dot-keyboard-other-key-calls-onkeydown'}
      <Carousel views={slides} showDots dotTestId="dot" onkeydown={log('onkeydown')} />
    {:else if name === 'dot-focus-ring'}
      <Carousel views={slides} showDots dotTestId="dot" onkeydown={log('onkeydown')} />
    {:else if name === 'single-slide-dots'}
      <Carousel views={[slides[0]]} showDots />
    {:else if name === 'empty-views'}
      <Carousel views={[]} />
    {:else if name === 'empty-views-dots'}
      <Carousel views={[]} showDots />
    {:else if name === 'autoplay-disabled-explicit'}
      <Carousel views={slides} autoplay={false} showDots />
    {:else if name === 'autoplay-disabled-custom-interval'}
      <Carousel views={slides} autoplay={false} autoplayInterval={50} showDots />
    {:else if name === 'scrollable-last'}
      <Carousel views={slides} isScrollableLast showDots />
    {:else if name === 'grid-item-slides'}
      <Carousel views={gridSlides} showDots dotTestId="dot" />
    {:else if name === 'classes-and-test-ids'}
      <Carousel
        views={slides}
        showDots
        classes="extra-class"
        testId="car"
        dotsWrapperTestId="dots"
        dotTestId="dot"
      />
    {:else if name === 'width-200-height-60'}
      <div style="--carousel-width: 200px; --carousel-height: 60px;">
        <Carousel views={slides} showDots dotTestId="dot" />
      </div>
    {:else if name === 'width-viewport-units'}
      <div style="--carousel-width: 80vw;">
        <Carousel views={slides} showDots dotTestId="dot" />
      </div>
    {:else if name === 'css-variables-dots'}
      <div
        style="--dot-width: 12px; --dot-height: 12px; --dot-gap: 20px; --dot-padding-top: 24px; --carousel-dot-color: #fca5a5; --carousel-dot-active-color: #b91c1c;"
      >
        <Carousel views={slides} showDots />
      </div>
    {:else if name === 'css-variables-frame'}
      <div
        style="--carousel-border-radius: 16px; --carousel-shadow: 0 4px 12px #0005; --carousel-height: 80px; --carousel-track-transition-duration: 0.1s; --carousel-dot-transition-duration: 0.1s;"
      >
        <Carousel views={slides} showDots dotTestId="dot" />
      </div>
    {:else if name === 'css-variables-instant-transition'}
      <div
        style="--carousel-track-transition-duration: 0s; --carousel-dot-transition-duration: 0s;"
      >
        <Carousel views={slides} showDots dotTestId="dot" />
      </div>
    {:else if name === 'tall-height-with-dots'}
      <div style="--carousel-height: 160px;">
        <Carousel views={slides} showDots />
      </div>
    {/if}
  </div>
{/if}
