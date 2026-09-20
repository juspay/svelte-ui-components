import { mount } from 'svelte';
import FormAssociation from './FormAssociation.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Form association fixture mount target is missing');
}
mount(FormAssociation, { target });
