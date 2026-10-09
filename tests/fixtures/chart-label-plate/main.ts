import { mount } from 'svelte';
import ChartLabelPlate from './ChartLabelPlate.svelte';
import '$lib/styles/theme-dark.css';

const target = document.getElementById('app');
if (target) {
  mount(ChartLabelPlate, { target });
}
