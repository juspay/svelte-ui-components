import { mount } from 'svelte';
import SankeyLabelPlateInset from './SankeyLabelPlateInset.svelte';

const target = document.getElementById('app');
if (target) {
  mount(SankeyLabelPlateInset, { target });
}
