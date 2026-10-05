import { mount } from 'svelte';
import ButtonShrinkable from './ButtonShrinkable.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Button shrinkable fixture mount target is missing');
}
mount(ButtonShrinkable, { target });
