import { mount } from 'svelte';
import DateRangePickerScenarios from './DateRangePickerScenarios.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Date range picker fixture mount target is missing');
}
mount(DateRangePickerScenarios, { target });
