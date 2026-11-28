<script context="module">
  // A parent update that both removes a component's branch and makes its props invalid. Svelte 4
  // removed the branch without showing the child the invalid props; these cases check the v1
  // components survive Svelte 5 handing them over first. Modelled on Nimble's custom payment
  // option, whose REMOVE button takes its text from `instrumentDetails.action`.
  export const cases = [
    { name: 'button-direct', actions: [['click', '#t']] },
    { name: 'button-in-listitem-slot', actions: [['click', '#t']] },
    { name: 'button-props-undefined', actions: [['click', '#t']] },
    { name: 'input-message-undefined', actions: [['click', '#t']] },
    { name: 'inputbutton-input-undefined', actions: [['click', '#t']] },
    { name: 'modal-header-undefined', actions: [['click', '#t']] },
    { name: 'select-items-undefined', actions: [['click', '#t']] },
    { name: 'toggle-text-undefined', actions: [['click', '#t']] },
    { name: 'table-data-undefined', actions: [['click', '#t']] },
    { name: 'listitem-props-undefined', actions: [['click', '#t']] }
  ];
</script>

<script>
  import {
    Button,
    ListItem,
    Input,
    InputButton,
    Modal,
    Select,
    Toggle,
    Table,
    defaultButtonProperties,
    defaultListItemProperties,
    defaultInputProperties,
    defaultModalProperties
  } from 'sui-v1-under-test';
  import { log, svg } from './_kit.js';
  export let name;

  let details = { action: 'REMOVE' };
  let show = true;
  function clear() {
    details = { action: undefined };
    show = false;
  }

  $: buttonProps = { ...defaultButtonProperties, text: details.action, type: 'button' };
  $: listProps = { ...defaultListItemProperties, label: 'Nector' };
  $: inputProps = show
    ? { ...defaultInputProperties, focus: false, value: 'abc', label: 'Name' }
    : { ...defaultInputProperties, focus: false, value: 'abc', message: undefined };
  $: inputButtonProps = show
    ? {
        inputProperties: { ...defaultInputProperties, focus: false, value: '98', label: 'Phone' },
        rightButtonProperties: { ...defaultButtonProperties, text: 'Go', type: 'button' },
        leftButtonProperties: null,
        bottomButtonProperties: null
      }
    : {
        inputProperties: undefined,
        rightButtonProperties: null,
        leftButtonProperties: null,
        bottomButtonProperties: null
      };
  $: modalProps = show
    ? {
        ...defaultModalProperties,
        enableTransition: false,
        header: { leftImage: null, rightImage: null, text: 'Title' }
      }
    : { ...defaultModalProperties, enableTransition: false, header: undefined };
  $: selectProps = show
    ? {
        placeholder: 'Pick',
        label: 'State',
        allItems: ['A', 'B'],
        selectedItem: 'A',
        selectedItemLabel: null,
        showSelectedItem: true,
        selectMultipleItems: false,
        dropDownIcon: svg
      }
    : {
        placeholder: 'Pick',
        label: 'State',
        allItems: undefined,
        selectedItem: undefined,
        selectedItemLabel: null,
        showSelectedItem: true,
        selectMultipleItems: false,
        dropDownIcon: svg
      };
  $: toggleText = show ? 'Save' : undefined;
  $: tableProps = show
    ? { tableTitle: 'T', tableHeaders: ['A'], tableData: [['1']] }
    : { tableTitle: 'T', tableHeaders: undefined, tableData: undefined };
  $: listItemProps = show ? { ...defaultListItemProperties, label: 'Row' } : undefined;
</script>

<button id="t" style="position: relative; z-index: 100;" on:click={clear}>clear</button>
<div style="width: 360px;">
  {#if name === 'button-direct'}
    {#if details.action === 'REMOVE'}
      <Button properties={buttonProps} on:click={log('click')} />
    {/if}
  {:else if name === 'button-in-listitem-slot'}
    <ListItem properties={listProps}>
      <div slot="rightContent">
        {#if details.action === 'REMOVE'}
          <Button properties={buttonProps} on:click={log('click')} />
        {/if}
      </div>
    </ListItem>
  {:else if name === 'button-props-undefined'}
    {#if show}
      <Button properties={show ? buttonProps : undefined} />
    {/if}
  {:else if name === 'input-message-undefined'}
    {#if show}
      <Input properties={inputProps} />
    {/if}
  {:else if name === 'inputbutton-input-undefined'}
    {#if show}
      <InputButton properties={inputButtonProps} />
    {/if}
  {:else if name === 'modal-header-undefined'}
    {#if show}
      <Modal properties={modalProps}><div slot="content">Body</div></Modal>
    {/if}
  {:else if name === 'select-items-undefined'}
    {#if show}
      <Select properties={selectProps} />
    {/if}
  {:else if name === 'toggle-text-undefined'}
    {#if show}
      <Toggle text={toggleText} checked={false} />
    {/if}
  {:else if name === 'table-data-undefined'}
    {#if show}
      <Table properties={tableProps} />
    {/if}
  {:else if name === 'listitem-props-undefined'}
    {#if show}
      <ListItem properties={listItemProps} />
    {/if}
  {/if}
</div>
