<script module>
  const W = ['wait', 700];
  export const cases = [
    { name: 'default', actions: [W] },
    { name: 'type-success', actions: [W] },
    { name: 'type-error', actions: [W] },
    { name: 'type-info', actions: [W] },
    { name: 'type-warn', actions: [W] },
    { name: 'icons-both-success', actions: [W] },
    { name: 'icons-both-error', actions: [W] },
    { name: 'icons-both-info', actions: [W] },
    { name: 'icons-both-warn', actions: [W] },
    { name: 'left-icon', actions: [W] },
    { name: 'right-icon', actions: [W] },
    { name: 'subtext', actions: [W] },
    { name: 'subtext-with-icons', actions: [W] },
    { name: 'bottom-content', actions: [W] },
    { name: 'long-message', actions: [W] },
    { name: 'long-message-subtext', actions: [W] },
    { name: 'empty-message', actions: [W] },
    { name: 'null-type-null-icons', actions: [W] },
    { name: 'direction-left-to-right', actions: [W] },
    { name: 'direction-right-to-left', actions: [W] },
    { name: 'direction-top-to-bottom', actions: [W] },
    { name: 'direction-bottom-to-top', actions: [W] },
    { name: 'no-overlap-page', actions: [W] },
    { name: 'custom-offset-duration', actions: [W] },
    { name: 'classes', actions: [W] },
    { name: 'test-ids', actions: [W] },
    {
      name: 'close-click',
      allowBlank: true,
      actions: [W, ['click', '.close-button'], ['wait', 1500]]
    },
    {
      name: 'close-keyboard-enter',
      allowBlank: true,
      actions: [W, ['focus', '.close-button'], ['key', 'Enter'], ['wait', 1500]]
    },
    {
      name: 'close-keyboard-space',
      allowBlank: true,
      actions: [W, ['focus', '.close-button'], ['key', ' '], ['wait', 1500]]
    },
    {
      name: 'close-fast-exit',
      allowBlank: true,
      actions: [W, ['click', '.close-button'], ['wait', 600]]
    },
    { name: 'close-focus-ring', actions: [W, ['focus', '.close-button']] },
    { name: 'hover-close', actions: [W, ['hover', '.close-button']] },
    { name: 'auto-hide-short-duration', allowBlank: true, actions: [['wait', 2000]] },
    { name: 'css-custom-properties', actions: [W] }
  ];
</script>

<script>
  import { Toast } from 'sui-under-test';
  import { log, svg } from './_kit.js';
  let { name } = $props();

  // Far beyond the test's lifetime so no case depends on the auto-hide timer.
  const LONG = 600000;
  const longMsg =
    'A long toast message that keeps going far enough that it has to wrap onto several lines inside the toast body';
</script>

{#snippet bottomContent()}
  <div style="margin-top: 8px; font-size: 12px;">Bottom content snippet</div>
{/snippet}

{#if name === 'default'}
  <Toast message="Saved" duration={LONG} />
{:else if name === 'type-success'}
  <Toast type="success" message="Payment successful" duration={LONG} />
{:else if name === 'type-error'}
  <Toast type="error" message="Payment failed" duration={LONG} />
{:else if name === 'type-info'}
  <Toast type="info" message="Heads up" duration={LONG} />
{:else if name === 'type-warn'}
  <Toast type="warn" message="Check your details" duration={LONG} />
{:else if name === 'icons-both-success'}
  <Toast type="success" message="Both icons" leftIcon={svg} rightIcon={svg} duration={LONG} />
{:else if name === 'icons-both-error'}
  <Toast type="error" message="Both icons" leftIcon={svg} rightIcon={svg} duration={LONG} />
{:else if name === 'icons-both-info'}
  <Toast type="info" message="Both icons" leftIcon={svg} rightIcon={svg} duration={LONG} />
{:else if name === 'icons-both-warn'}
  <Toast type="warn" message="Both icons" leftIcon={svg} rightIcon={svg} duration={LONG} />
{:else if name === 'left-icon'}
  <Toast type="info" message="With left icon" leftIcon={svg} duration={LONG} />
{:else if name === 'right-icon'}
  <Toast type="info" message="With close icon" rightIcon={svg} duration={LONG} />
{:else if name === 'subtext'}
  <Toast type="info" message="Headline" subtext="Supporting detail text" duration={LONG} />
{:else if name === 'subtext-with-icons'}
  <Toast
    type="success"
    message="Headline"
    subtext="Supporting detail text"
    leftIcon={svg}
    rightIcon={svg}
    duration={LONG}
  />
{:else if name === 'bottom-content'}
  <Toast type="warn" message="Headline" duration={LONG} {bottomContent} />
{:else if name === 'long-message'}
  <Toast type="error" message={longMsg} rightIcon={svg} leftIcon={svg} duration={LONG} />
{:else if name === 'long-message-subtext'}
  <Toast type="info" message={longMsg} subtext={longMsg} duration={LONG} />
{:else if name === 'empty-message'}
  <Toast type="info" message="" duration={LONG} />
{:else if name === 'null-type-null-icons'}
  <Toast
    type={null}
    leftIcon={null}
    rightIcon={null}
    subtext={null}
    message="Nulls everywhere"
    duration={LONG}
  />
{:else if name === 'direction-left-to-right'}
  <Toast direction="left-to-right" type="info" message="Left to right" duration={LONG} />
{:else if name === 'direction-right-to-left'}
  <Toast direction="right-to-left" type="info" message="Right to left" duration={LONG} />
{:else if name === 'direction-top-to-bottom'}
  <Toast direction="top-to-bottom" type="info" message="Top to bottom" duration={LONG} />
{:else if name === 'direction-bottom-to-top'}
  <Toast direction="bottom-to-top" type="info" message="Bottom to top" duration={LONG} />
{:else if name === 'no-overlap-page'}
  <div style="padding: 20px; font-family: sans-serif;">
    <p>Content above</p>
    <Toast overlapPage={false} type="success" message="In flow" duration={LONG} />
    <p>Content below</p>
  </div>
{:else if name === 'custom-offset-duration'}
  <Toast
    type="info"
    message="Custom motion"
    inAnimationOffset={20}
    outAnimationOffset={20}
    inAnimationDuration={100}
    outAnimationDuration={100}
    duration={LONG}
  />
{:else if name === 'classes'}
  <Toast classes="extra-class" type="info" message="With classes" duration={LONG} />
{:else if name === 'test-ids'}
  <Toast
    testId="toast"
    messageTestId="toast-message"
    subTextTestId="toast-sub"
    closeIconTestId="toast-close"
    type="info"
    message="Test ids"
    subtext="sub"
    rightIcon={svg}
    duration={LONG}
  />
{:else if name === 'close-click'}
  <Toast
    type="success"
    message="Dismiss me"
    rightIcon={svg}
    ontoasthide={log('ontoasthide')}
    duration={LONG}
  />
{:else if name === 'close-keyboard-enter'}
  <Toast
    type="success"
    message="Dismiss me"
    rightIcon={svg}
    ontoasthide={log('ontoasthide')}
    duration={LONG}
  />
{:else if name === 'close-keyboard-space'}
  <Toast
    type="error"
    message="Dismiss me"
    rightIcon={svg}
    ontoasthide={log('ontoasthide')}
    duration={LONG}
  />
{:else if name === 'close-fast-exit'}
  <Toast
    type="info"
    message="Mid-exit"
    rightIcon={svg}
    outAnimationDuration={2000}
    ontoasthide={log('ontoasthide')}
    duration={LONG}
  />
{:else if name === 'close-focus-ring'}
  <Toast type="info" message="Focus" rightIcon={svg} duration={LONG} />
{:else if name === 'hover-close'}
  <Toast type="info" message="Hover" rightIcon={svg} duration={LONG} />
{:else if name === 'auto-hide-short-duration'}
  <Toast
    type="info"
    message="Auto hide"
    duration={300}
    inAnimationDuration={100}
    outAnimationDuration={100}
    ontoasthide={log('ontoasthide')}
  />
{:else if name === 'css-custom-properties'}
  <div
    style="--toast-background-color: #4c1d95; --toast-border-radius: 16px; --toast-padding: 18px; --toast-font-size: 18px; --toast-subtext-color: #fde68a; --toast-subtext-font-size: 13px; --toast-success-background-color: #0f766e; --toast-margin: 0 24px 0 24px; --toast-width: auto;"
  >
    <Toast
      type="success"
      message="Themed toast"
      subtext="Custom properties"
      leftIcon={svg}
      rightIcon={svg}
      duration={LONG}
    />
  </div>
{/if}
