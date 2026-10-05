import { mount } from 'svelte';
import ModalViewport from './ModalViewport.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Modal viewport fixture mount target is missing');
}
mount(ModalViewport, { target });
