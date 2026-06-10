<script lang="ts">
  import ThemeSwitcher from '$lib/ThemeSwitcher/ThemeSwitcher.svelte';

  let callbackValue = $state('');
  let callbackResolved = $state('');
</script>

<div class="page-header">
  <span class="category-badge">Theming</span>
  <h1>ThemeSwitcher</h1>
</div>

<div class="demo-row" style="align-items: flex-start; gap: 32px; flex-wrap: wrap;">
  <div>
    <p style="margin-bottom: 8px;">Default (segment mode):</p>
    <ThemeSwitcher />
  </div>

  <div>
    <p style="margin-bottom: 8px;">Two-option toggle:</p>
    <ThemeSwitcher options={[{ value: 'light' }, { value: 'dark' }]} />
  </div>

  <div>
    <p style="margin-bottom: 8px;">Three-option cycling toggle:</p>
    <ThemeSwitcher mode="toggle" />
  </div>

  <div>
    <p style="margin-bottom: 8px;">Custom 4 options (segment):</p>
    <ThemeSwitcher
      options={[
        { value: 'light' },
        { value: 'dark' },
        { value: 'sepia', label: 'Sepia theme' },
        { value: 'system' }
      ]}
    />
  </div>

  <div>
    <p style="margin-bottom: 8px;">Callback display:</p>
    <ThemeSwitcher
      onchange={(value, resolvedValue) => {
        callbackValue = value;
        callbackResolved = resolvedValue;
      }}
    />
    {#if callbackValue}
      <p style="margin-top: 8px; font-size: 13px; color: #666;">
        value: <code>{callbackValue}</code> &bull; resolved: <code>{callbackResolved}</code>
      </p>
    {/if}
  </div>

  <div>
    <p style="margin-bottom: 8px;">Link mode (icon only):</p>
    <ThemeSwitcher mode="link" />
  </div>

  <div>
    <p style="margin-bottom: 8px;">Link mode with label:</p>
    <ThemeSwitcher mode="link" showLabel={true} />
  </div>

  <div>
    <p style="margin-bottom: 8px;">Link mode — custom color via CSS vars:</p>
    <ThemeSwitcher mode="link" showLabel={true} classes="demo-link-themed" />
  </div>
</div>

<style>
  :global(.demo-link-themed) {
    --theme-switcher-link-color: #6366f1;
    --theme-switcher-link-color-hover: #4f46e5;
    --theme-switcher-link-underline: underline;
  }
</style>
