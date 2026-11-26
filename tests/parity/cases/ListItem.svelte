<script module>
  export const cases = [
    { name: 'label-only' },
    { name: 'empty-renders-nothing', allowBlank: true },
    { name: 'label-empty-string', allowBlank: true },
    { name: 'left-image' },
    { name: 'left-image-svg' },
    { name: 'left-image-fallback', actions: [['wait', 300]] },
    { name: 'right-image' },
    { name: 'both-images' },
    { name: 'right-content-text' },
    { name: 'left-content-snippet' },
    { name: 'center-content-snippet' },
    { name: 'right-content-snippet' },
    { name: 'all-regions' },
    { name: 'long-label' },
    { name: 'label-escaped-markup' },
    { name: 'label-sanitized-markup' },
    { name: 'label-sanitize-without-sanitizer' },
    { name: 'bottom-accordion-collapsed' },
    { name: 'bottom-accordion-expanded' },
    { name: 'bottom-without-accordion' },
    {
      name: 'expand-after-mount',
      actions: [
        ['click', '#t'],
        ['wait', 600]
      ]
    },
    { name: 'show-loader' },
    { name: 'click-item', actions: [['click', '[data-pw="item"]']] },
    { name: 'click-left-image', actions: [['click', '[data-pw="left"]']] },
    { name: 'click-right-image', actions: [['click', '[data-pw="right"]']] },
    { name: 'click-center-text', actions: [['click', '[data-pw="center"]']] },
    { name: 'click-top-section', actions: [['click', '[data-pw="top"]']] },
    {
      name: 'keyboard-enter-item',
      actions: [
        ['focus', '[data-pw="item"]'],
        ['key', 'Enter']
      ]
    },
    {
      name: 'keyboard-space-center',
      actions: [
        ['focus', '[data-pw="center"]'],
        ['key', ' ']
      ]
    },
    { name: 'handlers-wired-focus', actions: [['focus', '[data-pw="left"]']] },
    { name: 'role-option-selected' },
    { name: 'suppress-role-and-tabindex', actions: [['click', '[data-pw="item"]']] },
    {
      name: 'prevent-focus',
      actions: [
        ['click', '[data-pw="center"]'],
        ['focus', '[data-pw="center"]']
      ]
    },
    { name: 'hover-background', actions: [['hover', '[data-pw="item"]']] },
    { name: 'id-classes-testid' },
    { name: 'css-variables' }
  ];
</script>

<script>
  import { ListItem } from 'sui-under-test';
  import { log, note, png, svg } from './_kit.js';
  let { name } = $props();

  const handlers = {
    onitemclick: log('onitemclick'),
    ontopsectionclick: log('ontopsectionclick'),
    onleftimageclick: log('onleftimageclick'),
    onrightimageclick: log('onrightimageclick'),
    oncentertextclick: log('oncentertextclick'),
    onkeydown: log('onkeydown')
  };
  const idSanitizer = (html) => html;
  const longText =
    'A very long list item label that keeps going and going so that it has to wrap onto several lines inside the narrow container';
  let expand = $state(false);
  $effect(() => note('expand', expand));
</script>

<div style="width: 360px; font-family: sans-serif;">
  {#if name === 'label-only'}
    <ListItem label="Plain label" />
  {:else if name === 'empty-renders-nothing'}
    <ListItem />
  {:else if name === 'label-empty-string'}
    <ListItem label="" />
  {:else if name === 'left-image'}
    <ListItem leftImageUrl={png} label="With left image" />
  {:else if name === 'left-image-svg'}
    <ListItem leftImageUrl={svg} label="With left svg" />
  {:else if name === 'left-image-fallback'}
    <ListItem
      leftImageUrl="data:image/png;base64,AAAA"
      leftImageFallbackUrl={png}
      label="Broken image uses fallback"
    />
  {:else if name === 'right-image'}
    <ListItem rightImageUrl={png} label="With right image" />
  {:else if name === 'both-images'}
    <ListItem leftImageUrl={svg} rightImageUrl={png} label="Both images" />
  {:else if name === 'right-content-text'}
    <ListItem label="Amount" rightContentText="Rs. 1,200" />
  {:else if name === 'left-content-snippet'}
    <ListItem label="Left snippet">
      {#snippet leftContent()}<span style="color: #c2410c;">[L]</span>{/snippet}
    </ListItem>
  {:else if name === 'center-content-snippet'}
    <ListItem label="Label">
      {#snippet centerContent()}<span style="color: #1d4ed8;">center extra</span>{/snippet}
    </ListItem>
  {:else if name === 'right-content-snippet'}
    <ListItem label="Right snippet">
      {#snippet rightContent()}<span style="color: #15803d;">[R]</span>{/snippet}
    </ListItem>
  {:else if name === 'all-regions'}
    <ListItem
      leftImageUrl={svg}
      rightImageUrl={png}
      label="Everything"
      rightContentText="Text"
      useAccordion
      expand
    >
      {#snippet leftContent()}<b>L</b>{/snippet}
      {#snippet centerContent()}<i>C</i>{/snippet}
      {#snippet rightContent()}<b>R</b>{/snippet}
      {#snippet bottomContent()}<div style="padding: 8px; background: #eef2ff;">
          Bottom
        </div>{/snippet}
    </ListItem>
  {:else if name === 'long-label'}
    <ListItem label={longText} rightContentText="End" />
  {:else if name === 'label-escaped-markup'}
    <ListItem label="<b>Bold</b> & <i>italic</i>" />
  {:else if name === 'label-sanitized-markup'}
    <ListItem
      label="<b>Bold</b> and <i>italic</i>"
      sanitize={{ rawHtml: 'sanitize', htmlSanitizer: idSanitizer }}
    />
  {:else if name === 'label-sanitize-without-sanitizer'}
    <ListItem label="<b>Bold</b>" sanitize={{ rawHtml: 'sanitize' }} />
  {:else if name === 'bottom-accordion-collapsed'}
    <ListItem label="Collapsed" useAccordion>
      {#snippet bottomContent()}<div style="padding: 8px; background: #eef2ff;">
          Hidden body
        </div>{/snippet}
    </ListItem>
  {:else if name === 'bottom-accordion-expanded'}
    <ListItem label="Expanded" useAccordion expand>
      {#snippet bottomContent()}<div style="padding: 8px; background: #eef2ff;">
          Visible body
        </div>{/snippet}
    </ListItem>
  {:else if name === 'bottom-without-accordion'}
    <ListItem label="No accordion" expand>
      {#snippet bottomContent()}<div style="padding: 8px; background: #eef2ff;">
          Not rendered
        </div>{/snippet}
    </ListItem>
  {:else if name === 'expand-after-mount'}
    <button id="t" onclick={() => (expand = true)}>expand</button>
    <ListItem label="Expands later" useAccordion bind:expand>
      {#snippet bottomContent()}<div style="padding: 24px; background: #eef2ff;">
          Arrived
        </div>{/snippet}
    </ListItem>
  {:else if name === 'show-loader'}
    <div style="--list-item-loader-duration: 0s;">
      <ListItem label="Loading" showLoader />
    </div>
  {:else if name === 'click-item'}
    <ListItem label="Click" testId="item" onitemclick={log('onitemclick')} />
  {:else if name === 'click-left-image'}
    <ListItem label="Click" leftImageUrl={png} testId="item" leftImageTestId="left" {...handlers} />
  {:else if name === 'click-right-image'}
    <ListItem
      label="Click"
      rightImageUrl={png}
      testId="item"
      rightImageTestId="right"
      {...handlers}
    />
  {:else if name === 'click-center-text'}
    <ListItem label="Click" testId="item" centerTextTestId="center" {...handlers} />
  {:else if name === 'click-top-section'}
    <ListItem label="Click" testId="item" topSectionTestId="top" {...handlers} />
  {:else if name === 'keyboard-enter-item'}
    <ListItem label="Keyboard" testId="item" {...handlers} />
  {:else if name === 'keyboard-space-center'}
    <ListItem label="Keyboard" testId="item" centerTextTestId="center" {...handlers} />
  {:else if name === 'handlers-wired-focus'}
    <ListItem
      label="Focus"
      leftImageUrl={png}
      rightImageUrl={svg}
      testId="item"
      leftImageTestId="left"
      {...handlers}
    />
  {:else if name === 'role-option-selected'}
    <ListItem label="Option" role="option" ariaSelected={true} testId="item" />
  {:else if name === 'suppress-role-and-tabindex'}
    <ListItem label="Suppressed" suppressRoleAndTabindex testId="item" {...handlers} />
  {:else if name === 'prevent-focus'}
    <ListItem
      label="Prevent focus"
      preventFocus
      testId="item"
      centerTextTestId="center"
      oncentertextclick={log('oncentertextclick')}
    />
  {:else if name === 'hover-background'}
    <div
      style="--list-item-hover-background-color: #fde68a; --list-item-background-color: #f3f4f6;"
    >
      <ListItem label="Hover me" testId="item" />
    </div>
  {:else if name === 'id-classes-testid'}
    <ListItem label="Attrs" id="the-item" classes="extra-class" testId="item" />
  {:else if name === 'css-variables'}
    <div
      style="--list-item-background-color: #fef3c7; --list-item-border: 1px solid #d97706; --list-item-border-radius: 12px; --list-item-padding: 12px; --list-item-margin: 8px; --list-item-box-shadow: 0 2px 6px #0003; --list-item-center-text-color: #7c2d12; --list-item-center-text-font-size: 16px; --list-item-center-text-font-weight: 600; --list-item-center-text-padding: 0 12px; --list-item-left-image-height: 40px; --list-item-left-image-width: 40px; --list-item-left-image-border-radius: 50%; --list-item-right-image-height: 28px; --list-item-right-image-width: 28px; --list-item-right-content-text-color: #1d4ed8; --list-item-right-content-text-font-size: 14px; --list-item-top-section-align-items: center; --list-item-top-section-gap: 4px;"
    >
      <ListItem
        leftImageUrl={svg}
        rightImageUrl={png}
        label="Styled item"
        rightContentText="Value"
      />
    </div>
  {/if}
</div>
