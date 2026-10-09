import { mount } from 'svelte';
import CompositeValidity from './CompositeValidity.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Composite validity fixture mount target missing');
}
mount(CompositeValidity, { target });
