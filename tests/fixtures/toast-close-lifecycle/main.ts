import { mount } from 'svelte';
import ToastCloseLifecycle from './ToastCloseLifecycle.svelte';
const target = document.getElementById('app');
if (target === null) {
  throw new Error('Toast lifecycle fixture mount target is missing');
}
mount(ToastCloseLifecycle, { target });
