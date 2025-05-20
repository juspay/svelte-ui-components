<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import GridItem from '$lib/GridItem/GridItem.svelte';
  import Toggle from '$lib/Toggle/Toggle.svelte';
  import Toolbar from '$lib/Toolbar/Toolbar.svelte';
  import { defaultButtonProperties } from '$lib/Button/properties';

  function handleToggle(event: CustomEvent) {
    console.log("Toggle clicked:", event.detail);
  }

  function handleButtonClick() {
    console.log("Button clicked");
  }

  function handleGridItemClick() {
    console.log("GridItem clicked");
  }

  function handleToolbarBackClick() {
    console.log("Toolbar back button clicked");
  }

  // Button properties for testing
  const buttonProps = {
    ...defaultButtonProperties,
    text: "Click me",
    enable: true
  };

  // Toolbar custom content
  const toolbarCustomContent = () => `<span>Custom content</span>`;
</script>

<div class="container">
  <h1>Svelte UI Components - Svelte 5 Migration Test</h1>

  <h3>Components</h3>

  <div class="component-section">
    <h4>Button Component</h4>
    <div class="component-test">
      <Button properties={buttonProps} on:click={handleButtonClick} />
      <Button properties={{...buttonProps, text: "Disabled", enable: false}} />
      <Button properties={{...buttonProps, text: "With loader", showLoader: true}} />
    </div>
  </div>

  <div class="component-section">
    <h4>Toggle Component</h4>
    <div class="component-test">
      <Toggle text="Default Toggle" on:click={handleToggle} />
      <Toggle text="Pre-checked Toggle" checked={true} on:click={handleToggle} />
    </div>
  </div>

  <div class="component-section">
    <h4>GridItem Component</h4>
    <div class="component-test">
      <GridItem text="Grid Item" on:click={handleGridItemClick} />
    </div>
  </div>

  <div class="component-section">
    <h4>Toolbar Component</h4>
    <div class="component-test toolbar-test">
      <Toolbar
        properties={{
          text: "Toolbar Title",
          showBackButton: true,
          backIcon: "https://cdn-icons-png.flaticon.com/512/93/93634.png"
        }}
        on:backClick={handleToolbarBackClick}
      />

      <Toolbar
        properties={{
          text: null,
          showBackButton: false,
          backIcon: null
        }}
        leftContent={toolbarCustomContent}
      />
    </div>
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap');

  .container {
    font-family: 'Nunito Sans', sans-serif;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .component-section {
    margin: 20px 0;
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 20px;
  }

  h4 {
    margin-top: 0;
    color: #333;
  }

  .component-test {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    align-items: center;

    /* Toggle component variables */
    --toggle-text-order: 1;
    --toggle-switch-width: 40px;
    --toggle-switch-height: 20px;
    --toggle-ball-height: 18px;
    --toggle-ball-width: 18px;

    /* Button component variables */
    --button-color: #4a6cf7;
    --button-hover-color: #3a5cf7;
    --button-border-radius: 8px;
    --button-padding: 8px 16px;
    --button-font-size: 14px;
  }

  .toolbar-test {
    display: block;
    width: 100%;
    height: 300px;
    position: relative;

    /* Toolbar variables */
    --toolbar-position: relative;
    --toolbar-height: auto;
    --toolbar-width: 100%;
    --toolbar-background: #f9f9f9;
    --toolbar-box-shadow: 0px 1px 3px rgba(0,0,0,0.1);
    --toolbar-border-radius: 8px;
    --toolbar-padding: 10px;
  }
</style>
