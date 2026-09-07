<script lang="ts">
  import Accordion from '$lib/Accordion/Accordion.svelte';

  let accordionExpanded = $state(false);
  let latePanelId = $state<string>();
  let gridAccordionExpanded = $state(false);
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

<h3>Stable trigger id</h3>
<p>
  The trigger's <code>id</code> is generated per instance and never changes, even when
  <code>panelId</code> is assigned later, so the panel's <code>aria-labelledby</code> and anything else
  holding a reference to the trigger stay valid.
</p>
<div class="demo-row" style="flex-direction: column; max-width: 500px;">
  <button
    class="toggle-btn"
    data-pw="accordion-late-id-assign"
    onclick={() => (latePanelId = 'late-panel')}
  >
    Assign panelId
  </button>
  <Accordion testId="accordion-late-id" panelId={latePanelId}>
    {#snippet trigger({ expanded })}
      <span data-pw="accordion-late-id-trigger-label">Warranty {expanded ? '▲' : '▼'}</span>
    {/snippet}
    <div style="padding: 16px; background: #f5f5f5; border-radius: 8px;">
      <p>Two-year manufacturer warranty.</p>
    </div>
  </Accordion>
</div>

<h3>Inside a grid container</h3>
<p>
  A <code>display: grid</code> parent stretches its items into an auto-sized row by default. The
  panel needs <code>overflow: hidden</code> to animate <code>grid-template-rows</code>, but
  <code>overflow</code> other than <code>visible</code> also drops an element's automatic minimum
  size to zero — so as a grid item the panel is squeezed down to whatever height the grid happens to
  hand it, disconnected from what its own content actually needs, rather than growing to fit.
  Depending on the surrounding layout that can mean a sliver, or nothing at all. The children are
  still in the DOM and correctly rendered; only the box around them is wrong.
  <code>align-self: start</code> on the panel opts it out of that stretch so it always sizes from its
  own expanded content instead.
</p>
<div class="demo-row" style="flex-direction: column; max-width: 500px;">
  <button
    class="toggle-btn"
    data-pw="accordion-grid-toggle"
    onclick={() => (gridAccordionExpanded = !gridAccordionExpanded)}
  >
    {gridAccordionExpanded ? 'Collapse' : 'Expand'} Accordion (grid parent)
  </button>
  <div
    data-pw="accordion-grid-parent"
    style="display: grid; align-content: start; overflow-y: auto; height: 300px; border: 1px solid #ccc; border-radius: 8px;"
  >
    <Accordion expand={gridAccordionExpanded} testId="accordion-grid-nested">
      <div style="padding: 16px; background: #f5f5f5; border-radius: 8px;">
        <p>
          This paragraph must stay visible once the accordion above is expanded, even though its
          direct parent is a grid container rather than a block one.
        </p>
        <p>
          A second paragraph of the same content keeps the panel's expanded height comfortably
          taller than the 300px grid parent, proving the fix reads real content height rather than
          coincidentally fitting inside a squeezed row.
        </p>
        <p>
          A third paragraph pads the expanded height further still, so a regression that shrinks the
          row back down is unmistakably a missing few hundred pixels, not a rounding difference.
        </p>
        <p>
          A fourth paragraph, for the same reason: the more of this content a broken build hides,
          the less plausible it is that a future change could pass this check by accident.
        </p>
        <p>
          A fifth and final paragraph brings the panel's true content height well past the grid
          parent's own 300px, so the parent's <code>overflow-y: auto</code> is the thing that scrolls
          once the fix is in place — not the panel silently discarding the rest.
        </p>
      </div>
    </Accordion>
  </div>
</div>
