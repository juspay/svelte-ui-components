<script lang="ts">
  import Accordion from '$lib/Accordion/Accordion.svelte';

  let accordionExpanded = $state(false);
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>Accordion</h1>
</div>

<div class="demo-row" style="flex-direction: column; max-width: 500px;">
  <button class="toggle-btn" onclick={() => (accordionExpanded = !accordionExpanded)}>
    {accordionExpanded ? 'Collapse' : 'Expand'} Accordion
  </button>
  <Accordion expand={accordionExpanded}>
    <div style="padding: 16px; background: #f5f5f5; border-radius: 8px;">
      <p>This is the accordion content that can be expanded or collapsed.</p>
      <p>It supports any content inside including other components.</p>
    </div>
  </Accordion>
</div>

<h3>Built-in trigger</h3>
<p>
  With a <code>trigger</code> snippet the component renders its own header. The trigger carries
  <code>aria-expanded</code> and <code>aria-controls</code> pointing at the panel it opens, so assistive
  technology can move straight to the region the trigger governs.
</p>
<div class="demo-row" style="flex-direction: column; max-width: 500px;">
  <Accordion testId="accordion-linked">
    {#snippet trigger({ expanded })}
      <div style="padding: 12px; background: #eef; border-radius: 6px;">
        Shipping details {expanded ? '▲' : '▼'}
      </div>
    {/snippet}
    <div style="padding: 16px; background: #f5f5f5; border-radius: 8px;">
      <p>Delivered in 3–5 business days.</p>
    </div>
  </Accordion>
</div>

<h3>Explicit panelId</h3>
<p>
  Pass <code>panelId</code> when something outside the component needs to reference the panel by a
  known id; the trigger's <code>aria-controls</code> follows it.
</p>
<div class="demo-row" style="flex-direction: column; max-width: 500px;">
  <Accordion testId="accordion-custom-panel" panelId="returns-policy-panel">
    {#snippet trigger({ expanded })}
      <div style="padding: 12px; background: #efe; border-radius: 6px;">
        Returns policy {expanded ? '▲' : '▼'}
      </div>
    {/snippet}
    <div style="padding: 16px; background: #f5f5f5; border-radius: 8px;">
      <p>Free returns within 30 days.</p>
    </div>
  </Accordion>
</div>

<h3>Disabled trigger</h3>
<p>
  <code>disabled</code> locks the built-in trigger: clicks and Enter/Space no longer toggle, it
  leaves the tab order, and <code>aria-disabled="true"</code> is set.
</p>
<div class="demo-row" style="flex-direction: column; max-width: 500px;">
  <Accordion expand={false} disabled testId="accordion-disabled">
    {#snippet trigger({ expanded })}
      <span data-pw="accordion-disabled-trigger-label">{expanded ? 'Collapse' : 'Expand'}</span>
    {/snippet}
    <div style="padding: 16px; background: #f5f5f5; border-radius: 8px;">
      <p>This content stays collapsed — the trigger above is disabled.</p>
    </div>
  </Accordion>
</div>
