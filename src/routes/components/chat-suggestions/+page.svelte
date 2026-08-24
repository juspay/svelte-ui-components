<script lang="ts">
  import ChatSuggestions from '$lib/ChatSuggestions/ChatSuggestions.svelte';
  // `icon` is a URL — Img fetches it. Raw SVG markup in this slot becomes a
  // bogus relative link that the prerenderer reports as a 404.
  import sparkIcon from '$lib/assets/chat.svg?url';

  let picked = $state('');
  let events = $state<string[]>([]);
  const record = (value: string, index: number) => {
    picked = value;
    events = [...events, `${index}:${value}`];
  };

  // A short chip standing in for a much longer query — the case `label`/`value`
  // exists for. The value becomes the hover text automatically.
  const analytics = [
    {
      label: 'Refund trends',
      value: 'Show me refund trends for the last 30 days',
      icon: sparkIcon
    },
    {
      label: 'Top products',
      value: 'What are my top selling products this month?',
      icon: sparkIcon
    },
    {
      label: 'Checkout drop-off',
      value: 'Where are customers abandoning checkout?',
      icon: sparkIcon
    },
    { label: 'COD share', value: 'What share of my orders are cash on delivery?', icon: sparkIcon }
  ];
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>ChatSuggestions</h1>
</div>

<h2>Default — wrap</h2>
<div class="demo-row">
  <ChatSuggestions
    items={['Recommend a gift', 'Track my order', 'Return policy?', 'Talk to a human']}
    onselect={record}
  />
</div>

<h2>Leading icons, and a value longer than the label</h2>
<div class="demo-row">
  <ChatSuggestions items={analytics} onselect={record} />
</div>

<h2>maxVisible — cap a long list</h2>
<div class="demo-row">
  <ChatSuggestions items={analytics} maxVisible={2} onselect={record} />
</div>

<h2>layout="scroll" — one draggable line, for a composer on a phone</h2>
<div class="demo-row" style="max-width: 380px;">
  <ChatSuggestions items={analytics} layout="scroll" onselect={record} />
</div>

<h2>direction="vertical" — a full-width menu</h2>
<div class="demo-row" style="max-width: 380px;">
  <ChatSuggestions items={analytics} direction="vertical" onselect={record} />
</div>

<h2>loading — chips hidden while the answer is still coming</h2>
<div class="demo-row">
  <ChatSuggestions items={analytics} loading={true} onselect={record} />
</div>

<h2>chipClasses — a consumer's own class on every chip</h2>
<div class="demo-row">
  <ChatSuggestions items={analytics} chipClasses="demo-chip-hook" onselect={record} />
</div>

<p class="demo-note" data-pw="event-log">events: {events.join(' | ')}</p>

{#if picked.length > 0}
  <p class="demo-note">Selected: {picked}</p>
{/if}
