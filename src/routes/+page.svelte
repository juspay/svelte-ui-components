<script lang="ts">
  import type { InputButtonProperties } from '$lib';
  import Button from '$lib/Button/Button.svelte';
  import Input from '$lib/Input/Input.svelte';
  import InputButton from '$lib/InputButton/InputButton.svelte';
  import Toast from '$lib/Toast/Toast.svelte';
  import Toolbar from '$lib/Toolbar/Toolbar.svelte';

  let showToast: boolean = $state(false);

  let phoneNumber: string = $state('');
  let inputButtonPhoneNumber: string = $state('');

  let props: Omit<InputButtonProperties, 'value'> = {
    inputProperties: {
      validationPattern: new RegExp('^[6-9]{1}[0-9]{9}$'),
      inProgressPattern: new RegExp('^[6-9]{1}[0-9]{0,9}$'),
      onErrorMessage: 'Enter Valid phone number',
      maxLength: 10,
      minLength: 10
    },
    rightButtonProperties: {
      text: 'Submit',
      enable: false,
      loaderType: 'Circular'
    },
    rightButtonEventProperties: {
      onclick: () => {}
    }
  };
</script>

<div class="container">
  <h1>Svelte UI Components</h1>

  <h3>Components</h3>

  <div class="components">
    <Toolbar />

    <Input dataType="tel" bind:value={phoneNumber} {...props.inputProperties} />
    <InputButton bind:value={inputButtonPhoneNumber} {...props} />

    {#if showToast}
      <Toast message="hello" onToastHide={() => (showToast = false)} />
    {/if}

    <Button onclick={() => (showToast = true)} text="Show Toast" />
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap');

  .container {
    font-family: 'Nunito Sans', sans-serif;
  }

  .components {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    --toggle-text-order: 1;
    --toggle-switch-width: 40px;
    --toggle-switch-height: 20px;
    --toggle-ball-height: 18px;
    --toggle-ball-width: 18px;
  }
</style>
