import { mount } from 'svelte';
import TabsScrollBounds from './TabsScrollBounds.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Tabs scroll bounds fixture mount target is missing');
}
mount(TabsScrollBounds, { target });
