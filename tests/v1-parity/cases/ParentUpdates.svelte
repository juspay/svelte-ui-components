<script context="module">
  // A parent changing the props it passes down, after the child has mounted. Nimble's address form
  // prefills the recipient's name this way: it mutates the bound object in its own onMount and then
  // reassigns it.
  export const cases = [
    { name: 'input-bound-mutate-on-mount' },
    { name: 'input-bound-replace-on-mount' },
    { name: 'input-bound-mutate-later', actions: [['wait', 300]] },
    { name: 'input-unbound-mutate-on-mount' },
    { name: 'input-unbound-replace-on-mount' },
    {
      name: 'input-bound-mutate-on-mount-then-type',
      actions: [
        ['click', 'input'],
        ['type', 'input', 'x'],
        ['key', 'Tab']
      ]
    },
    { name: 'input-two-bound-mutate-on-mount' },
    { name: 'input-bound-mutate-from-button', actions: [['click', '#t']] },
    {
      name: 'inputbutton-bound-mutate-on-mount',
      knownDifference:
        'when the parent changes a bound InputButton in code, its reactive statements run once more than on 1.34.1 and stateChange arrives one step earlier; typing and every other case match (Svelte 4 pushes a bound prop down once per flush, Svelte 5 has no such pass)'
    },
    {
      name: 'inputbutton-bound-replace-on-mount',
      knownDifference:
        'when the parent changes a bound InputButton in code, its reactive statements run once more than on 1.34.1 and stateChange arrives one step earlier; typing and every other case match (Svelte 4 pushes a bound prop down once per flush, Svelte 5 has no such pass)'
    },
    {
      name: 'inputbutton-bound-mutate-from-button',
      knownDifference:
        'when the parent changes a bound InputButton in code, its reactive statements run once more than on 1.34.1 and stateChange arrives one step earlier; typing and every other case match (Svelte 4 pushes a bound prop down once per flush, Svelte 5 has no such pass)',
      actions: [['click', '#t']]
    },
    { name: 'checklist-bound-checked-on-mount' },
    { name: 'listitem-replace-on-mount' },
    { name: 'button-replace-on-mount' },
    { name: 'button-mutate-from-button', actions: [['click', '#t']] }
  ];
</script>

<script>
  import { onMount } from 'svelte';
  import {
    Input,
    InputButton,
    CheckListItem,
    ListItem,
    Button,
    defaultInputProperties,
    defaultListItemProperties,
    defaultButtonProperties
  } from 'sui-v1-under-test';
  import { log, note } from './_kit.js';
  export let name;

  const input = (o = {}) => ({
    ...defaultInputProperties,
    focus: false,
    validators: [],
    textTransformers: [],
    placeholder: 'Name',
    label: 'RECIPIENT NAME',
    ...o
  });
  let a = input();
  let b = input({
    dataType: 'tel',
    maxLength: 10,
    label: 'RECIPIENT NUMBER',
    placeholder: 'Phone'
  });
  let ib = {
    inputProperties: input({ dataType: 'tel', maxLength: 10, label: 'PHONE', actionInput: true }),
    rightButtonProperties: {
      ...defaultButtonProperties,
      text: 'Verify',
      enable: false,
      type: 'button'
    },
    leftButtonProperties: null,
    bottomButtonProperties: null
  };
  let checked = false;
  let li = { ...defaultListItemProperties, label: 'Before' };
  let btn = { ...defaultButtonProperties, text: 'Before', type: 'button' };

  $: note('a', a.value);
  $: note('ib', ib.inputProperties.value);

  function mutateA() {
    a.value = 'Rahul Sharma';
    a = a;
  }

  onMount(() => {
    if (name === 'input-bound-mutate-on-mount' || name === 'input-unbound-mutate-on-mount') {
      mutateA();
    } else if (
      name === 'input-bound-replace-on-mount' ||
      name === 'input-unbound-replace-on-mount'
    ) {
      a = { ...a, value: 'Rahul Sharma' };
    } else if (name === 'input-bound-mutate-later') {
      setTimeout(mutateA, 50);
    } else if (name === 'input-bound-mutate-on-mount-then-type') {
      mutateA();
    } else if (name === 'input-two-bound-mutate-on-mount') {
      mutateA();
      b.value = '9876543210';
      b = b;
    } else if (name === 'inputbutton-bound-mutate-on-mount') {
      ib.inputProperties.value = '9876543210';
      ib = ib;
    } else if (name === 'inputbutton-bound-replace-on-mount') {
      ib = { ...ib, inputProperties: { ...ib.inputProperties, value: '9876543210' } };
    } else if (name === 'checklist-bound-checked-on-mount') {
      checked = true;
    } else if (name === 'listitem-replace-on-mount') {
      li = { ...li, label: 'After' };
    } else if (name === 'button-replace-on-mount') {
      btn = { ...btn, text: 'After', enable: false };
    }
  });
</script>

<div style="width: 360px;">
  {#if name === 'input-bound-mutate-on-mount' || name === 'input-bound-replace-on-mount' || name === 'input-bound-mutate-later' || name === 'input-bound-mutate-on-mount-then-type'}
    <Input
      bind:properties={a}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
    />
  {:else if name === 'input-unbound-mutate-on-mount' || name === 'input-unbound-replace-on-mount'}
    <Input properties={a} on:input={log('input')} on:stateChange={log('stateChange')} />
  {:else if name === 'input-two-bound-mutate-on-mount'}
    <Input bind:properties={a} on:stateChange={log('stateChange-a')} />
    <Input bind:properties={b} on:stateChange={log('stateChange-b')} />
  {:else if name === 'input-bound-mutate-from-button'}
    <button id="t" on:click={mutateA}>prefill</button>
    <Input bind:properties={a} on:stateChange={log('stateChange')} />
  {:else if name === 'inputbutton-bound-mutate-on-mount' || name === 'inputbutton-bound-replace-on-mount'}
    <InputButton bind:properties={ib} on:stateChange={log('stateChange')} />
  {:else if name === 'inputbutton-bound-mutate-from-button'}
    <button
      id="t"
      on:click={() => {
        ib.inputProperties.value = '9876543210';
        ib = ib;
      }}>prefill</button
    >
    <InputButton bind:properties={ib} on:stateChange={log('stateChange')} />
  {:else if name === 'checklist-bound-checked-on-mount'}
    <CheckListItem bind:checked text="Same as shipping" on:click={log('click')} />
  {:else if name === 'listitem-replace-on-mount'}
    <ListItem properties={li} on:itemClick={log('itemClick')} />
  {:else if name === 'button-replace-on-mount'}
    <Button properties={btn} on:click={log('click')} />
  {:else if name === 'button-mutate-from-button'}
    <button
      id="t"
      on:click={() => {
        btn.text = 'After';
        btn = btn;
      }}>change</button
    >
    <Button properties={btn} on:click={log('click')} />
  {/if}
</div>
