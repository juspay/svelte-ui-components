<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import Menu from '$lib/Menu/Menu.svelte';

  let loadingDemo = $state(false);

  const runLoading = () => {
    loadingDemo = true;
    setTimeout(() => (loadingDemo = false), 1600);
  };
</script>

<div class="page-header">
  <span class="category-badge">Buttons & Actions</span>
  <h1>Button</h1>
</div>

<div class="btn-demos">
  <h3>Variants</h3>
  <div class="demo-row">
    <Button text="Primary" variant="primary" />
    <Button text="Secondary" variant="secondary" />
    <Button text="Ghost" variant="ghost" />
    <Button text="Destructive" variant="destructive" />
  </div>

  <h3>Sizes</h3>
  <div class="demo-row" style="align-items: center;">
    <Button text="Small" size="sm" />
    <Button text="Medium" size="md" />
    <Button text="Large" size="lg" />
  </div>

  <h3>Icon only</h3>
  <p>Pair <code>iconOnly</code> with <code>ariaLabel</code> for an accessible name.</p>
  <div class="demo-row" style="align-items: center;">
    <Button iconOnly ariaLabel="Add" variant="primary">
      {#snippet icon()}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <line x1="8" y1="3" x2="8" y2="13" />
          <line x1="3" y1="8" x2="13" y2="8" />
        </svg>
      {/snippet}
    </Button>
    <Button iconOnly ariaLabel="Edit" variant="secondary">
      {#snippet icon()}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      {/snippet}
    </Button>
    <Button iconOnly ariaLabel="Delete" variant="destructive">
      {#snippet icon()}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="3 6 5 6 21 6" />
          <path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          />
        </svg>
      {/snippet}
    </Button>
  </div>

  <h3>Full width</h3>
  <div class="demo-row" style="max-width: 360px; flex-direction: column;">
    <Button text="Full-width button" fullWidth variant="primary" />
  </div>

  <h3>Loading</h3>
  <p>
    The <code>loading</code> prop shows a spinner, sets <code>aria-busy</code>, and disables the
    button.
  </p>
  <div class="demo-row">
    <Button text={loadingDemo ? 'Saving…' : 'Save'} loading={loadingDemo} onclick={runLoading} />
  </div>

  <h3>Disabled</h3>
  <div class="demo-row">
    <Button text="Primary" variant="primary" disabled />
    <Button text="Secondary" variant="secondary" disabled />
    <Button text="Ghost" variant="ghost" disabled />
  </div>

  <h3>As a link (href)</h3>
  <p>With <code>href</code> the button renders as a styled <code>&lt;a&gt;</code>.</p>
  <div class="demo-row">
    <Button text="Open docs" href="https://svelte.dev" target="_blank" variant="secondary" />
  </div>

  <h3>Gradient background</h3>
  <p>
    <code>--button-background</code> takes any <code>background-image</code> value — here a gradient
    layered over <code>--button-color</code> — and persists into hover/active instead of falling
    back to a flat color. Pair it with <code>--button-transition</code> to animate state changes (here,
    the hover lift).
  </p>
  <div class="demo-row">
    <Button text="Book a Demo" classes="btn-gradient" />
  </div>

  <h3>Brand variant</h3>
  <p>
    <code>variant="brand"</code> is a transparent chassis (white text, no border, no background of
    its own) purpose-built for gradient marketing CTAs — pair it with a
    <code>--button-background</code> gradient via <code>classes</code>. Unlike the plain gradient
    recipe above, the variant's internal hover default is also transparent, so set
    <code>--button-hover-color</code> too or the gradient will flatten to transparent on hover.
  </p>
  <div class="demo-row">
    <Button text="Get Started" variant="brand" classes="btn-brand-gradient" />
  </div>

  <h3>title and ariaBusy</h3>
  <p>
    <code>title</code> renders the browser's own hover tooltip; <code>ariaLabel</code> names the
    control for assistive tech without any visible affordance, so an icon-only button generally
    wants both. <code>ariaBusy</code> marks a control whose related data is still loading while
    leaving it clickable — unlike <code>loading</code>, which also spins and disables.
  </p>
  <div class="demo-row">
    <Button
      text="Filters"
      title="Filters"
      ariaLabel="Filters, 2 selected"
      ariaBusy
      testId="button-title-busy"
    />
  </div>

  <h3>ariaHaspopup</h3>
  <p>
    <code>aria-haspopup</code> is a promise that activating the control opens a popup, so it belongs
    on a button that really has one. <code>Menu</code> hands exactly this value to its
    <code>trigger</code> snippet — spread it rather than hardcoding the attribute.
  </p>
  <div class="demo-row">
    <Menu
      items={[
        { label: 'Newest first', value: 'newest' },
        { label: 'Oldest first', value: 'oldest' }
      ]}
      interactiveTrigger
      testId="button-haspopup-menu"
    >
      {#snippet trigger(triggerProps)}
        <Button {...triggerProps} text="Sort" testId="button-haspopup" />
      {/snippet}
    </Menu>
  </div>
</div>

<style>
  :global(.btn-gradient) {
    --button-background: linear-gradient(135deg, #8f41fc, #59299c);
    --button-hover-transform: translateY(-2px);
    --button-transition: background 0.2s ease, transform 0.15s ease;
  }

  :global(.btn-brand-gradient) {
    --button-background: linear-gradient(135deg, #ff7a45, #8f41fc);
    --button-hover-color: linear-gradient(135deg, #ff7a45, #8f41fc);
    --button-transition: background 0.2s ease, transform 0.15s ease;
    --button-hover-transform: translateY(-2px);
  }
</style>
