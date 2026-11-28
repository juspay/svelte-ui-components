import { mount } from 'svelte';
import FormSafeControls from './FormSafeControls.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Form-safe controls fixture mount target is missing');
}
mount(FormSafeControls, { target });
