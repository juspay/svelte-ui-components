<script lang="ts">
  import SplitInput from '$lib/SplitInput/SplitInput.svelte';

  let otpValues = $state(['', '', '', '']);
  let smsOtpValues = $state(['', '', '', '']);
  let rgbValues = $state(['255', '0', '128']);
  let ipValues = $state(['192', '168', '1', '1']);
  let describedCode = $state(['', '', '', '']);
  let infoOnlyCode = $state(['', '', '', '']);
  let plainCode = $state(['', '', '', '']);
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>SplitInput</h1>
</div>

<div class="demo-row" style="max-width: 400px;">
  <h3>OTP / PIN (auto-advance)</h3>
  <SplitInput bind:values={otpValues} autoAdvance testId="split-input-default" />
  <p>Value: {otpValues.join('')}</p>
</div>

<div class="demo-row" style="max-width: 400px;">
  <h3>SMS OTP (one-time-code autofill + numeric keypad)</h3>
  <SplitInput
    bind:values={smsOtpValues}
    autoAdvance
    testId="split-input-sms-otp"
    fields={[
      { dataType: 'tel', maxLength: 1, autoComplete: 'one-time-code', inputMode: 'numeric' },
      { dataType: 'tel', maxLength: 1, autoComplete: 'one-time-code', inputMode: 'numeric' },
      { dataType: 'tel', maxLength: 1, autoComplete: 'one-time-code', inputMode: 'numeric' },
      { dataType: 'tel', maxLength: 1, autoComplete: 'one-time-code', inputMode: 'numeric' }
    ]}
  />
</div>

<div class="demo-row" style="max-width: 400px;">
  <h3>RGB color channels</h3>
  <SplitInput
    bind:values={rgbValues}
    fields={[
      { label: 'R', dataType: 'number', min: 0, max: 255 },
      { label: 'G', dataType: 'number', min: 0, max: 255 },
      { label: 'B', dataType: 'number', min: 0, max: 255 }
    ]}
  />
</div>

<div class="demo-row" style="max-width: 400px;">
  <h3>IP address (with separator)</h3>
  <SplitInput
    bind:values={ipValues}
    separator="."
    fields={[
      { dataType: 'number', min: 0, max: 255, maxLength: 3 },
      { dataType: 'number', min: 0, max: 255, maxLength: 3 },
      { dataType: 'number', min: 0, max: 255, maxLength: 3 },
      { dataType: 'number', min: 0, max: 255, maxLength: 3 }
    ]}
  />
</div>

<div class="demo-row" style="max-width: 400px;">
  <h3>6-digit code (auto-advance)</h3>
  <SplitInput values={['', '', '', '', '', '']} length={6} autoAdvance />
</div>

<div class="demo-row" style="max-width: 400px;">
  <h3>Disabled</h3>
  <SplitInput values={['1', '2', '3', '4']} disabled />
</div>

<h2>Validity messaging</h2>
<p>
  The boxes are individually meaningless, so <code>ariaLabel</code> names the group and
  <code>errorMessage</code> / <code>infoMessage</code> describe it — the message is about the whole code,
  not about the box the caret is in.
</p>
<div
  class="demo-row"
  data-pw="splitinput-field-contract"
  style="flex-direction: column; align-items: start;"
>
  <SplitInput
    values={describedCode}
    length={4}
    ariaLabel="One-time code"
    errorMessage="That code is not right."
    infoMessage="Check your messages."
    testId="splitinput-described"
  />
  <SplitInput
    values={infoOnlyCode}
    length={4}
    ariaLabel="One-time code"
    infoMessage="Check your messages."
    testId="splitinput-info-only"
  />
  <SplitInput values={plainCode} length={4} testId="splitinput-undescribed" />
</div>
