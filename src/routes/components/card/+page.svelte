<script lang="ts">
  import Card from '$lib/Card/Card.svelte';
  import Button from '$lib/Button/Button.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Layout & Containers</span>
  <h1>Card</h1>
</div>

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

<style>
  .card-theme {
    --card-background: var(--doc-demo-bg);
    --card-border: 1px solid var(--doc-border);
  }

  .card-accent {
    --card-border: 1px solid var(--doc-accent-border);
    --card-background: var(--doc-accent-bg);
  }

  .tag {
    padding: 4px 10px;
    background: var(--doc-accent-subtle-bg);
    border-radius: 4px;
    font-size: 13px;
    color: var(--doc-accent-text);
    font-weight: 600;
  }
</style>
