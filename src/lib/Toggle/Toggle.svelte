<script lang="ts">
  export let toggleValue = false;
  export let toggleText = '';
</script>

<div class="toggle-container">
  <div class="toggle-text">{toggleText}</div>
  <label class="switch">
    <input class="input-checkbox" type="checkbox" bind:checked={toggleValue} />
    <span class="slider round" />
  </label>
</div>

<style>
  .toggle-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .toggle-text {
    font-size: 14px;
    font-weight: 500;
    color: #4a4a4a;
    margin-right: 8px;
  }

  .switch {
    position: relative;
    display: inline-block;
    width: 46px;
    height: 25px;
  }

  .switch .input-checkbox {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--slider-unchecked-color, #ccc);
    -webkit-transition: 0.4s;
    transition: 0.4s;
  }

  .slider:before {
    position: absolute;
    content: '';
    height: 23px;
    width: 23px;
    left: 2px;
    bottom: 1px;
    top: 1px;
    background-color: white;
    -webkit-transition: 0.4s;
    transition: 0.4s;
  }

  .input-checkbox:checked + .slider {
    background-color: var(--slider-checked-color, #2196f3);
  }

  .input-checkbox:focus + .slider {
    box-shadow: 0 0 1px #171717;
  }

  .input-checkbox:checked + .slider:before {
    -webkit-transform: translateX(19px);
    -ms-transform: translateX(19px);
    transform: translateX(19px);
  }

  .slider.round {
    border-radius: 23px;
  }

  .slider.round:before {
    border-radius: 50%;
  }
</style>
