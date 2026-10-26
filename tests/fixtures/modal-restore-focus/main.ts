import { mount } from 'svelte';
import ModalRestoreFocus from './ModalRestoreFocus.svelte';
const target = document.getElementById('app');
if (!target) {
  throw new Error('Fixture target missing');
}
mount(ModalRestoreFocus, { target });
