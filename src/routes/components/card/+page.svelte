<script lang="ts">
  import { base } from '$app/paths';
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

<div class="demo-section">
  <h2 class="demo-section-title">Anchor Cards (href / target / rel)</h2>
  <p class="demo-hint" style="margin: 0 0 16px;">
    With <code>href</code> set, the root renders as a native <code>&lt;a&gt;</code> instead of a
    <code>&lt;div&gt;</code> — same styling, but focus and Enter-activation come from the browser
    rather than a synthetic <code>role="button"</code>/<code>tabindex</code> shim.
  </p>
  <div class="demo-row" style="gap: 16px; flex-wrap: wrap;">
    <div class="card-clickable">
      <Card href="{base}/components/button" testId="internal-link-card">
        <div class="platform-tile">
          <span class="platform-icon">🔗</span>
          <span class="platform-name">Internal link</span>
        </div>
      </Card>
    </div>

    <div class="card-clickable">
      <Card href="https://svelte.dev" target="_blank" testId="external-link-card">
        <div class="platform-tile">
          <span class="platform-icon">↗️</span>
          <span class="platform-name">Opens in new tab</span>
        </div>
      </Card>
    </div>
  </div>
  <p class="demo-hint">
    The external link's <code>rel</code> defaults to <code>noopener noreferrer</code> because
    <code>target="_blank"</code> is set, without needing to pass <code>rel</code> explicitly.
  </p>
</div>

<div class="demo-section">
  <h2 class="demo-section-title">Anchor / Div Layout Parity</h2>
  <p class="demo-hint" style="margin: 0 0 16px;">
    Same sizing, same content -- only <code>href</code> differs. The rendered box must be identical
    whether the root is a <code>&lt;div&gt;</code> or an <code>&lt;a&gt;</code>.
  </p>
  <div class="demo-row" style="gap: 16px; flex-wrap: wrap;">
    <div class="card-parity-theme">
      <Card
        title="Layout Parity"
        description="Fixed-size layout for a bounding-box comparison test."
        testId="parity-div-card"
      >
        <p style="margin: 0;">Identical content in both cards.</p>
      </Card>
    </div>

    <div class="card-parity-theme">
      <Card
        href="{base}/components/card"
        title="Layout Parity"
        description="Fixed-size layout for a bounding-box comparison test."
        testId="parity-anchor-card"
      >
        <p style="margin: 0;">Identical content in both cards.</p>
      </Card>
    </div>
  </div>
</div>

<div class="demo-section">
  <h2 class="demo-section-title">Custom Layout (Consumer Recipe)</h2>
  <p class="demo-hint" style="margin: 0 0 16px;">
    Place the layout inside the default content area — the Card provides the container, shadow, and
    click semantics; flex/grid arrangement is the consumer's responsibility.
  </p>

  <div class="demo-row" style="flex-direction: column; gap: 12px; max-width: 640px;">
    <!-- Metric row: icon left, label+value center, badge right -->
    <div class="card-row-theme">
      <Card testId="metric-row-card">
        <div class="card-row">
          <span class="row-icon">📊</span>
          <div class="row-label-group">
            <span class="row-label">Total Revenue</span>
            <span class="row-value">$48,320</span>
          </div>
          <span class="row-badge row-badge-up">+12.4%</span>
        </div>
      </Card>
    </div>

    <!-- Integration row: logo left, name+status center, connect/disconnect right -->
    <div class="card-row-theme">
      <Card testId="integration-row-card">
        <div class="card-row">
          <span class="row-icon">🛒</span>
          <div class="row-label-group">
            <span class="row-label">Shopify</span>
            <span class="row-status row-status-connected">Connected</span>
          </div>
          <div class="disconnect-btn">
            <Button text="Disconnect" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Clickable integration row: the entire card is interactive -->
    <div class="card-row-theme card-row-clickable">
      <Card onclick={handleCardClick('WooCommerce')} testId="integration-woo-card">
        <div class="card-row">
          <span class="row-icon">🧩</span>
          <div class="row-label-group">
            <span class="row-label">WooCommerce</span>
            <span class="row-status row-status-disconnected">Not connected</span>
          </div>
          <span class="row-arrow">›</span>
        </div>
      </Card>
    </div>

    <!-- Only two zones (no center) — gap fills the space -->
    <div class="card-row-theme">
      <Card testId="two-zone-card">
        <div class="card-row">
          <span class="row-label">Plan</span>
          <span class="row-badge">Pro</span>
        </div>
      </Card>
    </div>
  </div>
</div>

<style>
  .demo-section {
    margin-bottom: 40px;
  }

  .demo-section-title {
    margin: 0 0 16px;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .platform-name {
    color: var(--doc-text, #111827);
  }

  .tag {
    padding: 4px 10px;
    background: var(--doc-accent-subtle-bg);
    border-radius: 4px;
    color: var(--doc-accent-text);
  }

  .click-status {
    margin: 0 0 12px;
    color: var(--doc-text-secondary, #6b7280);
  }

  .demo-hint {
    margin: 12px 0 0;
    color: var(--doc-text-secondary, #9ca3af);
  }

  /* ── Custom layout demo ─────────────────────────────── */

  .card-row-theme {
    --card-background: var(--doc-demo-bg);
    --card-border: 1px solid var(--doc-border);
    --card-width: 100%;
    --card-content-padding: 0;
  }

  .card-row-clickable {
    --card-border-radius: 10px;
    --card-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }

  .card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    gap: 12px;
  }

  .row-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .row-label-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .row-label {
    color: var(--doc-text, #111827);
  }

  .row-value {
    color: var(--doc-text, #111827);
  }

  .row-badge {
    padding: 3px 10px;
    border-radius: 20px;
    background: var(--doc-accent-subtle-bg, #eff6ff);
    color: var(--doc-accent-text, #3b82f6);
  }

  .row-badge-up {
    background: #ecfdf5;
    color: #059669;
  }

  .row-status {
    display: block;
  }

  .row-status-connected {
    color: #059669;
  }

  .row-status-disconnected {
    color: var(--doc-text-secondary, #6b7280);
  }

  .row-arrow {
    color: var(--doc-text-secondary, #9ca3af);
    display: inline-flex;
    align-items: center;
  }

  .disconnect-btn {
    --button-padding: 4px 12px;
    --button-border-radius: 6px;
    --button-color: transparent;
    --button-border: 1px solid var(--doc-border, #e5e7eb);
    --button-text-color: var(--doc-text, #374151);
    --button-hover-color: var(--doc-demo-bg, #f9fafb);
  }
</style>
