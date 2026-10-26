import { mount } from 'svelte';
import Reversal from './Reversal.svelte';
const target = document.getElementById('app');
if (!target) {
  throw new Error('Fixture target missing');
}
mount(Reversal, { target });
