import { mount } from 'svelte';
import ModalHiddenInput from './ModalHiddenInput.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Modal hidden-input fixture mount target is missing');
}
mount(ModalHiddenInput, { target });
