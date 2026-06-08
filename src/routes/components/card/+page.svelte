<script lang="ts">
  import Card from '$lib/Card/Card.svelte';
  import Button from '$lib/Button/Button.svelte';

  let lastClicked = $state('');

  const handleCardClick = (label: string) => (_event: MouseEvent) => {
    lastClicked = label;
  };
</script>

<div class="page-header">
  <span class="category-badge">Layout & Containers</span>
  <h1>Card</h1>
</div>

<div class="demo-section">
  <h2 class="demo-section-title">Basic Cards</h2>
  <div class="demo-row" style="flex-direction: column; max-width: 420px; gap: 16px;">
    <div class="card-theme">
      <Card title="Order Summary" description="Review your items before checkout.">
        <p style="margin: 0;">3 items in your cart totalling $49.99</p>
      </Card>
    </div>

    <div class="card-theme">
      <Card>
        <p style="margin: 0;">A card with no header — just content.</p>
      </Card>
    </div>

    <div class="card-theme">
      <Card title="Quick Actions" description="Common tasks at a glance.">
        <div style="display: flex; gap: 8px;">
          <Button text="Create" />
          <Button text="Import" />
        </div>
      </Card>
    </div>

    <div class="card-theme card-accent">
      <Card title="Pro Plan" description="Unlock all features.">
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <span class="tag">Unlimited</span>
          <span class="tag">Priority Support</span>
          <span class="tag">Analytics</span>
        </div>
      </Card>
    </div>
  </div>
</div>

<div class="demo-section">
  <h2 class="demo-section-title">Sized Cards (--card-width / --card-box-shadow / --card-margin)</h2>
  <div class="demo-row" style="flex-direction: column; gap: 16px;">
    <div class="card-sized">
      <Card title="Fixed Width + Shadow" description="600px wide, box-shadow applied.">
        <p style="margin: 0;">
          Useful for onboarding flows, gateway config forms, and step panels.
        </p>
      </Card>
    </div>

    <div class="card-theme card-with-margin">
      <Card title="Card with Margin">
        <p style="margin: 0;">Outer margin via --card-margin — useful in stacked list layouts.</p>
      </Card>
    </div>

    <div class="card-theme card-constrained">
      <Card title="Max/Min Width Constrained">
        <p style="margin: 0;">Stays between 200px and 400px regardless of container size.</p>
      </Card>
    </div>
  </div>
</div>

<div class="demo-section">
  <h2 class="demo-section-title">Clickable Cards (onclick + keyboard a11y)</h2>
  {#if lastClicked}
    <p class="click-status">Last clicked: <strong>{lastClicked}</strong></p>
  {/if}
  <div class="demo-row" style="gap: 16px; flex-wrap: wrap;">
    <div class="card-clickable">
      <Card onclick={handleCardClick('Platform A')} testId="platform-a-card">
        <div class="platform-tile">
          <span class="platform-icon">🛒</span>
          <span class="platform-name">Platform A</span>
        </div>
      </Card>
    </div>

    <div class="card-clickable">
      <Card onclick={handleCardClick('Platform B')} testId="platform-b-card">
        <div class="platform-tile">
          <span class="platform-icon">📦</span>
          <span class="platform-name">Platform B</span>
        </div>
      </Card>
    </div>

    <div class="card-clickable card-clickable-disabled">
      <Card classes="card-coming-soon">
        <div class="platform-tile">
          <span class="platform-icon">🔒</span>
          <span class="platform-name">Coming Soon</span>
        </div>
      </Card>
    </div>
  </div>
  <p class="demo-hint">Tab to the interactive cards and press Enter or Space to activate.</p>
</div>

<style>
  .demo-section {
    margin-bottom: 40px;
  }

  .demo-section-title {
    margin: 0 0 16px;
    font-size: 15px;
    font-weight: 600;
    color: var(--doc-text-secondary, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .card-theme {
    --card-background: var(--doc-demo-bg);
    --card-border: 1px solid var(--doc-border);
  }

  .card-accent {
    --card-border: 1px solid var(--doc-accent-border);
    --card-background: var(--doc-accent-bg);
  }

  .card-sized {
    --card-background: var(--doc-demo-bg);
    --card-border: 1px solid var(--doc-border);
    --card-width: 600px;
    --card-min-width: 600px;
    --card-max-width: 600px;
    --card-box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .card-with-margin {
    --card-margin: 0 0 0 24px;
  }

  .card-constrained {
    --card-min-width: 200px;
    --card-max-width: 400px;
  }

  .card-clickable {
    --card-background: var(--doc-demo-bg);
    --card-border: 1px solid var(--doc-border);
    --card-border-radius: 12px;
    --card-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    --card-content-padding: 20px;
    --card-width: 160px;
  }

  .card-clickable-disabled {
    opacity: 0.45;
  }

  .platform-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .platform-icon {
    font-size: 28px;
    line-height: 1;
  }

  .platform-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--doc-text, #111827);
  }

  .tag {
    padding: 4px 10px;
    background: var(--doc-accent-subtle-bg);
    border-radius: 4px;
    font-size: 13px;
    color: var(--doc-accent-text);
    font-weight: 600;
  }

  .click-status {
    margin: 0 0 12px;
    font-size: 13px;
    color: var(--doc-text-secondary, #6b7280);
  }

  .demo-hint {
    margin: 12px 0 0;
    font-size: 12px;
    color: var(--doc-text-secondary, #9ca3af);
  }
</style>
