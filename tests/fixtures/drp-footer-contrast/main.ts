import { mount } from 'svelte';
import '$lib/styles/theme-dark.css';
import DrpFooterContrast from './DrpFooterContrast.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Date range picker footer contrast fixture mount target is missing');
}
mount(DrpFooterContrast, { target });
