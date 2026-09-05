<script lang="ts">
  import { onMount } from 'svelte';
  import TypewriterText from '$lib/TypewriterText/TypewriterText.svelte';
  import type { TypewriterProgress, TypewriterDelayContext } from '$lib/TypewriterText/properties';

  const answer =
    'Refunds are down 12% this month. Card refunds cleared fastest, UPI refunds took a median of 2.1 days, and three orders are still awaiting gateway confirmation.';

  let streamed = $state('');
  let isStreaming = $state(false);

  const startStream = (): void => {
    streamed = '';
    isStreaming = true;
    let index = 0;
    const interval = setInterval(() => {
      index += 18;
      streamed = answer.slice(0, index);
      if (index >= answer.length) {
        clearInterval(interval);
        isStreaming = false;
      }
    }, 120);
  };

  // Fixed-length text keeps completion time deterministic enough for a
  // Playwright timing assertion (used both as the "default pacing unchanged"
  // baseline and as the digit/punctuation-vs-default contrast below).
  const baselinePacingText = 'Baseline pacing check text stays fast.';
  const variableDelayText = 'Total: 4 items, $9!';

  // Assigned a tick after mount, not as the prop's initial value — see the
  // note above the demos below.
  let baselinePacingDisplayText = $state('');
  let variableDelayDisplayText = $state('');
  onMount(() => {
    baselinePacingDisplayText = baselinePacingText;
    variableDelayDisplayText = variableDelayText;
  });

  // A live counter plus a call count lets a test prove onProgress fires once
  // per revealed character, not just once at the end.
  const progressDemoText =
    'Progress reporting keeps a scroll container pinned to the newest character.';
  let progressIndex = $state(0);
  let progressTotal = $state(0);
  let progressCallCount = $state(0);
  const handleProgress = (progress: TypewriterProgress): void => {
    progressIndex = progress.index;
    progressTotal = progress.total;
    progressCallCount += 1;
  };

  // Digits get wrapped so a test can assert the decoration landed on exactly
  // the digit characters.
  const renderCharacterText = 'Order #482 shipped';

  // resolveDelay demo (F71): a stand-in for the app's 80-word cyclical acceleration
  // window, scaled down to every-4th-word so the demo stays fast and deterministic.
  // `variableDelay` cannot express this — the flat "accelerated" range has to apply to
  // whitespace/punctuation/default alike for the duration of the window, and only
  // `resolveDelay`'s `wordCount` carries that position-dependent state in. Every branch
  // returns a fixed value (no `Math.random()` range) so the total elapsed time for
  // `cyclicalPacingText` is exactly computable — see the Playwright spec.
  const cyclicalPacingText = 'a1 b2, c d e f';
  let cyclicalPacingDisplayText = $state('');
  let cyclicalDelayLog = $state<TypewriterDelayContext[]>([]);
  const resolveCyclicalDelay = (context: TypewriterDelayContext): number => {
    cyclicalDelayLog = [...cyclicalDelayLog, context];
    const cyclePosition = context.wordCount % 4;
    const isAccelerated = cyclePosition >= 3;
    // Digits stay slow regardless of the acceleration window — same priority order as
    // the app's getTypingDelay (digit check happens before the cycle check).
    if (/\d/.test(context.character)) {
      return 120;
    }
    if (isAccelerated) {
      return 10;
    }
    if (context.character === ' ' || context.character === '\n') {
      return 60;
    }
    if (',.?!'.includes(context.character)) {
      return 90;
    }
    return 20;
  };

  // resolveDelay must take priority over variableDelay when both are set — a flat 2ms
  // proves it, since variableDelay's ranges below (5-200ms) would take far longer.
  const priorityDemoText = 'Total: 4 items, $9!';
  let priorityDemoDisplayText = $state('');
  const resolveFlatFastDelay = (): number => 2;

  onMount(() => {
    cyclicalPacingDisplayText = cyclicalPacingText;
    priorityDemoDisplayText = priorityDemoText;
  });
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>TypewriterText</h1>
</div>

<h2>Typing a live answer — isStreaming keeps the reveal running</h2>
<div class="demo-row">
  <TypewriterText text={answer} isStreaming={true} />
</div>

<h2>Historic message — isStreaming false renders instantly, no animation</h2>
<div class="demo-row">
  <TypewriterText text={answer} />
</div>

<h2>Streaming — text grows in chunks, typing follows</h2>
<div class="demo-row">
  <button onclick={startStream}>Restart stream</button>
  <TypewriterText text={streamed} {isStreaming} />
</div>

<h2>Rich text via renderText</h2>
<div class="demo-row">
  <TypewriterText
    text="**Bold** where the renderer says so."
    renderText={(text) => text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
  />
</div>

<!--
  The two pacing demos below assign `text` a tick after mount instead of as
  the prop's initial value. TypewriterText's typing engine has a pre-existing
  quirk, unrelated to variableDelay: when a full, non-empty `text` is already
  present at mount together with `isStreaming={true}`, BOTH its mount $effect
  and its onMount hook independently start the typing loop (TypewriterText.svelte,
  the `typeNextCharacter()` calls inside the first `$effect` and inside
  `onMount`), racing two interleaved timer chains and typing far faster than
  `speed`/`variableDelay` call for. It reproduces identically against the
  pre-`variableDelay` build of this component (git show HEAD on this branch's
  parent commit), so it predates and is independent of the pacing work here.
  Growing `text` from empty after mount — the same shape the "Streaming" demo
  above already relies on — goes through the $effect's growth path only, so
  these two demos (and the Playwright pacing assertions against them) measure
  `resolveTypingDelay` cleanly instead of that race.
-->
<h2>Baseline pacing — no variableDelay, default speed</h2>
<div class="demo-row">
  <TypewriterText
    text={baselinePacingDisplayText}
    isStreaming={true}
    testId="typewriter-default-pacing"
  />
</div>

<h2>Variable pacing — digits and punctuation slow down, letters stay fast</h2>
<div class="demo-row">
  <TypewriterText
    text={variableDelayDisplayText}
    isStreaming={true}
    testId="typewriter-variable-delay"
    variableDelay={{
      digit: { min: 200, max: 200 },
      whitespace: { min: 10, max: 10 },
      punctuation: { min: 120, max: 120 },
      default: { min: 5, max: 5 }
    }}
  />
</div>

<h2>Progress callback — onProgress reports how far typing has reached</h2>
<div class="demo-row">
  <TypewriterText
    text={progressDemoText}
    speed={20}
    isStreaming={true}
    testId="typewriter-progress-demo"
    onprogress={handleProgress}
  />
  <p>
    Revealed <span data-pw="typewriter-progress-index">{progressIndex}</span>
    of <span data-pw="typewriter-progress-total">{progressTotal}</span>
    — calls so far: <span data-pw="typewriter-progress-call-count">{progressCallCount}</span>
  </p>
</div>

<h2>Per-character render hook — decorate what's being typed</h2>
<div class="demo-row">
  <TypewriterText text={renderCharacterText} speed={5} testId="typewriter-render-character">
    {#snippet renderCharacter({ character })}
      {#if /\d/.test(character)}
        <strong data-pw="typewriter-digit-highlight">{character}</strong>
      {:else}
        {character}
      {/if}
    {/snippet}
  </TypewriterText>
</div>

<h2>resolveDelay — pacing driven by position/state, not just character class</h2>
<div class="demo-row">
  <TypewriterText
    text={cyclicalPacingDisplayText}
    isStreaming={true}
    testId="typewriter-resolve-delay-cyclical"
    resolveDelay={resolveCyclicalDelay}
  />
  <!-- Every {character, index, wordCount} resolveDelay was called with, in call order —
       lets a test assert the ordering guarantee directly instead of through timing. -->
  <p data-pw="typewriter-resolve-delay-log">{JSON.stringify(cyclicalDelayLog)}</p>
</div>

<h2>resolveDelay takes priority over variableDelay when both are set</h2>
<div class="demo-row">
  <TypewriterText
    text={priorityDemoDisplayText}
    isStreaming={true}
    testId="typewriter-resolve-delay-priority"
    resolveDelay={resolveFlatFastDelay}
    variableDelay={{
      digit: { min: 200, max: 200 },
      whitespace: { min: 10, max: 10 },
      punctuation: { min: 120, max: 120 },
      default: { min: 5, max: 5 }
    }}
  />
</div>
