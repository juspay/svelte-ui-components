import { mount } from 'svelte';
import Deadline from './Deadline.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('HITL deadline fixture mount target is missing');
}
mount(Deadline, { target });
