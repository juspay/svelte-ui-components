<script lang="ts">
  import TypewriterText from '$lib/TypewriterText/TypewriterText.svelte';

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
