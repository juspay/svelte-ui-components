<script lang="ts">
  import KeyValue from '$lib/KeyValue/KeyValue.svelte';
  import Pill from '$lib/Pill/Pill.svelte';
  import type { KeyValueItem } from '$lib/KeyValue/properties';

  const offerFields: KeyValueItem[] = [
    { label: 'Offer name', value: 'Summer Sale 2026' },
    { label: 'Offer code', value: 'SUMMER20' },
    { label: 'Discount', value: '20% off, up to ₹500' },
    { label: 'Payment method', value: 'Credit Card, UPI' },
    { label: 'Valid from', value: '01 Jun 2026' },
    { label: 'Valid till', value: '30 Jun 2026' },
    { label: 'Min order value', value: '₹1,499' },
    { label: 'Usage limit', value: '1 per customer' }
  ];

  const withEmptyFields: KeyValueItem[] = [
    { label: 'Customer', value: 'Neha Sanwal' },
    { label: 'Email', value: 'neha@example.com' },
    { label: 'Phone', value: '' },
    { label: 'Notes', value: null },
    { label: 'Wallet balance', value: '₹2,340' }
  ];

  const statusFields: KeyValueItem[] = [
    { label: 'Offer name', value: 'Festive Cashback' },
    { label: 'Status', value: 'active' },
    { label: 'Channel', value: 'Online' },
    { label: 'Created by', value: 'Merchant Ops' }
  ];
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>KeyValue</h1>
</div>

<div class="kv-demos">
  <h3>Default (2 columns)</h3>
  <div class="demo-row">
    <KeyValue items={offerFields} testId="key-value-default" />
  </div>

  <h3>Three columns</h3>
  <div class="demo-row">
    <KeyValue items={offerFields} columns={3} />
  </div>

  <h3>Single column</h3>
  <div class="demo-row" style="max-width: 360px;">
    <KeyValue items={offerFields.slice(0, 4)} columns={1} />
  </div>

  <h3>Sizes</h3>
  <p>
    Three typography presets — <code>sm</code> (14/12px), <code>md</code> (16/14px, default), and
    <code>lg</code> (18/16px) — scale the text. The value sits 2px below the label so the key reads as
    the primary element.
  </p>
  <div class="demo-row size-row">
    <div>
      <p class="size-caption">size="sm"</p>
      <KeyValue items={offerFields.slice(0, 3)} columns={1} size="sm" />
    </div>
    <div>
      <p class="size-caption">size="md"</p>
      <KeyValue items={offerFields.slice(0, 3)} columns={1} size="md" />
    </div>
    <div>
      <p class="size-caption">size="lg"</p>
      <KeyValue items={offerFields.slice(0, 3)} columns={1} size="lg" />
    </div>
  </div>

  <h3>Horizontal layout</h3>
  <p>Set <code>layout="horizontal"</code> to place each label beside its value.</p>
  <div class="demo-row" style="max-width: 480px;">
    <KeyValue items={offerFields.slice(0, 5)} columns={1} layout="horizontal" />
  </div>

  <h3>Empty values hidden (default)</h3>
  <p>
    Items whose value is <code>null</code>, <code>undefined</code>, or an empty string are skipped —
    the "Phone" and "Notes" rows below disappear.
  </p>
  <div class="demo-row" style="max-width: 480px;">
    <KeyValue items={withEmptyFields} />
  </div>

  <h3>Empty values shown</h3>
  <p>Pass <code>hideEmpty={false}</code> with an <code>emptyText</code> placeholder.</p>
  <div class="demo-row" style="max-width: 480px;">
    <KeyValue items={withEmptyFields} hideEmpty={false} emptyText="N/A" />
  </div>

  <h3>Custom value snippet</h3>
  <p>Render the value cell yourself — here the "Status" field uses a <code>Pill</code>.</p>
  <div class="demo-row" style="max-width: 480px;">
    <KeyValue items={statusFields}>
      {#snippet valueSnippet(item)}
        {#if item.label === 'Status'}
          <Pill text={String(item.value)} />
        {:else}
          {item.value}
        {/if}
      {/snippet}
    </KeyValue>
  </div>
</div>

<style>
  .size-row {
    display: flex;
    gap: 40px;
    flex-wrap: wrap;
  }

  .size-caption {
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--doc-text-muted, #6b7280);
  }

  /* Keep labels/values readable on the docs dark theme. */
  :global([data-theme='dark']) .kv-demos {
    --keyvalue-label-color: var(--doc-text-primary);
    --keyvalue-value-color: var(--doc-text-secondary);
  }
</style>
